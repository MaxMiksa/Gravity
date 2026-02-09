from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import re
from collections import Counter
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from history_common import (
  build_business_days,
  evenly_spread_indices,
  get_repo_root,
  join_non_empty,
  load_holiday_set,
  read_json,
  run_git,
  split_evenly,
  write_json,
)


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(description="Build a deterministic rewrite blueprint.")
  parser.add_argument(
    "--config",
    default="scripts/history_rewrite/rewrite_config.json",
    help="Path to rewrite config JSON.",
  )
  parser.add_argument(
    "--source-ref",
    required=True,
    help="Git ref used as rewrite source (must include the target final tree).",
  )
  parser.add_argument(
    "--output",
    default="scripts/history_rewrite/blueprint.json",
    help="Path to output blueprint JSON.",
  )
  return parser.parse_args()


def parse_name_status(diff_text: str) -> list[dict[str, str]]:
  operations: list[dict[str, str]] = []
  for raw_line in diff_text.splitlines():
    if not raw_line.strip():
      continue
    fields = raw_line.split("\t")
    status_field = fields[0]
    kind = status_field[0]
    if kind in {"R", "C"}:
      if len(fields) < 3:
        raise RuntimeError(f"Invalid rename/copy line: {raw_line}")
      operations.append(
        {
          "kind": kind,
          "old_path": fields[1],
          "new_path": fields[2],
          "status": status_field,
        }
      )
    else:
      if len(fields) < 2:
        raise RuntimeError(f"Invalid name-status line: {raw_line}")
      operations.append(
        {
          "kind": kind,
          "path": fields[1],
          "status": status_field,
        }
      )
  return operations


def allocate_commit_counts(weights: list[int], target_commit_count: int) -> list[int]:
  source_count = len(weights)
  if source_count == 0:
    raise RuntimeError("No source commits were discovered")
  if target_commit_count < source_count:
    raise RuntimeError(
      f"Target commit count {target_commit_count} is smaller than source commit count {source_count}"
    )

  minimum_allocations = [1 for _ in weights]
  remaining_budget = target_commit_count - source_count

  capacities = [max(0, weight - 1) for weight in weights]
  maximum_expandable = sum(capacities)
  if remaining_budget > maximum_expandable:
    raise RuntimeError(
      f"Target commit count {target_commit_count} exceeds expandable capacity {source_count + maximum_expandable}"
    )

  if remaining_budget == 0:
    return minimum_allocations

  total_capacity = sum(capacities)
  raw_extras: list[float] = [
    (remaining_budget * capacity / total_capacity) if total_capacity else 0.0
    for capacity in capacities
  ]

  floor_extras = [min(capacities[index], math.floor(raw_extras[index])) for index in range(source_count)]
  assigned_extras = sum(floor_extras)
  left_to_distribute = remaining_budget - assigned_extras

  ranking = sorted(
    range(source_count),
    key=lambda index: (raw_extras[index] - math.floor(raw_extras[index]), capacities[index]),
    reverse=True,
  )

  while left_to_distribute > 0:
    progressed = False
    for source_index in ranking:
      if floor_extras[source_index] < capacities[source_index]:
        floor_extras[source_index] += 1
        left_to_distribute -= 1
        progressed = True
        if left_to_distribute == 0:
          break
    if not progressed:
      raise RuntimeError("Unable to distribute remaining allocation budget")

  return [minimum_allocations[index] + floor_extras[index] for index in range(source_count)]


def infer_scope(path_list: list[str]) -> str:
  scopes: list[str] = []
  for file_path in path_list:
    normalized_path = file_path.replace("\\", "/")
    if normalized_path.startswith("apps/electron/src/main/"):
      scopes.append("main-process")
    elif normalized_path.startswith("apps/electron/src/preload/"):
      scopes.append("preload")
    elif normalized_path.startswith("apps/electron/src/renderer/"):
      scopes.append("renderer")
    elif normalized_path.startswith("apps/electron/resources/") or normalized_path.startswith("apps/electron/src/renderer/assets/"):
      scopes.append("assets")
    elif normalized_path.startswith("packages/core/"):
      scopes.append("core")
    elif normalized_path.startswith("packages/shared/"):
      scopes.append("shared")
    elif normalized_path.startswith("packages/ui/"):
      scopes.append("ui")
    elif normalized_path.startswith("scripts/"):
      scopes.append("tooling")
    elif normalized_path.startswith("README") or normalized_path.endswith(".md"):
      scopes.append("docs")
    else:
      scopes.append("workspace")
  return Counter(scopes).most_common(1)[0][0]


def infer_type(operation_kinds: set[str], scope: str) -> str:
  if operation_kinds == {"A"}:
    return "feat"
  if operation_kinds == {"D"}:
    return "refactor"
  if "R" in operation_kinds or "C" in operation_kinds:
    return "refactor"
  if scope in {"main-process", "preload", "renderer", "core", "shared", "ui"}:
    return "fix"
  return "chore"


