/**
 * AppShell - 应用主布局容器
 *
 * 布局结构：[LeftSidebar 280px] | [MainContentPanel 浮动效果]
 *
 * MainContentPanel 根据当前 App 模式（Chat/Agent）自动渲染对应内容
 */

import * as React from 'react'
import { LeftSidebar } from './LeftSidebar'
import { MainContentPanel } from './MainContentPanel'
import { AppShellProvider, type AppShellContextType } from '@/contexts/AppShellContext'

export interface AppShellProps {
  /** Context 值，用于传递给子组件 */
  contextValue: AppShellContextType
}

export function AppShell({ contextValue }: AppShellProps): React.ReactElement {
  // 固定侧边栏宽度
  const sidebarWidth = 280

  return (
    <AppShellProvider value={contextValue}>
      {/* 可拖动标题栏区域，用于窗口拖动 */}
      <div className="titlebar-drag-region fixed top-0 left-0 right-0 h-[50px] z-50" />

      <div className="h-screen w-screen flex overflow-hidden bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
        {/* 左侧边栏 */}
        <LeftSidebar width={sidebarWidth} />

        {/* 右侧容器，带 padding 实现浮动效果 */}
        <div className="flex-1 p-2">
          {/* 主内容面板（根据模式自动切换内容） */}
          <MainContentPanel />
        </div>
      </div>
    </AppShellProvider>
  )
}
