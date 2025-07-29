/**
 * MainContentPanel - 主内容面板
 *
 * 根据当前 App 模式显示不同的内容：
 * - Chat 模式：显示 ChatPlaceholder（后续替换为 ChatView）
 * - Agent 模式：显示 AgentPlaceholder（后续替换为 AgentView）
 */

import * as React from 'react'
import { useAtomValue } from 'jotai'
import { appModeAtom } from '@/atoms/app-mode'
import { Panel } from './Panel'
import { ChatPlaceholder } from '@/components/chat'
import { AgentPlaceholder } from '@/components/agent'

export function MainContentPanel(): React.ReactElement {
  const mode = useAtomValue(appModeAtom)

  return (
    <Panel
      variant="grow"
      className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50"
    >
      {mode === 'chat' ? <ChatPlaceholder /> : <AgentPlaceholder />}
    </Panel>
  )
}
