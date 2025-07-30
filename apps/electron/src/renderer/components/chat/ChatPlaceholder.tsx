/**
 * ChatPlaceholder - Chat 模式占位符组件
 *
 * 临时占位组件，后续将替换为完整的 ChatView 组件
 */

import * as React from 'react'
import { MessageSquare } from 'lucide-react'

export function ChatPlaceholder(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <MessageSquare size={32} className="text-muted-foreground/60" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-lg font-medium text-foreground">Chat 模式</h2>
        <p className="text-sm max-w-[300px]">
          开始一个新的对话，或从左侧选择已有对话
        </p>
      </div>
    </div>
  )
}
