from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from history_common import build_business_days, load_holiday_set, read_json, run_git


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(description="Verify rewritten history against configured constraints.")
  parser.add_argument(
    "--config",
    default="scripts/history_rewrite/rewrite_config.json",
    help="Path to rewrite config JSON.",
  )
  parser.add_argument(
    "--blueprint",
    default="scripts/history_rewrite/blueprint.json",
    help="Path to blueprint JSON.",
  )
  parser.add_argument(
    "--report",
    default="scripts/history_rewrite/rewrite_report.md",
    help="Output markdown report path.",
  )
  return parser.parse_args()


def collect_commit_rows(branch_name: str) -> list[dict[str, str]]:
  format_string = "%H|%aI|%cI|%an|%ae|%cn|%ce|%s"
  raw_rows = run_git(["log", "--reverse", "--format=" + format_string, branch_name]).stdout.splitlines()
  parsed_rows: list[dict[str, str]] = []
  for raw_row in raw_rows:
    parts = raw_row.split("|", 7)
    if len(parts) != 8:
      continue
    parsed_rows.append(
      {
        "hash": parts[0],
        "author_date": parts[1],
        "committer_date": parts[2],
        "author_name": parts[3],
        "author_email": parts[4],
        "committer_name": parts[5],
        "committer_email": parts[6],
        "subject": parts[7],
      }
    )
  return parsed_rows


def is_ascii_only(value: str) -> bool:
  try:
    value.encode("ascii")
    return True
  except UnicodeEncodeError:
    return False


def main() -> int:
  args = parse_args()
  config_path = Path(args.config).resolve()
  blueprint_path = Path(args.blueprint).resolve()
  report_path = Path(args.report).resolve()

  config = read_json(config_path)
  blueprint = read_json(blueprint_path)

  target_branch = config["target_branch"]
  target_commit_count = int(config["target_commit_count"])
  identity_name = config["identity"]["name"]
  identity_email = config["identity"]["email"]
  forbidden_terms: list[str] = [term.lower() for term in config["forbidden_message_terms"]]

  holiday_file = Path(config["holidays_file"]).resolve()
  if not holiday_file.exists():
    holiday_file = config_path.parent / Path(config["holidays_file"]).name
  holiday_set = load_holiday_set(holiday_file)

  start_date = dt.date.fromisoformat(config["start_date"])
  end_date = dt.date.fromisoformat(config["end_date"])
  business_days = set(build_business_days(start_date, end_date, holiday_set))

  commit_rows = collect_commit_rows(target_branch)
  commit_count = len(commit_rows)
  merge_count = int(run_git(["rev-list", "--count", "--merges", target_branch]).stdout.strip())

  identity_errors: list[str] = []
  date_errors: list[str] = []
  message_errors: list[str] = []

  timezone_name = config["timezone"]
  timezone = ZoneInfo(timezone_name)

  for commit_row in commit_rows:
    if commit_row["author_name"] != identity_name or commit_row["author_email"] != identity_email:
      identity_errors.append(f"author mismatch on {commit_row['hash']}")
    if commit_row["committer_name"] != identity_name or commit_row["committer_email"] != identity_email:
      identity_errors.append(f"committer mismatch on {commit_row['hash']}")

    author_datetime = dt.datetime.fromisoformat(commit_row["author_date"])
    committer_datetime = dt.datetime.fromisoformat(commit_row["committer_date"])
    author_in_timezone = author_datetime.astimezone(timezone)
    committer_in_timezone = committer_datetime.astimezone(timezone)

    if author_datetime != committer_datetime:
      date_errors.append(f"author/committer date mismatch on {commit_row['hash']}")

    if author_in_timezone.date() not in business_days:
      date_errors.append(f"non-business day date on {commit_row['hash']}: {author_in_timezone.date().isoformat()}")

    if author_in_timezone.weekday() >= 5:
      date_errors.append(f"weekend date on {commit_row['hash']}: {author_in_timezone.date().isoformat()}")

    if not (start_date <= author_in_timezone.date() <= end_date):
      date_errors.append(f"out-of-range date on {commit_row['hash']}: {author_in_timezone.date().isoformat()}")

    author_clock = author_datetime.strftime("%Y-%m-%d %H:%M")
    normalized_clock = author_in_timezone.strftime("%Y-%m-%d %H:%M")
    if author_clock != normalized_clock:
      date_errors.append(f"timezone mismatch on {commit_row['hash']}")

    if not is_ascii_only(commit_row["subject"]):
      message_errors.append(f"non-ascii subject on {commit_row['hash']}")
    lowered_subject = commit_row["subject"].lower()
    for forbidden_term in forbidden_terms:
      if forbidden_term in lowered_subject:
        message_errors.append(f"forbidden term '{forbidden_term}' on {commit_row['hash']}")

  current_tree = run_git(["rev-parse", f"{target_branch}^{{tree}}"]).stdout.strip()
  expected_tree = blueprint["meta"]["source_tree"]
  tree_match = current_tree == expected_tree

  expected_tags: list[str] = config["tag_names"]
  missing_tags: list[str] = []
  for tag_name in expected_tags:
    tag_check = run_git(["show-ref", "--tags", "--verify", f"refs/tags/{tag_name}"], check=False)
    if tag_check.returncode != 0:
      missing_tags.append(tag_name)

  checks: list[tuple[str, bool, str]] = [
    ("Commit count", commit_count == target_commit_count, f"actual={commit_count}, expected={target_commit_count}"),
    ("No merge commits", merge_count == 0, f"merge_count={merge_count}"),
    ("Identity consistency", len(identity_errors) == 0, f"identity_errors={len(identity_errors)}"),
    ("Date constraints", len(date_errors) == 0, f"date_errors={len(date_errors)}"),
    ("Message constraints", len(message_errors) == 0, f"message_errors={len(message_errors)}"),
    ("Tag presence", len(missing_tags) == 0, f"missing_tags={missing_tags}"),
    ("Final tree consistency", tree_match, f"current_tree={current_tree}, expected_tree={expected_tree}"),
  ]

  all_passed = all(check[1] for check in checks)

  lines: list[str] = [
    "# Rewrite Verification Report",
    "",
    f"- Generated: {dt.datetime.now(dt.timezone.utc).isoformat()}",
    f"- Branch: `{target_branch}`",
    f"- Commit count: `{commit_count}`",
    "",
    "## Checks",
  ]

  for check_name, check_passed, detail in checks:
    status = "PASS" if check_passed else "FAIL"
    lines.append(f"- [{status}] {check_name} — {detail}")

  if identity_errors:
    lines.extend(["", "## Identity Errors", *[f"- {entry}" for entry in identity_errors[:30]]])
  if date_errors:
    lines.extend(["", "## Date Errors", *[f"- {entry}" for entry in date_errors[:30]]])
  if message_errors:
    lines.extend(["", "## Message Errors", *[f"- {entry}" for entry in message_errors[:30]]])

  report_path.parent.mkdir(parents=True, exist_ok=True)
  report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

  summary = {
    "passed": all_passed,
    "report": str(report_path),
    "commit_count": commit_count,
    "target_commit_count": target_commit_count,
    "identity_errors": len(identity_errors),
    "date_errors": len(date_errors),
    "message_errors": len(message_errors),
    "missing_tags": missing_tags,
    "merge_count": merge_count,
    "tree_match": tree_match,
  }
  print(json.dumps(summary, indent=2))

  return 0 if all_passed else 1


if __name__ == "__main__":
  raise SystemExit(main())

