import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'

/* 标题层级动画演示 */
function HeadingDemo() {
  const [level, setLevel] = useState(1)
  const [auto, setAuto] = useState(false)

  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => {
      setLevel((l) => {
        if (l >= 6) {
          setAuto(false)
          return l
        }
        return l + 1
      })
    }, 900)
    return () => clearInterval(t)
  }, [auto])

  const code = `${'#'.repeat(level)} 这是${['一', '二', '三', '四', '五', '六'][level - 1]}级标题`

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            className={`btn btn-sm ${level === n ? 'btn-primary' : ''}`}
            onClick={() => { setLevel(n); setAuto(false) }}
          >
            {n} 个 #
          </button>
        ))}
        <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { setAuto(true); setLevel(1) }}>
          ▶️ 自动演示
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-soft)', marginBottom: 6 }}>源码：</div>
          <pre style={{ background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10, padding: '12px 14px', fontSize: 15, margin: 0 }}>{code}</pre>
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-soft)', marginBottom: 6 }}>渲染效果：</div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', background: 'var(--card-2)' }}>
            {React.createElement(`h${level}`, { style: { margin: 0, color: 'var(--accent)' } }, `这是${['一', '二', '三', '四', '五', '六'][level - 1]}级标题`)}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-faint)' }}>
        💡 规律：<code>#</code> 的数量 = 标题层级，<code>#</code> 与文字之间<b>必须有一个空格</b>。
      </div>
    </div>
  )
}

export default function Headings() {
  const { done, markDone } = useLessonComplete('headings')
  const [src, setSrc] = useState('')
  const [fixed, setFixed] = useState(false)
  const hasWrong = /^#\S/.test(src)
  const hasRight = /^###\s+\S+/m.test(src)
  const passed = hasRight

  useEffect(() => {
    if (passed) markDone()
  }, [passed, markDone])

  return (
    <LessonPage
      id="headings"
      module="m2"
      moduleName="模块二 · 核心语法精讲"
      time="60min"
      icon="#"
      title="标题专题"
      subtitle="# 的数量决定标题层级——这是 Markdown 最常用也最容易出错的语法。"
      goals={['理解 # 数量与层级的对应关系', '记住 # 后必须有空格', '写出任意层级的标题']}
    >
      <Section num={1} title="动画演示：# 数量对应层级">
        <HeadingDemo />
      </Section>

      <Section num={2} title="常见错误：缺少空格">
        <Callout type="warn" title="看看这个错误">
          输入 <code>#标题</code>（# 后没空格）时，很多编辑器不会把它识别为标题。
        </Callout>
        <div className="card" style={{ padding: '14px 18px', marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="match-pill">❌ #标题</span>
            <span style={{ color: 'var(--text-faint)' }}>→</span>
            <span className="match-pill" style={{ borderColor: 'var(--ok)', background: 'var(--ok-soft)' }}>✅ # 标题</span>
            <button
              className="btn btn-sm btn-primary"
              style={{ marginLeft: 'auto' }}
              onClick={() => { setFixed(true); setSrc('# 我的第一篇Markdown\n\n' + src.replace(/^#\S.*$/m, '')) }}
            >
              ✨ 自动修正
            </button>
          </div>
          {fixed && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ok)' }}>✅ 已自动加上空格，标题正常渲染了！</div>}
        </div>
      </Section>

      <Section num={3} title="动手练习">
        <Exercise num={1} title="写出正确层级的标题" done={done} doneLabel="标题关卡通过">
          <p style={{ fontSize: 13.5, color: 'var(--text-soft)' }}>
            任务：把「你好世界」写成<b>三级标题</b>（三个 #）。右侧预览出现带下划线的三级标题即通过。
          </p>
          <MdEditor
            value={src}
            onChange={setSrc}
            height={200}
            hint={hasRight ? '🎉 三级标题写对了！' : '输入：### 你好世界'}
          />
          {hasWrong && !hasRight && (
            <Callout type="error" title="检测到小问题">
              <code>#</code> 和文字之间好像少了空格，试试 <code>### 你好世界</code>。
            </Callout>
          )}
          {passed && (
            <Callout type="tip" title="通关">
              🎉 你掌握了标题语法！下一关「强调」已解锁。
            </Callout>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