def make_topic(path_list: list[str], scope: str) -> str:
  if len(path_list) == 1:
    file_name = Path(path_list[0]).name
    token = re.sub(r"[^A-Za-z0-9]+", " ", file_name).strip().lower()
    token = token or "workspace"
    return f"{token} handling"

  fallback_topics = {
    "main-process": "main process behavior",
    "preload": "preload bridge flow",
    "renderer": "renderer interaction flow",
    "assets": "asset organization",
    "core": "core provider pipeline",
    "shared": "shared type contracts",
    "ui": "ui component behavior",
    "tooling": "tooling workflow",
    "docs": "project documentation",
    "workspace": "workspace consistency",
  }
  return fallback_topics.get(scope, "workspace consistency")


def build_message(entry_index: int, operation_group: list[dict[str, str]]) -> str:
  path_list: list[str] = []
  operation_kinds: set[str] = set()
  for operation in operation_group:
    operation_kinds.add(operation["kind"])
    if operation["kind"] in {"R", "C"}:
      path_list.append(operation["new_path"])
      path_list.append(operation["old_path"])
    else:
      path_list.append(operation["path"])

  scope = infer_scope(path_list)
  commit_type = infer_type(operation_kinds, scope)

  action_map = {
    "feat": ["add", "introduce", "enable", "expand", "support", "wire"],
    "fix": ["fix", "stabilize", "correct", "resolve", "harden", "adjust"],
    "refactor": ["refactor", "streamline", "reorganize", "simplify", "reshape", "tidy"],
    "chore": ["update", "align", "polish", "refine", "tune", "improve"],
  }
  action_pool = action_map[commit_type]
  action_word = action_pool[entry_index % len(action_pool)]

  topic = make_topic(path_list, scope)
  message = f"{commit_type}({scope}): {action_word} {topic}"
  return message


def select_tag_targets(
  source_ref: str,
  source_commits: list[str],
  source_subjects: dict[str, str],
  tag_names: list[str],
) -> dict[str, str]:
  source_commit_set = set(source_commits)
  first_parent_history = run_git(["rev-list", "--first-parent", "--reverse", source_ref]).stdout.splitlines()
  tag_target_map: dict[str, str] = {}

  def find_by_message(tag_name: str) -> str | None:
    lowered = tag_name.lower()
    for commit_hash in source_commits:
      if lowered in source_subjects[commit_hash].lower():
        return commit_hash
    return None

  for tag_name in tag_names:
    tag_ref = run_git(["show-ref", "--tags", "--verify", f"refs/tags/{tag_name}"], check=False)
    tagged_commit: str | None = None
    if tag_ref.returncode == 0:
      tagged_commit = run_git(["rev-list", "-n", "1", tag_name]).stdout.strip()

    candidate: str | None = None
    if tagged_commit and tagged_commit in source_commit_set:
      candidate = tagged_commit
    elif tagged_commit:
      tagged_index = first_parent_history.index(tagged_commit) if tagged_commit in first_parent_history else -1
      if tagged_index >= 0:
        for reverse_index in range(tagged_index, -1, -1):
          history_commit = first_parent_history[reverse_index]
          if history_commit in source_commit_set:
            candidate = history_commit
            break

    if candidate is None:
      candidate = find_by_message(tag_name)

    if candidate is None:
      candidate = source_commits[-1]

    tag_target_map[tag_name] = candidate

  return tag_target_map


