/**
 * LeftSidebar - 左侧导航栏
 *
 * 包含：
 * - Chat/Agent 模式切换器
 * - 导航菜单项（点击切换主内容区视图）
 */

import * as React from 'react'
import { useAtom } from 'jotai'
import { MessagesSquare, Pin, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModeSwitcher } from './ModeSwitcher'
import { activeViewAtom } from '@/atoms/active-view'
import type { ActiveView } from '@/atoms/active-view'

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
        'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors titlebar-no-drag',
        active
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}
    >
      <span className="flex-shrink-0 w-4 h-4">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

export interface LeftSidebarProps {
  width: number
}

/** 侧边栏导航项标识 */
type SidebarItemId = 'pinned' | 'all-chats' | 'settings'

/** 导航项到视图的映射 */
const ITEM_TO_VIEW: Record<SidebarItemId, ActiveView> = {
  pinned: 'conversations',
  'all-chats': 'conversations',
  settings: 'settings',
}

export function LeftSidebar({ width }: LeftSidebarProps): React.ReactElement {
  const [activeView, setActiveView] = useAtom(activeViewAtom)
  const [activeItem, setActiveItem] = React.useState<SidebarItemId>('all-chats')

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

  return (
    <div
      className="h-full flex flex-col bg-background"
      style={{ width }}
    >
      {/* 顶部留空，避开 macOS 红绿灯 */}
      <div className="pt-[50px]">
        {/* 模式切换器 */}
        <ModeSwitcher />
      </div>

      {/* 导航菜单 */}
      <div className="flex-1 flex flex-col gap-1 pt-3 pb-3 px-3">
        <SidebarItem
          icon={<Pin size={14} />}
          label="置顶对话"
          active={activeItem === 'pinned'}
          onClick={() => handleItemClick('pinned')}
        />
        <SidebarItem
          icon={<MessagesSquare size={14} />}
          label="对话列表"
          active={activeItem === 'all-chats'}
          onClick={() => handleItemClick('all-chats')}
        />

        {/* 弹性空间 */}
        <div className="flex-1" />

        <SidebarItem
          icon={<Settings size={16} />}
          label="设置"
          active={activeItem === 'settings'}
          onClick={() => handleItemClick('settings')}
        />
      </div>
    </div>
  )
}
