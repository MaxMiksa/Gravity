# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在处理此仓库代码时提供指导。

**重要提示：** 
- 当功能发生变化时，请保持此文件和 `README.md` 同步更新。请更新文档以反映当前状态，但是需要经过我的允许后再修改。
- 所有的注释和日志优先采用中文，保留必要的专业术语部分。
- 所有的依赖包的安装都要先进行搜索，综合判断依赖采用的版本，而不是默认采用某个版本。
- 这是个开源项目，本地存储优先，善用配置文件优于大部分默认采用 localstorage，不采用本地数据库方案。
- 保证充分的组件化以及人类的可读性，每次完成改动后都要思考这一点，运行@code-simplifier 来简化优化代码，保持简单直接不过渡设计的风格。


## 项目概述

Proma 是一个集成通用 AI Agent 的下一代人工智能软件，采用 Electron 桌面应用架构。项目的架构和模式基于 [craft-agents-oss](https://github.com/craftship/craft-agents-oss)。

## Monorepo 结构

这是一个 Bun workspace monorepo：

```
proma/
├── packages/
│   ├── core/       # 核心逻辑、Agent 集成、类型定义
│   ├── shared/     # 共享类型、配置和工具函数
│   └── ui/         # 共享 UI 组件 (React)
└── apps/
    └── electron/   # Electron 桌面应用
        ├── src/
        │   ├── main/      # Electron 主进程
        │   ├── preload/   # 上下文桥接 (IPC)
        │   └── renderer/  # React UI (Vite + Tailwind)
        └── dist/          # 构建输出
```

**包命名规范**：所有包都使用 `@proma/*` 作用域（例如：`@proma/core`、`@proma/electron`）

**依赖管理**：在 package.json 中使用 `workspace:*` 引用内部包依赖

## 运行时环境

使用 Bun 代替 Node.js/npm/pnpm：

- `bun <file>` 代替 `node <file>` 或 `ts-node <file>`
- `bun test` 代替 `jest` 或 `vitest`
- `bun build <file>` 代替 `webpack` 或 `esbuild`
- `bun install` 安装依赖
- `bun run <script>` 运行 package scripts
- Bun 自动加载 .env 文件（无需使用 dotenv 包）

## 常用命令

### 开发模式

```bash
# 启动开发模式（推荐 - 自动启动 Vite 和 Electron）
bun run dev

# 手动开发模式（调试时更稳定）
# 终端 1：
cd apps/electron && bun run dev:vite
# 终端 2（等待 Vite 启动后）：
cd apps/electron && bun run dev:electron

# 对所有包进行类型检查
bun run typecheck
```

### 构建

```bash
# 构建并运行 Electron 应用
bun run electron:start

# 仅构建（不运行）
bun run electron:build

# 构建所有包
bun run build
```

### Electron 应用脚本

在 `apps/electron/` 目录下：

```bash
bun run build:main        # 构建主进程 (esbuild → dist/main.cjs)
bun run build:preload     # 构建 preload 脚本 (esbuild → dist/preload.cjs)
bun run build:renderer    # 构建 React UI (Vite → dist/renderer/)
bun run build:resources   # 复制 resources/ 到 dist/
```

### 类型检查

```bash
bun run typecheck         # 根目录级别（所有包）
cd packages/core && bun run typecheck    # 单个包
```

## Bun APIs

优先使用 Bun 原生 API：

- `Bun.serve()` 用于 HTTP/WebSocket 服务器（不使用 Express）
- `bun:sqlite` 用于 SQLite（不使用 better-sqlite3）
- `Bun.redis` 用于 Redis（不使用 ioredis）
- `Bun.sql` 用于 Postgres（不使用 pg/postgres.js）
- `WebSocket` 是内置的（不使用 ws 包）
- `Bun.file` 优于 `node:fs` 的 readFile/writeFile
- `Bun.$\`command\`` 用于执行 shell 命令（不使用 execa）

## Electron 架构

### 主进程 (`apps/electron/src/main/`)

- **index.ts**：应用生命周期、窗口创建、开发/生产模式处理
- **menu.ts**：应用菜单 (createApplicationMenu)
- **ipc.ts**：IPC 处理器 (registerIpcHandlers)
- **tray.ts**：系统托盘图标 (createTray, destroyTray)

关键模式：
- 使用 `join(__dirname, '../resources')` 处理资源路径
- 开发模式：加载 `http://localhost:5173`（Vite 开发服务器）
- 生产模式：加载 `dist/renderer/index.html`
- 平台特定图标：.icns (macOS)、.ico (Windows)、.png (Linux)

### Preload (`apps/electron/src/preload/`)

- 用于主进程和渲染进程之间安全 IPC 通信的上下文桥接
- 使用 `contextIsolation: true` 和 `nodeIntegration: false`

### 渲染进程 (`apps/electron/src/renderer/`)

使用 Vite 构建的 React UI：

- **main.tsx**：入口文件，渲染 App 组件
- **App.tsx**：根组件，提供 AppShellContext
- **components/app-shell/**：三面板布局系统
  - AppShell：主容器，包含 LeftSidebar | NavigatorPanel | MainContentPanel
  - 布局比例：20% | 32% | 48%
- **contexts/**：React 上下文用于状态管理
- **lib/utils.ts**：工具函数（cn 用于合并 className）

**路径别名**：`@/` 映射到 `apps/electron/src/renderer/`

### 构建工具

- **主进程/Preload**：esbuild (--bundle --platform=node --format=cjs --external:electron)
- **渲染进程**：Vite 配合 React 插件、Tailwind CSS、HMR
- **开发服务器**：Vite 运行在 5173 端口

## UI 框架

- **React 18** 配合 TypeScript
- **Tailwind CSS** 用于样式（配置文件：`apps/electron/tailwind.config.js`）
- **lucide-react** 用于图标
- **clsx + tailwind-merge** 用于 className 工具函数（cn 函数）

## TypeScript 配置

- **Module**：`"Preserve"` 配合 `"moduleResolution": "bundler"`
- **JSX**：`"react-jsx"`
- **严格模式**：启用
- **Target**：ESNext
- 所有包在 package.json 中使用 `"type": "module"`
- 在导入时使用 `.ts` 扩展名（Bun 会处理）

## 创作参考

此项目遵循 craft-agents-oss 的模式，当用户询问你设计的时候，你需要先去参考这个项目，研究它的实现方式，优先跟随这个项目的设计：

- **会话管理**：收件箱/归档工作流，带状态管理
- **权限模式**：safe（探索）/ ask（请求编辑）/ allow-all（自动）
- **Agent SDK**：使用 @anthropic-ai/claude-agent-sdk
- **MCP 集成**：Model Context Protocol 用于外部数据源
- **凭证存储**：AES-256-GCM 加密凭证
- **配置位置**：`~/.proma/`（类似 `~/.craft-agent/`）

## 关于 claude agent SDK 的类型文档及其解释
- **v1 版本的文档：**：详细文档访问地址，方便 Claude 可以在需要的时候直接抓取该网页的信息：https://platform.claude.com/docs/en/agent-sdk/typescript
- **v2 版本的文档，大部分是基于 v1 的**：https://platform.claude.com/docs/en/agent-sdk/typescript-v2-preview

## 代码风格

- 永远不要使用 `any` 类型 - 创建合适的接口
- 对于对象类型优先使用 interface 而不是 type
- 为所有函数使用正确的 TypeScript 类型
- 组件应该有明确的返回类型（`: React.ReactElement`）
- 尽可能使用 `import type` 进行仅类型导入

## 版本管理

**重要**：在进行代码更改和提交时：

- **始终递增版本号**在受影响的 `package.json` 文件中
- 递增补丁版本（例如：`1.0.0` → `1.0.1`）
- 如果更改影响多个包，需要递增所有受影响包的版本号
- 这适用于 `packages/` 和 `apps/` 目录下的所有包

工作流示例：
```bash
# 1. 对 packages/core 和 apps/electron 进行代码更改
# 2. 更新 packages/core/package.json 中的版本 (1.0.0 → 1.0.1)
# 3. 更新 apps/electron/package.json 中的版本 (1.0.0 → 1.0.1)
# 4. 提交时包含版本更新
```

## 开发注意事项

- **热重载**：主进程需要重新构建，渲染进程通过 Vite 支持 HMR
- **开发工具**：开发模式下自动打开（见 `main/index.ts:54`）
- **窗口设置**：默认 1400x900，最小 800x600
- **macOS**：使用 hiddenInset 标题栏和毛玻璃效果
- **图标**：在 apps/electron/resources/ 中使用 `bun run generate:icons` 生成
- **注释**：所有的代码都需要有明确完备的注释，注释可以采用中文

## 测试

使用 Bun 内置的测试运行器：

```ts
import { test, expect } from "bun:test";

test("example", () => {
  expect(1).toBe(1);
});
```

运行命令：`bun test`
