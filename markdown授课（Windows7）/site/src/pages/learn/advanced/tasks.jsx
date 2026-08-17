import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, CopyBlock, useLessonComplete } from '../../../components/ui.jsx'
import { MarkdownPreview } from '../../../lib/md.jsx'
import MdEditor from '../../../components/MdEditor.jsx'

/* ============================================================
   可点击勾选的任务列表演示
   ============================================================ */

const INIT_TODOS = [
  { text: '学会写 Markdown 表格', done: true },
  { text: '把代码块高亮玩明白', done: false },
  { text: '给今天的笔记加个任务清单', done: false },
  { text: '挑战模块三小测验', done: false },
]

function TodoDemo() {
  const [items, setItems] = useState(INIT_TODOS)
  const [lastToggled, setLastToggled] = useState(-1)

  const toggle = (i) => {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, done: !it.done } : it)))
    setLastToggled(i)
  }

  const doneCount = items.filter((it) => it.done).length
  const total = items.length
  const pct = Math.round((doneCount / total) * 100)
  const src = items.map((it) => `- [${it.done ? 'x' : ' '}] ${it.text}`).join('\n')

  return (
    <div>
      <div className="grid-2">
        <div className="demo-frame">
          <b>☑️ 点击勾选试试</b>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((it, i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                className="btn btn-sm"
                style={{
                  justifyContent: 'flex-start', textAlign: 'left', background: 'var(--card)',
                  ...(it.done ? { color: 'var(--text-faint)', textDecoration: 'line-through' } : {}),
                }}
              >
                <span style={{ fontSize: 16, marginRight: 8 }}>{it.done ? '✅' : '⬜'}</span>
                {it.text}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-soft)', marginBottom: 6 }}>
              <span>完成进度</span>
              <span>{doneCount}/{total} · {pct}%</span>
            </div>
            <div className={`progress-track ${pct === 100 ? 'ok' : ''}`}>
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <div className="demo-frame">
          <b>📝 勾选后源码变成什么？</b>
          <p style={{ fontSize: 12.5, color: 'var(--text-soft)', margin: '6px 0 10px' }}>
            每次点击，下面源码里对应的 <code>[ ]</code> 和 <code>[x]</code> 就会互换（高亮的是刚点的那一行）。
          </p>
          <pre
            style={{
              background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10,
              padding: '12px 14px', fontSize: 13.5, lineHeight: 1.8, fontFamily: 'var(--font-mono)', margin: 0,
            }}
          >
            {src.split('\n').map((line, i) => (
              <div
                key={i}
                style={i === lastToggled ? { background: 'var(--accent-soft)', borderRadius: 4, padding: '0 4px' } : undefined}
              >
                {line}
              </div>
            ))}
          </pre>
        </div>
      </div>

      {/* 渲染效果对比 */}
      <div className="card" style={{ padding: '16px 18px', marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>👀 渲染效果（这里的勾选框不可点击，仅供对比）</div>
        <MarkdownPreview source={src} />
      </div>
    </div>
  )
}

/* ============================================================
   练习：用户自己写任务列表
   ============================================================ */

function TaskExercise({ onPass }) {
  const [src, setSrc] = useState('')
  const taskCount = (src.match(/^\s*[-*+]\s+\[[ xX]\]/gm) || []).length
  const passed = taskCount >= 2

  useEffect(() => {
    if (passed) onPass()
  }, [passed, onPass])

  return (
    <MdEditor
      value={src}
      onChange={setSrc}
      height={240}
      initialMode="split"
      hint={
        passed
          ? '🎉 检测到至少 2 个任务项，通关！'
          : '试试写：- [ ] 背 20 个单词，- [x] 已写完今天的笔记'
      }
    />
  )
}

/* ============================================================
   页面
   ============================================================ */

const TASK_EXAMPLE = `- [x] 写完第二章
- [ ] 复习第一章
- [ ] 做练习题`

export default function Tasks() {
  const { done, markDone } = useLessonComplete('tasks')

  return (
    <LessonPage
      id="tasks"
      module="m3"
      moduleName="模块三 · 进阶语法精讲"
      time="60min"
      icon="☑️"
      title="任务列表"
      subtitle="在列表项前面加一个带勾的方框，Markdown 就变成了一张可以打勾的待办清单。这一课让清单动起来。"
      goals={['看懂任务列表语法 - [ ] 和 - [x]', '体验点击勾选、源码实时变化', '亲手写出自己的任务清单并通关']}
    >
      <Section num={1} title="任务列表长什么样">
        <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.8 }}>
          任务列表就是「列表 + 方框」：在 <code>-</code> 后面写 <code>[ ]</code>（方括号里一个空格）表示未完成，
          写 <code>[x]</code>（小写字母 x）表示已完成。渲染后就是一个可以打勾的清单。
        </p>
        <CopyBlock code={TASK_EXAMPLE} lang="markdown" label="任务列表源码" />
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>渲染效果：</div>
          <MarkdownPreview source={TASK_EXAMPLE} />
        </div>
        <Callout type="info">
          <b>细节别忘：</b><code>-</code> 后面要有空格，<code>[ ]</code> 里是<b>一个空格</b>，
          <code>[x]</code> 里的 x 可以大写可以小写。
        </Callout>
      </Section>

      <Section num={2} title="☑️ 点击勾选，源码实时变">
        <TodoDemo />
      </Section>

      <Section num={3} title="🎯 练习：写出你自己的任务清单">
        <Exercise num={1} title="写出至少 2 个任务项" done={done} doneLabel="清单达人">
          <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 10px' }}>
            至少写 2 个任务项（<code>- [ ]</code> 或 <code>- [x]</code> 都算），
            比如「- [ ] 背 20 个单词」「- [x] 已写完今天的笔记」。
          </p>
          <TaskExercise onPass={markDone} />
          {done && (
            <Callout type="tip" title="通关">
              <b>太棒了！</b>你已经有自己的任务清单了。下一课《转义字符游戏》已经解锁，去和特殊符号斗智斗勇吧～
            </Callout>
          )}
        </Exercise>
      </Section>

      <Section num={4} title="下一步">
        {done ? (
          <Callout type="tip" title="获得徽章">
            你已完成「任务列表」，模块三进度 +1！继续完成其余课程，集齐模块三就能点亮「<b>进阶语法大师</b>」徽章。
          </Callout>
        ) : (
          <p style={{ color: 'var(--text-faint)' }}>完成上面的练习后，这里会出现通关彩蛋 🎉</p>
        )}
      </Section>
    </LessonPage>
  )
}
