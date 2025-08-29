/**
 * Shiki 语法高亮服务
 *
 * 提供懒加载的 Shiki 高亮器单例，支持按需加载语言。
 * 纯逻辑层，不依赖 React。
 */

import { createHighlighter, bundledLanguages } from 'shiki'
import type { HighlighterGeneric, BundledLanguage, BundledTheme } from 'shiki'

/** Shiki 高亮器实例类型 */
type ShikiHighlighter = HighlighterGeneric<BundledLanguage, BundledTheme>

/** 默认预加载的语言列表 */
const DEFAULT_LANGS: BundledLanguage[] = [
  'javascript', 'typescript', 'python', 'java', 'json',
  'markdown', 'html', 'css', 'shellscript', 'go', 'rust', 'sql',
  'tsx', 'jsx', 'yaml', 'toml', 'c', 'cpp',
]

/** 默认加载的主题 */
const DEFAULT_THEMES: BundledTheme[] = ['github-light', 'github-dark']

/** 常见语言别名映射 */
const LANGUAGE_ALIASES: Record<string, string> = {
  sh: 'shellscript',
  bash: 'shellscript',
  shell: 'shellscript',
  zsh: 'shellscript',
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  rb: 'ruby',
  yml: 'yaml',
  'c++': 'cpp',
  'c#': 'csharp',
  cs: 'csharp',
  kt: 'kotlin',
  rs: 'rust',
  md: 'markdown',
  tf: 'terraform',
  dockerfile: 'docker',
  plaintext: 'text',
  txt: 'text',
  plain: 'text',
}

/** 高亮选项 */
export interface HighlightOptions {
  /** 代码内容 */
  code: string
  /** 语言标识（如 'typescript'、'py'、'bash'） */
  language: string
  /** Shiki 主题名，默认 'github-dark' */
  theme?: string
}

/** 高亮结果 */
export interface HighlightResult {
  /** Shiki 渲染的 HTML 字符串 */
  html: string
  /** 实际使用的语言（经过别名解析和 fallback） */
  language: string
}

/** 单例高亮器 Promise */
let highlighterPromise: Promise<ShikiHighlighter> | null = null

/**
 * 获取或创建 Shiki 高亮器单例
 * 首次调用时懒加载，后续复用同一实例
 */
function getHighlighter(): Promise<ShikiHighlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: DEFAULT_THEMES,
      langs: DEFAULT_LANGS,
    })
  }
  return highlighterPromise
}

/**
 * 解析语言别名并按需加载，返回可直接使用的语言标识
 * 未知语言自动 fallback 到 'text'
 */
async function resolveAndLoadLanguage(highlighter: ShikiHighlighter, lang: string): Promise<string> {
  const normalized = lang.toLowerCase().trim()
  const resolved = LANGUAGE_ALIASES[normalized] ?? normalized

  // 'text' 是通用 fallback，无需加载
  if (resolved === 'text') return 'text'

  // 不是 Shiki 已知语言 → fallback
  if (!(resolved in bundledLanguages)) return 'text'

  // 已加载过则直接返回
  if (highlighter.getLoadedLanguages().includes(resolved)) return resolved

  // 按需动态加载
  try {
    await highlighter.loadLanguage(resolved as BundledLanguage)
    return resolved
  } catch {
    console.warn(`[shiki-service] 加载语言 "${resolved}" 失败，回退到 text`)
    return 'text'
  }
}

/**
 * 高亮代码，返回 HTML 字符串
 *
 * @example
 * const result = await highlightCode({
 *   code: 'const a = 1',
 *   language: 'typescript',
 * })
 * // result.html → '<pre class="shiki ...">...</pre>'
 */
export async function highlightCode(options: HighlightOptions): Promise<HighlightResult> {
  const { code, language, theme = 'github-dark' } = options

  const highlighter = await getHighlighter()
  const resolvedLang = await resolveAndLoadLanguage(highlighter, language)

  const html = highlighter.codeToHtml(code, {
    lang: resolvedLang as BundledLanguage,
    theme: theme as BundledTheme,
  })

  return { html, language: resolvedLang }
}
