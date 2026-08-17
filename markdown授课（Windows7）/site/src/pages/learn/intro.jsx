import React, { useEffect, useRef, useState } from 'react'
import { LessonPage, Section, Callout, useLessonComplete } from '../../components/ui.jsx'
import MdEditor from '../../components/MdEditor.jsx'
import { MarkdownPreview } from '../../lib/md.jsx'

const WORDS = 'Markdown 是一种轻量级标记语言，用纯文本就能排版。'

/* 交互：同一份文档，两种写法 */
const WORD_STEPS = [
  { icon: 'B', tip: '加粗' },
  { icon: 'I', tip: '斜体' },
  { icon: 'U', tip: '下划线' },
  { icon: 'A+', tip: '加大字号' },
  { icon: '≡', tip: '居中' },
  { icon: '🅰', tip: '调颜色' },
  { icon: '🖌', tip: '格式刷' },
  { icon: '💾', tip: '保存' },
]

const MD_SOURCE = `# 郊游计划

今天天气不错，我们一起去**郊游**。`

function CompareDemo() {
  const [wordSteps, setWordSteps] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [typed, setTyped] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => () => clearInterval(timerRef.current), [])

  const play = () => {
    if (playing) return
    setPlaying(true)
    setWordSteps(0)
    setTyped(0)
    // Word 模拟：工具栏按钮一个接一个被"点击"
    const wordTimer = setInterval(() => {
      setWordSteps((s) => {
        if (s >= WORD_STEPS.length) {
          clearInterval(wordTimer)
          return s
        }
        return s + 1
      })
    }, 480)
    // Markdown 模拟：打字机效果
    let i = 0
    timerRef.current = setInterval(() => {
      i += 1
      if (i >= MD_SOURCE.length + 6) {
        clearInterval(timerRef.current)
        setTyped(MD_SOURCE.length + 6)
        setPlaying(false)
      } else {
        setTyped(i)
      }
    }, 90)
  }

  const fullTyped = typed >= MD_SOURCE.length + 6
  const allDone = wordSteps >= WORD_STEPS.length && fullTyped
  const curTool = playing && wordSteps < WORD_STEPS.length ? wordSteps : -1
  const typedMd = MD_SOURCE.slice(0, Math.max(0, typed - 6))

  /* Word 文档样式：随着步骤逐步变化 */
  const docStyle = {
    fontWeight: wordSteps >= 1 ? 700 : 400,
    fontStyle: wordSteps >= 2 ? 'italic' : 'normal',
    textDecoration: wordSteps >= 3 ? 'underline' : 'none',
    fontSize: wordSteps >= 4 ? 19 : 15,
    textAlign: wordSteps >= 5 ? 'center' : 'left',
    color: wordSteps >= 6 ? '#e11d48' : 'var(--text)',
  }
  const brushApplied = wordSteps >= 7

  return (
    <div>
      <div className="grid-2" style={{ alignItems: 'stretch' }}>
        {/* ---------- 左侧：Word 模拟窗口 ---------- */}
        <div className="demo-frame" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          {/* 窗口标题栏 */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              background: 'var(--card-2)', borderBottom: '1px solid var(--border)',
              borderTopLeftRadius: 'var(--radius)', borderTopRightRadius: 'var(--radius)',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
            <b style={{ fontSize: 13, marginLeft: 8 }}>📝 文档1 - Word</b>
          </div>

          {/* 工具栏（Word 的"格式"按钮） */}
          <div style={{ display: 'flex', gap: 6, padding: '10px 12px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
            {WORD_STEPS.map((t, i) => {
              const done = i < wordSteps
              const cur = i === curTool
              return (
                <span
                  key={t.tip}
                  title={t.tip}
                  style={{
                    width: 30, height: 30, display: 'grid', placeItems: 'center',
                    borderRadius: 7, fontSize: 13, fontWeight: 800, cursor: 'default',
                    fontFamily: 'var(--font-serif, Georgia, serif)',
                    background: done ? 'var(--accent-soft)' : cur ? 'var(--accent)' : 'var(--bg-soft)',
                    color: done ? 'var(--accent)' : cur ? '#fff' : 'var(--text-faint)',
                    border: `1px solid ${done ? 'transparent' : cur ? 'transparent' : 'var(--border)'}`,
                    transform: cur ? 'scale(1.12)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {done ? '✓' : t.icon}
                </span>
              )
            })}
          </div>

          {/* 文档正文：操作一步一步作用在上面 */}
          <div style={{ padding: '14px 16px', flex: 1 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginBottom: 8 }}>
              已操作 <b style={{ color: 'var(--accent)' }}>{Math.min(wordSteps, WORD_STEPS.length)}/{WORD_STEPS.length}</b> 步
              {playing && ' · 正在点按钮…'}
            </div>
            <div
              style={{
                border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px',
                background: 'var(--card-2)', minHeight: 128, transition: 'all 0.25s ease',
              }}
            >
              <b style={{ display: 'block', fontSize: 17, marginBottom: 8, ...(wordSteps >= 1 ? {} : {}) }}>
                郊游计划
              </b>
              <span style={docStyle}>
                {brushApplied ? (
                  <>今天天气不错，我们一起去<b style={{ color: '#e11d48', fontWeight: 700 }}>郊游</b>。</>
                ) : (
                  '今天天气不错，我们一起去郊游。'
                )}
              </span>
              {wordSteps >= 8 && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ok)' }}>💾 已保存：文档1.docx</div>
              )}
            </div>
          </div>
        </div>

        {/* ---------- 右侧：Markdown 编辑器 + 实时预览 ---------- */}
        <div className="demo-frame" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              background: 'var(--card-2)', borderBottom: '1px solid var(--border)',
              borderTopLeftRadius: 'var(--radius)', borderTopRightRadius: 'var(--radius)',
            }}
          >
            <span style={{ fontSize: 15 }}>✨</span>
            <b style={{ fontSize: 13 }}>Markdown 编辑器</b>
            <span className="chip" style={{ marginLeft: 'auto', fontSize: 11 }}>打字即排版</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', flex: 1 }}>
            {/* 源码区（打字机效果） */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 5 }}>⌨️ 正在输入的源码</div>
              <pre
                className="typing-caret"
                style={{
                  background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10,
                  padding: '10px 13px', fontSize: 13, lineHeight: 1.7, margin: 0,
                  fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  minHeight: 108, overflow: 'hidden',
                }}
              >
                {typedMd || '⏳ 等一下，开始打字…'}
              </pre>
            </div>
            {/* 实时预览区 */}
            <div style={{ flex: 1, minHeight: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 5 }}>👁️ 实时预览（渲染效果）</div>
              <div
                style={{
                  border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px',
                  background: 'var(--card-2)', maxHeight: 220, overflow: 'auto',
                }}
              >
                {typedMd.trim() ? (
                  <MarkdownPreview source={typedMd} />
                ) : (
                  <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>输入的内容会在这里实时渲染…</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 控制条 */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14, alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={play} disabled={playing}>
          {playing ? '⏳ 演示中…' : '▶️ 点击体验：两种方式写同一段文字'}
        </button>
        {wordSteps >= WORD_STEPS.length && (
          <span className="chip chip-accent">
            🏆 结论：Word 点了 {WORD_STEPS.length} 次按钮，Markdown 只需打一行字
          </span>
        )}
        {allDone && <span className="chip chip-ok">⚡ 一次成型，无需任何点击</span>}
      </div>
    </div>
  )
}

/* 一分钟上手 */
function MinuteDemo({ onPass }) {
  const [src, setSrc] = useState('')
  const hasHeading = /^#\s+\S+/m.test(src)
  const passed = hasHeading

  useEffect(() => {
    if (passed) onPass()
  }, [passed, onPass])

  return (
    <MdEditor
      value={src}
      onChange={setSrc}
      height={240}
      initialMode="split"
      hint={hasHeading ? '🎉 太棒了！你已经写出了第一个 Markdown 标题。' : '试试输入 # 然后空格，打「我的第一篇Markdown」'}
    />
  )
}

export default function Intro() {
  const { done, markDone } = useLessonComplete('intro')

  return (
    <LessonPage
      id="intro"
      module="m1"
      moduleName="模块一 · 初识 Markdown"
      time="50min"
      icon="📘"
      title="Markdown 是什么？"
      subtitle="先别急着学语法——搞清楚它是什么、为什么值得学，再用 1 分钟写出你的第一篇文档。"
      goals={['理解 Markdown 与 Word 的本质区别', '写出人生中第一个 Markdown 标题', '获得第一个成就 ✨']}
    >
      <Section num={1} title="同一份文档，两种写作方式">
        <CompareDemo />
      </Section>

      <Section num={2} title="一分钟上手（第一个互动）">
        <Callout type="info">
          <b>试试看：</b>在下方编辑器里输入 <code># 我的第一篇Markdown</code>，右侧会<b>实时预览</b>渲染效果。
          完成即获得第一个成就 ✨
        </Callout>
        <MinuteDemo onPass={markDone} />
        {done && (
          <Callout type="tip">
            <b>✨ 第一个成就已达成！</b>恭喜你完成了第一课，下一课「环境搭建」已经解锁。
          </Callout>
        )}
      </Section>

      <Section num={3} title="为什么用 Markdown？">
        <div className="grid-3">
          {[
            { icon: '⌨️', t: '纯文本写作', d: '任何编辑器都能写，不担心格式错乱、版本冲突' },
            { icon: '📦', t: '一次成型', d: '语法即排版，写完就是成品' },
            { icon: '🔄', t: '版本友好', d: 'Git 里 diff 清晰，团队协作零摩擦' },
            { icon: '🌍', t: '生态庞大', d: '博客、文档、笔记、PPT、图表全面支持' },
          ].map((c) => (
            <div className="card" key={c.t} style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 24 }}>{c.icon}</div>
              <b style={{ display: 'block', margin: '6px 0 4px' }}>{c.t}</b>
              <span style={{ fontSize: 13, color: 'var(--text-soft)' }}>{c.d}</span>
            </div>
          ))}
        </div>
      </Section>
    </LessonPage>
  )
}
