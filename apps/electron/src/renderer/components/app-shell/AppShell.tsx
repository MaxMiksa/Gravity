/**
 * AppShell - Main 2-panel layout container with floating content
 *
 * Layout: [LeftSidebar 280px] | [MainContentPanel with floating effect]
 */

import * as React from 'react'
import { LeftSidebar } from './LeftSidebar'
import { MainContentPanel } from './MainContentPanel'
import { AppShellProvider, type AppShellContextType } from '@/contexts/AppShellContext'

export interface AppShellProps {
  /** Context value for children */
  contextValue: AppShellContextType
}

export function AppShell({ contextValue }: AppShellProps): React.ReactElement {
  // Fixed sidebar width
  const sidebarWidth = 280

  return (
    <AppShellProvider value={contextValue}>
      {/* Draggable title bar region for window dragging */}
      <div className="titlebar-drag-region fixed top-0 left-0 right-0 h-[50px] z-50" />

      <div className="h-screen w-screen flex overflow-hidden bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
        {/* Left Sidebar */}
        <LeftSidebar width={sidebarWidth} />

        {/* Right Container with padding for floating effect */}
        <div className="flex-1 p-2">
          {/* Main Content Panel (Floating) */}
          <MainContentPanel>
            <div className="text-sm text-muted-foreground">
              Select a conversation to get started
            </div>
          </MainContentPanel>
        </div>
      </div>
    </AppShellProvider>
  )
}
