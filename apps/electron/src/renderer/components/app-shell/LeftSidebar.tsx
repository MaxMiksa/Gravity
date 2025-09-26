/**
 * LeftSidebar - 左侧导航栏
 *
 * 包含：
 * - Chat/Agent 模式切换器
 * - 导航菜单项（点击切换主内容区视图）
 * - 对话列表（新对话按钮 + 按 updatedAt 降序排列）
 */

import * as React from 'react'
import { useAtom, useSetAtom, useAtomValue } from 'jotai'
import { MessagesSquare, Pin, Settings, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModeSwitcher } from './ModeSwitcher'
import { activeViewAtom } from '@/atoms/active-view'
import {
  conversationsAtom,
  currentConversationIdAtom,
  selectedModelAtom,
} from '@/atoms/chat-atoms'
import { userProfileAtom } from '@/atoms/user-profile'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { ActiveView } from '@/atoms/active-view'
import type { ConversationMeta } from '@proma/shared'

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}

function SidebarItem({ icon, label, active, onClick }: SidebarItemProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-[13px] transition-colors duration-100 titlebar-no-drag',
        active
          ? 'bg-foreground/[0.08] dark:bg-foreground/[0.08] text-foreground shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]'
          : 'text-foreground/60 hover:bg-foreground/[0.04] dark:hover:bg-foreground/[0.04] hover:text-foreground'
      )}
    >
      <span className="flex-shrink-0 w-[18px] h-[18px]">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

export interface LeftSidebarProps {
  /** 可选固定宽度，默认使用 CSS 响应式宽度 */
  width?: number
}

/** 侧边栏导航项标识 */
type SidebarItemId = 'pinned' | 'all-chats' | 'settings'

/** 导航项到视图的映射 */
const ITEM_TO_VIEW: Record<SidebarItemId, ActiveView> = {
  pinned: 'conversations',
  'all-chats': 'conversations',
  settings: 'settings',
}

/**
 * 格式化日期（简短显示）
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export function LeftSidebar({ width }: LeftSidebarProps): React.ReactElement {
  const [activeView, setActiveView] = useAtom(activeViewAtom)
  const [activeItem, setActiveItem] = React.useState<SidebarItemId>('all-chats')
  const [conversations, setConversations] = useAtom(conversationsAtom)
  const [currentConversationId, setCurrentConversationId] = useAtom(currentConversationIdAtom)
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)
  /** 待删除对话 ID，非空时显示确认弹窗 */
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null)
  const setUserProfile = useSetAtom(userProfileAtom)
  const selectedModel = useAtomValue(selectedModelAtom)

  // 初始加载对话列表 + 用户档案
  React.useEffect(() => {
    window.electronAPI
      .listConversations()
      .then(setConversations)
      .catch(console.error)
    window.electronAPI
      .getUserProfile()
      .then(setUserProfile)
      .catch(console.error)
  }, [setConversations, setUserProfile])

  /** 处理导航项点击 */
  const handleItemClick = (item: SidebarItemId): void => {
    setActiveItem(item)
    setActiveView(ITEM_TO_VIEW[item])
  }

  // 当 activeView 从外部改变时，同步 activeItem
  React.useEffect(() => {
    if (activeView === 'conversations' && activeItem === 'settings') {
      setActiveItem('all-chats')
    }
  }, [activeView, activeItem])

  /** 创建新对话（继承当前选中的模型/渠道） */
  const handleNewConversation = async (): Promise<void> => {
    try {
      const meta = await window.electronAPI.createConversation(
        undefined,
        selectedModel?.modelId,
        selectedModel?.channelId,
      )
      setConversations((prev) => [meta, ...prev])
      setCurrentConversationId(meta.id)
      // 确保在对话视图
      setActiveView('conversations')
      setActiveItem('all-chats')
    } catch (error) {
      console.error('[侧边栏] 创建对话失败:', error)
    }
  }

  /** 选择对话 */
  const handleSelectConversation = (id: string): void => {
    setCurrentConversationId(id)
    setActiveView('conversations')
    setActiveItem('all-chats')
  }

  /** 请求删除对话（弹出确认框） */
  const handleRequestDelete = (e: React.MouseEvent, id: string): void => {
    e.stopPropagation()
    setPendingDeleteId(id)
  }

  /** 重命名对话标题 */
  const handleRename = async (id: string, newTitle: string): Promise<void> => {
    try {
      const updated = await window.electronAPI.updateConversationTitle(id, newTitle)
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      )
    } catch (error) {
      console.error('[侧边栏] 重命名对话失败:', error)
    }
  }

  /** 确认删除对话 */
  const handleConfirmDelete = async (): Promise<void> => {
    if (!pendingDeleteId) return
    try {
      await window.electronAPI.deleteConversation(pendingDeleteId)
      setConversations((prev) => prev.filter((c) => c.id !== pendingDeleteId))
      if (currentConversationId === pendingDeleteId) {
        setCurrentConversationId(null)
      }
    } catch (error) {
      console.error('[侧边栏] 删除对话失败:', error)
    } finally {
      setPendingDeleteId(null)
    }
  }

  return (
    <div
      className="h-full flex flex-col bg-background"
      style={{ width: width ?? 280, minWidth: 180, flexShrink: 1 }}
    >
      {/* 顶部留空，避开 macOS 红绿灯 */}
      <div className="pt-[50px]">
        {/* 模式切换器 */}
        <ModeSwitcher />
      </div>
      
      {/* 新对话按钮 */}
      <div className="px-3 pt-3">
        <button
          onClick={handleNewConversation}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-medium text-foreground/70 bg-foreground/[0.04] hover:bg-foreground/[0.08] transition-colors duration-100 titlebar-no-drag border border-dashed border-foreground/10 hover:border-foreground/20"
        >
          <Plus size={14} />
          <span>新对话</span>
        </button>
      </div>

      {/* 导航菜单 */}
      <div className="flex flex-col gap-1 pt-3 px-3">
        <SidebarItem
          icon={<Pin size={16} />}
          label="置顶对话"
          active={activeItem === 'pinned'}
          onClick={() => handleItemClick('pinned')}
        />
        {/* <SidebarItem
          icon={<MessagesSquare size={16} />}
          label="对话列表"
          active={activeItem === 'all-chats'}
          onClick={() => handleItemClick('all-chats')}
        /> */}
      </div>


      {/* 对话列表 */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-3">
        <div className="flex flex-col gap-0.5">
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              active={conv.id === currentConversationId}
              hovered={conv.id === hoveredId}
              onSelect={() => handleSelectConversation(conv.id)}
              onDelete={(e) => handleRequestDelete(e, conv.id)}
              onRename={handleRename}
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
            />
          ))}
        </div>
      </div>

      {/* 底部设置 */}
      <div className="px-3 pb-3">
        <SidebarItem
          icon={<Settings size={18} />}
          label="设置"
          active={activeItem === 'settings'}
          onClick={() => handleItemClick('settings')}
        />
      </div>

      {/* 删除确认弹窗 */}
      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除对话</AlertDialogTitle>
            <AlertDialogDescription>
              删除后将无法恢复，确定要删除这个对话吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ===== 对话列表项 =====

