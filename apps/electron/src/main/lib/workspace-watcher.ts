/**
 * 工作区文件监听器
 *
 * 使用 fs.watch 递归监听 ~/.proma/agent-workspaces/ 目录，
 * 根据变化的文件路径区分事件类型：
 * - mcp.json / skills/ 变化 → 推送 CAPABILITIES_CHANGED（侧边栏刷新）
 * - 其他文件变化 → 推送 WORKSPACE_FILES_CHANGED（文件浏览器刷新）
 *
 * 所有事件均做 debounce 防抖，避免高频文件操作导致渲染进程风暴。
 */

import { watch, existsSync } from 'node:fs'
import type { FSWatcher } from 'node:fs'
import type { BrowserWindow } from 'electron'
import { AGENT_IPC_CHANNELS } from '@proma/shared'
import { getAgentWorkspacesDir } from './config-paths'

/** debounce 延迟（ms） */
const DEBOUNCE_MS = 500

let watcher: FSWatcher | null = null

/**
 * 启动工作区文件监听
 *
 * @param win 主窗口引用，用于向渲染进程推送事件
 */
export function startWorkspaceWatcher(win: BrowserWindow): void {
  const watchDir = getAgentWorkspacesDir()

  if (!existsSync(watchDir)) {
    console.warn('[工作区监听] 目录不存在，跳过:', watchDir)
    return
  }

  // 防抖定时器：按事件类型分别 debounce
  let capabilitiesTimer: ReturnType<typeof setTimeout> | null = null
  let filesTimer: ReturnType<typeof setTimeout> | null = null

  try {
    watcher = watch(watchDir, { recursive: true }, (_eventType, filename) => {
      if (!filename || win.isDestroyed()) return

      // filename 格式: {slug}/mcp.json 或 {slug}/skills/xxx/SKILL.md 或 {slug}/{sessionId}/file.txt
      const isCapabilitiesChange =
        filename.endsWith('/mcp.json') ||
        filename.endsWith('\\mcp.json') ||
        filename.includes('/skills/') ||
        filename.includes('\\skills/')

      if (isCapabilitiesChange) {
        // MCP/Skills 变化 → 通知侧边栏刷新
        if (capabilitiesTimer) clearTimeout(capabilitiesTimer)
        capabilitiesTimer = setTimeout(() => {
          if (!win.isDestroyed()) {
            win.webContents.send(AGENT_IPC_CHANNELS.CAPABILITIES_CHANGED)
          }
          capabilitiesTimer = null
        }, DEBOUNCE_MS)
      } else {
        // 其他文件变化 → 通知文件浏览器刷新
        if (filesTimer) clearTimeout(filesTimer)
        filesTimer = setTimeout(() => {
          if (!win.isDestroyed()) {
            win.webContents.send(AGENT_IPC_CHANNELS.WORKSPACE_FILES_CHANGED)
          }
          filesTimer = null
        }, DEBOUNCE_MS)
      }
    })

    console.log('[工作区监听] 已启动文件监听:', watchDir)
  } catch (error) {
    console.error('[工作区监听] 启动失败:', error)
  }
}

/**
 * 停止工作区文件监听
 */
export function stopWorkspaceWatcher(): void {
  if (watcher) {
    watcher.close()
    watcher = null
    console.log('[工作区监听] 已停止')
  }
}
