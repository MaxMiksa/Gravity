<h1 align="center">Gravity</h1>

<p align="center">
  <a href="https://img.shields.io/badge/version-v0.4.3-blue.svg"><img alt="版本" src="https://img.shields.io/badge/版本-v0.4.3-blue.svg" /></a>
  <a href="https://img.shields.io/badge/Desktop-Electron-47848F.svg"><img alt="Desktop" src="https://img.shields.io/badge/Desktop-Electron-47848F.svg" /></a>
  <a href="LICENSE"><img alt="许可证" src="https://img.shields.io/badge/许可证-MIT-green.svg" /></a>
  &nbsp;&nbsp;
  <a href="README.md">English</a>
</p>

✅ **本地优先（默认本地存储）| 开源可审计 | Chat / Agent 双模式**  
✅ **多供应商接入 | 文件解析对话 | 流式输出 | Skills & MCP**  
✅ **Windows / macOS | OpenAI 兼容接口 | Anthropic Agent 工作流**  

Gravity 是一个面向生产效率的 AI 桌面应用，核心目标是把通用对话、自动化 Agent 与本地数据安全放到同一个工作流里。
你可以从聊天开始，也可以在 Agent 模式中把多步骤任务交给 AI 持续执行。

## 🎬 可视化演示

<p align="center">
  <img src="https://img.erlich.fun/personal-blog/uPic/tBXRKI.png" alt="Gravity Chat Mode" width="900" />
</p>

## ✨ 核心特性

| 功能 | 描述 |
| :--- | :--- |
| 🤖 Chat / Agent 双模式 | 既支持常规对话，也支持自主执行任务的 Agent 工作流 |
| 🔌 多供应商渠道 | 支持 Anthropic、OpenAI、Google、DeepSeek、MiniMax、Kimi、智谱 GLM 及 OpenAI 兼容端点 |
| 📎 文件与文档解析 | 支持图片上传，支持 PDF / Office / 文本内容注入对话 |
| 🌊 流式与思考展示 | 实时流式输出，可视化思考过程 |
| 🧩 Skills 与 MCP | 默认 Skills，可通过对话安装扩展能力 |
| 🏠 本地优先 | 数据默认存储在 `~/.gravity/`，无中心数据库 |

## 🚀 快速使用（推荐路径）

1. 下载最新版本：[`GitHub Releases`](https://github.com/MaxMiksa/Gravity/releases)
2. 启动应用后进入 `设置 > 渠道管理`，添加你的 API Key 并测试连接。
3. 在 Chat 模式直接对话，或在 Agent 模式选择 Anthropic 渠道后执行任务。

<details>
  <summary><strong>Requirements & Limits（环境要求与限制）</strong></summary>

- Agent 模式需要可用的 Node.js 与 Git 运行环境。
- Agent 模式当前依赖 Anthropic 渠道。
- 本地数据默认写入 `~/.gravity/`，请确保目录有读写权限。

</details>

<details>
  <summary><strong>Developer Guide（本地开发）</strong></summary>

```powershell
# 1) 安装依赖
bun install

# 2) 避免 Electron 以 Node 模式运行（Windows 常见问题）
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

# 3) 启动开发模式（Vite + Electron）
npm run dev

# 4) 构建
npm run build
```

</details>

<details>
  <summary><strong>Troubleshooting / Known Issues（常见问题）</strong></summary>

- `ERR_CONNECTION_REFUSED`：通常是只启动了 Electron，未启动 Vite dev server，请使用 `npm run dev`。
- `whenReady` 相关报错：先清理环境变量 `ELECTRON_RUN_AS_NODE` 后重启。
- `5173` 端口冲突：关闭占用进程或修改 Vite 端口配置。

</details>

<details>
  <summary><strong>商业版本（可选）</strong></summary>

如需云端能力、稳定 API 与订阅服务，可使用商业版本：
https://gravity.cool/download

</details>

## 🤝 贡献与联系

欢迎提交 Issue 和 Pull Request！  
如有任何问题或建议，请联系 Zheyuan (Max) Kong (卡内基梅隆大学，宾夕法尼亚州)。

Zheyuan (Max) Kong: kongzheyuan@outlook.com | zheyuank@andrew.cmu.edu

## 📄 开源许可

[MIT](./LICENSE)
