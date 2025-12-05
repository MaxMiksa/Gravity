/**
 * 自动更新 IPC 处理器
 *
 * 注册更新相关的 IPC 通道，供渲染进程调用。
 */

import { ipcMain } from 'electron'
import { UPDATER_IPC_CHANNELS } from './updater-types'
import type { UpdateStatus } from './updater-types'
import {
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  getUpdateStatus,
} from './auto-updater'

/** 注册更新 IPC 处理器 */
export function registerUpdaterIpc(): void {
  console.log('[更新 IPC] 正在注册更新 IPC 处理器...')

  // 检查更新
  ipcMain.handle(
    UPDATER_IPC_CHANNELS.CHECK_FOR_UPDATES,
    async (): Promise<void> => {
      await checkForUpdates()
    }
  )

  // 下载更新
  ipcMain.handle(
    UPDATER_IPC_CHANNELS.DOWNLOAD_UPDATE,
    async (): Promise<void> => {
      await downloadUpdate()
    }
  )

  // 安装更新（退出并安装）
  ipcMain.handle(
    UPDATER_IPC_CHANNELS.INSTALL_UPDATE,
    async (): Promise<void> => {
      installUpdate()
    }
  )

  // 获取当前更新状态
  ipcMain.handle(
    UPDATER_IPC_CHANNELS.GET_STATUS,
    async (): Promise<UpdateStatus> => {
      return getUpdateStatus()
    }
  )

  console.log('[更新 IPC] 更新 IPC 处理器注册完成')
}
