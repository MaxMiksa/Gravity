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

## 14. 历史重构执行结果（2026-02-10）
- 已完成：按既定计划将本地 `main` 重构为 `520` 条线性提交（无 merge commit）。
- 已完成：Author/Committer 唯一值统一为 `MaxMiksa <kongzheyuan@outlook.com>`。
- 已完成：日期规则校验通过（区间 `2025-07-01` ~ `2026-02-10`，排除周末与指定美国联邦节假日，`America/New_York`）。
- 已完成：消息规则校验通过（全英文且不含禁用重写痕迹词）。
- 已完成：标签 `v0.4.1`、`v0.4.2`、`v0.4.3` 在新历史上重建。
- 已完成：最终树一致性校验通过（`main^{tree}` 与 blueprint `meta.source_tree` 一致）。
- 已完成：工程构建验收通过（执行 `bun install --force` 后 `npm run build` 成功）。
- 核验产物：`scripts/history_rewrite/rewrite_report.md`（全 PASS）。
- 关键输入：`scripts/history_rewrite/blueprints/gravity-blueprint-20260210-015305.json`（已修正 2 条含 `rewrite` 的提交消息）。
- 安全锚点保留：
  - `backup/pre-520-rewrite-20260210-015004`
  - `backups/history_rewrite/gravity-pre520-20260210-015004.bundle`
  - `rewrite/source-snapshot-20260210-015004`
- 当前状态：`main` 与 `origin/main` 分叉（本地 ahead 520 / behind 61）；按用户要求未推送。

## 15. tags/releases 可行性评估（2026-02-11）
- 在“仅本地重写、不 push”前提下，GitHub 侧分支、tags、releases 均不会变化，也不会被删除。
- 若后续 `force push main` 但不更新 tags，远端既有 tags/release 仍指向旧 tag 对象（仍可用，但与新历史不一致）。
- 若目标是“tag 保留且继续对应同名 release”，可行方案是保留 tag 名称并将其重定位到新历史后再推送 tags（可能需要 force 更新 tags）。
- `release` 的显示时间需区分字段：发布时刻（`published_at`）通常不会因 tag 重定位自动改写；与提交时间相关字段可随目标提交变化而变化。
- 对“release 日期必须等于新 commit 日期”这一目标，存在平台字段语义限制，通常需要在“保留原 release”与“重建 release 时间”之间取舍。
- 本地临时产物默认不会同步到 GitHub：`backup/*` 分支、`rewrite/*` 分支、`.bundle` 文件均仅本地，除非被显式 push 或纳入版本控制后推送。

## 16. Release 时间字段结论（2026-02-11）
- 依据 GitHub REST 文档，`Create a release` 与 `Update a release` 的请求参数不提供直接写入 `published_at` 的能力。
- `published_at` 可视为发布动作产生的时间戳：可通过“重新创建/重新发布 release”间接改变为新的发布时间，但无法回填为任意历史提交时间。
- 若优先保留现有 release（含 assets、讨论、链接），建议只更新 tag 指向；若优先改变发布时间显示，通常需重建 release 并迁移 assets。

## 17. 历史重构产物路径迁移（2026-02-12）
- 已完成：仓库文档中的蓝图路径已统一替换为 `scripts/history_rewrite/blueprints/gravity-blueprint-20260210-015305.json`。
- 已完成：仓库文档中的 bundle 路径已统一替换为 `backups/history_rewrite/gravity-pre520-20260210-015004.bundle`。
- 已完成：全仓检索确认无上述旧路径残留。
- 已完成：执行 `npm run build` 通过，路径更新未引入构建回归。

## 18. 重构产物目录规范（2026-02-12）
- 目录规范：历史重构蓝图统一存放在 `scripts/history_rewrite/blueprints/`。
- 目录规范：历史重构备份 bundle 统一存放在 `backups/history_rewrite/`。
- 版本控制策略：`backups/history_rewrite/*.bundle` 已加入 `.gitignore`，默认不纳入仓库历史。
- 验证状态：完成目录迁移与引用修正后，`npm run build` 通过。

## 19. 云端 Gravity 差异核查（2026-02-12）
- 比较基准：云端 `MaxMiksa/Gravity` 的 `main`（`861a142`） vs 本地 `main`（`cfdd5fe`）。
- 提交面：`git rev-list --left-right --count gravity/main...main` = `85 520`（云端侧 85，本地侧 520）。
- 拓扑关系：`git merge-base gravity/main main` 无结果，当前不是同祖先线性分支关系。
- 快照面：`git diff --shortstat gravity/main main` = `111 files changed, 3647 insertions(+), 3416 deletions(-)`。
- 差异类型：`M 83 / A 13 / D 10 / R100 5`；差异集中在 `apps`、`packages`、`scripts`。
- 当前工作区状态：存在未提交本地改动（文档与配置文件），需在后续同步前明确是否先提交或暂存。

