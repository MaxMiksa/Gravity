/**
 * Bun 运行时路径检测模块
 *
 * 负责在不同环境下检测 Bun 二进制文件的位置：
 * - 开发环境：优先使用系统 PATH 中的 bun，其次检查 vendor 目录
 * - 打包环境：从应用资源目录中查找打包的 bun
 */

import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { execSync, spawnSync } from 'child_process'
import { app } from 'electron'
import type { BunRuntimeStatus, PlatformArch } from '@proma/shared'

/**
 * 获取当前平台架构标识
 *
 * @returns 当前系统的平台架构组合
 */
export function getCurrentPlatformArch(): PlatformArch {
  const platform = process.platform as 'darwin' | 'linux' | 'win32'
  const arch = process.arch as 'arm64' | 'x64'

  // 验证支持的组合
  const platformArch = `${platform}-${arch}` as PlatformArch

  const supportedCombinations: PlatformArch[] = [
    'darwin-arm64',
    'darwin-x64',
    'linux-arm64',
    'linux-x64',
    'win32-x64',
  ]

  if (!supportedCombinations.includes(platformArch)) {
    throw new Error(`不支持的平台架构组合: ${platformArch}`)
  }

  return platformArch
}

/**
 * 获取 Bun 二进制文件名
 *
 * @returns Windows 上返回 'bun.exe'，其他平台返回 'bun'
 */
function getBunBinaryName(): string {
  return process.platform === 'win32' ? 'bun.exe' : 'bun'
}

/**
 * 获取打包环境下的 Bun 路径
 *
 * 打包后的目录结构：
 * - macOS: App.app/Contents/Resources/vendor/bun/bun
 * - Windows: resources/vendor/bun/bun.exe
 * - Linux: resources/vendor/bun/bun
 *
 * @returns Bun 二进制路径，如果不存在返回 null
 */
export function getBundledBunPath(): string | null {
  if (!app.isPackaged) {
    return null
  }

  // process.resourcesPath 指向应用的 resources 目录
  const bunPath = join(process.resourcesPath, 'vendor', 'bun', getBunBinaryName())

  if (existsSync(bunPath)) {
    return bunPath
  }

  return null
}

/**
 * 获取开发环境下 vendor 目录中的 Bun 路径
 *
 * 开发环境目录结构：
 * apps/electron/vendor/bun/{platform-arch}/bun
 *
 * @returns Bun 二进制路径，如果不存在返回 null
 */
export function getVendorBunPath(): string | null {
  if (app.isPackaged) {
    return null
  }

  try {
    const platformArch = getCurrentPlatformArch()
    // __dirname 在开发环境下指向 dist/，需要向上一级到 apps/electron/
    const vendorDir = join(__dirname, '..', 'vendor', 'bun', platformArch)
    const bunPath = join(vendorDir, getBunBinaryName())

    if (existsSync(bunPath)) {
      return bunPath
    }
  } catch {
    // 平台不支持，忽略
  }

  return null
}

/**
 * 从系统 PATH 查找 Bun
 *
 * @returns Bun 二进制路径，如果未找到返回 null
 */
export function getSystemBunPath(): string | null {
  try {
    // 使用 which/where 命令查找 bun
    const command = process.platform === 'win32' ? 'where bun' : 'which bun'

    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    })

    const bunPath = result.trim().split('\n')[0]

    if (bunPath && existsSync(bunPath)) {
      return bunPath
    }
  } catch {
    // 命令执行失败，Bun 未安装
  }

  return null
}

/**
 * 验证 Bun 可执行文件
 *
 * @param bunPath - Bun 二进制路径
 * @returns 版本号，如果无效返回 null
 */
export function validateBunExecutable(bunPath: string): string | null {
  if (!existsSync(bunPath)) {
    return null
  }

  try {
    // 使用 spawnSync 执行，更可靠
    const result = spawnSync(bunPath, ['--version'], {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    if (result.status === 0 && result.stdout) {
      return result.stdout.trim()
    }
  } catch {
    // 执行失败
  }

  return null
}

/**
 * 检测并返回 Bun 运行时状态
 *
 * 检测顺序：
 * 1. 打包环境：使用打包的 Bun
 * 2. 开发环境：
 *    a. 系统 PATH 中的 Bun（优先，因为开发者可能想用自己的版本）
 *    b. vendor 目录中的 Bun
 *
 * @returns Bun 运行时状态
 */
export async function detectBunRuntime(): Promise<BunRuntimeStatus> {
  console.log('[Bun 检测] 开始检测 Bun 运行时...')

  // 1. 打包环境：使用打包的 Bun
  if (app.isPackaged) {
    const bundledPath = getBundledBunPath()

    if (bundledPath) {
      const version = validateBunExecutable(bundledPath)

      if (version) {
        console.log(`[Bun 检测] 找到打包的 Bun: ${bundledPath} (${version})`)
        return {
          available: true,
          path: bundledPath,
          version,
          source: 'bundled',
          error: null,
        }
      } else {
        console.warn(`[Bun 检测] 打包的 Bun 无法执行: ${bundledPath}`)
      }
    } else {
      console.warn('[Bun 检测] 打包环境中未找到 Bun 二进制文件')
    }

    // 打包环境下如果没有找到，返回错误
    return {
      available: false,
      path: null,
      version: null,
      source: null,
      error: '打包环境中未找到可用的 Bun 运行时',
    }
  }

  // 2. 开发环境：优先使用系统 PATH
  const systemPath = getSystemBunPath()

  if (systemPath) {
    const version = validateBunExecutable(systemPath)

    if (version) {
      console.log(`[Bun 检测] 找到系统 Bun: ${systemPath} (${version})`)
      return {
        available: true,
        path: systemPath,
        version,
        source: 'system',
        error: null,
      }
    }
  }

  // 3. 开发环境：检查 vendor 目录
  const vendorPath = getVendorBunPath()

  if (vendorPath) {
    const version = validateBunExecutable(vendorPath)

    if (version) {
      console.log(`[Bun 检测] 找到 vendor Bun: ${vendorPath} (${version})`)
      return {
        available: true,
        path: vendorPath,
        version,
        source: 'vendor',
        error: null,
      }
    }
  }

  // 未找到任何 Bun
  console.warn('[Bun 检测] 未找到可用的 Bun 运行时')
  return {
    available: false,
    path: null,
    version: null,
    source: null,
    error: '未找到可用的 Bun 运行时。请安装 Bun 或运行 bun run build:vendor',
  }
}
