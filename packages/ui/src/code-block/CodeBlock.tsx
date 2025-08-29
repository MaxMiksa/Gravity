/**
 * CodeBlock - 代码块组件
 *
 * 提供语法高亮（Shiki）、语言标签和复制按钮。
 * 用于 react-markdown 的 pre 元素自定义渲染。
 *
 * 结构：
 * ┌─────────────────────────────────────────┐
 * │ [language]                     [📋 复制] │  ← 头部栏
 * ├─────────────────────────────────────────┤
 * │  const foo = 'bar'                      │  ← 高亮代码区
 * │  console.log(foo)                       │
 * └─────────────────────────────────────────┘
 */

import * as React from 'react'
import { highlightCode } from '@proma/core'

/** react-markdown 传入的 <code> 元素 props */
interface CodeElementProps {
  className?: string
  children?: React.ReactNode
}

interface CodeBlockProps {
  /** react-markdown 传入的 <pre> 子元素（内含 <code>） */
  children: React.ReactNode
}

// ===== 工具函数 =====

/** 递归提取 ReactNode 中的纯文本 */
function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (!node) return ''
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (React.isValidElement(node)) {
    return extractText((node.props as CodeElementProps).children)
  }
  return ''
}

/** 从 children 中提取语言名和代码文本 */
function extractCodeInfo(children: React.ReactNode): { language: string; code: string } {
  const codeElement = React.Children.toArray(children).find(
    (child): child is React.ReactElement =>
      React.isValidElement(child) && (child as React.ReactElement).type === 'code'
  ) as React.ReactElement | undefined

  if (!codeElement) {
    return { language: '', code: extractText(children) }
  }

  const props = codeElement.props as CodeElementProps
  const langMatch = props.className?.match(/language-(\S+)/)

  return {
    language: langMatch?.[1] ?? '',
    code: extractText(props.children),
  }
}

/**
 * 不规则语言显示名称（无法通过首字母大写自动生成的）
 * 其余语言自动 capitalize 首字母
 */
const DISPLAY_NAMES: Record<string, string> = {
  js: 'JavaScript', javascript: 'JavaScript',
  ts: 'TypeScript', typescript: 'TypeScript',
  tsx: 'TSX', jsx: 'JSX',
  py: 'Python', rb: 'Ruby',
  cpp: 'C++', 'c++': 'C++',
  cs: 'C#', csharp: 'C#',
  kt: 'Kotlin', rs: 'Rust',
  sh: 'Shell', zsh: 'Shell',
  yml: 'YAML', md: 'Markdown',
  tf: 'Terraform',
  html: 'HTML', css: 'CSS', scss: 'SCSS', less: 'LESS',
  json: 'JSON', xml: 'XML', sql: 'SQL',
  graphql: 'GraphQL', php: 'PHP',
  plaintext: 'Text', text: 'Text',
}

/** 获取语言显示名称，未匹配的自动首字母大写 */
function getDisplayName(lang: string): string {
  if (!lang) return 'Code'
  const key = lang.toLowerCase()
  return DISPLAY_NAMES[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

// ===== SVG 图标路径常量 =====

const ICON_ATTRS = {
  width: 14, height: 14, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor', strokeWidth: 2,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
}

/** 复制图标 */
const copyIconPath = (
  <>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </>
)

/** 已复制图标 */
const checkIconPath = <polyline points="20 6 9 17 4 12" />

// ===== 主组件 =====

/**
 * CodeBlock 代码块组件
 *
 * 作为 react-markdown 的 pre 组件使用：
 * ```tsx
 * <Markdown components={{ pre: ({ children }) => <CodeBlock>{children}</CodeBlock> }}>
 * ```
 */
export function CodeBlock({ children }: CodeBlockProps): React.ReactElement {
  const { language, code } = React.useMemo(() => extractCodeInfo(children), [children])
  const [highlightedHtml, setHighlightedHtml] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  // 去除尾部换行
  const trimmedCode = code.replace(/\n$/, '')

  // 异步高亮
  React.useEffect(() => {
    let cancelled = false

    highlightCode({
      code: trimmedCode,
      language: language || 'text',
    }).then((result) => {
      if (!cancelled) setHighlightedHtml(result.html)
    }).catch((error) => {
      console.error('[CodeBlock] 高亮失败:', error)
    })

    return () => { cancelled = true }
  }, [trimmedCode, language])

  // 复制到剪贴板
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(trimmedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('[CodeBlock] 复制失败:', error)
    }
  }, [trimmedCode])

  return (
    <div className="code-block-wrapper group/code rounded-lg overflow-hidden my-2 border border-border/50">
      {/* 头部栏：语言标签 + 复制按钮 */}
      <div className="flex items-center justify-between h-[34px] px-2 py-1 bg-muted/60 text-muted-foreground text-xs">
        <span className="font-medium select-none">{getDisplayName(language)}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
        >
          <svg {...ICON_ATTRS}>{copied ? checkIconPath : copyIconPath}</svg>
          <span>{copied ? '已复制' : '复制'}</span>
        </button>
      </div>

      {/* 代码区域 */}
      {highlightedHtml ? (
        <div
          className="shiki-container"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className="shiki overflow-x-auto p-4 text-[13px] leading-[1.5] bg-[#24292e] text-[#e1e4e8]">
          <code>{trimmedCode}</code>
        </pre>
      )}
    </div>
  )
}
