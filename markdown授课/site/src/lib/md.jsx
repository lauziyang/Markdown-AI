import React, { memo, useEffect, useId, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { copyText } from './utils.js'

/* 轻量清理：移除 script、事件属性和 javascript: 伪协议（教学用途足够） */
function lightSanitize(src) {
  return String(src)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
}

/* ============================================================
   Mermaid 图表渲染块
   ============================================================ */

export function MermaidBlock({ code, theme = 'default', naturalWidth = false }) {
  const [svg, setSvg] = useState(null)
  const [err, setErr] = useState(null)
  const uid = useId().replace(/[:]/g, '')

  useEffect(() => {
    let cancelled = false
    setErr(null)
    setSvg(null)
    const run = async () => {
      const id = `mmd-${uid}-${Math.random().toString(36).slice(2, 8)}`
      try {
        // 预检：第一行没有图表类型关键字就不调用 mermaid，
        // 避免它把"炸弹+Syntax error"的错误图注入到页面底部。
        const firstLine = (code || '').trim().split('\n')[0] || ''
        if (!/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|journey|gantt|pie|quadrantChart|requirementDiagram|gitGraph|mindmap|timeline|zenuml|sankey|xychart-beta|block|packet|architecture-beta|c4)/.test(firstLine.trim())) {
          throw new Error('没有识别到图表类型（试试用 graph 开头）')
        }
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme,
          securityLevel: 'loose',
          fontFamily: 'inherit',
        })
        const { svg } = await mermaid.render(id, code)
        // 清理 mermaid 渲染用的临时容器
        document.getElementById(`d${id}`)?.remove()
        if (cancelled) return
        // mermaid 默认给 svg 写 width="100%"（会随容器缩放）。
        // naturalWidth 模式下改回 viewBox 的固有宽度，宽图（甘特图等）保持原始大小、可横向滚动。
        let html = svg
        if (naturalWidth) {
          const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
          if (vb) {
            const w = Math.ceil(parseFloat(vb[1]))
            html = svg.replace(/width="100%"/, `width="${w}"`)
          }
        }
        setSvg(html)
      } catch (e) {
        // mermaid 解析失败时会把"错误图"（炸弹 + Syntax error）注入到 body，
        // 必须清掉，否则它会一直挂在页面左下角。
        document.getElementById(`d${id}`)?.remove()
        document.querySelector(`svg#${id}`)?.remove()
        if (!cancelled) setErr(e.message || String(e))
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [code, theme, uid, naturalWidth])

  if (err) {
    return (
      <div className="mermaid-err">
        <div>⚠️ 图表暂时没画出来——Mermaid 读不懂这段代码</div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
          可能原因：代码还没写完、箭头符号有笔误，或节点名用了特殊字符。
        </div>
        <details style={{ marginTop: 6, fontSize: 12, opacity: 0.65 }}>
          <summary style={{ cursor: 'pointer' }}>查看技术细节</summary>
          <pre style={{ whiteSpace: 'pre-wrap', margin: '6px 0 0', fontFamily: 'var(--font-mono)' }}>{err}</pre>
        </details>
      </div>
    )
  }
  if (!svg) {
    return <div className="mermaid-block" style={{ color: 'var(--text-faint)' }}>⏳ 渲染图表中…</div>
  }
  return <div className="mermaid-block" dangerouslySetInnerHTML={{ __html: svg }} />
}

/* ============================================================
   Markdown 渲染器（统一配置）
   关键：mermaid 代码块在解析前被替换为占位符，避免被
   rehype-highlight 高亮破坏，渲染时再还原为 MermaidBlock。
   ============================================================ */

function TokenText({ token, theme }) {
  return <MermaidBlock code={token.code} theme={theme} />
}

function CodeBlock({ children, className, inline }) {
  const lang = /language-(\w+)/.exec(className || '')?.[1] || ''
  const code = String(children).replace(/\n$/, '')
  const [copied, setCopied] = useState(false)

  if (inline) {
    return <code className={className}>{children}</code>
  }
  return (
    <pre className={className}>
      <button
        className="md-copy-btn"
        onClick={async (e) => {
          e.stopPropagation()
          await copyText(code)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
      >
        {copied ? '✓ 已复制' : '复制'}
      </button>
      <code className={className}>{children}</code>
    </pre>
  )
}

export const MarkdownPreview = memo(function MarkdownPreview({ source = '', className = '', mermaidTheme = 'default', rawHtml = true }) {
  // 1. 提取 mermaid 代码块
  const tokens = {}
  let processed = String(source).replace(/```mermaid\s*\n([\s\S]*?)```/g, (_m, code) => {
    const t = `[[MMD_TOKEN_${Object.keys(tokens).length}]]`
    tokens[t] = { code }
    return t
  })
  if (rawHtml) processed = lightSanitize(processed)

  const components = {
    code: CodeBlock,
    pre: ({ children }) => <>{children}</>,
    p: ({ children }) => {
      // 还原 mermaid 占位符
      if (typeof children === 'string' && tokens[children]) {
        return <TokenText token={tokens[children]} theme={mermaidTheme} />
      }
      if (Array.isArray(children)) {
        for (const c of children) {
          if (typeof c === 'string' && tokens[c]) {
            return <TokenText token={tokens[c]} theme={mermaidTheme} />
          }
        }
      }
      return <p>{children}</p>
    },
  }

  return (
    <div className={`md ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={rawHtml ? [rehypeRaw, rehypeKatex, rehypeHighlight] : [rehypeKatex, rehypeHighlight]}
        components={components}
      >
        {processed}
      </ReactMarkdown>
    </div>
  )
})
