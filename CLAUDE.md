# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Proma is a next-gen AI software with general agents, built as an Electron desktop application. The architecture and patterns are based on [craft-agents-oss](https://github.com/craftship/craft-agents-oss).

## Monorepo Structure

This is a Bun workspace monorepo:

```
proma/
├── packages/
│   ├── core/       # Core logic, agent integration, types
│   ├── shared/     # Shared types, configs, and utilities
│   └── ui/         # Shared UI components (React)
└── apps/
    └── electron/   # Electron desktop application
        ├── src/
        │   ├── main/      # Electron main process
        │   ├── preload/   # Context bridge (IPC)
        │   └── renderer/  # React UI (Vite + Tailwind)
        └── dist/          # Build output
```

**Package naming**: All packages use `@proma/*` scope (e.g., `@proma/core`, `@proma/electron`)

**Dependencies**: Use `workspace:*` for internal package dependencies in package.json

## Runtime

Use Bun instead of Node.js/npm/pnpm:

- `bun <file>` instead of `node <file>` or `ts-node <file>`
- `bun test` instead of `jest` or `vitest`
- `bun build <file>` instead of `webpack` or `esbuild`
- `bun install` for dependencies
- `bun run <script>` for package scripts
- Bun automatically loads .env files (don't use dotenv package)

## Common Commands

### Development

```bash
# Start dev mode (recommended - auto-starts both Vite + Electron)
bun run dev

# Manual dev mode (more stable for debugging)
# Terminal 1:
cd apps/electron && bun run dev:vite
# Terminal 2 (after Vite starts):
cd apps/electron && bun run dev:electron

# Type checking across all packages
bun run typecheck
```

### Building

```bash
# Build and run Electron app
bun run electron:start

# Build only (no run)
bun run electron:build

# Build all packages
bun run build
```

### Electron App Scripts

From `apps/electron/`:

```bash
bun run build:main        # Build main process (esbuild → dist/main.cjs)
bun run build:preload     # Build preload script (esbuild → dist/preload.cjs)
bun run build:renderer    # Build React UI (Vite → dist/renderer/)
bun run build:resources   # Copy resources/ to dist/
```

### Type Checking

```bash
bun run typecheck         # Root-level (all packages)
cd packages/core && bun run typecheck    # Individual package
```

## Bun APIs

Prefer Bun-native APIs:

- `Bun.serve()` for HTTP/WebSocket servers (not Express)
- `bun:sqlite` for SQLite (not better-sqlite3)
- `Bun.redis` for Redis (not ioredis)
- `Bun.sql` for Postgres (not pg/postgres.js)
- `WebSocket` is built-in (not ws package)
- `Bun.file` over `node:fs` readFile/writeFile
- `Bun.$\`command\`` for shell commands (not execa)

## Electron Architecture

### Main Process (`apps/electron/src/main/`)

- **index.ts**: App lifecycle, window creation, dev/prod mode handling
- **menu.ts**: Application menu (createApplicationMenu)
- **ipc.ts**: IPC handlers (registerIpcHandlers)
- **tray.ts**: System tray icon (createTray, destroyTray)

Key patterns:
- Use `join(__dirname, '../resources')` for resource paths
- Dev mode: loads `http://localhost:5173` (Vite dev server)
- Prod mode: loads `dist/renderer/index.html`
- Platform-specific icons: .icns (macOS), .ico (Windows), .png (Linux)

### Preload (`apps/electron/src/preload/`)

- Context bridge for secure IPC between main and renderer
- Use `contextIsolation: true` and `nodeIntegration: false`

### Renderer (`apps/electron/src/renderer/`)

React UI built with Vite:

- **main.tsx**: Entry point, renders App component
- **App.tsx**: Root component, provides AppShellContext
- **components/app-shell/**: 3-panel layout system
  - AppShell: Main container with LeftSidebar | NavigatorPanel | MainContentPanel
  - Layout proportions: 20% | 32% | 48%
- **contexts/**: React contexts for state management
- **lib/utils.ts**: Utility functions (cn for className merging)

**Path alias**: `@/` maps to `apps/electron/src/renderer/`

### Build Tools

- **Main/Preload**: esbuild (--bundle --platform=node --format=cjs --external:electron)
- **Renderer**: Vite with React plugin, Tailwind CSS, HMR
- **Dev server**: Vite on port 5173

## UI Framework

- **React 18** with TypeScript
- **Tailwind CSS** for styling (config in `apps/electron/tailwind.config.js`)
- **lucide-react** for icons
- **clsx + tailwind-merge** for className utilities (cn function)

## TypeScript Configuration

- **Module**: `"Preserve"` with `"moduleResolution": "bundler"`
- **JSX**: `"react-jsx"`
- **Strict mode**: enabled
- **Target**: ESNext
- All packages use `"type": "module"` in package.json
- Use `.ts` extensions in imports (Bun handles them)

## Reference Project Patterns

This project follows patterns from craft-agents-oss:

- **Session management**: Inbox/archive workflow with statuses
- **Permission modes**: safe (explore) / ask (ask to edit) / allow-all (auto)
- **Agent SDK**: Uses @anthropic-ai/claude-agent-sdk
- **MCP integration**: Model Context Protocol for external sources
- **Credential storage**: AES-256-GCM encrypted credentials
- **Config location**: `~/.proma/` (similar to `~/.craft-agent/`)

## Code Style

- Never use `any` type - create proper interfaces
- Prefer interface over type for object shapes
- Use proper TypeScript types for all functions
- Components should have explicit return type (`: React.ReactElement`)
- Use `import type` for type-only imports when possible

## Version Management

**IMPORTANT**: When making code changes and committing:

- **Always increment version numbers** in affected `package.json` files
- Increment the patch version (e.g., `1.0.0` → `1.0.1`)
- If changes affect multiple packages, increment version numbers for ALL affected packages
- This applies to all packages in `packages/` and `apps/` directories

Example workflow:
```bash
# 1. Make code changes to packages/core and apps/electron
# 2. Update version in packages/core/package.json (1.0.0 → 1.0.1)
# 3. Update version in apps/electron/package.json (1.0.0 → 1.0.1)
# 4. Commit with version bumps included
```

## Development Notes

- **Hot reload**: Main process requires rebuild, renderer has HMR via Vite
- **Dev tools**: Auto-open in dev mode (see `main/index.ts:54`)
- **Window settings**: 1400x900 default, 800x600 minimum
- **macOS**: Uses hiddenInset titlebar with vibrancy effects
- **Icons**: Generate with `bun run generate:icons` in apps/electron/resources/

## Testing

Use Bun's built-in test runner:

```ts
import { test, expect } from "bun:test";

test("example", () => {
  expect(1).toBe(1);
});
```

Run with: `bun test`
