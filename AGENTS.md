# Repository Agent Guidelines

## Scope
- This file is the source of truth for AI assistant behavior in this repository.
- Keep AI-facing instructions in English (`AGENTS.md`).
- Keep user-facing project memory in Chinese (`CHAT_LOGS.md`, `PROJECT.md`).

## Project Intent
- This workspace (`Gravity`) is prepared to migrate and modernize the old repo `https://github.com/MaxMiksa/Gravity`.
- The future main-account target repo is planned as `https://github.com/MaxMiksa/Gravity` (not created yet).
- Continue feature development, repository evolution, and commit-history organization in this workspace.

## Required Docs Workflow
- Ensure `AGENTS.md`, `CHAT_LOGS.md`, and `PROJECT.md` exist in the repository root.
- After each user/assistant conversation round:
  - Append one structured round entry to `CHAT_LOGS.md`.
  - Update durable facts/decisions/progress in `PROJECT.md`.

## Tooling Preferences
- Prefer `rg` / `rg --files` for fast search.
- Prefer structured edits via patch operations.
- Prefer minimal, focused changes aligned with existing code style.

## Encoding & Localization Safety
- Always read and write text files in UTF-8 without BOM.
- Re-open localized (Chinese) files after edits to verify no garbled text.
- Avoid non-UTF-8 bulk replacement tools for Chinese content.

## Safety Constraints
- Do not run destructive commands unless explicitly requested.
- Do not revert unrelated modifications.
- Do not commit, force-push, or rewrite git history unless explicitly requested.

## Repeated Friction Notes
- Symptom: `apply_patch.bat` on PowerShell repeatedly reports `last line must be '*** End Patch'`.
- Cause: Windows batch argument forwarding (`%*`) does not reliably preserve multi-line patch content.
- Fix: Call the underlying `codex.exe --codex-run-as-apply-patch <PATCH>` with a PowerShell string variable.

- Symptom: `install-skill-from-github.py` with default `--method auto` repeatedly failed with `destination path ...\repo already exists`.
- Cause: Auto path fallback hit git clone into a pre-existing temp repo directory under `AppData\Local\Temp\codex\skill-install-*`.
- Fix: Prefer explicit args for this repo: `python "$HOME\.codex\skills\.system\skill-installer\scripts\install-skill-from-github.py" --repo OthmanAdi/planning-with-files --path skills/planning-with-files --method download --ref master`.

- Symptom: `npm run dev/build` repeatedly reported `No packages matched the filter` on Windows PowerShell.
- Cause: root scripts used `bun run --filter='...'`, and single quotes were passed literally in this environment.
- Fix: update root `package.json` scripts to unquoted form (`--filter=@gravity/electron`, `--filter=*`).

- Symptom: Running `npx electron .` failed with `TypeError: Cannot read properties of undefined (reading 'whenReady')` from `dist/main.cjs`.
- Cause: Environment variable `ELECTRON_RUN_AS_NODE=1` was set, so Electron ran in Node mode and `require('electron')` returned no `app` API.
- Fix: Clear env var before launch on PowerShell: `Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue`.

- Symptom: `scripts/history_rewrite/replay_blueprint.py` repeatedly failed at clean-check with `Working tree is not clean` right after Python runs.
- Cause: Python auto-generated `scripts/history_rewrite/__pycache__/` before the script's clean-worktree guard, making the repo dirty.
- Fix: Run rewrite/verify commands with `PYTHONDONTWRITEBYTECODE=1` and clean cache dirs first when needed (`git clean -fd scripts/history_rewrite/__pycache__/`).
