/**
 * Provider 适配器类型定义
 *
 * 定义所有 AI 供应商适配器需要实现的接口，
 * 以及流式事件、请求配置等核心类型。
 * core 层不依赖 Electron / Node fs，通过注入函数访问平台能力。
 */

import type { ChatMessage, FileAttachment, ProviderType } from '@proma/shared'

// ===== 图片附件数据 =====

/** 图片附件的 base64 数据（已从磁盘读取） */
export interface ImageAttachmentData {
  /** MIME 类型 (如 image/png) */
  mediaType: string
  /** base64 编码的图片数据 */
  data: string
}

/**
 * 图片附件读取器
 *
 * 由 Electron 层注入，负责从磁盘读取附件 base64 数据。
 * core 层不直接访问文件系统。
 */
export type ImageAttachmentReader = (attachments?: FileAttachment[]) => ImageAttachmentData[]

// ===== 流式事件 =====

/** 文本增量事件 */
export interface StreamChunkEvent {
  type: 'chunk'
  delta: string
}

/** 推理增量事件 */
export interface StreamReasoningEvent {
  type: 'reasoning'
  delta: string
}

/** 流式错误事件 */
export interface StreamErrorEvent {
  type: 'error'
  error: string
}

/** 流式完成事件 */
export interface StreamDoneEvent {
  type: 'done'
}

/** 所有流式事件的联合类型 */
export type StreamEvent =
  | StreamChunkEvent
  | StreamReasoningEvent
  | StreamErrorEvent
  | StreamDoneEvent

/** 流式事件回调函数 */
export type StreamEventCallback = (event: StreamEvent) => void

// ===== HTTP 请求 =====

/** 构建好的 HTTP 请求配置（用于 fetch） */
export interface ProviderRequest {
  /** 完整的请求 URL */
  url: string
  /** HTTP 请求头 */
  headers: Record<string, string>
  /** JSON 序列化后的请求体 */
  body: string
}

// ===== 请求输入 =====

/** 流式请求的输入参数 */
export interface StreamRequestInput {
  /** 供应商 API Base URL */
  baseUrl: string
  /** 明文 API Key */
  apiKey: string
  /** 模型 ID */
  modelId: string
  /** 经过裁剪的历史消息（不含当前用户消息） */
  history: ChatMessage[]
  /** 当前用户消息文本 */
  userMessage: string
  /** 系统提示词 */
  systemMessage?: string
  /** 当前用户消息的附件 */
  attachments?: FileAttachment[]
  /** 图片附件读取器（由 Electron 层注入） */
  readImageAttachments: ImageAttachmentReader
}

/** 标题生成请求的输入参数 */
export interface TitleRequestInput {
  /** 供应商 API Base URL */
  baseUrl: string
  /** 明文 API Key */
  apiKey: string
  /** 模型 ID */
  modelId: string
  /** 标题生成 prompt（已包含用户消息） */
  prompt: string
}

// ===== 适配器接口 =====

/**
 * AI 供应商适配器接口
 *
 * 每个供应商（Anthropic、OpenAI、Google）实现此接口。
 * 适配器负责：消息格式转换、HTTP 请求构建、SSE 解析、标题生成。
 * 适配器是纯逻辑，不执行 fetch，不访问文件系统。
 */
export interface ProviderAdapter {
  /** 供应商类型标识 */
  readonly providerType: ProviderType

  /**
   * 构建流式请求的 HTTP 配置
   *
   * 将通用输入转换为供应商特定的 HTTP 请求，
   * 包括：URL 拼接、认证头、消息格式转换、请求体构建。
   */
  buildStreamRequest(input: StreamRequestInput): ProviderRequest

  /**
   * 解析 SSE 数据行，提取流式事件
   *
   * @param jsonLine 已去掉 "data: " 前缀的 JSON 字符串
   * @returns 解析出的事件数组（可能为空）
   */
  parseSSELine(jsonLine: string): StreamEvent[]

  /**
   * 构建标题生成请求的 HTTP 配置（非流式）
   */
  buildTitleRequest(input: TitleRequestInput): ProviderRequest

  /**
   * 从标题请求的响应 JSON 中提取标题文本
   *
   * @param responseBody 响应 JSON 对象
   * @returns 提取的标题文本，失败返回 null
   */
  parseTitleResponse(responseBody: unknown): string | null
}
