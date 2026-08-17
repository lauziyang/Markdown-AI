import React, { useEffect, useRef, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete, CopyBlock } from '../../../components/ui.jsx'
import { MarkdownPreview } from '../../../lib/md.jsx'
import { copyText } from '../../../lib/utils.js'

/* ============================================================
   示例文章（预览区固定用它）
   ============================================================ */
const SAMPLE = `# 我的专属样式

这是**示例文章**，用来展示你的样式调整效果。

## 为什么样式很重要

> 好的排版让阅读更舒服。Markdown 负责内容，样式负责颜值。

- 字号：影响阅读舒适度
- 行距：影响段落呼吸感
- 颜色：影响整体氛围

[GitHub Markdown 样式指南](https://github.com/sindresorhus/github-markdown-css)

---

*祝你调出喜欢的风格！*`

/* ============================================================
   预设主题：本质就是一组样式变量的集合
   ============================================================ */
const THEMES = {
  default: { name: '默认', emoji: '⚙️', fontFamily: '', fontSize: 16, lineHeight: 1.8, color: '#1f2937', accent: '#6366f1', bg: '#ffffff', border: '#e5e7eb' },
  warm: { name: '暖色', emoji: '🌅', fontFamily: '', fontSize: 16, lineHeight: 1.85, color: '#5b4230', accent: '#d97706', bg: '#fff8ec', border: '#f0e0c2' },
  green: { name: '护眼绿', emoji: '🌿', fontFamily: '', fontSize: 16, lineHeight: 1.8, color: '#2d4a37', accent: '#16a34a', bg: '#f1faf3', border: '#cde8d4' },
  night: { name: '夜间', emoji: '🌙', fontFamily: '', fontSize: 15, lineHeight: 1.9, color: '#d6dce8', accent: '#818cf8', bg: '#0f172a', border: '#27334d' },
  minimal: { name: '极简', emoji: '🤍', fontFamily: '', fontSize: 17, lineHeight: 2, color: '#111111', accent: '#111111', bg: '#ffffff', border: '#f0f0f0' },
}

const FONTS = [
  { value: '', label: '系统默认' },
  { value: '"SimSun", "Songti SC", "Noto Serif SC", serif', label: '宋体' },
  { value: '"KaiTi", "KaiTi SC", "STKaiti", serif', label: '楷体' },
  { value: '"SF Mono", ui-monospace, Menlo, Consolas, monospace', label: '等宽' },
]

/* 导出 HTML 时内嵌的 .md 样式（让导出的文件脱离本网站也能正常渲染） */
const MD_CSS = `
.md{font-family:var(--pv-font,system-ui);font-size:var(--pv-size,16px);line-height:var(--pv-lh,1.8);color:var(--pv-color,#1f2937);word-wrap:break-word;max-width:760px;margin:0 auto}
.md h1,.md h2,.md h3{font-weight:800;line-height:1.4}
.md h1{font-size:1.85em;border-bottom:1px solid var(--pv-border,#e5e7eb);padding-bottom:.35em}
.md h2{font-size:1.45em;border-bottom:1px solid var(--pv-border,#e5e7eb);padding-bottom:.3em}
.md h3{font-size:1.22em}
.md p{margin:.8em 0}
.md a{color:var(--pv-accent,#6366f1)}
.md strong{font-weight:700}
.md blockquote{border-left:4px solid var(--pv-accent,#6366f1);background:var(--pv-bg,#f6f7fb);margin:1em 0;padding:.4em 1.1em;border-radius:0 10px 10px 0}
.md ul,.md ol{padding-left:1.6em}
.md li{margin:.3em 0}
.md code{background:#f3f4f6;border:1px solid #e5e7eb;border-radius:6px;padding:.12em .42em;font-size:.88em}
.md pre{background:#0f172a;color:#e2e8f0;border-radius:12px;padding:15px 17px;overflow-x:auto}
.md hr{border:none;height:3px;background:#f3f4f6;margin:1.8em 0}
`