interface ConversationItemProps {
  conversation: ConversationMeta
  active: boolean
  hovered: boolean
  onSelect: () => void
  onDelete: (e: React.MouseEvent) => void
  onRename: (id: string, newTitle: string) => Promise<void>
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function ConversationItem({
  conversation,
  active,
  hovered,
  onSelect,
  onDelete,
  onRename,
  onMouseEnter,
  onMouseLeave,
}: ConversationItemProps): React.ReactElement {
  const [editing, setEditing] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  /** 进入编辑模式 */
  const startEdit = (): void => {
    setEditTitle(conversation.title)
    setEditing(true)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }

  /** 保存标题 */
  const saveTitle = async (): Promise<void> => {
    const trimmed = editTitle.trim()
    if (!trimmed || trimmed === conversation.title) {
      setEditing(false)
      return
    }
    await onRename(conversation.id, trimmed)
    setEditing(false)
  }

  /** 键盘事件 */
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveTitle()
    } else if (e.key === 'Escape') {
      setEditing(false)
    }
  }

  return (
    <button
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.stopPropagation()
        startEdit()
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-[7px] rounded-[10px] transition-colors duration-100 titlebar-no-drag text-left',
        active
          ? 'bg-foreground/[0.08] dark:bg-foreground/[0.08] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]'
          : 'hover:bg-foreground/[0.04] dark:hover:bg-foreground/[0.04]'
      )}
    >
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveTitle}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-[13px] leading-5 text-foreground border-b border-primary/50 outline-none px-0 py-0"
            maxLength={100}
          />
        ) : (
          <div className={cn(
            'truncate text-[13px] leading-5',
            active ? 'text-foreground' : 'text-foreground/80'
          )}>
            {conversation.title}
          </div>
        )}
        <div className="text-[11px] text-foreground/40 mt-0.5">
          {formatDate(conversation.updatedAt)}
        </div>
      </div>

      {/* 删除按钮（hover 时显示，编辑时隐藏） */}
      {hovered && !editing && (
        <button
          onClick={onDelete}
          className="flex-shrink-0 p-1 rounded-md text-foreground/30 hover:bg-destructive/10 hover:text-destructive transition-colors duration-100"
          title="删除对话"
        >
          <Trash2 size={13} />
        </button>
      )}
    </button>
  )
}
