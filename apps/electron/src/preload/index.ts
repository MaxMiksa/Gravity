/**
 * Preload 脚本
 *
 * 通过 contextBridge 安全地将 API 暴露给渲染进程
 * 使用上下文隔离确保安全性
 */

import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, CHANNEL_IPC_CHANNELS, CHAT_IPC_CHANNELS } from '@proma/shared'
import { USER_PROFILE_IPC_CHANNELS, SETTINGS_IPC_CHANNELS } from '../types'
import type {
  RuntimeStatus,
  GitRepoStatus,
  Channel,
  ChannelCreateInput,
  ChannelUpdateInput,
  ChannelTestResult,
  FetchModelsInput,
  FetchModelsResult,
  ConversationMeta,
  ChatMessage,
  ChatSendInput,
  GenerateTitleInput,
  StreamChunkEvent,
  StreamReasoningEvent,
  StreamCompleteEvent,
  StreamErrorEvent,
  AttachmentSaveInput,
  AttachmentSaveResult,
  FileDialogResult,
  RecentMessagesResult,
} from '@proma/shared'
import type { UserProfile, AppSettings } from '../types'

/**
 * 暴露给渲染进程的 API 接口定义
 */
export interface ElectronAPI {
  // ===== 运行时相关 =====

  /**
   * 获取运行时状态
   * @returns 运行时状态，包含 Bun、Git 等信息
   */
  getRuntimeStatus: () => Promise<RuntimeStatus | null>

  /**
   * 获取指定目录的 Git 仓库状态
   * @param dirPath - 目录路径
   * @returns Git 仓库状态
   */
  getGitRepoStatus: (dirPath: string) => Promise<GitRepoStatus | null>

  // ===== 渠道管理相关 =====

  /** 获取所有渠道列表（apiKey 保持加密态） */
  listChannels: () => Promise<Channel[]>

  /** 创建渠道（apiKey 为明文，主进程加密） */
  createChannel: (input: ChannelCreateInput) => Promise<Channel>

  /** 更新渠道 */
  updateChannel: (id: string, input: ChannelUpdateInput) => Promise<Channel>

  /** 删除渠道 */
  deleteChannel: (id: string) => Promise<void>

  /** 解密获取明文 API Key（仅在用户查看时调用） */
  decryptApiKey: (channelId: string) => Promise<string>

  /** 测试渠道连接 */
  testChannel: (channelId: string) => Promise<ChannelTestResult>

  /** 直接测试连接（无需已保存渠道，传入明文凭证） */
  testChannelDirect: (input: FetchModelsInput) => Promise<ChannelTestResult>

  /** 从供应商拉取可用模型列表（直接传入凭证，无需已保存渠道） */
  fetchModels: (input: FetchModelsInput) => Promise<FetchModelsResult>

  // ===== 对话管理相关 =====

  /** 获取对话列表 */
  listConversations: () => Promise<ConversationMeta[]>

  /** 创建对话 */
  createConversation: (title?: string, modelId?: string, channelId?: string) => Promise<ConversationMeta>

  /** 获取对话消息 */
  getConversationMessages: (id: string) => Promise<ChatMessage[]>

  /** 获取对话最近 N 条消息（分页加载） */
  getRecentMessages: (id: string, limit: number) => Promise<RecentMessagesResult>

  /** 更新对话标题 */
  updateConversationTitle: (id: string, title: string) => Promise<ConversationMeta>

  /** 更新对话使用的模型/渠道 */
  updateConversationModel: (id: string, modelId: string, channelId: string) => Promise<ConversationMeta>

  /** 删除对话 */
  deleteConversation: (id: string) => Promise<void>

  // ===== 消息发送 =====

  /** 发送消息（触发 AI 流式响应） */
  sendMessage: (input: ChatSendInput) => Promise<void>

  /** 中止生成 */
  stopGeneration: (conversationId: string) => Promise<void>

  /** 删除指定消息 */
  deleteMessage: (conversationId: string, messageId: string) => Promise<ChatMessage[]>

  /** 更新上下文分隔线 */
  updateContextDividers: (conversationId: string, dividers: string[]) => Promise<ConversationMeta>

  /** 生成对话标题 */
  generateTitle: (input: GenerateTitleInput) => Promise<string | null>

