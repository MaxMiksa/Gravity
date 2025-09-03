/**
 * CodeBlock - 代码块组件
 *
 * 提供语法高亮（Shiki）、语言标签和复制按钮。
 * 用于 react-markdown 的 pre 元素自定义渲染。
 *
 * 流式渲染策略（类 Cherry Studio 方案）：
 * 1. 使用 highlightToTokens 获取结构化 token，逐行渲染为 React 元素
 * 2. 稳定的行级 key → React reconciliation 只更新变化/新增的行
 * 3. 节流 80ms → 避免每个 token 都触发高亮计算
 * 4. 首次挂载异步初始化 → 后续全部同步
 *
 * 结构：
 * ┌─────────────────────────────────────────┐
 * │ [language]                     [📋 复制] │  ← 头部栏
 * ├─────────────────────────────────────────┤
 * │  const foo = 'bar'                      │  ← 高亮代码区（逐行渲染）
 * │  console.log(foo)                       │
 * └─────────────────────────────────────────┘
 */

import * as React from 'react'
import { highlightCode, highlightToTokens } from '@proma/core'
import type { HighlightToken, HighlightTokensResult } from '@proma/core'

/** react-markdown 传入的 <code> 元素 props */
interface CodeElementProps {
  className?: string
  children?: React.ReactNode
}

interface CodeBlockProps {
  /** react-markdown 传入的 <pre> 子元素（内含 <code>） */
  children: React.ReactNode
}

/** 节流间隔（ms）：流式输出时限制高亮更新频率 */
const THROTTLE_MS = 80

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

const copyIconPath = (
  <>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </>
)

const checkIconPath = <polyline points="20 6 9 17 4 12" />

// ===== 逐行渲染子组件 =====

interface CodeLineProps {
  tokens: HighlightToken[]
  /** 该行的原始文本（token 未覆盖部分作为 fallback） */
  rawLine: string
}

/** 单行代码渲染（memo 避免已稳定行重复渲染） */
const CodeLine = React.memo(function CodeLine({ tokens, rawLine }: CodeLineProps): React.ReactElement {
  // token 覆盖的字符数
  const tokenLen = tokens.reduce((sum, t) => sum + t.content.length, 0)

  return (
    <span className="line">
      {tokens.map((token, i) => (
        <span key={i} style={token.color ? { color: token.color } : undefined}>
          {token.content}
        </span>
      ))}
      {/* 流式输出时可能有 token 尚未覆盖的尾部文本 */}
      {tokenLen < rawLine.length && (
        <span>{rawLine.slice(tokenLen)}</span>
      )}
    </span>
  )
})

// ===== 主组件 =====

/**
 * CodeBlock 代码块组件
 *
 * 渲染策略：
 * - 逐行渲染：highlightToTokens → 每行独立 React 元素 + 稳定 key
 * - 节流 80ms：流式输出时控制重计算频率
 * - 异步兜底：首次挂载高亮器未就绪时，异步初始化后触发一次更新
 */
export function CodeBlock({ children }: CodeBlockProps): React.ReactElement {
  const { language, code } = React.useMemo(() => extractCodeInfo(children), [children])
  const [copied, setCopied] = React.useState(false)

  const trimmedCode = code.replace(/\n$/, '')
  const langOrText = language || 'text'
  const rawLines = React.useMemo(() => trimmedCode.split('\n'), [trimmedCode])

  // ---- 节流 token 高亮 ----
  const [tokenResult, setTokenResult] = React.useState<HighlightTokensResult | null>(
    () => highlightToTokens({ code: trimmedCode, language: langOrText })
  )
  const pendingCodeRef = React.useRef(trimmedCode)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastUpdateRef = React.useRef(Date.now())

  pendingCodeRef.current = trimmedCode

  React.useEffect(() => {
    const now = Date.now()
    const elapsed = now - lastUpdateRef.current

    const doHighlight = () => {
      const currentCode = pendingCodeRef.current
      const result = highlightToTokens({ code: currentCode, language: langOrText })
      if (result) {
        lastUpdateRef.current = Date.now()
        setTokenResult(result)
      }
    }

    // 同步路径可用时
    const syncResult = highlightToTokens({ code: trimmedCode, language: langOrText })
    if (syncResult) {
      if (elapsed >= THROTTLE_MS) {
        // 距上次更新已超过节流间隔，立即执行
        lastUpdateRef.current = now
        setTokenResult(syncResult)
      } else if (!timerRef.current) {
        // 安排延迟执行，确保最终状态正确
        timerRef.current = setTimeout(() => {
          timerRef.current = null
          doHighlight()
        }, THROTTLE_MS - elapsed)
      }
      return
    }

    // 异步兜底：高亮器尚未初始化
    let cancelled = false
    highlightCode({ code: trimmedCode, language: langOrText })
      .then(() => {
        // 初始化完成，用同步路径获取最新结果
        if (!cancelled) doHighlight()
      })
      .catch((error) => console.error('[CodeBlock] 高亮失败:', error))

    return () => { cancelled = true }
  }, [trimmedCode, langOrText])

  // 清理节流定时器
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

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

      {/* 代码区域：逐行渲染 */}
      <pre
        className="shiki overflow-x-auto p-4 m-0 text-[13px] leading-[1.6]"
        style={{
          backgroundColor: tokenResult?.bgColor ?? '#24292e',
          color: tokenResult?.fgColor ?? '#e1e4e8',
          borderRadius: '0 0 8px 8px',
        }}
      >
        <code>
          {rawLines.map((rawLine, i) => (
            <React.Fragment key={i}>
              {i > 0 && '\n'}
              <CodeLine
                tokens={tokenResult?.lines[i] ?? []}
                rawLine={rawLine}
              />
            </React.Fragment>
          ))}
        </code>
      </pre>
    </div>
  )
}