## 20. 非命名差异基线（2026-02-12）
- 约束确认：保持 `gravity` 命名，不要求本地与云端 commit 颗粒度一致。
- 过滤方法：在 `gravity/main` vs `main` 文件差异基础上，归一化品牌词（`gravity/Gravity/GRAVITY`）后判定纯命名差异。
- 结果：总差异 `111` 项，其中纯命名差异 `55` 项，剩余实质差异 `56` 项。
- 模块分布：`renderer(20)`、`main-process(11)`、`docs-markdown(9)`、`history-rewrite(6)`、`packages(3)`、`electron-config(3)`、`preload(1)`、`default-skills(1)`、`other(2)`。
- 当前判读：后续同步评估应聚焦这 `56` 项非命名差异，提交拆分差异可忽略。

## 21. 同步落地优先级（2026-02-12）
- 执行原则：保持 `Gravity` 命名与本地历史重构资产不变，仅选择性吸收云端 Gravity 的功能更新。
- P0（优先同步，稳定性/可用性）：`apps/electron/src/main/lib/chat-service.ts`、`apps/electron/src/main/lib/updater/auto-updater.ts`、`apps/electron/electron-builder.yml`、`apps/electron/default-skills/find-skills/SKILL.md`。
- P1（高价值功能）：聊天原地编辑/重发链路（`ChatView.tsx`、`ChatMessages.tsx`、`ChatMessageItem.tsx`、`ParallelChatMessages.tsx`、`InlineEditForm.tsx`、`conversation-manager.ts`、`ipc.ts`、`preload/index.ts`、`packages/shared/src/types/chat.ts`）。
- P2（可选能力包）：环境检测与 Onboarding 全链路（`environment-checker.ts`、`node-detector.ts`、`OnboardingView.tsx`、`EnvironmentCheckCard.tsx`、`renderer/atoms/environment.ts`、`types/settings.ts`、`packages/shared/src/types/environment.ts` 等）。
- 明确保留：`scripts/history_rewrite/*`、`AGENTS.md`、`CHAT_LOGS.md`、`PROJECT.md` 及本地 PowerShell 兼容脚本策略（如 root `package.json` 的无引号 filter）。

## 22. 增量合并长期策略（已确认）（2026-02-12）
- 目标约束：
  - 不覆盖/替换本地提交池（当前为 520+ 拆分提交），仅新增本地 commit 吸收云端功能变化。
  - 每轮合并后需可构建运行，默认以 `npm run build` 作为最低验收门槛。
  - 统一保持本地品牌命名 `gravity`，不引入 `gravity` 命名回流。
- 标准流程（每轮云端更新时重复执行）：
  - 拉取云端基线：`gravity/main`。
  - 生成“非命名差异”清单并按 P0/P1/P2 分级。
  - 逐项回补到本地代码，必要时做 `gravity` 命名适配。
  - 为每个逻辑单元创建新的本地细粒度 commit，补充进当前 commit 池。
  - 执行构建/关键回归验证；通过后再进入下一批差异。
- 历史统一策略（用户需求，待确认范围）：
  - 已确认：仅“新增 commit”遵循本地已重写的统一作者/邮箱/时间/拆分规范。
  - 已确认：本轮不做历史再重写，不改动既有 520+ 提交池。
- 文档同步：
  - 每轮对话与执行结果继续写入 `CHAT_LOGS.md`、`PROJECT.md`。

## 23. Gravity 增量回补执行记录（P0）（2026-02-12）
- 用户确认选项：
  - `1a`：本轮仅执行 P0。
  - `2a`：手动回补并创建本地新提交。
  - `3a`：仅新增提交需要遵循统一元数据规则。
  - `4`：提交元数据直接复用本地已重写规则（`MaxMiksa <kongzheyuan@outlook.com>` + `-0500` 时区时间）。
- 已实施文件：
  - `apps/electron/src/main/lib/chat-service.ts`：回补空助手消息过滤与空响应不落盘逻辑。
  - `apps/electron/src/main/lib/updater/auto-updater.ts`：回补安装前清理与延迟 `quitAndInstall` 逻辑。
  - `apps/electron/src/main/lib/agent-service.ts`：新增 `stopAllAgents()` 供更新流程调用。
  - `apps/electron/electron-builder.yml`：回补 SDK 排除规则（避免打包硬链接冲突）。
  - `apps/electron/default-skills/find-skills/SKILL.md`：恢复默认技能模板。
- 构建验证：
  - `npm run build` 通过。
- 新增提交（本地）：
  - `1cacce6` `fix(chat): skip empty assistant responses`
  - `3455346` `fix(updater): defer install and stop active sessions`
  - `e25b589` `fix(build): exclude claude sdk from builder files`
  - `f2a846f` `feat(skills): add default find-skills skill`

## 24. Gravity 增量回补执行记录（扩展范围）（2026-02-12）
- 执行输入：
  - 用户要求继续落实“所有我判断需要落实的 changes”，不局限于 P0/P1。