  // ===== 附件管理相关 =====

  /** 保存附件到本地 */
  saveAttachment: (input: AttachmentSaveInput) => Promise<AttachmentSaveResult>

  /** 读取附件（返回 base64 字符串） */
  readAttachment: (localPath: string) => Promise<string>

  /** 删除附件 */
  deleteAttachment: (localPath: string) => Promise<void>

  /** 打开文件选择对话框 */
  openFileDialog: () => Promise<FileDialogResult>

  /** 提取附件文档的文本内容 */
  extractAttachmentText: (localPath: string) => Promise<string>

  // ===== 用户档案相关 =====

  /** 获取用户档案 */
  getUserProfile: () => Promise<UserProfile>

  /** 更新用户档案 */
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>

  // ===== 应用设置相关 =====

  /** 获取应用设置 */
  getSettings: () => Promise<AppSettings>

  /** 更新应用设置 */
  updateSettings: (updates: Partial<AppSettings>) => Promise<AppSettings>

  /** 获取系统主题（是否深色模式） */
  getSystemTheme: () => Promise<boolean>

  /** 订阅系统主题变化事件（返回清理函数） */
  onSystemThemeChanged: (callback: (isDark: boolean) => void) => () => void

  // ===== 流式事件订阅（返回清理函数） =====

  /** 订阅内容片段事件 */
  onStreamChunk: (callback: (event: StreamChunkEvent) => void) => () => void

  /** 订阅推理片段事件 */
  onStreamReasoning: (callback: (event: StreamReasoningEvent) => void) => () => void

  /** 订阅流式完成事件 */
  onStreamComplete: (callback: (event: StreamCompleteEvent) => void) => () => void

  /** 订阅流式错误事件 */
  onStreamError: (callback: (event: StreamErrorEvent) => void) => () => void
}

/**
 * 实现 ElectronAPI 接口
 */