function buildExportHtml(outer, bg) {
  return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>我的 Markdown 文章</title>
<style>body{margin:0;padding:36px 20px;background:${bg}}${MD_CSS}</style>
</head>
<body>${outer}</body>
</html>`
}

export default function StylePage() {
  const { done, markDone } = useLessonComplete('style')
  const [theme, setTheme] = useState('default')
  const [fontFamily, setFontFamily] = useState('')
  const [fontSize, setFontSize] = useState(16)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [textColor, setTextColor] = useState('#1f2937')
  const [accent, setAccent] = useState('#6366f1')
  const [tweaks, setTweaks] = useState(0) // 调节次数（≥2 即通过练习）
  const [copyState, setCopyState] = useState(null) // 'ok' | 'fail'
  const previewRef = useRef(null)

  const bump = () => setTweaks((t) => t + 1)

  const applyTheme = (key) => {
    const t = THEMES[key]
    setTheme(key)
    setFontFamily(t.fontFamily)
    setFontSize(t.fontSize)
    setLineHeight(t.lineHeight)
    setTextColor(t.color)
    setAccent(t.accent)
    bump()
  }

  const passed = tweaks >= 2
  useEffect(() => {
    if (passed) markDone()
  }, [passed, markDone])

  const copyHtml = async () => {
    const el = previewRef.current
    if (!el) return
    const html = buildExportHtml(el.outerHTML, THEMES[theme].bg)
    const ok = await copyText(html)
    setCopyState(ok ? 'ok' : 'fail')
    setTimeout(() => setCopyState(null), 2200)
  }

  const downloadHtml = () => {
    const el = previewRef.current
    if (!el) return
    const html = buildExportHtml(el.outerHTML, THEMES[theme].bg)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '我的文章.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  /* 预览区样式：CSS 变量 + 内联样式双保险 */
  const previewStyle = {
    '--pv-font': fontFamily,
    '--pv-size': `${fontSize}px`,
    '--pv-lh': lineHeight,
    '--pv-color': textColor,
    '--pv-accent': accent,
    '--pv-bg': THEMES[theme].bg,
    '--pv-border': THEMES[theme].border,
    '--md-font': fontFamily || undefined,
    background: THEMES[theme].bg,
    border: `1px solid ${THEMES[theme].border}`,
    borderRadius: 14,
    padding: '22px 26px',
    transition: 'all .25s ease',
  }

  return (
    <LessonPage
      id="style"
      module="m1"
      moduleName="模块一 · 初识与样式"
      time="40min"
      icon="🎨"
      title="样式自定义"
      subtitle="同样的 Markdown 内容，换一套样式就是另一种气质。动手调一调，导出带样式的 HTML。"
      goals={['理解 CSS 变量如何控制 Markdown 渲染样式', '会调整字体 / 字号 / 行距 / 颜色', '能导出带样式的 HTML 分享给任何人']}
    >
      <style>{`
.md-theme-preview .md{
  font-family: var(--pv-font, var(--font-sans)) !important;
  font-size: var(--pv-size, 15px) !important;
  line-height: var(--pv-lh, 1.75) !important;
  color: var(--pv-color, var(--text)) !important;
}
.md-theme-preview .md a{ color: var(--pv-accent, var(--accent)) !important; }
.md-theme-preview .md li::marker{ color: var(--pv-accent, var(--accent)) !important; }
.md-theme-preview .md blockquote{ border-left-color: var(--pv-accent, var(--accent)) !important; }
.md-theme-preview .md h1, .md-theme-preview .md h2{ border-bottom-color: var(--pv-border, var(--border)) !important; }
.md-theme-preview .md code{ color: var(--pv-accent, var(--accent)) !important; }
`}</style>

      <Section num={1} title="样式从哪来？">
        <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: '0 0 12px', lineHeight: 1.8 }}>
          Markdown 只负责<b>内容</b>，渲染成 HTML 后长什么样，由 <b>CSS</b> 决定。
          CSS 变量（<code>--xxx</code>）就像抽屉上的标签：改一处，所有用到它的地方一起变。
        </p>
        <CopyBlock
          code={`.md {
  --md-font: var(--font-sans);  /* 字体 */
  font-family: var(--md-font);
  font-size: 15px;             /* 字号 */
  line-height: 1.75;           /* 行距 */
  color: var(--text);          /* 文字颜色 */
}`}
          lang="css"
          label="样式变量示例"
        />
        <Callout type="info">
          <b>玩法：</b>下面你调节的每一项，都会实时作用到预览区 —— 这就是「主题」的本质：一组样式变量的集合。
        </Callout>
      </Section>

      <Section num={2} title="调一调，立刻变">
        <Exercise num={1} title="至少调节 2 个样式项（主题也算一次）" done={done} doneLabel="风格大师">
          <p style={{ marginTop: 0, fontSize: 13.5, color: 'var(--text-soft)' }}>
            已调节 <b style={{ color: 'var(--accent)' }}>{tweaks}</b> 个控件（≥2 即通过）。
            主题、字体、字号、行距、颜色都算哦。
          </p>

          {/* 主题预设 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {Object.entries(THEMES).map(([key, t]) => (
              <button key={key} className={`btn btn-sm ${theme === key ? 'btn-primary' : ''}`} onClick={() => applyTheme(key)}>
                {t.emoji} {t.name}
              </button>
            ))}
          </div>

          {/* 精细调节 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div className="card" style={{ padding: '14px 16px' }}>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>🔤 字体族</label>
              <select
                className="ex-input"
                value={fontFamily}
                onChange={(e) => {
                  setFontFamily(e.target.value)
                  bump()
                }}
              >
                {FONTS.map((f) => (
                  <option key={f.value || 'sys'} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="card" style={{ padding: '14px 16px' }}>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                🔠 字号：{fontSize}px
              </label>
              <input
                type="range"
                min={14}
                max={20}
                step={1}
                value={fontSize}
                style={{ width: '100%' }}
                onChange={(e) => {
                  setFontSize(Number(e.target.value))
                  bump()
                }}
              />
            </div>
            <div className="card" style={{ padding: '14px 16px' }}>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                ↕️ 行距：{lineHeight.toFixed(1)}
              </label>
              <input
                type="range"
                min={1.4}
                max={2.2}
                step={0.1}
                value={lineHeight}
                style={{ width: '100%' }}
                onChange={(e) => {
                  setLineHeight(Number(e.target.value))
                  bump()
                }}
              />
            </div>
            <div className="card" style={{ padding: '14px 16px', display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>🎨 文字颜色</label>
                <input
                  type="color"
                  value={textColor}
                  style={{ width: 44, height: 32, border: 'none', background: 'none', cursor: 'pointer' }}
                  onChange={(e) => {
                    setTextColor(e.target.value)
                    bump()
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>✨ 强调色（链接/列表）</label>
                <input
                  type="color"
                  value={accent}
                  style={{ width: 44, height: 32, border: 'none', background: 'none', cursor: 'pointer' }}
                  onChange={(e) => {
                    setAccent(e.target.value)
                    bump()
                  }}
                />
              </div>
            </div>
          </div>

          {/* 实时预览 */}
          <div ref={previewRef} className="md-theme-preview" style={previewStyle}>
            <MarkdownPreview source={SAMPLE} />
          </div>

          {/* 导出带样式的 HTML */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 14 }}>
            <button className="btn btn-primary" onClick={copyHtml}>
              {copyState === 'ok' ? '✅ 已复制 HTML' : copyState === 'fail' ? '❌ 复制失败' : '📋 复制 HTML'}
            </button>
            <button className="btn" onClick={downloadHtml}>⬇️ 下载 .html 文件</button>
            <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
              复制 / 下载的内容包含样式，粘贴到任意 HTML 文件就能独立打开。
            </span>
          </div>

          {done && (
            <Callout type="tip">
              <b>🎉 风格大师！</b>你已经会调 Markdown 的样式了。这也完成了模块一「初识与样式」，
              下一课「语法卡片矩阵」将进入模块二「核心语法精讲」！
            </Callout>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
