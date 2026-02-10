from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

from history_common import ensure_clean_worktree, read_json, run_git


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(description="Replay blueprint into a new linear history.")
  parser.add_argument(
    "--blueprint",
    default="scripts/history_rewrite/blueprint.json",
    help="Path to blueprint JSON.",
  )
  return parser.parse_args()


def apply_operation(source_commit: str, operation: dict[str, str]) -> None:
  kind = operation["kind"]
  if kind in {"A", "M", "T", "C"}:
    path_value = operation["path"] if "path" in operation else operation["new_path"]
    run_git(["checkout", source_commit, "--", path_value], capture_output=False)
    return

  if kind == "D":
    run_git(["rm", "-f", "--ignore-unmatch", "--", operation["path"]], check=False, capture_output=False)
    return

  if kind == "R":
    run_git(["rm", "-f", "--ignore-unmatch", "--", operation["old_path"]], check=False, capture_output=False)
    run_git(["checkout", source_commit, "--", operation["new_path"]], capture_output=False)
    return

  raise RuntimeError(f"Unsupported operation kind: {kind}")


def git_index_has_changes() -> bool:
  diff_result = run_git(["diff", "--cached", "--quiet"], check=False)
  return diff_result.returncode != 0


def main() -> int:
  args = parse_args()
  blueprint_path = Path(args.blueprint).resolve()
  payload = read_json(blueprint_path)

  config = payload["config"]
  commits: list[dict[str, Any]] = payload["commits"]
  identity = config["identity"]
  rewrite_branch = config["rewrite_branch"]
  target_branch = config["target_branch"]
  tag_targets: dict[str, str] = payload.get("tag_targets", {})

  ensure_clean_worktree()

  existing_rewrite_branch = run_git(["branch", "--list", rewrite_branch]).stdout.strip()
  if existing_rewrite_branch:
    run_git(["branch", "-D", rewrite_branch], capture_output=False)

  run_git(["checkout", "--orphan", rewrite_branch], capture_output=False)
  run_git(["rm", "-rf", ".", "--ignore-unmatch"], check=False, capture_output=False)

  source_commit_to_last_new_hash: dict[str, str] = {}

  for commit_entry in commits:
    source_commit = commit_entry["source_commit"]
    for operation in commit_entry["operations"]:
      apply_operation(source_commit, operation)

    if not git_index_has_changes():
      raise RuntimeError(f"No staged changes for generated commit #{commit_entry['index']}")

    commit_environment = os.environ.copy()
    commit_environment["GIT_AUTHOR_NAME"] = identity["name"]
    commit_environment["GIT_AUTHOR_EMAIL"] = identity["email"]
    commit_environment["GIT_COMMITTER_NAME"] = identity["name"]
    commit_environment["GIT_COMMITTER_EMAIL"] = identity["email"]
    commit_environment["GIT_AUTHOR_DATE"] = commit_entry["author_date"]
    commit_environment["GIT_COMMITTER_DATE"] = commit_entry["committer_date"]

    run_git(
      ["commit", "-m", commit_entry["message"], "--no-gpg-sign"],
      env=commit_environment,
      capture_output=False,
    )
    new_hash = run_git(["rev-parse", "HEAD"]).stdout.strip()
    source_commit_to_last_new_hash[source_commit] = new_hash

  for tag_name, source_commit in tag_targets.items():
    if source_commit not in source_commit_to_last_new_hash:
      continue
    run_git(["tag", "-f", tag_name, source_commit_to_last_new_hash[source_commit]], capture_output=False)

  run_git(["checkout", target_branch], capture_output=False)
  run_git(["reset", "--hard", rewrite_branch], capture_output=False)

  summary = {
    "rewritten_branch": rewrite_branch,
    "target_branch": target_branch,
    "generated_commits": len(commits),
    "target_head": run_git(["rev-parse", "HEAD"]).stdout.strip(),
  }
  print(json.dumps(summary, indent=2))
  return 0


if __name__ == "__main__":
  raise SystemExit(main())

