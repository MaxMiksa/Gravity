/**
 * useSmoothStream - 流式文本平滑渲染 Hook
 *
 * 将后端推送的流式文本（可能每秒几十次更新）转化为
 * 平滑的逐字渲染效果，类似打字机。
 *
 * 核心机制：
 * 1. 新增 delta 通过 Intl.Segmenter 拆分为字符粒度后入队
 * 2. requestAnimationFrame 驱动渲染循环
 * 3. 每帧动态计算渲染字符数（队列长时加速追赶，短时放慢）
 * 4. 流结束时一次性输出剩余内容
 *
 * 参考 Cherry Studio 的 useSmoothStream 实现。
 */

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseSmoothStreamOptions {
  /** 原始流式内容（每次 chunk 累积后的完整文本） */
  content: string
  /** 是否正在流式输出中 */
  isStreaming: boolean
  /** 每帧最小间隔（ms），默认 10 */
  minDelay?: number
}

interface UseSmoothStreamReturn {
  /** 平滑后的显示内容 */
  displayedContent: string
}

/** 多语言字符分割器（正确处理中文、日文等多字节字符） */
const segmenter = new Intl.Segmenter(
  ['en-US', 'zh-CN', 'zh-TW', 'ja-JP', 'ko-KR', 'de-DE', 'fr-FR', 'es-ES', 'pt-PT', 'ru-RU'],
)

/** 用 Intl.Segmenter 将文本拆分为字符数组 */
function segmentText(text: string): string[] {
  return Array.from(segmenter.segment(text)).map((s) => s.segment)
}

/**
 * 流式文本平滑渲染 Hook
 *
 * @example
 * ```tsx
 * const streamingContent = useAtomValue(streamingContentAtom)
 * const isStreaming = useAtomValue(streamingAtom)
 *
 * const { displayedContent } = useSmoothStream({
 *   content: streamingContent,
 *   isStreaming,
 * })
 *
 * return <MessageResponse>{displayedContent}</MessageResponse>
 * ```
 */
export function useSmoothStream({
  content,
  isStreaming,
  minDelay = 10,
}: UseSmoothStreamOptions): UseSmoothStreamReturn {
  const [displayedContent, setDisplayedContent] = useState(content)

  // 字符队列（待渲染的字符）
  const chunkQueueRef = useRef<string[]>([])
  // rAF ID
  const rafRef = useRef<number | null>(null)
  // 已渲染到 UI 的文本
  const displayedRef = useRef(content)
  // 上一次收到的完整内容（用于计算 delta）
  const prevContentRef = useRef(content)
  // 上次渲染时间
  const lastRenderTimeRef = useRef(0)
  // 流是否结束
  const streamDoneRef = useRef(!isStreaming)

  // 同步 streamDone 状态
  streamDoneRef.current = !isStreaming

  // 检测内容变化，计算 delta 并入队
  useEffect(() => {
    const prevContent = prevContentRef.current
    const newContent = content

    if (newContent === prevContent) return

    // 检测是否为追加（正常流式）
    const isAppend = newContent.startsWith(prevContent)

    if (isAppend) {
      // 增量部分拆分为字符后入队
      const delta = newContent.slice(prevContent.length)
      if (delta) {
        const chars = segmentText(delta)
        chunkQueueRef.current.push(...chars)
      }
    } else {
      // 内容重置（用户重新发送等场景）
      chunkQueueRef.current = []
      displayedRef.current = newContent
      setDisplayedContent(newContent)
    }

    prevContentRef.current = newContent
  }, [content])

  // 非流式状态时，直接显示完整内容（历史消息、编辑后的消息等）
  useEffect(() => {
    if (!isStreaming) {
      // 如果队列还有剩余，一次性输出
      if (chunkQueueRef.current.length > 0) {
        displayedRef.current += chunkQueueRef.current.join('')
        chunkQueueRef.current = []
        setDisplayedContent(displayedRef.current)
      }
      // 确保显示内容与实际内容一致
      if (displayedRef.current !== content) {
        displayedRef.current = content
        setDisplayedContent(content)
      }
    }
  }, [isStreaming, content])

  // 渲染循环
  const renderLoop = useCallback((currentTime: number) => {
    const queue = chunkQueueRef.current

    // 队列为空
    if (queue.length === 0) {
      if (streamDoneRef.current) {
        // 流结束 + 队列空 → 停止循环
        rafRef.current = null
        return
      }
      // 流未结束但队列空 → 等下一帧
      rafRef.current = requestAnimationFrame(renderLoop)
      return
    }

    // 最小延迟控制
    if (currentTime - lastRenderTimeRef.current < minDelay) {
      rafRef.current = requestAnimationFrame(renderLoop)
      return
    }
    lastRenderTimeRef.current = currentTime

    // 动态计算本帧渲染字符数：队列越长越快（追赶），最少 1 个
    let count = Math.max(1, Math.floor(queue.length / 5))

    // 流结束时一次性输出所有剩余
    if (streamDoneRef.current) {
      count = queue.length
    }

    // 取出字符并更新
    const chars = queue.splice(0, count)
    displayedRef.current += chars.join('')
    setDisplayedContent(displayedRef.current)

    // 还有内容 → 继续下一帧
    if (queue.length > 0 || !streamDoneRef.current) {
      rafRef.current = requestAnimationFrame(renderLoop)
    } else {
      rafRef.current = null
    }
  }, [minDelay])

  // 启动/重启渲染循环
  useEffect(() => {
    if (isStreaming && !rafRef.current) {
      rafRef.current = requestAnimationFrame(renderLoop)
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isStreaming, renderLoop])

  return { displayedContent }
}
