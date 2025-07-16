/**
 * MainContentPanel - Right panel for displaying main content with floating effect
 * Features Craft-style floating design with subtle shadow and glass effect
 */

import * as React from 'react'
import { Panel } from './Panel'

export interface MainContentPanelProps {
  /** Main content */
  children: React.ReactNode
}

export function MainContentPanel({ children }: MainContentPanelProps): React.ReactElement {
  return (
    <Panel
      variant="grow"
      className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50"
    >
      <div className="flex items-center justify-center h-full">
        {children}
      </div>
    </Panel>
  )
}
