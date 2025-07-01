# proma

The next-gen AI software with general agents.

## Project Structure

```
proma/
├── packages/
│   ├── core/       # Core logic and agent integration
│   ├── shared/     # Shared types, configs, and utilities
│   └── ui/         # Shared UI components
└── apps/
    └── electron/   # Electron desktop application
```

## Getting Started

### Install Dependencies

```bash
bun install
```

### Development

有两种方式运行开发模式：

#### 方式一：自动启动（推荐）

```bash
bun run dev
```

这会同时启动 Vite 开发服务器和 Electron 窗口。

#### 方式二：手动启动（更稳定）

打开两个终端窗口：

**终端 1** - 启动 Vite 开发服务器：
```bash
cd apps/electron
bun run dev:vite
```

**终端 2** - 启动 Electron（等 Vite 启动完成后）：
```bash
cd apps/electron
bun run dev:electron
```

开发服务器启动后，Electron 窗口会自动打开并显示应用界面。修改代码后 Vite 会自动热重载。

### Build and Run

Build the Electron app and run it:

```bash
bun run electron:start
```

This will:
1. Build the main process
2. Build the preload script
3. Build the renderer (React app)
4. Copy resources
5. Launch the Electron app

### Build Only

To build without running:

```bash
bun run electron:build
```

## Tech Stack

- **Runtime**: Bun
- **Framework**: Electron + React 18
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Build Tools**: Vite (renderer), esbuild (main/preload)

## Current Status

✅ Basic three-panel layout
✅ Left sidebar with navigation items
✅ Navigator panel (middle)
✅ Main content panel (right)
✅ Dark/Light theme support (follows system preference)

This project was created using `bun init` in bun v1.3.1. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
