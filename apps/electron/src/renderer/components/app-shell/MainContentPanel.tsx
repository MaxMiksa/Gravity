/**
 * MainContentPanel - Right panel for displaying main content
 * Takes the remaining space and displays content
 */

import * as React from 'react'
import { Panel } from './Panel'

export interface MainContentPanelProps {
  /** Main content */
  children: React.ReactNode
}

export function MainContentPanel({ children }: MainContentPanelProps): React.ReactElement {
  return (
    <Panel variant="grow" className="bg-background">
      <div className="flex items-center justify-center h-full">
        {children}
      </div>
    </Panel>
  )
}
