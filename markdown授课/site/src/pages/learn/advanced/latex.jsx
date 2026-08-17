import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import { MarkdownPreview } from '../../../lib/md.jsx'
import { copyText } from '../../../lib/utils.js'

/* ============================================================
   常用公式模板：点击插入到输入区
   ============================================================ */

const TEMPLATES = [
  { name: '分数', icon: '½', code: '\\frac{a}{b}' },
  { name: '根号', icon: '√', code: '\\sqrt{x}' },
  { name: '积分', icon: '∫', code: '\\int_a^b f(x)\\,dx' },
  { name: '矩阵', icon: '▦', code: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { name: '方程组', icon: '⛓', code: '\\begin{cases} x + y = 1 \\\\ x - y = 3 \\end{cases}' },
  { name: '希腊字母', icon: 'α', code: '\\alpha \\beta \\gamma' },
]

/* 常用符号速查表（点击一行可复制示例） */
const SYMBOLS = [
  { sym: '^', name: '上标', demo: 'x^2' },
  { sym: '_', name: '下标', demo: 'a_i' },
  { sym: '\\frac', name: '分数', demo: '\\frac{1}{2}' },
  { sym: '\\sqrt', name: '根号', demo: '\\sqrt{2}' },
  { sym: '\\sum', name: '求和', demo: '\\sum_{i=1}^{n} i' },
  { sym: '\\int', name: '积分', demo: '\\int_0^1 x\\,dx' },
  { sym: '\\times', name: '乘号', demo: 'a \\times b' },
  { sym: '\\cdot', name: '点乘', demo: 'a \\cdot b' },
  { sym: '\\leq', name: '小于等于', demo: 'x \\leq 5' },
  { sym: '\\geq', name: '大于等于', demo: 'x \\geq 1' },
  { sym: '\\infty', name: '无穷大', demo: '\\infty' },
  { sym: '\\pi', name: '圆周率', demo: '\\pi' },
]

export default function Latex() {
  const { done, markDone } = useLessonComplete('latex')
  const [formula, setFormula] = useState('\\frac{a}{b}')
  const [copied, setCopied] = useState(false)
  const [copiedSym, setCopiedSym] = useState('')

  // 用 $$...$$ 包起来，MarkdownPreview 会渲染成块级公式
  const md = '$$' + formula + '$$'

  const insert = (code) => setFormula((f) => (f.trim() ? f.trimEnd() + ' ' + code : code))

  const copyFormula = async () => {
    await copyText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const copySym = async (s) => {
    await copyText(s.demo)
    setCopiedSym(s.name)
    setTimeout(() => setCopiedSym(''), 1200)
  }

  /* 练习：写一个含分数或根号的公式 */
  const [exSrc, setExSrc] = useState('')
  const exPassed = /\\frac|\\sqrt/.test(exSrc)
  useEffect(() => {
    if (exPassed) markDone()
  }, [exPassed, markDone])

  return (
    <LessonPage
      id="latex"
      module="m4"
      moduleName="模块四 · 高级应用"
      time="60min"
      icon="➗"
      title="LaTeX 公式编辑器"
      subtitle="用 LaTeX 语法在 Markdown 里写出漂亮的数学公式：分数、根号、积分、矩阵，所见即所得。"
      goals={['会用 LaTeX 写分数、根号、积分等常见公式', '能插入矩阵、方程组等复杂结构', '看懂常用数学符号的写法']}
    >
      <Section num={1} title="公式工坊：点模板，改一改">
        <Callout type="info">
          数学公式用 <code>$...$</code>（行内）或 <code>$$...$$</code>（独立一行）包起来，
          例如 <code>$$E = mc^2$$</code>。下面先点几个<b>模板按钮</b>，代码会自动插进输入框，改一改就能看到效果。
        </Callout>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
          {TEMPLATES.map((t) => (
            <button key={t.name} className="btn btn-sm" onClick={() => insert(t.code)}>
              {t.icon} {t.name}
            </button>
          ))}
        </div>

        <textarea
          className="ex-input"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 14, minHeight: 110 }}
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          spellCheck={false}
          placeholder={'例如：\\frac{a}{b} + \\sqrt{x^2 + y^2}'}
        />

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '10px 0 14px', flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-primary" onClick={copyFormula}>
            {copied ? '✓ 已复制' : '📋 复制公式源码'}
          </button>
          <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
            复制的内容是 <code>$$...$$</code> 完整源码，可直接粘进任何 Markdown 文档
          </span>
        </div>

        <div className="grid-2">
          <div className="demo-frame">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--text-soft)' }}>🧪 渲染效果</div>
            {formula.trim() ? (
              <MarkdownPreview source={md} />
            ) : (
              <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>在这里输入公式，左侧会实时渲染…</div>
            )}
          </div>
          <div className="demo-frame">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--text-soft)' }}>📄 对应的源码</div>
            <pre
              style={{
                background: 'var(--code-bg)', color: 'var(--code-text)',
                borderRadius: 10, padding: '12px 14px', fontSize: 13.5,
                fontFamily: 'var(--font-mono)', margin: 0, minHeight: 120, whiteSpace: 'pre-wrap',
              }}
            >
              {formula.trim() ? md : '（空）'}
            </pre>
          </div>
        </div>
      </Section>

      <Section num={2} title="常用符号速查表">
        <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 10px' }}>
          下面这些符号天天都要用，<b>点击任意一行</b>即可复制它的写法示例，再粘回上面的输入框试试。
        </p>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: 'var(--bg-soft)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>符号</th>
                <th style={{ padding: '10px 14px' }}>作用</th>
                <th style={{ padding: '10px 14px' }}>写法示例</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {SYMBOLS.map((s) => (
                <tr
                  key={s.sym}
                  onClick={() => copySym(s)}
                  style={{ cursor: 'pointer', borderTop: '1px solid var(--border)' }}
                >
                  <td style={{ padding: '8px 14px', fontFamily: 'var(--font-mono)' }}>{s.sym}</td>
                  <td style={{ padding: '8px 14px' }}>{s.name}</td>
                  <td style={{ padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{s.demo}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: 'var(--text-faint)', fontSize: 12 }}>
                    {copiedSym === s.name ? '✓ 已复制' : '点击复制'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout type="tip" title="小口诀">
          <code>^</code> 上标、<code>_</code> 下标、<code>\frac</code> 分数、<code>\sqrt</code> 根号、
          <code>\sum</code> 求和、<code>\int</code> 积分——记住这 6 个，日常公式基本够用。
        </Callout>
      </Section>

      <Section num={3} title="动手练习：写一个公式">
        <Exercise num={1} title="写一个包含分数或根号的公式" done={done} doneLabel="公式写对了！">
          <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 10px' }}>
            在下方输入一个包含 <code>\frac</code>（分数）或 <code>\sqrt</code>（根号）的公式，
            例如 <code>{'\\frac{1}{2}'}</code> 或 <code>{'\\sqrt{x^2 + y^2}'}</code>。写对会自动检测并通关。
          </p>
          <textarea
            className="ex-input"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 14, minHeight: 90 }}
            value={exSrc}
            onChange={(e) => setExSrc(e.target.value)}
            spellCheck={false}
            placeholder={'例如：\\frac{1}{2} + \\sqrt{x}'}
          />
          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`chip ${exPassed ? 'chip-ok' : ''}`}>
              {exPassed ? '✅ 检测通过：包含分数或根号' : '⏳ 还没检测到 \\frac 或 \\sqrt'}
            </span>
          </div>
          {exSrc.trim() && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--text-soft)' }}>你的公式渲染效果：</div>
              <MarkdownPreview source={'$$' + exSrc + '$$'} />
            </div>
          )}
          {done && (
            <div style={{ marginTop: 12 }}>
              <Callout type="tip">
                <b>🎉 通关成功！</b>你已经会写数学公式了。下一课《HTML 混写》已解锁——看看怎么在 Markdown 里塞进 HTML 吧！
              </Callout>
            </div>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
