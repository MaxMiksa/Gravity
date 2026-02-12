# Findings & Decisions
<!-- 
  WHAT: Your knowledge base for the task. Stores everything you discover and decide.
  WHY: Context windows are limited. This file is your "external memory" - persistent and unlimited.
  WHEN: Update after ANY discovery, especially after 2 view/browser/search operations (2-Action Rule).
-->

## Requirements
<!-- 
  WHAT: What the user asked for, broken down into specific requirements.
  WHY: Keeps requirements visible so you don't forget what you're building.
  WHEN: Fill this in during Phase 1 (Requirements & Discovery).
  EXAMPLE:
    - Command-line interface
    - Add tasks
    - List all tasks
    - Delete tasks
    - Python implementation
-->
<!-- Captured from user request -->
- Runtime UX reliability/performance review.
- Focus on hardcoded localhost/devtools, heavy bundle/perf warnings.
- Identify process leaks/watch scripts/platform-specific command issues.
- Provide concrete issues with severity and file:line.

## Research Findings
<!-- 
  WHAT: Key discoveries from web searches, documentation reading, or exploration.
  WHY: Multimodal content (images, browser results) doesn't persist. Write it down immediately.
  WHEN: After EVERY 2 view/browser/search operations, update this section (2-Action Rule).
  EXAMPLE:
    - Python's argparse module supports subcommands for clean CLI design
    - JSON module handles file persistence easily
    - Standard pattern: python script.py <command> [args]
-->
<!-- Key discoveries during exploration -->
- Hardcoded dev URL + devtools toggle found in `apps/electron/src/main/index.ts`.
- Electron dev script uses `electronmon` watcher in `apps/electron/package.json`.
- `build:resources` uses `cp -r` (POSIX-specific) in `apps/electron/package.json`.
- `watch:main` / `watch:preload` use `--watch=forever` (always-on watch).
- App menu always exposes `toggleDevTools` and reload roles in production (`apps/electron/src/main/menu.ts`).
- Workspace watcher uses `fs.watch` with `{ recursive: true }` (`apps/electron/src/main/lib/workspace-watcher.ts`).
- Dev navigation allowlist only permits `http://localhost` in `will-navigate` handler.
- Checked `CHAT_LOGS.md`/`PROJECT.md` format for required updates.
- Re-opened `CHAT_LOGS.md` and `PROJECT.md` to verify UTF-8 integrity after edits.

## Technical Decisions
<!-- 
  WHAT: Architecture and implementation choices you've made, with reasoning.
  WHY: You'll forget why you chose a technology or approach. This table preserves that knowledge.
  WHEN: Update whenever you make a significant technical choice.
  EXAMPLE:
    | Use JSON for storage | Simple, human-readable, built-in Python support |
    | argparse with subcommands | Clean CLI: python todo.py add "task" |
-->
<!-- Decisions made with rationale -->
| Decision | Rationale |
|----------|-----------|
| Use ripgrep + package.json review first | Fast coverage for dev/prod runtime risks |

## Issues Encountered
<!-- 
  WHAT: Problems you ran into and how you solved them.
  WHY: Similar to errors in task_plan.md, but focused on broader issues (not just code errors).
  WHEN: Document when you encounter blockers or unexpected challenges.
  EXAMPLE:
    | Empty file causes JSONDecodeError | Added explicit empty file check before json.load() |
-->
<!-- Errors and how they were resolved -->
| Issue | Resolution |
|-------|------------|
| Session catchup script path mismatch | Retried with `.codex` skill path |

## Resources
<!-- 
  WHAT: URLs, file paths, API references, documentation links you've found useful.
  WHY: Easy reference for later. Don't lose important links in context.
  WHEN: Add as you discover useful resources.
  EXAMPLE:
    - Python argparse docs: https://docs.python.org/3/library/argparse.html
    - Project structure: src/main.py, src/utils.py
-->
<!-- URLs, file paths, API references -->
- `task_plan.md`
- `findings.md`
- `progress.md`

## Visual/Browser Findings
<!-- 
  WHAT: Information you learned from viewing images, PDFs, or browser results.
  WHY: CRITICAL - Visual/multimodal content doesn't persist in context. Must be captured as text.
  WHEN: IMMEDIATELY after viewing images or browser results. Don't wait!
  EXAMPLE:
    - Screenshot shows login form has email and password fields
    - Browser shows API returns JSON with "status" and "data" keys
-->
<!-- CRITICAL: Update after every 2 view/browser operations -->
<!-- Multimodal content must be captured as text immediately -->
-

---
<!-- 
  REMINDER: The 2-Action Rule
  After every 2 view/browser/search operations, you MUST update this file.
  This prevents visual information from being lost when context resets.
-->
*Update this file after every 2 view/browser/search operations*
*This prevents visual information from being lost*

---

## Session 2026-02-12: Full-Scope Sync Findings

### Confirmed Constraints
- Local history must not be replaced; only add new commits.
- Build must pass after sync.
- Future sync flow should be repeatable and documented.
- New commits must reuse local rewritten metadata convention.

### Implemented So Far
- P0 landed with 4 commits:
  - `1cacce6` chat empty-response filtering/persist behavior
  - `3455346` updater install timing + active-session cleanup
  - `e25b589` builder SDK exclusion
  - `f2a846f` default `find-skills` skill restored
- Full-scope continuation landed with 3 commits:
  - `67d3f31` agent skill namespace enforcement in system prompt
  - `bee7ef4` core恢复（环境检测、消息截断重发链路、macOS/tray 行为）
  - `5f890bc` renderer恢复（inline edit、onboarding、update 红点和 UI 组件）

### Working Baseline
- Build verification after full-scope continuation: `npm run build` passed.

### Closure Recheck (2026-02-12)
- Rechecked remaining `main..gravity/main` diffs at patch level.
- Remaining non-functional drift is mainly branding text/links and version bumps.
- Kept local Windows-friendly dev script strategy (`node -e setTimeout(...)`) and did not adopt `sleep 2`.
