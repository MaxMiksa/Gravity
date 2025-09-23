/**
 * AI 聊天流式服务（Electron 编排层）
 *
 * 负责 Electron 特定的操作：
 * - 查找渠道、解密 API Key
 * - 管理 AbortController
 * - 调用 @proma/core 的 Provider 适配器系统
 * - 桥接 StreamEvent → webContents.send()
 * - 持久化消息到 JSONL + 更新索引
 *
 * 纯逻辑（消息转换、SSE 解析、请求构建）已抽象到 @proma/core/providers。
 */

import { randomUUID } from 'node:crypto'
import type { WebContents } from 'electron'
import { CHAT_IPC_CHANNELS } from '@proma/shared'
import type { ChatSendInput, ChatMessage, GenerateTitleInput, FileAttachment } from '@proma/shared'
import {
  getAdapter,
  streamSSE,
  fetchTitle,
} from '@proma/core'
import type { ImageAttachmentData } from '@proma/core'
import { listChannels, decryptApiKey } from './channel-manager'
import { appendMessage, updateConversationMeta, getConversationMessages } from './conversation-manager'
import { readAttachmentAsBase64, isImageAttachment } from './attachment-service'

/** 活跃的 AbortController 映射（conversationId → controller） */
const activeControllers = new Map<string, AbortController>()

// ===== 平台相关：图片附件读取器 =====

/**
 * 读取图片附件的 base64 数据
 *
 * 此函数作为 ImageAttachmentReader 注入给 core 层，
 * 因为文件系统读取属于 Electron 平台操作。
 */
function getImageAttachmentData(attachments?: FileAttachment[]): ImageAttachmentData[] {
  if (!attachments || attachments.length === 0) return []

  return attachments
    .filter((att) => isImageAttachment(att.mediaType))
    .map((att) => ({
      mediaType: att.mediaType,
      data: readAttachmentAsBase64(att.localPath),
    }))
}

// ===== 上下文过滤 =====

/**
 * 根据分隔线和上下文长度裁剪历史消息
 *
 * 三层过滤：
 * 1. 分隔线过滤：仅保留最后一个分隔线之后的消息
 * 2. 轮数裁剪：按轮数（user+assistant = 1 轮）限制历史
 * 3. contextLength === 'infinite' 或 undefined 时保留全部
 */
function filterHistory(
  messageHistory: ChatMessage[],
  contextDividers?: string[],
  contextLength?: number | 'infinite',
): ChatMessage[] {
  let filtered = [...messageHistory]

  // 分隔线过滤：仅保留最后一个分隔线之后的消息
  if (contextDividers && contextDividers.length > 0) {
    const lastDividerId = contextDividers[contextDividers.length - 1]
    const dividerIndex = filtered.findIndex((msg) => msg.id === lastDividerId)
    if (dividerIndex >= 0) {
      filtered = filtered.slice(dividerIndex + 1)
    }
  }

  // 上下文长度过滤：按轮数裁剪
  if (typeof contextLength === 'number' && contextLength >= 0) {
    if (contextLength === 0) {
      return []
    }
    // 从后往前，收集 N 轮对话
    const collected: ChatMessage[] = []
    let roundCount = 0
    for (let i = filtered.length - 1; i >= 0; i--) {
      const msg = filtered[i] as ChatMessage
      collected.unshift(msg)
      // 每遇到一条 user 消息算一轮结束
      if (msg.role === 'user') {
        roundCount++
        if (roundCount >= contextLength) break
      }
    }
    return collected
  }

  // contextLength === 'infinite' 或 undefined 时保留全部
  return filtered
}

// ===== 核心流式函数 =====

/**
 * 发送消息并流式返回 AI 响应
 *
 * @param input 发送参数
 * @param webContents 渲染进程的 webContents 实例（用于推送事件）
 */
