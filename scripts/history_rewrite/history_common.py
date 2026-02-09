from __future__ import annotations

import datetime as dt
import json
import math
import subprocess
from pathlib import Path
from typing import Iterable


def run_command(
  command: list[str],
  *,
  capture_output: bool = True,
  check: bool = True,
  env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
  return subprocess.run(
    command,
    check=check,
    text=True,
    capture_output=capture_output,
    encoding="utf-8",
    errors="replace",
    env=env,
  )


def run_git(
  args: list[str],
  *,
  capture_output: bool = True,
  check: bool = True,
  env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
  return run_command(["git", *args], capture_output=capture_output, check=check, env=env)


def get_repo_root() -> Path:
  result = run_git(["rev-parse", "--show-toplevel"])
  return Path(result.stdout.strip())


def read_json(json_path: Path) -> dict:
  return json.loads(json_path.read_text(encoding="utf-8"))


def write_json(json_path: Path, payload: dict) -> None:
  json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def load_holiday_set(holiday_file: Path) -> set[dt.date]:
  payload = read_json(holiday_file)
  return {dt.date.fromisoformat(raw_date) for raw_date in payload["dates"]}


def build_business_days(
  start_date: dt.date,
  end_date: dt.date,
  holiday_set: set[dt.date],
) -> list[dt.date]:
  business_days: list[dt.date] = []
  current_date = start_date
  while current_date <= end_date:
    is_weekday = current_date.weekday() < 5
    is_holiday = current_date in holiday_set
    if is_weekday and not is_holiday:
      business_days.append(current_date)
    current_date += dt.timedelta(days=1)
  return business_days


def evenly_spread_indices(total_size: int, pick_count: int) -> list[int]:
  if pick_count < 0 or pick_count > total_size:
    raise ValueError(f"Invalid pick_count={pick_count} for total_size={total_size}")
  selected_indices: list[int] = []
  for index in range(total_size):
    previous_bucket = math.floor(index * pick_count / total_size)
    next_bucket = math.floor((index + 1) * pick_count / total_size)
    if next_bucket > previous_bucket:
      selected_indices.append(index)
  return selected_indices


def ensure_clean_worktree() -> None:
  status_result = run_git(["status", "--porcelain"])
  if status_result.stdout.strip():
    raise RuntimeError("Working tree is not clean. Commit/stash changes before running this step.")


def split_evenly(items: list[dict], split_count: int) -> list[list[dict]]:
  if split_count < 1:
    raise ValueError("split_count must be >= 1")
  if split_count > len(items):
    raise ValueError("split_count cannot exceed number of items")

  chunk_size, remainder = divmod(len(items), split_count)
  chunks: list[list[dict]] = []
  cursor = 0
  for chunk_index in range(split_count):
    size_for_chunk = chunk_size + (1 if chunk_index < remainder else 0)
    chunk = items[cursor:cursor + size_for_chunk]
    chunks.append(chunk)
    cursor += size_for_chunk
  return chunks


def join_non_empty(values: Iterable[str], separator: str = ", ") -> str:
  return separator.join([value for value in values if value])
