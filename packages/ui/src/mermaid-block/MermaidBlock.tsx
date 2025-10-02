/**
 * MermaidBlock - Mermaid 图表渲染组件
 *
 * 使用 beautiful-mermaid 将 mermaid 源码渲染为 SVG 图表。
 *
 * 核心策略 —— "源码优先，SVG 覆盖淡入"：
 *
 * 布局结构（关键：源码层永远在文档流中，SVG 层永远 absolute）：
 *   <div relative>
 *     <pre>源码（始终 static，提供稳定高度）</pre>
 *     <div absolute inset-0>SVG 覆盖层（不参与布局）</div>
 *   </div>
 *
 * 渲染时序：
 *   流式输出 → 源码自然增长（零跳动）
 *   code 稳定 350ms → 后台 renderMermaid
 *   成功 → SVG 淡入覆盖，源码淡出（一次性过渡）
 *   失败 → 保持源码展示
 *
 * 防竞态：generation 计数器，只有最新一代的渲染结果才会生效
 */

import * as React from 'react'
import { renderMermaid, THEMES } from 'beautiful-mermaid'
import type { RenderOptions } from 'beautiful-mermaid'

interface MermaidBlockProps {
  /** mermaid 源码 */
  code: string
}

/** 防抖间隔（ms） */
const DEBOUNCE_MS = 350
/** 淡入淡出时长（ms） */
const FADE_MS = 250
/** 缩放范围 */
const ZOOM_MIN = 0.25
const ZOOM_MAX = 3
const ZOOM_STEP = 0.15

function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark')
}

