/**
 * 渠道管理器
 *
 * 负责渠道的 CRUD 操作、API Key 加密/解密、连接测试。
 * 使用 Electron safeStorage 进行 API Key 加密（底层使用 OS 级加密）。
 * 数据持久化到 ~/.proma/channels.json。
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { safeStorage } from 'electron'
import { randomUUID } from 'node:crypto'
import { getChannelsPath } from './config-paths'
import type {
  Channel,
  ChannelCreateInput,
  ChannelUpdateInput,
  ChannelsConfig,
  ChannelTestResult,
} from '@proma/shared'

/** 当前配置版本 */
const CONFIG_VERSION = 1

/**
 * 读取渠道配置文件
 */
function readConfig(): ChannelsConfig {
  const configPath = getChannelsPath()

  if (!existsSync(configPath)) {
    return { version: CONFIG_VERSION, channels: [] }
  }

  try {
    const raw = readFileSync(configPath, 'utf-8')
    return JSON.parse(raw) as ChannelsConfig
  } catch (error) {
    console.error('[渠道管理] 读取配置文件失败:', error)
    return { version: CONFIG_VERSION, channels: [] }
  }
}

/**
 * 写入渠道配置文件
 */
function writeConfig(config: ChannelsConfig): void {
  const configPath = getChannelsPath()

  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
  } catch (error) {
    console.error('[渠道管理] 写入配置文件失败:', error)
    throw new Error('写入渠道配置失败')
  }
}

/**
 * 加密 API Key
 *
 * 使用 Electron safeStorage 加密，底层使用：
 * - macOS: Keychain
 * - Windows: DPAPI
 * - Linux: Secret Service API
 *
 * @returns base64 编码的加密字符串
 */
function encryptApiKey(plainKey: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('[渠道管理] safeStorage 加密不可用，将以明文存储')
    return plainKey
  }

  const encrypted = safeStorage.encryptString(plainKey)
  return encrypted.toString('base64')
}

/**
 * 解密 API Key
 *
 * @param encryptedKey base64 编码的加密字符串
 * @returns 明文 API Key
 */
function decryptKey(encryptedKey: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    // 如果加密不可用，假设存储的是明文
    return encryptedKey
  }

  try {
    const buffer = Buffer.from(encryptedKey, 'base64')
    return safeStorage.decryptString(buffer)
  } catch (error) {
    console.error('[渠道管理] 解密 API Key 失败:', error)
    throw new Error('解密 API Key 失败')
  }
}

/**
 * 获取所有渠道
 *
 * 返回的渠道中 apiKey 保持加密状态。
 */
export function listChannels(): Channel[] {
  const config = readConfig()
  return config.channels
}

/**
 * 创建新渠道
 *
 * @param input 渠道创建数据（apiKey 为明文，会自动加密）
 * @returns 创建后的渠道（apiKey 为加密态）
 */
export function createChannel(input: ChannelCreateInput): Channel {
  const config = readConfig()
  const now = Date.now()

  const channel: Channel = {
    id: randomUUID(),
    name: input.name,
    provider: input.provider,
    baseUrl: input.baseUrl,
    apiKey: encryptApiKey(input.apiKey),
    models: input.models,
    enabled: input.enabled,
    createdAt: now,
    updatedAt: now,
  }

  config.channels.push(channel)
  writeConfig(config)

  console.log(`[渠道管理] 已创建渠道: ${channel.name} (${channel.id})`)
  return channel
}

/**
 * 更新渠道
 *
 * @param id 渠道 ID
 * @param input 更新数据（apiKey 为明文，空字符串表示不更新）
 * @returns 更新后的渠道
 */
