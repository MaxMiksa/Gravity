# planning-with-files vs Plan / OpenSpec / repo-init 对比

> 生成时间：2026-02-09 05:41:27（Local）
> 对比对象：
> - `planning-with-files`（https://github.com/OthmanAdi/planning-with-files）
> - 内置 `update_plan`（本会话的 plan 功能）
> - `openspec` skill
> - `repo-init` skill

## 1) 一句话定义

- **planning-with-files**：把复杂任务的计划、发现、进度落地为三个持久化文件（`task_plan.md` / `findings.md` / `progress.md`），降低上下文丢失。
- **内置 plan（update_plan）**：会话内的任务看板，用于标记步骤状态与推进顺序。
- **openspec skill**：变更治理流程路由器，围绕 `openspec-proposal / apply / archive` 管理规范级变更。
- **repo-init skill**：仓库文档引导器，建立并维护 `AGENTS.md`、`CHAT_LOGS.md`、`PROJECT.md` 的长期记录机制。

## 2) 共同点（相同）

- 都是“流程约束工具”，目的是让工作更可追踪、可复盘、可协作。
- 都强调结构化产物（看板、规范、日志或文档），而不是只靠临时对话记忆。
- 都适合多步骤任务；越复杂的任务收益越大。

## 3) 关键差异（不同）

| 维度 | planning-with-files | 内置 plan（update_plan） | openspec skill | repo-init skill |
|---|---|---|---|---|
| 核心目标 | 把执行记忆落盘，防止上下文漂移 | 在当前会话里管理步骤状态 | 对“规范/需求变更”做阶段化治理 | 建立仓库长期知识与对话记录体系 |
| 主要产物 | `task_plan.md` `findings.md` `progress.md` | 计划步骤及 `pending/in_progress/completed` 状态 | `openspec/` 下的 proposal/design/tasks 或已归档变更 | `AGENTS.md` `CHAT_LOGS.md` `PROJECT.md` |
| 生命周期 | 跨会话、跨天持续 | 主要是当前会话可见 | 跨阶段（提案→实施→归档） | 长期持续（每轮对话更新） |
| 适用场景 | 复杂实现、研究型任务、易中断任务 | 日常任务拆解与推进可视化 | 需要“先提案后实施”的正式变更 | 仓库初始化与知识沉淀治理 |
| 约束强度 | 中高（强调持续写文件与复盘） | 中（轻量、快速） | 高（阶段和前置条件明确） | 中（强调文档存在与持续更新） |
| 对代码改动关系 | 可有可无，偏执行管理 | 与代码无强绑定 | 与代码改动治理强相关 | 与代码弱相关，偏文档治理 |

## 4) 你最关心的差别（实操视角）

- `planning-with-files` 和内置 `plan` 最像，但**一个是文件持久化记忆**，一个是**会话内看板**。
- `openspec` 不是通用计划工具，而是**规范化变更流程**（特别适合“要审查/要留痕”的变更）。
- `repo-init` 不是任务执行方法论，而是**仓库文档操作系统**（保证团队长期可读性）。

## 5) 如何组合使用（推荐）

- **常规复杂任务**：`update_plan` + `planning-with-files`  
  - `update_plan` 管当前节奏；`task_plan/findings/progress` 管长期记忆。
- **正式需求变更**：`openspec` + `planning-with-files`  
  - `openspec` 管变更门禁；`findings/progress` 记录调研与执行细节。
- **仓库长期运营**：`repo-init` +（上述任一）  
  - `repo-init` 维护项目知识底座，避免“只有聊天记录没有项目记忆”。

## 6) 结论

- 如果你要的是“我今天和明天都不丢上下文”的执行系统：优先 `planning-with-files`。
- 如果你要的是“当前会话清晰推进”：内置 `update_plan` 足够快。
- 如果你要的是“规范级变更治理”：用 `openspec`。
- 如果你要的是“仓库长期文档纪律”：用 `repo-init`。

你当前的 Gravity 场景（迁移 + 持续重构 + commit 整理）最适合：
- **底层**：`repo-init`
- **执行层**：`planning-with-files` + `update_plan`
- **规范层（按需）**：`openspec`
