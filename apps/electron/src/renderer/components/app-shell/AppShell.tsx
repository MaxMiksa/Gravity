/**
 * AppShell - Main 3-panel layout container
 *
 * Layout: [LeftSidebar 20%] | [NavigatorPanel 32%] | [MainContentPanel 48%]
 */

import * as React from 'react'
import { LeftSidebar } from './LeftSidebar'
import { NavigatorPanel } from './NavigatorPanel'
import { MainContentPanel } from './MainContentPanel'
import { AppShellProvider, type AppShellContextType } from '@/contexts/AppShellContext'

export interface AppShellProps {
  /** Context value for children */
  contextValue: AppShellContextType
}

export function AppShell({ contextValue }: AppShellProps): React.ReactElement {
  // Panel widths (can be made adjustable later)
  const sidebarWidth = 220
  const navigatorWidth = 320

  return (
    <AppShellProvider value={contextValue}>
      {/* Draggable title bar region for window dragging */}
      <div className="titlebar-drag-region fixed top-0 left-0 right-0 h-[50px] z-50" />

      <div className="h-screen w-screen flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar width={sidebarWidth} />

        {/* Navigator Panel (Middle) */}
        <NavigatorPanel title="Conversations" width={navigatorWidth}>
          <div className="p-4 text-sm text-muted-foreground">
            Conversations will appear here
          </div>
        </NavigatorPanel>

        {/* Main Content Panel (Right) */}
        <MainContentPanel>
          <div className="text-sm text-muted-foreground">
            Select a conversation to get started
          </div>
        </MainContentPanel>
      </div>
    </AppShellProvider>
  )
}