export function updateChannel(id: string, input: ChannelUpdateInput): Channel {
  const config = readConfig()
  const index = config.channels.findIndex((c) => c.id === id)

  if (index === -1) {
    throw new Error(`渠道不存在: ${id}`)
  }

  const existing = config.channels[index]
  const updated: Channel = {
    ...existing,
    name: input.name ?? existing.name,
    provider: input.provider ?? existing.provider,
    baseUrl: input.baseUrl ?? existing.baseUrl,
    apiKey: input.apiKey ? encryptApiKey(input.apiKey) : existing.apiKey,
    models: input.models ?? existing.models,
    enabled: input.enabled ?? existing.enabled,
    updatedAt: Date.now(),
  }

  config.channels[index] = updated
  writeConfig(config)

  console.log(`[渠道管理] 已更新渠道: ${updated.name} (${updated.id})`)
  return updated
}

/**
 * 删除渠道
 */
export function deleteChannel(id: string): void {
  const config = readConfig()
  const index = config.channels.findIndex((c) => c.id === id)

  if (index === -1) {
    throw new Error(`渠道不存在: ${id}`)
  }

  const removed = config.channels.splice(index, 1)[0]
  writeConfig(config)

  console.log(`[渠道管理] 已删除渠道: ${removed.name} (${removed.id})`)
}

/**
 * 解密渠道的 API Key
 *
 * 仅在用户需要查看时调用。
 */
export function decryptApiKey(channelId: string): string {
  const config = readConfig()
  const channel = config.channels.find((c) => c.id === channelId)

  if (!channel) {
    throw new Error(`渠道不存在: ${channelId}`)
  }

  return decryptKey(channel.apiKey)
}

/**
 * 测试渠道连接
 *
 * 向提供商的 API 发送简单请求，验证 API Key 和连接是否有效。
 */
export async function testChannel(channelId: string): Promise<ChannelTestResult> {
  const config = readConfig()
  const channel = config.channels.find((c) => c.id === channelId)

  if (!channel) {
    return { success: false, message: '渠道不存在' }
  }

  const apiKey = decryptKey(channel.apiKey)

  try {
    switch (channel.provider) {
      case 'anthropic':
        return await testAnthropic(channel.baseUrl, apiKey)
      case 'openai':
      case 'deepseek':
      case 'custom':
        return await testOpenAICompatible(channel.baseUrl, apiKey)
      case 'google':
        return await testGoogle(channel.baseUrl, apiKey)
      default:
        return { success: false, message: `不支持的提供商: ${channel.provider}` }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    return { success: false, message: `连接测试失败: ${message}` }
  }
}

/**
 * 测试 Anthropic API 连接
 */
async function testAnthropic(baseUrl: string, apiKey: string): Promise<ChannelTestResult> {
  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'hi' }],
    }),
  })

  if (response.ok || response.status === 200) {
    return { success: true, message: '连接成功' }
  }

  // 401 表示 API Key 无效，其他错误可能表示连接正常但请求有问题
  if (response.status === 401) {
    return { success: false, message: 'API Key 无效' }
  }

  // 如果能收到 API 的响应（即使是错误），说明连接是通的
  return { success: true, message: '连接成功' }
}

/**
 * 测试 OpenAI 兼容 API 连接（OpenAI / DeepSeek / Custom）
 */
async function testOpenAICompatible(baseUrl: string, apiKey: string): Promise<ChannelTestResult> {
  const response = await fetch(`${baseUrl}/models`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (response.ok) {
    return { success: true, message: '连接成功' }
  }

  if (response.status === 401) {
    return { success: false, message: 'API Key 无效' }
  }

  const text = await response.text().catch(() => '')
  return { success: false, message: `请求失败 (${response.status}): ${text.slice(0, 200)}` }
}

/**
 * 测试 Google Generative AI API 连接
 */
async function testGoogle(baseUrl: string, apiKey: string): Promise<ChannelTestResult> {
  const response = await fetch(`${baseUrl}/v1beta/models?key=${apiKey}`, {
    method: 'GET',
  })

  if (response.ok) {
    return { success: true, message: '连接成功' }
  }

  if (response.status === 400 || response.status === 403) {
    return { success: false, message: 'API Key 无效' }
  }

  const text = await response.text().catch(() => '')
  return { success: false, message: `请求失败 (${response.status}): ${text.slice(0, 200)}` }
}
