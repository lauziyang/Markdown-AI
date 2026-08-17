import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'
import { MarkdownPreview } from '../../../lib/md.jsx'
import { copyText } from '../../../lib/utils.js'

/* ============================================================
   语言选项
   ============================================================ */

const LANGS = [
  { label: 'JavaScript', fence: 'javascript', hl: 'javascript' },
  { label: 'Python', fence: 'python', hl: 'python' },
  { label: 'HTML', fence: 'html', hl: 'html' },
  { label: 'CSS', fence: 'css', hl: 'css' },
  { label: 'Go', fence: 'go', hl: 'go' },
  { label: 'JSON', fence: 'json', hl: 'json' },
  { label: 'SQL', fence: 'sql', hl: 'sql' },
]

const SAMPLES = {
  JavaScript: `// 计算斐波那契数列
function fib(n) {
  if (n <= 1) return n
  return fib(n - 1) + fib(n - 2)
}

for (let i = 0; i < 10; i++) {
  console.log('fib(' + i + ') =', fib(i))
}`,
  Python: `# 打印 1 到 10
for i in range(1, 11):
    print(i)`,
  HTML: `<h1>你好，Markdown</h1>
<p>这是 HTML 示例</p>`,
  CSS: `h1 {
  color: #6366f1;
  font-size: 24px;
}`,
  Go: `package main

import "fmt"

func main() {
  fmt.Println("你好，Go")
}`,
  JSON: `{
  "name": "张三",
  "age": 25,
  "tags": ["markdown", "code"]
}`,
  SQL: `-- 查询成年用户
SELECT name, age
FROM users
WHERE age > 18
ORDER BY age DESC;`,
}

const SAMPLE_CODE = SAMPLES.JavaScript

/* ============================================================
   代码块高亮实验室
   ============================================================ */

