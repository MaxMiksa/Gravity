/**
 * ChatView - 主聊天视图容器
 *
 * 职责：
 * - 加载当前对话消息和上下文分隔线
 * - 订阅流式 IPC 事件（chunk, reasoning, complete, error）
 * - 管理 streaming 状态和累积内容
 * - 处理消息删除、上下文清除/删除
 * - 传递 contextLength 和 contextDividers 到 sendMessage
 * - 无当前对话时显示引导文案
 *
 * 布局：三段式 ChatHeader | ChatMessages | ChatInput
 */

import * as React from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { MessageSquare } from 'lucide-react'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import {
  currentConversationIdAtom,
  currentConversationAtom,
  currentMessagesAtom,
  streamingAtom,
  streamingContentAtom,
  streamingReasoningAtom,
  selectedModelAtom,
  conversationsAtom,
  contextLengthAtom,
  contextDividersAtom,
  thinkingEnabledAtom,
  pendingAttachmentsAtom,
  hasMoreMessagesAtom,
  INITIAL_MESSAGE_LIMIT,
} from '@/atoms/chat-atoms'
import type { PendingAttachment } from '@/atoms/chat-atoms'
import type {
  ChatSendInput,
  GenerateTitleInput,
  StreamChunkEvent,
  StreamReasoningEvent,
  StreamCompleteEvent,
  StreamErrorEvent,
  FileAttachment,
  AttachmentSaveInput,
} from '@proma/shared'

