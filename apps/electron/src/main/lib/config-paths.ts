/**
 * 配置路径工具
 *
 * 管理 Proma 应用的本地配置文件路径。
 * 所有用户配置存储在 ~/.proma/ 目录下。
 */

import { join } from 'node:path'
import { mkdirSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'

/** 配置目录名称 */
const CONFIG_DIR_NAME = '.proma'

/**
 * 获取配置目录路径
 *
 * 返回 ~/.proma/，如果目录不存在则自动创建。
 */
export function getConfigDir(): string {
  const configDir = join(homedir(), CONFIG_DIR_NAME)

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
    console.log(`[配置] 已创建配置目录: ${configDir}`)
  }

  return configDir
}

/**
 * 获取渠道配置文件路径
 *
 * @returns ~/.proma/channels.json
 */
export function getChannelsPath(): string {
  return join(getConfigDir(), 'channels.json')
}