const electronAPI: ElectronAPI = {
  // 运行时
  getRuntimeStatus: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_RUNTIME_STATUS)
  },

  getGitRepoStatus: (dirPath: string) => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_GIT_REPO_STATUS, dirPath)
  },

  // 渠道管理
  listChannels: () => {
    return ipcRenderer.invoke(CHANNEL_IPC_CHANNELS.LIST)
  },

  createChannel: (input: ChannelCreateInput) => {
    return ipcRenderer.invoke(CHANNEL_IPC_CHANNELS.CREATE, input)
  },

  updateChannel: (id: string, input: ChannelUpdateInput) => {
    return ipcRenderer.invoke(CHANNEL_IPC_CHANNELS.UPDATE, id, input)
  },

  deleteChannel: (id: string) => {
    return ipcRenderer.invoke(CHANNEL_IPC_CHANNELS.DELETE, id)
  },

  decryptApiKey: (channelId: string) => {
    return ipcRenderer.invoke(CHANNEL_IPC_CHANNELS.DECRYPT_KEY, channelId)
  },

  testChannel: (channelId: string) => {
    return ipcRenderer.invoke(CHANNEL_IPC_CHANNELS.TEST, channelId)
  },

  testChannelDirect: (input: FetchModelsInput) => {
    return ipcRenderer.invoke(CHANNEL_IPC_CHANNELS.TEST_DIRECT, input)
  },

  fetchModels: (input: FetchModelsInput) => {
    return ipcRenderer.invoke(CHANNEL_IPC_CHANNELS.FETCH_MODELS, input)
  },

  // 对话管理
  listConversations: () => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.LIST_CONVERSATIONS)
  },

  createConversation: (title?: string, modelId?: string, channelId?: string) => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.CREATE_CONVERSATION, title, modelId, channelId)
  },

  getConversationMessages: (id: string) => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.GET_MESSAGES, id)
  },

  getRecentMessages: (id: string, limit: number) => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.GET_RECENT_MESSAGES, id, limit)
  },

  updateConversationTitle: (id: string, title: string) => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.UPDATE_TITLE, id, title)
  },

  updateConversationModel: (id: string, modelId: string, channelId: string) => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.UPDATE_MODEL, id, modelId, channelId)
  },

  deleteConversation: (id: string) => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.DELETE_CONVERSATION, id)
  },

  // 消息发送
  sendMessage: (input: ChatSendInput) => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.SEND_MESSAGE, input)
  },

  stopGeneration: (conversationId: string) => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.STOP_GENERATION, conversationId)
  },

  deleteMessage: (conversationId: string, messageId: string) => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.DELETE_MESSAGE, conversationId, messageId)
  },

  updateContextDividers: (conversationId: string, dividers: string[]) => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.UPDATE_CONTEXT_DIVIDERS, conversationId, dividers)
  },

  generateTitle: (input: GenerateTitleInput) => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.GENERATE_TITLE, input)
  },

  // 附件管理
  saveAttachment: (input: AttachmentSaveInput) => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.SAVE_ATTACHMENT, input)
  },

  readAttachment: (localPath: string) => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.READ_ATTACHMENT, localPath)
  },

  deleteAttachment: (localPath: string) => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.DELETE_ATTACHMENT, localPath)
  },

  openFileDialog: () => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.OPEN_FILE_DIALOG)
  },

  extractAttachmentText: (localPath: string) => {
    return ipcRenderer.invoke(CHAT_IPC_CHANNELS.EXTRACT_ATTACHMENT_TEXT, localPath)
  },

  // 用户档案
  getUserProfile: () => {
    return ipcRenderer.invoke(USER_PROFILE_IPC_CHANNELS.GET)
  },

  updateUserProfile: (updates: Partial<UserProfile>) => {
    return ipcRenderer.invoke(USER_PROFILE_IPC_CHANNELS.UPDATE, updates)
  },

  // 应用设置
  getSettings: () => {
    return ipcRenderer.invoke(SETTINGS_IPC_CHANNELS.GET)
  },

  updateSettings: (updates: Partial<AppSettings>) => {
    return ipcRenderer.invoke(SETTINGS_IPC_CHANNELS.UPDATE, updates)
  },

  getSystemTheme: () => {
    return ipcRenderer.invoke(SETTINGS_IPC_CHANNELS.GET_SYSTEM_THEME)
  },

  onSystemThemeChanged: (callback: (isDark: boolean) => void) => {
    const listener = (_: unknown, isDark: boolean): void => callback(isDark)
    ipcRenderer.on(SETTINGS_IPC_CHANNELS.ON_SYSTEM_THEME_CHANGED, listener)
    return () => { ipcRenderer.removeListener(SETTINGS_IPC_CHANNELS.ON_SYSTEM_THEME_CHANGED, listener) }
  },

  // 流式事件订阅
  onStreamChunk: (callback: (event: StreamChunkEvent) => void) => {
    const listener = (_: unknown, event: StreamChunkEvent): void => callback(event)
    ipcRenderer.on(CHAT_IPC_CHANNELS.STREAM_CHUNK, listener)
    return () => { ipcRenderer.removeListener(CHAT_IPC_CHANNELS.STREAM_CHUNK, listener) }
  },

  onStreamReasoning: (callback: (event: StreamReasoningEvent) => void) => {
    const listener = (_: unknown, event: StreamReasoningEvent): void => callback(event)
    ipcRenderer.on(CHAT_IPC_CHANNELS.STREAM_REASONING, listener)
    return () => { ipcRenderer.removeListener(CHAT_IPC_CHANNELS.STREAM_REASONING, listener) }
  },

  onStreamComplete: (callback: (event: StreamCompleteEvent) => void) => {
    const listener = (_: unknown, event: StreamCompleteEvent): void => callback(event)
    ipcRenderer.on(CHAT_IPC_CHANNELS.STREAM_COMPLETE, listener)
    return () => { ipcRenderer.removeListener(CHAT_IPC_CHANNELS.STREAM_COMPLETE, listener) }
  },

  onStreamError: (callback: (event: StreamErrorEvent) => void) => {
    const listener = (_: unknown, event: StreamErrorEvent): void => callback(event)
    ipcRenderer.on(CHAT_IPC_CHANNELS.STREAM_ERROR, listener)
    return () => { ipcRenderer.removeListener(CHAT_IPC_CHANNELS.STREAM_ERROR, listener) }
  },
}

// 将 API 暴露到渲染进程的 window 对象上
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// 扩展 Window 接口的类型定义
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
