# Gravity 项目手册（PROJECT.md）

本文件用于沉淀本项目的长期事实、约束、决策与进展，作为迁移与后续开发的统一记忆。

## 1. 项目目的与范围

### 1.1 目标（Why）
- 将原仓库 `Gravity` 迁移到新身份体系下并进行系统化革新。
- 以 `Gravity` 工作空间作为长期开发主场，持续推进产品能力与工程质量。
- 在开发过程中规范整理提交历史与关键决策，提升可维护性。

### 1.2 范围（What）
- 仓库迁移准备与远程切换。
- 代码与文档持续迭代。
- 提交记录（commit history）整理策略设计与执行。

## 2. 受众与语言规范
- 用户可读文档：中文（如 `PROJECT.md`、`CHAT_LOGS.md`）。
- AI 操作规则：英文（`AGENTS.md`）。

## 3. 已确认事实（Facts）

### 3.1 关键路径
- 当前本地工作目录：`d:\Max\Projects\Dev\Gravity`
- 当前远程仓库（origin）：`https://github.com/MaxMiksa/Gravity.git`
- 目标仓库：`https://github.com/MaxMiksa/Gravity`

### 3.2 当前技术栈（来自现有仓库）
- 运行时：Bun
- 桌面框架：Electron
- 前端：React + TypeScript
- 状态管理：Jotai
- 样式：Tailwind CSS + shadcn/ui
- 构建：Vite + esbuild
- Bun 版本约束：1.2.5（来自 `apps/electron/package.json`）

### 3.3 当前约束
- 已完成远程切换；后续以主账号仓库 `MaxMiksa/Gravity` 为唯一远程目标。
- 提交身份治理策略：仅保留主账号身份的 commit 历史记录。
- 历史重写后的多副本同步策略：优先重新 clone；仅在可覆盖本地改动时使用 `fetch + reset --hard`。
- 本仓库需长期维护对话日志与项目手册。
- 所有文本文件应保持 UTF-8（无 BOM）。

## 4. 迁移策略草案
- 阶段 A：保持与 `Gravity` 同步开发，完成结构梳理与改造计划。
- 阶段 B：已完成新远程切换（`origin -> MaxMiksa/Gravity`）。
- 阶段 C：按约定策略整理提交历史（保留历史或分段重构）。

## 5. 未决问题（Open Questions）
- 首次向 `MaxMiksa/Gravity` 推送时是否采用 `main` 直推或 `init/migration` 过渡分支。
- 提交历史策略：完整保留、压缩归档、或按里程碑重组。
- 首次迁移时是否拆分基础设施改造与功能迭代。

## 6. 进展记录（Progress）
- 2026-02-09：在当前目录完成源仓库 clone。
- 2026-02-09：初始化 `AGENTS.md`、`CHAT_LOGS.md`、`PROJECT.md` 三件套。
- 2026-02-09：完成 `planning-with-files`、内置 `update_plan`、`openspec`、`repo-init` 的方法论对比，并生成 `SKILL_COMPARISON.md`。
- 2026-02-09：完成 `planning-with-files` skill 本地安装（来源：`OthmanAdi/planning-with-files`，路径：`skills/planning-with-files`，分支：`master`）。
- 2026-02-09：完成全仓旧品牌 -> `Gravity` 品牌替换（含代码、文档、包作用域、配置路径与资源命名）。
- 2026-02-09：梳理本地启动脚本与 PowerShell 过滤参数注意事项（以根 `package.json` 与 `apps/electron/package.json` 为准）。
- 2026-02-09：在 `README.md` 与 `README.en.md` 新增本地开发启动章节（PowerShell 版本）。
- 2026-02-09：完成 Electron 主进程安全与稳健性审查，记录 IPC 路径穿越、Agent 文件写入/复制、shell 执行与权限绕过风险。
- 2026-02-09：完成数据持久化/配置路径与更新发布设置审查，记录路径碰撞、设置回写丢失与发布仓库配置风险。
- 2026-02-09：定位 typecheck 失败根因：`apps/electron` 的 project references 未满足 composite/noEmit 约束，且根 `package.json` 的 `--filter=*` 在当前环境无法匹配。
- 2026-02-09：完成运行时 UX 可靠性/性能风险审查，聚焦 localhost/devtools、watch 脚本与跨平台命令问题。
- 2026-02-09：完成全项目深度 code review，确认高优先级问题集中在附件/Agent 文件路径越界风险与 TypeScript references 配置异常。
- 2026-02-09：收到歧义指令“启用gi”，已进入澄清阶段，等待用户确认具体目标（Git/GUI/配置开关）。
- 2026-02-09：确认 Git 已启用且可用；当前分支 `main`，`origin` 初始指向旧仓库远程（已脱敏）。
- 2026-02-09：完成 Git 配置快照核查：本地 `main -> origin/main`，远程为旧仓库（已脱敏），全局身份 `MaxMiksa <kongzheyuan@outlook.com>`。
- 2026-02-09：完成远程迁移：`origin` 已切换至 `https://github.com/MaxMiksa/Gravity.git`，并清理旧远程追踪引用，旧仓库连接已断开。
- 2026-02-10：按回滚要求删除远端 tags，并清理本地文档中的相关敏感记录；远端 `main` 因默认分支限制仍存在。
- 2026-02-10：核验本地与 `origin/main` 的作者身份一致性，当前可达历史仅含主账号身份记录。
- 2026-02-10：按推荐执行“强制对齐兜底”流程（`stash -u` → `fetch --prune` → `reset --hard origin/main` → `stash pop`），完成同步且本地改动已恢复。
- 2026-02-10：再次核验提交身份与数量：`author/committer` 唯一值均为主账号；当前可达 commit 总数 `61`（`main` 与 `--all` 一致）。
- 2026-02-10：明确历史重写风险边界：对单人项目主要是本地副本/备份一致性与可恢复性风险，不是团队协作冲突风险。