- 执行策略：
  - 保持 `gravity` 命名。
  - 仅新增本地 commit，不重写既有 520+ 历史。
  - 每批改动后执行构建验证。
- 本轮补齐能力：
  - Agent 提示词规则：强制 Skill 工具使用带命名空间前缀的完整名称。
  - 主进程/IPC：
    - 恢复 `truncateMessagesFrom` 链路（IPC + preload + shared channel）。
    - 恢复环境检测 IPC 与设置持久化。
    - 恢复/强化 macOS 关闭隐藏、Dock 激活恢复、Tray 菜单弹出逻辑。
    - 退出前统一清理活跃 Agent/Chat 和 updater 资源。
  - Renderer：
    - 恢复用户消息原地编辑与重发（含附件重编）链路。
    - 恢复 Onboarding 与环境检测卡片。
    - 恢复更新可用红点提示（侧栏/设置相关）。
    - 补回 `alert` / `badge` UI 基础组件以满足新链路依赖。
  - Shared types：
    - 补回 `packages/shared/src/types/environment.ts` 并恢复导出。
    - 补回聊天截断 IPC 常量。
- 构建验证：
  - `npm run build` 通过（本轮完成后复验）。
- 新增提交（本地）：
  - `67d3f31` `fix(agent): enforce namespaced skill invocation`
  - `bee7ef4` `feat(core): restore env checks, chat truncation, and mac tray behavior`
  - `5f890bc` `feat(renderer): restore inline edit, onboarding, and update indicators`

## 25. 增量回补收口复核（2026-02-12）
- 差异复核方法：
  - 以 `main..gravity/main` 做文件与补丁级对比。
  - 过滤 `gravity/gravity` 品牌词后，复核是否仍有功能逻辑差异。
- 复核结论：
  - 近期关键修复提交已全部覆盖到本地（含空消息过滤、更新安装时机、Skill 命名空间强制、环境检测/Onboarding、inline edit）。
  - 新增收口提交：`b1031a0`（SDK 版本钉住与技能模板文本对齐）。
  - 当前剩余差异主要为品牌命名、仓库链接、版本号与文案注释，不影响运行链路。
  - 通过 `explorer` 子代理独立复核后结论一致：未发现新的必须同步功能差异。
- 兼容性策略：
  - 保持本地 `gravity` 命名不回流。
  - 保留本地 Windows 兼容脚本实现，不同步 `sleep 2` 替换（避免跨平台脚本退化）。
- 状态：
  - 当前“功能性增量回补”已完成，可进入下一轮云端更新后的增量同步循环。

## 26. 品牌标识统一替换（2026-02-12）
- 执行输入：
  - 用户要求全仓检测并统一替换旧用户名与旧品牌词。
- 执行规则：
  - 旧用户名 → `MaxMiksa`
  - 旧品牌词大小写变体 → `Gravity/GRAVITY/gravity`
- 影响范围（代表文件）：
  - `apps/electron/package.json`（author.name）
  - `apps/electron/electron-builder.yml`（publish.owner）
  - `apps/electron/src/renderer/components/settings/AboutSettings.tsx`（项目仓库链接）
  - `CHAT_LOGS.md`、`PROJECT.md`、`task_plan.md`、`findings.md`、`progress.md` 以及历史重构蓝图文本
- 验证结果：
  - 全仓复扫未命中旧用户名与旧品牌词关键字。
  - `npm run build` 通过。
- 约束说明：
  - 本轮按用户关键字指令执行，未扩展到邮箱等其他身份字段替换。

## 27. 替换彻底性复核（2026-02-12）
- 用户补充要求：
  - 必须确认设置页中的项目地址已切换到新账号仓库。
  - 若仍出现旧地址，需分析原因并重新执行替换。
- 复核动作：
  - 对源码与文本资产执行二次全仓扫描（不忽略关键文本文件）。
  - 对构建产物 `apps/electron/dist` 再扫描，验证运行时代码中的链接字符串。
  - 补齐遗漏替换：`apps/electron/package.json` 作者邮箱更新为 `kongzheyuan@outlook.com`。
- 结果：
  - `apps/electron/src/renderer/components/settings/AboutSettings.tsx` 与构建产物均为 `github.com/MaxMiksa/Gravity`。
  - 旧关键词在代码文本与构建产物中均为零命中。
  - `npm run build` 通过。

## 28. 远端同步执行（2026-02-12）
- 执行目标：
  - 将当前本地 `main` 全量同步到 `origin`（`https://github.com/MaxMiksa/Gravity`）。
- 分支状态：
  - 同步前 `main` 对 `origin/main`：`ahead 528 / behind 61`（历史分叉，无法快进推送）。
- 执行策略：
  - 先提交本地未提交改动。
  - 再使用 `git push --force-with-lease origin main` 进行安全强制推送，保证远端内容对齐本地。
- 预期结果：
  - 远端 `main` 文件树与本地当前工作树一致。
