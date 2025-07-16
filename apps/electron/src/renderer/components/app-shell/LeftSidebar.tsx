/**
 * LeftSidebar - Vertical navigation sidebar
 * Displays static navigation items with icons
 */

import * as React from 'react'
import { Inbox, Flag, FolderOpen, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      {/* Sidebar content - add top padding to avoid traffic lights */}
      {/* On macOS, traffic lights are at (18, 18), need ~50px clear space */}
      <div className="flex-1 flex flex-col gap-1 pt-[50px] pb-3 px-3">
        <SidebarItem
          icon={<Inbox size={16} />}
          label="All Chats"
          active={activeItem === 'all-chats'}
          onClick={() => setActiveItem('all-chats')}
        />
        <SidebarItem
          icon={<Flag size={16} />}
          label="Flagged"
          active={activeItem === 'flagged'}
          onClick={() => setActiveItem('flagged')}
        />
        <SidebarItem
          icon={<FolderOpen size={16} />}
          label="Sources"
          active={activeItem === 'sources'}
          onClick={() => setActiveItem('sources')}
        />

        {/* Spacer */}
        <div className="flex-1" />

        <SidebarItem
          icon={<Settings size={16} />}
          label="Settings"
          active={activeItem === 'settings'}
          onClick={() => setActiveItem('settings')}
        />
      </div>
    </div>
  )
}