## 7. 流程方法论沉淀
- 对比文档：`SKILL_COMPARISON.md`
- 当前建议的组合策略：
  - 底层治理：`repo-init`（项目记忆与日志）
  - 执行管理：`planning-with-files` + `update_plan`
  - 规范变更：`openspec`（按需启用）

## 8. 流程策略评估（2026-02-09）

### 8.1 问题
- `planning-with-files` 是否可以完全替代 `openspec` 做 changes 记录。

### 8.2 评估结论
- 在个人/小团队场景下，可行性较高（建议按 70%~85% 评估）。
- 不建议 100% 替代：`planning-with-files` 更强在执行记忆与过程追踪，`openspec` 更强在变更生命周期与可审计治理。

### 8.3 主要风险
- 生命周期缺失：容易缺少“提议/批准/实施/归档”的状态边界。
- 可追溯性下降：跨月份回看时难快速回答“为什么改、谁确认、何时生效”。
- 协作漂移：多人参与后记录格式和粒度可能快速失控。

### 8.4 推荐策略
- 采用“主从分层”而非“完全替代”：
  - 主：`planning-with-files`（`task_plan.md`/`findings.md`/`progress.md`）
  - 从：轻量 `openspec/changes/*.md` 作为变更索引与归档锚点
- 仅在重大变更触发时升级完整 openspec（例如：架构层、公共接口、跨 3+ 核心模块）。

## 9. 技能安装状态
- 已安装：`planning-with-files`
- 安装位置：`C:\Users\Max\.codex\skills\planning-with-files`
- 后续动作：重启 Codex 以稳定加载新技能；下一轮可直接按该 skill 启动三文件执行流。

## 10. 品牌迁移状态
- 已完成：仓库内旧品牌文本引用全量替换为 `Gravity/gravity/@gravity/.gravity`。
- 已完成：资源目录与文件重命名（迁移为 `gravity-logos` 与 `gravity.png`）。
- 待完成：安装依赖后执行完整构建验证（当前环境缺少 `esbuild`）。

## 11. 启动与运行状态
- 当前状态：项目已可启动（已在本地成功运行 Electron 主进程）。
- 启动前置：需先执行 `bun install`。
- Windows 关键注意项：启动前清理 `ELECTRON_RUN_AS_NODE` 环境变量。
- 推荐手动启动命令（PowerShell）：
  - `Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue`
  - `bun run --filter=@gravity/electron dev`
  - 或 `Set-Location apps/electron; npx electron .`
- 已修复：`apps/electron/package.json` 的 `dev:electron` 脚本由 `sleep 2` 改为 Node 延时，提升 Windows 兼容性。
- 已修复：根 `package.json` 的 `--filter='...'` 改为无引号形式，`npm run dev/build` 在 PowerShell 可用。
- 验证结果：`npm run build` 已通过。
- 文档状态：已在中英文 README 固化手动启动步骤与常见问题处理。

## 12. Renderer/Preload 安全审查
- 发现：附件读取/删除/抽取路径缺少规范化与前缀校验，存在路径穿越风险。
- 发现：Mermaid SVG 渲染链路可能注入不可信 SVG，导致 Renderer XSS。
- 发现：Agent 文件保存/拷贝接口缺少路径约束，潜在越界写入/拷贝。
- 下一步：为附件与 Agent 文件操作补充路径白名单校验，并为 Mermaid 渲染加 sanitize 或安全模式。

## 13. 全项目 Code Review 摘要（2026-02-09）
- 高优先级：`resolveAttachmentPath` 直接 `join` 外部 `localPath`，并在读/删/抽取链路复用，需补齐路径归一化与目录边界校验。
- 高优先级：`saveFilesToAgentSession` 将 `filename` 直接拼接到 session 目录写入，存在 `../` 越界写入风险。
- 中优先级：`@gravity/electron` 的 `tsconfig references` 与被引用包的 `composite/noEmit` 约束不一致，`npm run typecheck` 持续失败。
- 中优先级：Mermaid 渲染采用 `dangerouslySetInnerHTML`，需确认 SVG sanitize 策略与配置默认值。
- 中优先级：发布与运维配置仍有迁移遗留（`electron-builder.yml` 的 `owner`、帮助链接 placeholder、`http` 外链与 Linux watcher 兼容性）。
