/**
 * ModeSwitcher - Chat/Agent 模式切换
 */

import * as React from 'react'
import { useAtom } from 'jotai'
import { appModeAtom, type AppMode } from '@/atoms/app-mode'
import { cn } from '@/lib/utils'

const modes: { value: AppMode; label: string }[] = [
  { value: 'chat', label: 'Chat' },
  { value: 'agent', label: 'Agent' },
]

export function ModeSwitcher(): React.ReactElement {
  const [mode, setMode] = useAtom(appModeAtom)

  return (
    <div className="px-2 pt-2">
      <div className="flex rounded-lg bg-muted p-1">
        {modes.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              mode === value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
