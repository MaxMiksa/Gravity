/**
 * IPC 处理器模块
 *
 * 负责注册主进程和渲染进程之间的通信处理器
 */

import { ipcMain } from 'electron'
import { IPC_CHANNELS, CHANNEL_IPC_CHANNELS } from '@proma/shared'
import type {
  RuntimeStatus,
  GitRepoStatus,
  Channel,
  ChannelCreateInput,
  ChannelUpdateInput,
  ChannelTestResult,
  FetchModelsInput,
  FetchModelsResult,
} from '@proma/shared'
import { getRuntimeStatus, getGitRepoStatus } from './lib/runtime-init'
import {
  listChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  decryptApiKey,
  testChannel,
  testChannelDirect,
  fetchModels,
} from './lib/channel-manager'

/**
 * 注册 IPC 处理器
 *
 * 注册的通道：
 * - runtime:get-status: 获取运行时状态
 * - git:get-repo-status: 获取指定目录的 Git 仓库状态
 * - channel:list: 获取所有渠道列表
 * - channel:create: 创建渠道
 * - channel:update: 更新渠道
 * - channel:delete: 删除渠道
 * - channel:decrypt-key: 解密 API Key
 * - channel:test: 测试渠道连接
 * - channel:test-direct: 直接测试连接（无需已保存渠道）
 * - channel:fetch-models: 从供应商拉取可用模型列表
 */
export function registerIpcHandlers(): void {
  console.log('[IPC] 正在注册 IPC 处理器...')

  // ===== 运行时相关 =====

  // 获取运行时状态
  ipcMain.handle(
    IPC_CHANNELS.GET_RUNTIME_STATUS,
    async (): Promise<RuntimeStatus | null> => {
      return getRuntimeStatus()
    }
  )

  // 获取指定目录的 Git 仓库状态
  ipcMain.handle(
    IPC_CHANNELS.GET_GIT_REPO_STATUS,
    async (_, dirPath: string): Promise<GitRepoStatus | null> => {
      if (!dirPath || typeof dirPath !== 'string') {
        console.warn('[IPC] git:get-repo-status 收到无效的目录路径')
        return null
      }

      return getGitRepoStatus(dirPath)
    }
  )

  // ===== 渠道管理相关 =====

  // 获取所有渠道（apiKey 保持加密态）
  ipcMain.handle(
    CHANNEL_IPC_CHANNELS.LIST,
    async (): Promise<Channel[]> => {
      return listChannels()
    }
  )

  // 创建渠道
  ipcMain.handle(
    CHANNEL_IPC_CHANNELS.CREATE,
    async (_, input: ChannelCreateInput): Promise<Channel> => {
      return createChannel(input)
    }
  )

  // 更新渠道
  ipcMain.handle(
    CHANNEL_IPC_CHANNELS.UPDATE,
    async (_, id: string, input: ChannelUpdateInput): Promise<Channel> => {
      return updateChannel(id, input)
    }
  )

  // 删除渠道
  ipcMain.handle(
    CHANNEL_IPC_CHANNELS.DELETE,
    async (_, id: string): Promise<void> => {
      return deleteChannel(id)
    }
  )

  // 解密 API Key（仅在用户查看时调用）
  ipcMain.handle(
    CHANNEL_IPC_CHANNELS.DECRYPT_KEY,
    async (_, channelId: string): Promise<string> => {
      return decryptApiKey(channelId)
    }
  )

  // 测试渠道连接
  ipcMain.handle(
    CHANNEL_IPC_CHANNELS.TEST,
    async (_, channelId: string): Promise<ChannelTestResult> => {
      return testChannel(channelId)
    }
  )

  // 直接测试连接（无需已保存渠道，传入明文凭证）
  ipcMain.handle(
    CHANNEL_IPC_CHANNELS.TEST_DIRECT,
    async (_, input: FetchModelsInput): Promise<ChannelTestResult> => {
      return testChannelDirect(input)
    }
  )

  // 从供应商拉取可用模型列表（直接传入凭证，无需已保存渠道）
  ipcMain.handle(
    CHANNEL_IPC_CHANNELS.FETCH_MODELS,
    async (_, input: FetchModelsInput): Promise<FetchModelsResult> => {
      return fetchModels(input)
    }
  )

  console.log('[IPC] IPC 处理器注册完成')
}
