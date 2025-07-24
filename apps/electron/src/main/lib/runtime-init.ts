/**
 * 运行时初始化协调器
 *
 * 负责协调所有运行时初始化逻辑，包括：
 * 1. Shell 环境加载（macOS）
 * 2. Bun 运行时检测
 * 3. Git 运行时检测
 */

import type { RuntimeStatus, RuntimeInitOptions } from '@proma/shared'
import { loadShellEnv } from './shell-env'
import { detectBunRuntime } from './bun-finder'
import { detectGitRuntime, getGitRepoStatus } from './git-detector'

/** 运行时状态缓存 */
let runtimeStatusCache: RuntimeStatus | null = null

/** 初始化标志 */
let isInitialized = false

/**
 * 初始化运行时环境
 *
 * 按顺序执行：
 * 1. loadShellEnv() - 加载 Shell 环境（仅 macOS 打包环境）
 * 2. detectBunRuntime() - 检测 Bun 运行时
 * 3. detectGitRuntime() - 检测 Git 运行时
 *
 * @param options - 初始化选项
 * @returns 运行时状态
 */
export async function initializeRuntime(options: RuntimeInitOptions = {}): Promise<RuntimeStatus> {
  const startTime = Date.now()
  console.log('[运行时初始化] 开始初始化运行时环境...')

  // 1. 加载 Shell 环境
  let envLoaded = false

  if (!options.skipEnvLoad) {
    try {
      const shellEnvResult = await loadShellEnv()
      envLoaded = shellEnvResult.success
    } catch (error) {
      console.error('[运行时初始化] Shell 环境加载失败:', error)
      envLoaded = false
    }
  }

  // 2. 检测 Bun 运行时
  const bunStatus = options.skipBunDetection
    ? {
        available: false,
        path: null,
        version: null,
        source: null,
        error: '已跳过 Bun 检测',
      }
    : await detectBunRuntime()

  // 3. 检测 Git 运行时
  const gitStatus = options.skipGitDetection
    ? {
        available: false,
        version: null,
        path: null,
        error: '已跳过 Git 检测',
      }
    : await detectGitRuntime()

  // 构建运行时状态
  const runtimeStatus: RuntimeStatus = {
    bun: bunStatus,
    git: gitStatus,
    envLoaded,
    initializedAt: Date.now(),
  }

  // 缓存状态
  runtimeStatusCache = runtimeStatus
  isInitialized = true

  const duration = Date.now() - startTime
  console.log(`[运行时初始化] 初始化完成 (耗时 ${duration}ms)`)
  console.log('[运行时初始化] 状态:', {
    bun: bunStatus.available ? `✅ ${bunStatus.version} (${bunStatus.source})` : `❌ ${bunStatus.error}`,
    git: gitStatus.available ? `✅ ${gitStatus.version}` : `❌ ${gitStatus.error}`,
    envLoaded: envLoaded ? '✅' : '⚠️ 未加载或不需要',
  })

  return runtimeStatus
}

/**
 * 获取当前运行时状态
 *
 * @returns 运行时状态，如果未初始化返回 null
 */
export function getRuntimeStatus(): RuntimeStatus | null {
  return runtimeStatusCache
}

/**
 * 检查运行时是否已初始化
 *
 * @returns 是否已初始化
 */
export function isRuntimeInitialized(): boolean {
  return isInitialized
}

/**
 * 重新初始化运行时
 *
 * @param options - 初始化选项
 * @returns 新的运行时状态
 */
export async function reinitializeRuntime(options: RuntimeInitOptions = {}): Promise<RuntimeStatus> {
  isInitialized = false
  runtimeStatusCache = null
  return initializeRuntime(options)
}

// 重新导出子模块的函数，方便外部使用
export { getGitRepoStatus } from './git-detector'
export { detectBunRuntime } from './bun-finder'
export { loadShellEnv } from './shell-env'
