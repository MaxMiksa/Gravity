/**
 * LeftSidebar - 左侧导航栏
 *
 * 包含：
 * - Chat/Agent 模式切换器
 * - 导航菜单项
 */

import * as React from 'react'
import { MessagesSquare, Pin, FolderOpen, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModeSwitcher } from './ModeSwitcher'

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
        'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
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

export function LeftSidebar({ width }: LeftSidebarProps): React.ReactElement {
  const [activeItem, setActiveItem] = React.useState('all-chats')

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
          icon={<Pin size={12} />}
          label="置顶对话"
          active={activeItem === 'pinned'}
          onClick={() => setActiveItem('pinned')}
        />
        <SidebarItem
          icon={<MessagesSquare size={12} />}
          label="对话列表"
          active={activeItem === 'all-chats'}
          onClick={() => setActiveItem('all-chats')}
        />
        {/* <SidebarItem
          icon={<FolderOpen size={16} />}
          label="数据源"
          active={activeItem === 'sources'}
          onClick={() => setActiveItem('sources')}
        /> */}

        {/* 弹性空间 */}
        <div className="flex-1" />

        <SidebarItem
          icon={<Settings size={16} />}
          label="设置"
          active={activeItem === 'settings'}
          onClick={() => setActiveItem('settings')}
        />
      </div>
    </div>
  )
}
