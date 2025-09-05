/**
 * Anthropic 供应商适配器
 *
 * 实现 Anthropic Messages API 的消息转换、请求构建和 SSE 解析。
 * 特点：
 * - 角色：user / assistant（不支持 system 角色，system 通过 body.system 传递）
 * - 图片格式：{ type: 'image', source: { type: 'base64', media_type, data } }
 * - SSE 解析：content_block_delta → text，thinking_delta → reasoning
 * - 认证：x-api-key + Authorization: Bearer
 */

import type {
  ProviderAdapter,
  ProviderRequest,
  StreamRequestInput,
  StreamEvent,
  TitleRequestInput,
  ImageAttachmentData,
} from './types.ts'
import { normalizeAnthropicBaseUrl } from './url-utils.ts'

// ===== Anthropic 特有类型 =====

/** Anthropic 内容块 */
interface AnthropicContentBlock {
  type: 'text' | 'image'
  text?: string
  source?: {
    type: 'base64'
    media_type: string
    data: string
  }
}

/** Anthropic 消息格式 */
interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string | AnthropicContentBlock[]
}

/** Anthropic SSE 事件 */
interface AnthropicDeltaEvent {
  type: string
  delta?: { type?: string; text?: string }
}

/** Anthropic 标题响应 */
interface AnthropicTitleResponse {
  content?: Array<{ type: string; text?: string }>
}

// ===== 消息转换 =====

/**
 * 将单条用户消息的图片附件转换为 Anthropic 内容块
 */
function buildImageBlocks(imageData: ImageAttachmentData[]): AnthropicContentBlock[] {
  return imageData.map((img) => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: img.mediaType,
      data: img.data,
    },
  }))
}

/**
 * 构建包含图片和文本的消息内容
 *
 * 如果有图片附件则返回多模态内容块数组，否则返回纯文本。
 */
function buildMessageContent(
  text: string,
  imageData: ImageAttachmentData[],
): string | AnthropicContentBlock[] {
  if (imageData.length === 0) return text

  const content: AnthropicContentBlock[] = buildImageBlocks(imageData)
  if (text) {
    content.push({ type: 'text', text })
  }
  return content
}

/**
 * 将统一消息历史转换为 Anthropic 格式
 *
 * 包含历史消息附件的处理（修复了原始版本丢失历史附件的 Bug）。
 */
function toAnthropicMessages(
  input: StreamRequestInput,
): AnthropicMessage[] {
  const { history, userMessage, attachments, readImageAttachments } = input

  // 历史消息转换
  const messages: AnthropicMessage[] = history
    .filter((msg) => msg.role !== 'system')
    .map((msg) => {
      const role = msg.role === 'assistant' ? 'assistant' as const : 'user' as const

      // 历史用户消息的附件也需要转换为多模态内容
      if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
        const historyImages = readImageAttachments(msg.attachments)
        return { role, content: buildMessageContent(msg.content, historyImages) }
      }

      return { role, content: msg.content }
    })

  // 当前用户消息
  const currentImages = readImageAttachments(attachments)
  messages.push({
    role: 'user',
    content: buildMessageContent(userMessage, currentImages),
  })

  return messages
}

// ===== 适配器实现 =====

export class AnthropicAdapter implements ProviderAdapter {
  readonly providerType = 'anthropic' as const

  buildStreamRequest(input: StreamRequestInput): ProviderRequest {
    const url = normalizeAnthropicBaseUrl(input.baseUrl)
    const messages = toAnthropicMessages(input)

    const body: Record<string, unknown> = {
      model: input.modelId,
      max_tokens: 8192,
      messages,
      stream: true,
    }
    if (input.systemMessage) {
      body.system = input.systemMessage
    }

    return {
      url: `${url}/messages`,
      headers: {
        'x-api-key': input.apiKey,
        'Authorization': `Bearer ${input.apiKey}`,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  }

  parseSSELine(jsonLine: string): StreamEvent[] {
    try {
      const event = JSON.parse(jsonLine) as AnthropicDeltaEvent
      const events: StreamEvent[] = []

      if (event.type === 'content_block_delta') {
        // 推理内容（thinking block）
        if (event.delta?.type === 'thinking_delta' && event.delta?.text) {
          events.push({ type: 'reasoning', delta: event.delta.text })
        } else if (event.delta?.text) {
          // 普通文本内容
          events.push({ type: 'chunk', delta: event.delta.text })
        }
      }

      return events
    } catch {
      return []
    }
  }

  buildTitleRequest(input: TitleRequestInput): ProviderRequest {
    const url = normalizeAnthropicBaseUrl(input.baseUrl)

    return {
      url: `${url}/messages`,
      headers: {
        'x-api-key': input.apiKey,
        'Authorization': `Bearer ${input.apiKey}`,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: input.modelId,
        max_tokens: 50,
        messages: [{ role: 'user', content: input.prompt }],
      }),
    }
  }

  parseTitleResponse(responseBody: unknown): string | null {
    const data = responseBody as AnthropicTitleResponse
    return data.content?.[0]?.text ?? null
  }
}