export async function sendMessage(
  input: ChatSendInput,
  webContents: WebContents,
): Promise<void> {
  const {
    conversationId, userMessage, channelId,
    modelId, systemMessage, contextLength, contextDividers, attachments,
    thinkingEnabled,
  } = input

  // 1. 查找渠道
  const channels = listChannels()
  const channel = channels.find((c) => c.id === channelId)
  if (!channel) {
    webContents.send(CHAT_IPC_CHANNELS.STREAM_ERROR, {
      conversationId,
      error: '渠道不存在',
    })
    return
  }

  // 2. 解密 API Key
  let apiKey: string
  try {
    apiKey = decryptApiKey(channelId)
  } catch {
    webContents.send(CHAT_IPC_CHANNELS.STREAM_ERROR, {
      conversationId,
      error: '解密 API Key 失败',
    })
    return
  }

  // 3. 追加用户消息到 JSONL
  const userMsg: ChatMessage = {
    id: randomUUID(),
    role: 'user',
    content: userMessage,
    createdAt: Date.now(),
    attachments: attachments && attachments.length > 0 ? attachments : undefined,
  }
  appendMessage(conversationId, userMsg)

  // 4. 从磁盘读取完整消息历史（不依赖前端传入，确保上下文完整）
  const fullHistory = getConversationMessages(conversationId)
  const filteredHistory = filterHistory(fullHistory, contextDividers, contextLength)

  // 5. 创建 AbortController
  const controller = new AbortController()
  activeControllers.set(conversationId, controller)

  // 在 try 外累积流式内容，abort 时 catch 块仍可访问
  let accumulatedContent = ''
  let accumulatedReasoning = ''

  try {
    // 6. 获取适配器 + 构建请求 + 执行流式 SSE
    const adapter = getAdapter(channel.provider)
    const request = adapter.buildStreamRequest({
      baseUrl: channel.baseUrl,
      apiKey,
      modelId,
      history: filteredHistory,
      userMessage,
      systemMessage,
      attachments,
      readImageAttachments: getImageAttachmentData,
      thinkingEnabled,
    })

    const { content, reasoning } = await streamSSE({
      request,
      adapter,
      signal: controller.signal,
      onEvent: (event) => {
        switch (event.type) {
          case 'chunk':
            accumulatedContent += event.delta
            webContents.send(CHAT_IPC_CHANNELS.STREAM_CHUNK, {
              conversationId,
              delta: event.delta,
            })
            break
          case 'reasoning':
            accumulatedReasoning += event.delta
            webContents.send(CHAT_IPC_CHANNELS.STREAM_REASONING, {
              conversationId,
              delta: event.delta,
            })
            break
          // done 事件在外部处理
        }
      },
    })

    // 7. 保存 assistant 消息
    const assistantMsgId = randomUUID()
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content,
      createdAt: Date.now(),
      model: modelId,
      reasoning: reasoning || undefined,
    }
    appendMessage(conversationId, assistantMsg)

    // 更新对话索引的 updatedAt
    try {
      updateConversationMeta(conversationId, {})
    } catch {
      // 索引更新失败不影响主流程
    }

    webContents.send(CHAT_IPC_CHANNELS.STREAM_COMPLETE, {
      conversationId,
      model: modelId,
      messageId: assistantMsgId,
    })
  } catch (error) {
    // 被中止的请求：保存已输出的部分内容，通知前端停止
    if (controller.signal.aborted) {
      console.log(`[聊天服务] 对话 ${conversationId} 已被用户中止`)

      // 保存已累积的部分助手消息
      if (accumulatedContent) {
        const assistantMsgId = randomUUID()
        const partialMsg: ChatMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: accumulatedContent,
          createdAt: Date.now(),
          model: modelId,
          reasoning: accumulatedReasoning || undefined,
          stopped: true,
        }
        appendMessage(conversationId, partialMsg)

        try {
          updateConversationMeta(conversationId, {})
        } catch {
          // 索引更新失败不影响主流程
        }

        webContents.send(CHAT_IPC_CHANNELS.STREAM_COMPLETE, {
          conversationId,
          model: modelId,
          messageId: assistantMsgId,
        })
      } else {
        webContents.send(CHAT_IPC_CHANNELS.STREAM_COMPLETE, {
          conversationId,
          model: modelId,
        })
      }
      return
    }

    const errorMessage = error instanceof Error ? error.message : '未知错误'
    console.error(`[聊天服务] 流式请求失败:`, error)
    webContents.send(CHAT_IPC_CHANNELS.STREAM_ERROR, {
      conversationId,
      error: errorMessage,
    })
  } finally {
    activeControllers.delete(conversationId)
  }
}

/**
 * 中止指定对话的生成
 */
export function stopGeneration(conversationId: string): void {
  const controller = activeControllers.get(conversationId)
  if (controller) {
    controller.abort()
    activeControllers.delete(conversationId)
    console.log(`[聊天服务] 已中止对话: ${conversationId}`)
  }
}

// ===== 标题生成 =====

/** 标题生成 Prompt */
const TITLE_PROMPT = '根据用户的第一条消息，生成一个简短的对话标题（10字以内）。只输出标题，不要有任何其他内容、标点符号或引号。\n\n用户消息：'

/** 最大标题长度 */
const MAX_TITLE_LENGTH = 20

/**
 * 调用 AI 生成对话标题
 *
 * 使用与聊天相同的渠道和模型，发送非流式请求，
 * 让模型根据用户第一条消息生成简短标题。
 *
 * @param input 生成标题参数
 * @returns 生成的标题，失败时返回 null
 */
export async function generateTitle(input: GenerateTitleInput): Promise<string | null> {
  const { userMessage, channelId, modelId } = input

  // 查找渠道
  const channels = listChannels()
  const channel = channels.find((c) => c.id === channelId)
  if (!channel) {
    console.warn('[标题生成] 渠道不存在:', channelId)
    return null
  }

  // 解密 API Key
  let apiKey: string
  try {
    apiKey = decryptApiKey(channelId)
  } catch {
    console.warn('[标题生成] 解密 API Key 失败')
    return null
  }

  try {
    const adapter = getAdapter(channel.provider)
    const request = adapter.buildTitleRequest({
      baseUrl: channel.baseUrl,
      apiKey,
      modelId,
      prompt: TITLE_PROMPT + userMessage,
    })

    const title = await fetchTitle(request, adapter)
    if (!title) return null

    // 截断到最大长度并清理引号
    const cleaned = title.trim().replace(/^["'""'']+|["'""'']+$/g, '').trim()
    return cleaned.slice(0, MAX_TITLE_LENGTH) || null
  } catch (error) {
    console.warn('[标题生成] 请求失败:', error)
    return null
  }
}