function getThemeOptions(): RenderOptions {
  const colors = isDarkMode() ? THEMES['github-dark'] : THEMES['github-light']
  return colors ? { ...colors } : {}
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ===== 图标（与 CodeBlock 一致） =====

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
const zoomInPath = (
  <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </>
)
const zoomOutPath = (
  <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </>
)

// ===== 缩放平移 =====

interface ViewTransform {
  scale: number
  translateX: number
  translateY: number
}
const INITIAL_TRANSFORM: ViewTransform = { scale: 1, translateX: 0, translateY: 0 }

// ===== 主组件 =====

export function MermaidBlock({ code }: MermaidBlockProps): React.ReactElement {
  const [svgHtml, setSvgHtml] = React.useState<string | null>(null)
  const [svgVisible, setSvgVisible] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [transform, setTransform] = React.useState<ViewTransform>(INITIAL_TRANSFORM)

  const codeRef = React.useRef(code)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  /** generation 计数器：每次 code 变化递增，防止异步竞态 */
  const generationRef = React.useRef(0)
  const dragRef = React.useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null)
  const svgContainerRef = React.useRef<HTMLDivElement>(null)

  codeRef.current = code

  // ==== 唯一的渲染 effect：全部走防抖，generation 防竞态 ====
  React.useEffect(() => {
    // 每次 code 变化递增 generation，作废所有旧的异步渲染
    generationRef.current++
    const currentGen = generationRef.current

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const svg = await renderMermaid(codeRef.current, getThemeOptions())
        // 只有最新一代的结果才生效，旧的全部丢弃
        if (generationRef.current !== currentGen) return
        if (typeof svg === 'string' && svg.length > 0) {
          setSvgHtml(svg)
          requestAnimationFrame(() => setSvgVisible(true))
        }
      } catch {
        // 渲染失败 → 保持源码展示（不做任何操作）
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [code])

  // ---- 主题变化：重新渲染当前 code ----
  React.useEffect(() => {
    const observer = new MutationObserver(async () => {
      generationRef.current++
      const gen = generationRef.current
      try {
        const svg = await renderMermaid(codeRef.current, getThemeOptions())
        if (generationRef.current !== gen) return
        if (typeof svg === 'string' && svg.length > 0) {
          setSvgHtml(svg)
          setSvgVisible(true)
        }
      } catch { /* 忽略 */ }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // ---- 滚轮缩放 ----
  React.useEffect(() => {
    const el = svgContainerRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      setTransform((prev) => ({
        ...prev,
        scale: clamp(prev.scale + (e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP), ZOOM_MIN, ZOOM_MAX),
      }))
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [svgVisible])

  // ---- 拖拽平移 ----
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      startTx: transform.translateX, startTy: transform.translateY,
    }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      setTransform((prev) => ({
        ...prev,
        translateX: dragRef.current!.startTx + ev.clientX - dragRef.current!.startX,
        translateY: dragRef.current!.startTy + ev.clientY - dragRef.current!.startY,
      }))
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [transform.translateX, transform.translateY])

  const handleZoomIn = React.useCallback(() => {
    setTransform((prev) => ({ ...prev, scale: clamp(prev.scale + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX) }))
  }, [])
  const handleZoomOut = React.useCallback(() => {
    setTransform((prev) => ({ ...prev, scale: clamp(prev.scale - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX) }))
  }, [])
  const handleZoomReset = React.useCallback(() => setTransform(INITIAL_TRANSFORM), [])

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('[MermaidBlock] 复制失败:', error)
    }
  }, [code])

  const zoomPercent = Math.round(transform.scale * 100)

  return (
    <div className="mermaid-block-wrapper group/mermaid rounded-lg overflow-hidden my-2 border border-border/50">
      {/* 头部栏 */}
      <div className="flex items-center justify-between h-[34px] px-2 py-1 bg-muted/60 text-muted-foreground text-xs">
        <span className="font-medium select-none">Mermaid</span>
        <div className="flex items-center gap-1">
          {svgVisible && (
            <div className="flex items-center gap-0.5 mr-2">
              <button type="button" onClick={handleZoomOut} className="p-0.5 rounded hover:bg-foreground/10 transition-colors" title="缩小">
                <svg {...ICON_ATTRS}>{zoomOutPath}</svg>
              </button>
              <button type="button" onClick={handleZoomReset} className="px-1 py-0.5 rounded hover:bg-foreground/10 transition-colors min-w-[40px] text-center tabular-nums" title="重置缩放">
                {zoomPercent}%
              </button>
              <button type="button" onClick={handleZoomIn} className="p-0.5 rounded hover:bg-foreground/10 transition-colors" title="放大">
                <svg {...ICON_ATTRS}>{zoomInPath}</svg>
              </button>
            </div>
          )}
          <button type="button" onClick={handleCopy} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground">
            <svg {...ICON_ATTRS}>{copied ? checkIconPath : copyIconPath}</svg>
            <span>{copied ? '已复制' : '复制'}</span>
          </button>
        </div>
      </div>

      {/*
        内容区 —— 双层叠加，永不切换 position
        源码层：永远 static（提供稳定高度，零跳动）
        SVG 层：永远 absolute（不影响布局）
        两层只通过 opacity 交叉淡入淡出
      */}
      <div className="relative overflow-hidden">
        {/* 源码层 —— 始终在文档流中，流式输出时自然增长 */}
        <pre
          className="overflow-x-auto p-4 m-0 text-[13px] leading-[1.6] bg-muted/30 text-foreground/80"
          style={{
            opacity: svgVisible ? 0 : 1,
            transition: `opacity ${FADE_MS}ms ease`,
          }}
        >
          <code>{code}</code>
        </pre>

        {/* SVG 层 —— absolute 覆盖，渲染成功后淡入，不影响文档流 */}
        {svgHtml && (
          <div
            ref={svgContainerRef}
            className="absolute inset-0 bg-background overflow-hidden select-none"
            style={{
              opacity: svgVisible ? 1 : 0,
              transition: `opacity ${FADE_MS}ms ease`,
              cursor: svgVisible ? 'grab' : 'default',
              pointerEvents: svgVisible ? 'auto' : 'none',
            }}
            onMouseDown={svgVisible ? handleMouseDown : undefined}
          >
            <div
              className="flex justify-center items-center p-4 min-h-full origin-center"
              style={{
                transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
              }}
            >
              <div
                className="mermaid-svg [&>svg]:max-w-full [&>svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: svgHtml }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