function CodeLab({ onPass }) {
  const [langIdx, setLangIdx] = useState(0)
  const [code, setCode] = useState('')
  const [showLines, setShowLines] = useState(true)
  const [hljs, setHljs] = useState(null)
  const [copied, setCopied] = useState(false)

  // 动态引入 highlight.js（完整版自带所有语言）
  useEffect(() => {
    let alive = true
    import('highlight.js')
      .then((m) => {
        if (alive) setHljs(m.default)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const lang = LANGS[langIdx]
  const mdSrc = '```' + lang.fence + '\n' + code + '\n```'

  const highlighted = (() => {
    if (!hljs || !code.trim()) return null
    try {
      return hljs.highlight(code, { language: lang.hl, ignoreIllegals: true }).value
    } catch {
      return hljs.highlightAuto(code).value
    }
  })()

  const copy = async () => {
    await copyText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const lineCount = code.split('\n').filter((l) => l.trim() !== '').length
  const passed = code.trim() !== '' && lineCount >= 3

  useEffect(() => {
    if (passed) onPass()
  }, [passed, onPass])

  const numbers = code.split('\n')

  return (
    <div>
      {/* 语言 + 行号开关 */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <label style={{ fontSize: 13, color: 'var(--text-soft)' }}>
          选择语言
          <br />
          <select
            value={langIdx}
            onChange={(e) => setLangIdx(Number(e.target.value))}
            style={{
              marginTop: 4, padding: '7px 10px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13.5,
            }}
          >
            {LANGS.map((l, i) => (
              <option key={l.label} value={i}>{l.label}</option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 13, color: 'var(--text-soft)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={showLines} onChange={(e) => setShowLines(e.target.checked)} />
          显示行号
        </label>
        <button className="btn btn-sm" onClick={() => setCode(SAMPLES[lang.label] || SAMPLE_CODE)}>🎁 填入示例代码</button>
        {passed && <span className="chip chip-ok">✅ 已达到通关条件</span>}
      </div>

      {/* 代码输入 */}
      <textarea
        className="ex-input"
        rows={9}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={'在这里输入代码，例如：\nfunction hello() {\n  console.log("你好，Markdown")\n}'}
        style={{ fontSize: 13.5, lineHeight: 1.65 }}
      />

      {/* 高亮预览（带行号，自己用 highlight.js 渲染） */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
          ✨ 高亮预览{showLines ? '（带行号）' : ''}
        </div>
        <div className="code-block" style={{ margin: 0 }}>
          <div className="cb-head">
            <span>{lang.label} · 高亮预览</span>
            <button className="cb-copy" onClick={copy} disabled={!code.trim()}>
              {copied ? '✓ 已复制' : '📋 复制代码'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
            {showLines && (
              <div
                aria-hidden="true"
                style={{
                  userSelect: 'none', textAlign: 'right', flexShrink: 0,
                  padding: '14px 12px 14px 16px', color: 'var(--text-faint)',
                  fontSize: 13.5, lineHeight: 1.65, fontFamily: 'var(--font-mono)',
                  borderRight: '1px solid var(--border)', background: 'var(--code-bg)',
                }}
              >
                {numbers.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
            )}
            <pre
              style={{
                flex: 1, margin: 0, minWidth: 0, overflowX: 'auto',
                padding: '14px 17px', background: 'var(--code-bg)', color: 'var(--code-text)',
                fontSize: 13.5, lineHeight: 1.65, fontFamily: 'var(--font-mono)',
              }}
            >
              {highlighted ? (
                <code dangerouslySetInnerHTML={{ __html: highlighted }} />
              ) : (
                <code style={{ color: 'var(--text-faint)' }}>
                  {code ? '（highlight.js 加载中…）' : '// 在上方输入代码，这里立刻出现高亮效果'}
                </code>
              )}
            </pre>
          </div>
        </div>
      </div>

      {/* Markdown 渲染的真实效果 */}
      <div className="card" style={{ padding: '16px 18px', marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
          👀 真实渲染效果（由 Markdown 渲染器生成，与上方高亮预览是同一份代码）
        </div>
        {code.trim() ? (
          <MarkdownPreview source={mdSrc} />
        ) : (
          <p style={{ color: 'var(--text-faint)', fontSize: 13, margin: 0 }}>输入代码后，这里会按 Markdown 代码块的方式渲染出来。</p>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   页面
   ============================================================ */

export default function Code() {
  const { done, markDone } = useLessonComplete('code')
  const [freeSrc, setFreeSrc] = useState('')

  return (
    <LessonPage
      id="code"
      module="m3"
      moduleName="模块三 · 进阶语法精讲"
      time="60min"
      icon="💻"
      title="代码块高亮实验室"
      subtitle="写技术文档离不开代码。这一课搞懂行内代码和代码块的差别，再亲手把代码「点亮」成五颜六色的高亮效果。"
      goals={['分清行内代码 `code` 和代码块的区别', '学会用三个反引号 + 语言标注写出高亮代码块', '亲手提交一段 3 行以上的代码并通关']}
    >
      <Section num={1} title="行内代码 vs 代码块">
        <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.8 }}>
          想在句子里提到变量名、文件名，用<b>行内代码</b>：<code>`code`</code>（一对反引号包住，不换行）。
          想放一大段程序，用<b>代码块</b>：三对反引号包住，保留换行和缩进，还能高亮。两边对比看看：
        </p>
        <div className="grid-2">
          <div className="demo-frame">
            <b>行内代码 <code>`code`</code></b>
            <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: '8px 0' }}>
              适合在句子里提到变量或文件名，灰底小字，不换行。
            </p>
            <MarkdownPreview source={'这句话里有一个 `const x = 1`，它不会换行。'} />
          </div>
          <div className="demo-frame">
            <b>代码块 <code>```code```</code></b>
            <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: '8px 0' }}>
              适合放多行代码，保留缩进和换行，还能按语言上色。
            </p>
            <MarkdownPreview source={'```javascript\nconst x = 1\nconsole.log(x)\n```'} />
          </div>
        </div>
        <Callout type="info">
          <b>一句话记住：</b>反引号数量 = 代码块大小。一个反引号是「句子里的小标签」，三个反引号是「一整块代码区」。
        </Callout>
      </Section>

      <Section num={2} title="🎯 练习：点亮你的第一段代码">
        <Exercise num={1} title="输入至少 3 行代码（任选一种语言，试试 SQL！）" done={done} doneLabel="代码高亮师">
          <CodeLab onPass={markDone} />
          {done && (
            <Callout type="tip" title="通关">
              <b>漂亮！</b>你已亲手点亮了一段代码。下一课《任务列表》已经解锁，去给文档加个待办清单吧～
            </Callout>
          )}
        </Exercise>
      </Section>

      <Section num={3} title="✏️ 自主练习区">
        <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 10px' }}>
          这里是自由练习场——想练哪种语言、想写什么都行，<b>不会被判定对错</b>。
          试试在左侧写一段 SQL、Python 或 JavaScript，右侧实时预览高亮效果。
        </p>
        <MdEditor
          value={freeSrc}
          onChange={setFreeSrc}
          height={260}
          initialMode="split"
          placeholder={'```sql\nSELECT name, age\nFROM users\nWHERE age > 18;\n```'}
          hint="提示：三个反引号后面写上语言名（sql / javascript / python…），代码就会自动上色"
        />
      </Section>

      <Section num={4} title="下一步">
        {done ? (
          <Callout type="tip" title="获得徽章">
            你已完成「代码块高亮实验室」，模块三进度 +1！继续完成其余课程，集齐模块三就能点亮「<b>进阶语法大师</b>」徽章。
          </Callout>
        ) : (
          <p style={{ color: 'var(--text-faint)' }}>完成上面的练习后，这里会出现通关彩蛋 🎉</p>
        )}
      </Section>
    </LessonPage>
  )
}
