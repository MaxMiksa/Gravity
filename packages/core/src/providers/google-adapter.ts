/**
 * Google Generative AI 供应商适配器
 *
 * 实现 Google Generative AI (Gemini) API 的消息转换、请求构建和 SSE 解析。
 * 特点：
 * - 角色：user / model（注意：assistant 映射为 model）
 * - 图片格式：{ inline_data: { mime_type, data } }
 * - SSE 解析：遍历 candidates[0].content.parts，区分 thought 推理和正常文本
 * - 认证：API Key 作为 URL 查询参数
 * - 支持推理内容：Gemini 2.5/3 系列通过 thinkingConfig 启用思考过程回显
 */

import type {
  ProviderAdapter,
  ProviderRequest,
  StreamRequestInput,
  StreamEvent,
  TitleRequestInput,
  ImageAttachmentData,
} from './types.ts'
import { normalizeBaseUrl } from './url-utils.ts'

// ===== Google 特有类型 =====

/** Google 内容部分 */
interface GooglePart {
  text?: string
  inline_data?: {
    mime_type: string
    data: string
  }
}

/** Google 消息内容 */
interface GoogleContent {
  role: 'user' | 'model'
  parts: GooglePart[]
}

/** Google SSE 流式响应 */
interface GoogleStreamData {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
        /** Gemini 2.5/3 思考内容标记，true 表示此 part 为推理过程 */
        thought?: boolean
      }>
    }
    finishReason?: string
  }>
}

/** Google 标题响应 */
interface GoogleTitleResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

// ===== 消息转换 =====

/**
 * 将图片附件转换为 Google 格式的内容部分
 */
function buildImageParts(imageData: ImageAttachmentData[]): GooglePart[] {
  return imageData.map((img) => ({
    inline_data: {
      mime_type: img.mediaType,
      data: img.data,
    },
  }))
}

/**
 * 构建包含图片和文本的消息部分列表
 */
function buildMessageParts(text: string, imageData: ImageAttachmentData[]): GooglePart[] {
  const parts: GooglePart[] = buildImageParts(imageData)
  if (text) {
    parts.push({ text })
  }
  return parts
}

/**
 * 将统一消息历史转换为 Google 格式
 *
 * Google API 的 assistant 角色为 model，不支持 system 消息角色
 * （system 通过 body.systemInstruction 传递）。
 * 包含历史消息附件的处理。
 */
function toGoogleContents(input: StreamRequestInput): GoogleContent[] {
  const { history, userMessage, attachments, readImageAttachments } = input

  // 历史消息转换
  const contents: GoogleContent[] = history
    .filter((msg) => msg.role !== 'system')
    .map((msg) => {
      const role = msg.role === 'assistant' ? 'model' as const : 'user' as const

      // 历史用户消息的附件也需要转换为多模态内容
      if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
        const historyImages = readImageAttachments(msg.attachments)
        return { role, parts: buildMessageParts(msg.content, historyImages) }
      }

      return { role, parts: [{ text: msg.content }] }
    })

  // 当前用户消息
  const currentImages = readImageAttachments(attachments)
  contents.push({
    role: 'user',
    parts: buildMessageParts(userMessage, currentImages),
  })

  return contents
}

// ===== 适配器实现 =====

export class GoogleAdapter implements ProviderAdapter {
  readonly providerType = 'google' as const

  buildStreamRequest(input: StreamRequestInput): ProviderRequest {
    const url = normalizeBaseUrl(input.baseUrl)
    const contents = toGoogleContents(input)

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        // 启用思考过程回显（Gemini 2.5/3 系列支持，不支持的模型会忽略此配置）
        thinkingConfig: {
          includeThoughts: true,
        },
      },
    }

    if (input.systemMessage) {
      body.systemInstruction = {
        parts: [{ text: input.systemMessage }],
      }
    }

    return {
      url: `${url}/v1beta/models/${input.modelId}:streamGenerateContent?alt=sse&key=${input.apiKey}`,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  }

  parseSSELine(jsonLine: string): StreamEvent[] {
    try {
      const parsed = JSON.parse(jsonLine) as GoogleStreamData
      const parts = parsed.candidates?.[0]?.content?.parts
      if (!parts) return []

      const events: StreamEvent[] = []

      // 遍历所有 parts，区分推理内容和正常文本
      for (const part of parts) {
        if (!part.text) continue

        if (part.thought) {
          // Gemini 2.5/3 思考过程
          events.push({ type: 'reasoning', delta: part.text })
        } else {
          // 正常回复内容
          events.push({ type: 'chunk', delta: part.text })
        }
      }

      return events
    } catch {
      return []
    }
  }

  buildTitleRequest(input: TitleRequestInput): ProviderRequest {
    const url = normalizeBaseUrl(input.baseUrl)

    return {
      url: `${url}/v1beta/models/${input.modelId}:generateContent?key=${input.apiKey}`,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: input.prompt }] }],
        generationConfig: { maxOutputTokens: 50 },
      }),
    }
  }

  parseTitleResponse(responseBody: unknown): string | null {
    const data = responseBody as GoogleTitleResponse
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null
  }
}
