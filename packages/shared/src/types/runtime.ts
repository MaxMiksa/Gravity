/**
 * 运行时相关类型定义
 * 用于 Electron 应用的运行时环境检测和状态管理
 */

/**
 * 支持的操作系统平台
 */
export type Platform = 'darwin' | 'linux' | 'win32'

/**
 * 支持的 CPU 架构
 */
export type Architecture = 'arm64' | 'x64'

/**
 * 平台-架构组合标识
 * 用于确定下载哪个 Bun 二进制文件
 */
export type PlatformArch =
  | 'darwin-arm64'
  | 'darwin-x64'
  | 'linux-arm64'
  | 'linux-x64'
  | 'win32-x64'

/**
 * Bun 二进制下载信息
 */
export interface BunDownloadInfo {
  /** 目标平台架构 */
  platformArch: PlatformArch
  /** 下载 URL */
  url: string
  /** Bun GitHub releases 中的文件名 */
  zipFileName: string
  /** 解压后的二进制文件名 */
  binaryName: string
}

/**
 * Bun 运行时状态
 */
export interface BunRuntimeStatus {
  /** 是否可用 */
  available: boolean
  /** Bun 二进制路径 */
  path: string | null
  /** Bun 版本号 */
  version: string | null
  /** 来源：system（系统 PATH）| bundled（打包内置）| vendor（开发环境 vendor 目录）*/
  source: 'system' | 'bundled' | 'vendor' | null
  /** 错误信息（如果不可用）*/
  error: string | null
}

/**
 * Git 运行时状态
 */
export interface GitRuntimeStatus {
  /** 是否可用 */
  available: boolean
  /** Git 版本号 */
  version: string | null
  /** Git 可执行路径 */
  path: string | null
  /** 错误信息（如果不可用）*/
  error: string | null
}

/**
 * Git 仓库状态
 */
export interface GitRepoStatus {
  /** 是否为 Git 仓库 */
  isRepo: boolean
  /** 当前分支名称 */
  branch: string | null
  /** 是否有未提交的更改 */
  hasChanges: boolean
  /** 远程仓库 URL */
  remoteUrl: string | null
}

/**
 * 完整运行时状态
 */
export interface RuntimeStatus {
  /** Bun 运行时状态 */
  bun: BunRuntimeStatus
  /** Git 运行时状态 */
  git: GitRuntimeStatus
  /** Shell 环境变量是否已加载（仅 macOS 相关）*/
  envLoaded: boolean
  /** 初始化时间戳 */
  initializedAt: number
}

/**
 * 运行时初始化选项
 */
export interface RuntimeInitOptions {
  /** 是否跳过 Shell 环境加载（用于测试或特殊场景）*/
  skipEnvLoad?: boolean
  /** 是否跳过 Bun 检测 */
  skipBunDetection?: boolean
  /** 是否跳过 Git 检测 */
  skipGitDetection?: boolean
}

/**
 * Shell 环境加载结果
 */
export interface ShellEnvResult {
  /** 是否成功加载 */
  success: boolean
  /** 加载的环境变量数量 */
  loadedCount: number
  /** 错误信息（如果失败）*/
  error: string | null
}

/**
 * IPC 通道名称常量
 */
export const IPC_CHANNELS = {
  /** 获取运行时状态 */
  GET_RUNTIME_STATUS: 'runtime:get-status',
  /** 获取指定目录的 Git 仓库状态 */
  GET_GIT_REPO_STATUS: 'git:get-repo-status',
  /** 在系统默认浏览器中打开外部链接 */
  OPEN_EXTERNAL: 'shell:open-external',
} as const

/**
 * IPC 通道名称类型
 */
export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
