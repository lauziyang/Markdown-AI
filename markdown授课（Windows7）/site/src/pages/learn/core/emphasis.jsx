import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'
import { MarkdownPreview } from '../../../lib/md.jsx'

function HighlightDemo() {
  const [mode, setMode] = useState('bold')
  const demos = {
    bold: { sym: '**', label: '加粗', src: '这句话里的**重点内容**要加粗显示' },
    italic: { sym: '*', label: '斜体', src: '这是*强调语气*的文字' },
    strike: { sym: '~~', label: '删除线', src: '原价 ~~99元~~，现价 19.9 元' },
  }
  const d = demos[mode]
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {Object.entries(demos).map(([k, v]) => (
          <button key={k} className={`btn btn-sm ${mode === k ? 'btn-primary' : ''}`} onClick={() => setMode(k)}>
            {v.label} <code>{v.sym}…{v.sym}</code>
          </button>
        ))}
      </div>
      <div className="card" style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-soft)', marginBottom: 8 }}>
          包裹符号高亮（注意成对的 <code>{d.sym}</code>）：
        </div>
        <pre style={{ background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10, padding: '12px 14px', margin: 0, fontSize: 14 }}>
          {d.src.split(d.sym).map((seg, i) =>
            i % 2 === 1 ? (
              <b key={i} style={{ color: 'var(--accent)', background: 'var(--accent-soft)', borderRadius: 4, padding: '0 3px' }}>
                {d.sym}{seg}{d.sym}
              </b>
            ) : (
              <span key={i}>{seg}</span>
            )
          )}
        </pre>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-soft)', margin: '12px 0 8px' }}>渲染效果：</div>
        <MarkdownPreview source={d.src} />
      </div>
      <Callout type="info" title="规律">
        符号<b>成对出现</b>包裹文字：<code>**文字**</code>、<code>*文字*</code>、<code>~~文字~~</code>。忘记闭合就不会生效。
      </Callout>
    </div>
  )
}

export default function Emphasis() {
  const { done, markDone } = useLessonComplete('emphasis')
  const [src, setSrc] = useState('')
  const hasBold = /\*\*重要\*\*/.test(src)
  const hasStrike = /~~\S+~~/.test(src)
  const passed = hasBold

  useEffect(() => {
    if (passed) markDone()
  }, [passed, markDone])

  return (
    <LessonPage
      id="emphasis"
      module="m2"
      moduleName="模块二 · 核心语法精讲"
      time="60min"
      icon="🖊️"
      title="强调专题：加粗 / 斜体 / 删除线"
      subtitle="用成对的符号包裹文字，表达不同的强调语气。"
      goals={['会用 **加粗** 与 *斜体*', '会用 ~~删除线~~ 表达修正', '理解符号必须成对闭合']}
    >
      <Section num={1} title="包裹符号高亮演示">
        <HighlightDemo />
      </Section>

      <Section num={2} title="动手练习">
        <Exercise num={1} title="把普通文字改成加粗" done={done} doneLabel="强调关卡通过">
          <p style={{ fontSize: 13.5, color: 'var(--text-soft)' }}>
            任务：输入一句包含「<b>重要</b>」的话，并用 <code>**</code> 把它包起来变成加粗。
          </p>
          <MdEditor
            value={src}
            onChange={setSrc}
            height={200}
            hint={hasBold ? '🎉 **重要** 加粗成功！' : '例如：这个知识点很**重要**'}
          />
          {passed && (
            <Callout type="tip" title="通关">
              🎉 加粗完成！顺手试试删除线：<code>~~旧内容~~</code>，可以一并练练。
              {hasStrike ? '（已检测到你的删除线，很棒！）' : ''}
            </Callout>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
