/**
 * Chat 相关类型定义
 *
 * 本阶段仅定义类型，不实现 Chat 逻辑。
 * Chat 功能将在后续迭代中实现。
 */

/**
 * 消息角色
 */
export type MessageRole = 'user' | 'assistant' | 'system'

/**
 * 聊天消息
 */
export interface ChatMessage {
  /** 消息唯一标识 */
  id: string
  /** 发送者角色 */
  role: MessageRole
  /** 消息内容 */
  content: string
  /** 创建时间戳 */
  createdAt: number
  /** 使用的模型 ID（assistant 消息） */
  model?: string
  /** 推理内容（如果模型支持） */
  reasoning?: string
  /** 是否被用户中止 */
  stopped?: boolean
}

/**
 * 对话
 */
export interface Conversation {
  /** 对话唯一标识 */
  id: string
  /** 对话标题 */
  title: string
  /** 消息列表 */
  messages: ChatMessage[]
  /** 默认使用的模型 ID */
  modelId?: string
  /** 系统提示词 */
  systemMessage?: string
  /** 创建时间戳 */
  createdAt: number
  /** 更新时间戳 */
  updatedAt: number
}
