/**
 * WorkspaceSelector — Agent 工作区切换器
 *
 * 下拉选择器，展示所有工作区，支持新建和切换。
 * 切换工作区后持久化到 settings。
 */

import * as React from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { FolderOpen, Plus, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  agentWorkspacesAtom,
  currentAgentWorkspaceIdAtom,
} from '@/atoms/agent-atoms'
import type { AgentWorkspace } from '@proma/shared'

export function WorkspaceSelector(): React.ReactElement {
  const [workspaces, setWorkspaces] = useAtom(agentWorkspacesAtom)
  const [currentWorkspaceId, setCurrentWorkspaceId] = useAtom(currentAgentWorkspaceIdAtom)
  const [open, setOpen] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [newName, setNewName] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId)

  /** 切换工作区 */
  const handleSelect = (workspace: AgentWorkspace): void => {
    setCurrentWorkspaceId(workspace.id)
    setOpen(false)

    // 持久化到设置
    window.electronAPI.updateSettings({
      agentWorkspaceId: workspace.id,
    }).catch(console.error)
  }

  /** 开始新建 */
  const handleStartCreate = (): void => {
    setCreating(true)
    setNewName('')
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  /** 提交新建 */
  const handleCreate = async (): Promise<void> => {
    const trimmed = newName.trim()
    if (!trimmed) {
      setCreating(false)
      return
    }

    try {
      const workspace = await window.electronAPI.createAgentWorkspace(trimmed)
      setWorkspaces((prev) => [workspace, ...prev])
      setCurrentWorkspaceId(workspace.id)
      setCreating(false)
      setOpen(false)

      // 持久化到设置
      window.electronAPI.updateSettings({
        agentWorkspaceId: workspace.id,
      }).catch(console.error)
    } catch (error) {
      console.error('[WorkspaceSelector] 创建工作区失败:', error)
    }
  }

  /** 键盘事件 */
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreate()
    } else if (e.key === 'Escape') {
      setCreating(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] transition-colors duration-100 titlebar-no-drag',
            'text-foreground/70 bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-foreground/[0.06]',
          )}
        >
          <FolderOpen size={14} className="flex-shrink-0 text-foreground/50" />
          <span className="flex-1 text-left truncate">
            {currentWorkspace?.name || '选择工作区'}
          </span>
          <ChevronDown size={12} className="flex-shrink-0 text-foreground/40" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        className="w-[var(--radix-popover-trigger-width)] p-1"
      >
        {/* 工作区列表 */}
        <div className="max-h-[200px] overflow-y-auto">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => handleSelect(ws)}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] transition-colors duration-100 text-left',
                ws.id === currentWorkspaceId
                  ? 'bg-primary/10 text-foreground'
                  : 'text-foreground/70 hover:bg-foreground/[0.04]',
              )}
            >
              <FolderOpen size={13} className="flex-shrink-0 text-foreground/40" />
              <span className="flex-1 truncate">{ws.name}</span>
              {ws.id === currentWorkspaceId && (
                <Check size={13} className="flex-shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>

        {/* 分隔线 */}
        <div className="my-1 border-t border-foreground/[0.06]" />

        {/* 新建工作区 */}
        {creating ? (
          <div className="px-2 py-1">
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newName.trim()) setCreating(false)
              }}
              placeholder="工作区名称..."
              className="w-full bg-transparent text-[13px] text-foreground border-b border-primary/50 outline-none px-0.5 py-1"
              maxLength={50}
            />
          </div>
        ) : (
          <button
            onClick={handleStartCreate}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] text-foreground/50 hover:bg-foreground/[0.04] hover:text-foreground/70 transition-colors duration-100"
          >
            <Plus size={13} />
            <span>新建工作区</span>
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
