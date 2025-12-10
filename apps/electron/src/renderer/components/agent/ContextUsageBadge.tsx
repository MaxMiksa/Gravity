/**
 * ContextUsageBadge — 上下文使用量徽章
 *
 * 显示当前 Agent 会话的 token 使用量和压缩状态：
 * - 显示 "Xk / Yk" token 计数（Y = contextWindow × 0.775 压缩阈值）
 * - 压缩中时显示 Loader2 旋转图标
 * - 使用量 ≥ 80% 阈值时显示琥珀色警告（可点击发送 /compact）
 */

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/** 压缩阈值比例（SDK 在 ~77.5% 窗口大小时自动压缩） */
const COMPACT_THRESHOLD_RATIO = 0.775
/** 显示警告的阈值（阈值的 80%） */
const WARNING_RATIO = 0.80

interface ContextUsageBadgeProps {
  inputTokens?: number
  contextWindow?: number
  isCompacting: boolean
  isProcessing: boolean
  onCompact: () => void
}

/** 格式化 token 数为可读字符串（如 1234 → "1.2k"） */
function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}k`
  }
  return `${tokens}`
}

export function ContextUsageBadge({
  inputTokens,
  contextWindow,
  isCompacting,
  isProcessing,
  onCompact,
}: ContextUsageBadgeProps): React.ReactElement | null {
  // 压缩中 → 始终显示 spinner
  if (isCompacting) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        <span>压缩中...</span>
      </div>
    )
  }

  // 无 usage 数据 → 不显示
  if (!inputTokens || inputTokens <= 0) return null

  const compactThreshold = contextWindow
    ? Math.floor(contextWindow * COMPACT_THRESHOLD_RATIO)
    : undefined

  const usageRatio = compactThreshold
    ? inputTokens / compactThreshold
    : undefined

  const isWarning = usageRatio !== undefined && usageRatio >= WARNING_RATIO

  const displayText = compactThreshold
    ? `${formatTokens(inputTokens)} / ${formatTokens(compactThreshold)}`
    : formatTokens(inputTokens)

  const tooltipText = contextWindow
    ? `上下文: ${inputTokens.toLocaleString()} / ${compactThreshold!.toLocaleString()} tokens (窗口 ${contextWindow.toLocaleString()})${isWarning ? '\n点击手动压缩' : ''}`
    : `上下文: ${inputTokens.toLocaleString()} tokens`

  const percentText = usageRatio !== undefined
    ? `${Math.round(usageRatio * 100)}%`
    : undefined

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs transition-colors',
            isWarning
              ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer'
              : 'text-muted-foreground cursor-default',
          )}
          onClick={isWarning && !isProcessing ? onCompact : undefined}
          disabled={!isWarning || isProcessing}
        >
          <span>{displayText}</span>
          {isWarning && percentText && (
            <span className="font-medium">{percentText}</span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="whitespace-pre-line">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  )
}