def main() -> int:
  args = parse_args()

  repo_root = get_repo_root()
  config_path = (repo_root / args.config).resolve()
  output_path = (repo_root / args.output).resolve()

  config = read_json(config_path)
  holiday_file = (repo_root / config["holidays_file"]).resolve()
  holiday_set = load_holiday_set(holiday_file)

  source_ref = args.source_ref
  source_tree = run_git(["rev-parse", f"{source_ref}^{{tree}}"]).stdout.strip()
  source_commit_list = run_git(["rev-list", "--reverse", "--no-merges", source_ref]).stdout.splitlines()

  source_subjects: dict[str, str] = {}
  source_operations: dict[str, list[dict[str, str]]] = {}

  for source_commit in source_commit_list:
    source_subjects[source_commit] = run_git(["show", "-s", "--format=%s", source_commit]).stdout.strip()
    diff_output = run_git(
      ["diff-tree", "--root", "--no-commit-id", "--name-status", "-r", "-M", source_commit]
    ).stdout
    parsed_operations = parse_name_status(diff_output)
    if not parsed_operations:
      parsed_operations = [{"kind": "M", "path": ".", "status": "M"}]
    source_operations[source_commit] = parsed_operations

  operation_weights = [len(source_operations[source_commit]) for source_commit in source_commit_list]
  target_commit_count = int(config["target_commit_count"])

  if target_commit_count > sum(operation_weights):
    raise RuntimeError(
      f"Target count {target_commit_count} is greater than total operation count {sum(operation_weights)}"
    )

  allocation = allocate_commit_counts(operation_weights, target_commit_count)

  expanded_entries: list[dict[str, Any]] = []
  for source_index, source_commit in enumerate(source_commit_list):
    operation_groups = split_evenly(source_operations[source_commit], allocation[source_index])
    for group_index, operation_group in enumerate(operation_groups, start=1):
      expanded_entries.append(
        {
          "source_index": source_index,
          "source_commit": source_commit,
          "source_subject": source_subjects[source_commit],
          "group_index": group_index,
          "group_total": len(operation_groups),
          "operations": operation_group,
        }
      )

  if len(expanded_entries) != target_commit_count:
    raise RuntimeError(
      f"Expanded entry count {len(expanded_entries)} does not match target {target_commit_count}"
    )

  start_date = dt.date.fromisoformat(config["start_date"])
  end_date = dt.date.fromisoformat(config["end_date"])
  business_days = build_business_days(start_date, end_date, holiday_set)
  if not business_days:
    raise RuntimeError("No business days found in configured date range")

  day_count = len(business_days)
  base_daily_count = target_commit_count // day_count
  extra_commit_days = target_commit_count - (base_daily_count * day_count)
  day_commit_counts = [base_daily_count] * day_count
  for extra_day_index in evenly_spread_indices(day_count, extra_commit_days):
    day_commit_counts[extra_day_index] += 1

  timezone_name = config["timezone"]
  timezone = ZoneInfo(timezone_name)
  slot_map: dict[str, list[str]] = config["daily_slots"]

  entry_pointer = 0
  for day_index, business_day in enumerate(business_days):
    commits_for_day = day_commit_counts[day_index]
    slot_key = str(commits_for_day)
    if slot_key not in slot_map:
      raise RuntimeError(f"No slot definition for {commits_for_day} commits/day")

    slots = slot_map[slot_key]
    if len(slots) != commits_for_day:
      raise RuntimeError(f"Slot count mismatch for day {business_day}")

    for slot_index, slot_text in enumerate(slots):
      if entry_pointer >= len(expanded_entries):
        raise RuntimeError("Schedule overflow while assigning dates")

      hour_text, minute_text = slot_text.split(":")
      base_datetime = dt.datetime(
        year=business_day.year,
        month=business_day.month,
        day=business_day.day,
        hour=int(hour_text),
        minute=int(minute_text),
        second=0,
        tzinfo=timezone,
      )

      seed_material = f"{entry_pointer + 1}:{expanded_entries[entry_pointer]['source_commit']}:{slot_index}"
      seed_hash = hashlib.sha1(seed_material.encode("utf-8")).hexdigest()
      minute_jitter = (int(seed_hash[:8], 16) % 17) - 8
      final_datetime = base_datetime + dt.timedelta(minutes=minute_jitter)
      if final_datetime.date() != business_day:
        final_datetime = base_datetime

      expanded_entries[entry_pointer]["author_date"] = final_datetime.strftime("%Y-%m-%dT%H:%M:%S%z")
      expanded_entries[entry_pointer]["committer_date"] = expanded_entries[entry_pointer]["author_date"]
      expanded_entries[entry_pointer]["message"] = build_message(entry_pointer, expanded_entries[entry_pointer]["operations"])
      entry_pointer += 1

  if entry_pointer != len(expanded_entries):
    raise RuntimeError("Schedule underflow while assigning dates")

  tag_targets = select_tag_targets(source_ref, source_commit_list, source_subjects, config["tag_names"])

  payload = {
    "meta": {
      "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
      "source_ref": source_ref,
      "source_tree": source_tree,
      "timezone": timezone_name,
      "target_commit_count": target_commit_count,
      "business_day_count": len(business_days),
      "base_daily_count": base_daily_count,
      "extra_commit_days": extra_commit_days,
    },
    "config": config,
    "business_days": [business_day.isoformat() for business_day in business_days],
    "day_commit_counts": day_commit_counts,
    "source_commits": [
      {
        "commit": source_commit,
        "subject": source_subjects[source_commit],
        "operation_count": len(source_operations[source_commit]),
        "allocated_commits": allocation[source_index],
      }
      for source_index, source_commit in enumerate(source_commit_list)
    ],
    "tag_targets": tag_targets,
    "commits": [
      {
        "index": index + 1,
        **entry,
      }
      for index, entry in enumerate(expanded_entries)
    ],
  }

  output_path.parent.mkdir(parents=True, exist_ok=True)
  write_json(output_path, payload)

  summary = {
    "target": target_commit_count,
    "generated": len(expanded_entries),
    "business_days": len(business_days),
    "date_start": business_days[0].isoformat(),
    "date_end": business_days[-1].isoformat(),
    "source_tree": source_tree,
    "output": str(output_path),
  }
  print(json.dumps(summary, indent=2))
  return 0


if __name__ == "__main__":
  raise SystemExit(main())