export function ChatView(): React.ReactElement {
  const currentConversationId = useAtomValue(currentConversationIdAtom)
  const currentConversation = useAtomValue(currentConversationAtom)
  const [currentMessages, setCurrentMessages] = useAtom(currentMessagesAtom)
  const [streaming, setStreaming] = useAtom(streamingAtom)
  const setStreamingContent = useSetAtom(streamingContentAtom)
  const setStreamingReasoning = useSetAtom(streamingReasoningAtom)
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom)
  const setConversations = useSetAtom(conversationsAtom)
  const contextLength = useAtomValue(contextLengthAtom)
  const [contextDividers, setContextDividers] = useAtom(contextDividersAtom)
  const thinkingEnabled = useAtomValue(thinkingEnabledAtom)
  const [pendingAttachments, setPendingAttachments] = useAtom(pendingAttachmentsAtom)
  const setHasMoreMessages = useSetAtom(hasMoreMessagesAtom)

  // 首条消息标题生成相关 ref
  // pendingTitleRef 存储待生成标题的信息，非 null 时表示当前回复完成后需要生成标题
  const pendingTitleRef = React.useRef<GenerateTitleInput | null>(null)

  // 加载当前对话最近消息 + 上下文分隔线
  React.useEffect(() => {
    if (!currentConversationId) {
      setCurrentMessages([])
      setContextDividers([])
      setHasMoreMessages(false)
      return
    }

    // 仅加载最近 N 条消息，避免大量消息导致渲染卡顿
    window.electronAPI
      .getRecentMessages(currentConversationId, INITIAL_MESSAGE_LIMIT)
      .then((result) => {
        setCurrentMessages(result.messages)
        setHasMoreMessages(result.hasMore)
      })
      .catch(console.error)

    // 从对话元数据加载分隔线
    if (currentConversation?.contextDividers) {
      setContextDividers(currentConversation.contextDividers)
    } else {
      setContextDividers([])
    }

    // 从对话元数据恢复模型/渠道选择
    if (currentConversation?.modelId && currentConversation?.channelId) {
      setSelectedModel({
        channelId: currentConversation.channelId,
        modelId: currentConversation.modelId,
      })
    }
  }, [currentConversationId, currentConversation?.contextDividers, currentConversation?.modelId, currentConversation?.channelId, setCurrentMessages, setContextDividers, setHasMoreMessages, setSelectedModel])

  // 订阅流式 IPC 事件
  React.useEffect(() => {
    const cleanupChunk = window.electronAPI.onStreamChunk(
      (event: StreamChunkEvent) => {
        if (event.conversationId !== currentConversationId) return
        setStreamingContent((prev) => prev + event.delta)
      }
    )

    const cleanupReasoning = window.electronAPI.onStreamReasoning(
      (event: StreamReasoningEvent) => {
        if (event.conversationId !== currentConversationId) return
        setStreamingReasoning((prev) => prev + event.delta)
      }
    )

    const cleanupComplete = window.electronAPI.onStreamComplete(
      (event: StreamCompleteEvent) => {
        if (event.conversationId !== currentConversationId) return

        // 先加载持久消息，再清空 streaming 状态
        // 确保持久消息已在 DOM 中，临时流式消息才消失（避免闪烁空白）
        window.electronAPI
          .getConversationMessages(event.conversationId)
          .then((msgs) => {
            // React 18 自动批处理：以下 setState 合并为一次渲染
            setCurrentMessages(msgs)
            setHasMoreMessages(false)
            setStreaming(false)
            setStreamingContent('')
            setStreamingReasoning('')
          })
          .catch(console.error)

        // 刷新对话列表（updatedAt 已更新）
        window.electronAPI
          .listConversations()
          .then(setConversations)
          .catch(console.error)

        // 第一条消息回复完成后，生成对话标题
        const titleInput = pendingTitleRef.current
        if (titleInput) {
          pendingTitleRef.current = null
          window.electronAPI.generateTitle(titleInput).then((title) => {
            if (!title) return
            // 更新对话标题
            window.electronAPI
              .updateConversationTitle(event.conversationId, title)
              .then((updated) => {
                setConversations((prev) =>
                  prev.map((c) => (c.id === updated.id ? updated : c))
                )
              })
              .catch(console.error)
          }).catch(console.error)
        }
      }
    )

    const cleanupError = window.electronAPI.onStreamError(
      (event: StreamErrorEvent) => {
        if (event.conversationId !== currentConversationId) return
        console.error('[ChatView] 流式错误:', event.error)

        // 重新加载消息（用户消息可能已写入）
        window.electronAPI
          .getConversationMessages(event.conversationId)
          .then((msgs) => {
            setCurrentMessages(msgs)
            setHasMoreMessages(false)
          })
          .catch(console.error)

        setStreaming(false)
        setStreamingContent('')
        setStreamingReasoning('')
      }
    )

    return () => {
      cleanupChunk()
      cleanupReasoning()
      cleanupComplete()
      cleanupError()
    }
  }, [
    currentConversationId,
    setCurrentMessages,
    setConversations,
    setStreaming,
    setStreamingContent,
    setStreamingReasoning,
    setHasMoreMessages,
  ])

  /** 发送消息 */
  const handleSend = async (content: string): Promise<void> => {
    if (!currentConversationId || !selectedModel) return

    // 判断是否为第一条消息（发送前历史为空）
    const isFirstMessage = currentMessages.length === 0
    if (isFirstMessage && content) {
      pendingTitleRef.current = {
        userMessage: content,
        channelId: selectedModel.channelId,
        modelId: selectedModel.modelId,
      }
    }

    // 获取当前待发送附件的快照
    const currentAttachments = [...pendingAttachments]

    // 保存附件到磁盘（通过 IPC）
    const savedAttachments: FileAttachment[] = []
    for (const att of currentAttachments) {
      const base64Data = window.__pendingAttachmentData?.get(att.id)
      if (!base64Data) continue

      try {
        const input: AttachmentSaveInput = {
          conversationId: currentConversationId,
          filename: att.filename,
          mediaType: att.mediaType,
          data: base64Data,
        }
        const result = await window.electronAPI.saveAttachment(input)
        savedAttachments.push(result.attachment)
      } catch (error) {
        console.error('[ChatView] 保存附件失败:', error)
      }
    }

    // 清理 pending 附件和临时缓存
    for (const att of currentAttachments) {
      if (att.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(att.previewUrl)
      }
      window.__pendingAttachmentData?.delete(att.id)
    }
    setPendingAttachments([])

    setStreaming(true)
    setStreamingContent('')
    setStreamingReasoning('')

    const input: ChatSendInput = {
      conversationId: currentConversationId,
      userMessage: content,
      messageHistory: [], // 后端已改为从磁盘读取完整历史，无需前端传入
      channelId: selectedModel.channelId,
      modelId: selectedModel.modelId,
      contextLength,
      contextDividers,
      attachments: savedAttachments.length > 0 ? savedAttachments : undefined,
    }

    // 乐观更新：立即在 UI 中显示用户消息
    setCurrentMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        createdAt: Date.now(),
        attachments: savedAttachments.length > 0 ? savedAttachments : undefined,
      },
    ])

    window.electronAPI.sendMessage(input).catch((error) => {
      console.error('[ChatView] 发送消息失败:', error)
      setStreaming(false)
    })
  }

  /** 停止生成 */
  const handleStop = (): void => {
    if (!currentConversationId) return
    // 只切换 streaming 状态（按钮即时变化），不清空内容
    // 内容保留在 UI 直到 onStreamComplete 原子性替换为磁盘消息，避免闪烁
    setStreaming(false)
    window.electronAPI.stopGeneration(currentConversationId).catch(console.error)
  }

  /** 删除消息 */
  const handleDeleteMessage = async (messageId: string): Promise<void> => {
    if (!currentConversationId) return

    try {
      const updatedMessages = await window.electronAPI.deleteMessage(
        currentConversationId,
        messageId
      )
      setCurrentMessages(updatedMessages)

      // 如果删除的消息有对应的分隔线，也删除分隔线
      if (contextDividers.includes(messageId)) {
        const newDividers = contextDividers.filter((id) => id !== messageId)
        setContextDividers(newDividers)
        await window.electronAPI.updateContextDividers(
          currentConversationId,
          newDividers
        )
      }
    } catch (error) {
      console.error('[ChatView] 删除消息失败:', error)
    }
  }

  /** 清除上下文（toggle 最后消息的分隔线） */
  const handleClearContext = React.useCallback((): void => {
    if (!currentConversationId || currentMessages.length === 0) return

    const lastMessage = currentMessages[currentMessages.length - 1]
    const lastMessageId = lastMessage.id

    let newDividers: string[]
    if (contextDividers.includes(lastMessageId)) {
      // 已有分隔线 → 删除
      newDividers = contextDividers.filter((id) => id !== lastMessageId)
    } else {
      // 无分隔线 → 添加
      newDividers = [...contextDividers, lastMessageId]
    }

    setContextDividers(newDividers)
    window.electronAPI
      .updateContextDividers(currentConversationId, newDividers)
      .catch(console.error)
  }, [currentConversationId, currentMessages, contextDividers, setContextDividers])

  /** 删除分隔线 */
  const handleDeleteDivider = React.useCallback((messageId: string): void => {
    if (!currentConversationId) return

    const newDividers = contextDividers.filter((id) => id !== messageId)
    setContextDividers(newDividers)
    window.electronAPI
      .updateContextDividers(currentConversationId, newDividers)
      .catch(console.error)
  }, [currentConversationId, contextDividers, setContextDividers])

  /** 加载全部历史消息（向上滚动时触发） */
  const handleLoadMore = React.useCallback(async (): Promise<void> => {
    if (!currentConversationId) return

    const allMessages = await window.electronAPI.getConversationMessages(currentConversationId)
    setCurrentMessages(allMessages)
    setHasMoreMessages(false)
  }, [currentConversationId, setCurrentMessages, setHasMoreMessages])

  // 无当前对话 → 引导文案
  if (!currentConversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full max-w-[min(72rem,100%)] mx-auto gap-4 text-muted-foreground" style={{ zoom: 1.1 }}>
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <MessageSquare size={32} className="text-muted-foreground/60" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-medium text-foreground">开始对话</h2>
          <p className="text-sm max-w-[300px]">
            从左侧点击"新对话"按钮创建一个新对话
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full max-w-[min(72rem,100%)] mx-auto overflow-hidden">
      {/* 头部：对话标题 + 并排模式切换 */}
      <ChatHeader />

      {/* 中间：消息区域 */}
      <ChatMessages
        onDeleteMessage={handleDeleteMessage}
        onDeleteDivider={handleDeleteDivider}
        onLoadMore={handleLoadMore}
      />

      {/* 底部：输入框 */}
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        onClearContext={handleClearContext}
      />
    </div>
  )
}
