<h1 align="center">Gravity</h1>

<p align="center">
  <a href="https://img.shields.io/badge/version-v0.4.3-blue.svg"><img alt="Version" src="https://img.shields.io/badge/version-v0.4.3-blue.svg" /></a>
  <a href="https://img.shields.io/badge/Desktop-Electron-47848F.svg"><img alt="Desktop" src="https://img.shields.io/badge/Desktop-Electron-47848F.svg" /></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-green.svg" /></a>
  &nbsp;&nbsp;
  <a href="README-zh.md">中文说明</a>
</p>

✅ **Local-first (data stays on your machine) | Open source | Dual mode: Chat / Agent**  
✅ **Multi-provider channels | File parsing in chat | Streaming output | Skills & MCP**  
✅ **Windows / macOS | OpenAI-compatible endpoints | Anthropic Agent workflow**  

Gravity is an AI desktop app focused on real productivity workflows.
It combines general chat, autonomous agents, and local data control into one workspace.

## 🎬 Visual Demo

<p align="center">
  <img src="https://img.erlich.fun/personal-blog/uPic/3ZHWyA.png" alt="Gravity Agent Mode" width="900" />
</p>

## ✨ Core Features

| Feature | Description |
| :--- | :--- |
| 🤖 Chat / Agent Modes | Use simple chat or switch to autonomous multi-step agent execution |
| 🔌 Multi-Provider Support | Anthropic, OpenAI, Google, DeepSeek, MiniMax, Kimi, Zhipu GLM, and OpenAI-compatible endpoints |
| 📎 Attachments & Parsing | Upload images and parse PDF / Office / text content directly into context |
| 🌊 Streaming & Reasoning UI | Real-time streaming responses with visible reasoning flow |
| 🧩 Skills & MCP | Built-in skills with conversational discovery and installation |
| 🏠 Local-First Storage | Data is stored under `~/.gravity/` by default |

## 🚀 Happy Path (Recommended)

1. Download the latest build from [`GitHub Releases`](https://github.com/MaxMiksa/Gravity/releases).
2. Open `Settings > Channels`, add your API key, and test connectivity.
3. Start in Chat mode, or switch to Agent mode with an Anthropic channel configured.

<details>
  <summary><strong>Requirements & Limits</strong></summary>

- Agent mode requires working Node.js and Git runtimes.
- Agent mode currently depends on an Anthropic channel.
- Local data is stored under `~/.gravity/`; ensure write permission.

</details>

<details>
  <summary><strong>Developer Guide</strong></summary>

```powershell
# 1) Install dependencies
bun install

# 2) Prevent Electron from running in Node mode (common on Windows)
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

# 3) Start dev mode (Vite + Electron)
npm run dev

# 4) Build
npm run build
```

</details>

<details>
  <summary><strong>Troubleshooting / Known Issues</strong></summary>

- `ERR_CONNECTION_REFUSED`: Electron started without Vite dev server; use `npm run dev`.
- `whenReady` errors: clear `ELECTRON_RUN_AS_NODE` and restart.
- Port `5173` in use: stop conflicting process or change Vite port.

</details>

<details>
  <summary><strong>License</strong></summary>

[MIT](./LICENSE)

</details>

## 🤝 Contribution & Contact

Welcome to submit Issues and Pull Requests!
Any questions or suggestions? Please contact Zheyuan (Max) Kong (Carnegie Mellon University, Pittsburgh, PA).

Zheyuan (Max) Kong: kongzheyuan@outlook.com | zheyuank@tepper.cmu.edu
