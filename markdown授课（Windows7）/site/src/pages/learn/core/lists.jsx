import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'
import { MarkdownPreview } from '../../../lib/md.jsx'

/* 符号切换演示 */
function SymbolDemo() {
  const [sym, setSym] = useState('-')
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-soft)' }}>无序列表符号：</span>
        {['-', '*', '+'].map((s) => (
          <button key={s} className={`btn btn-sm ${sym === s ? 'btn-primary' : ''}`} onClick={() => setSym(s)}>
            <code>{s} 苹果</code>
          </button>
        ))}
        <span className="chip" style={{ marginLeft: 'auto' }}>三种符号效果相同</span>
      </div>
      <MarkdownPreview source={`${sym} 苹果\n${sym} 香蕉\n${sym} 橙子`} />
      <Callout type="info" title="注意">
        符号后面必须跟一个空格，否则不会被识别为列表。建议统一用 <code>-</code>。
      </Callout>
    </div>
  )
}

export default function Lists() {
  const { done, markDone } = useLessonComplete('lists')
  const [src1, setSrc1] = useState('')
  const [src2, setSrc2] = useState('')

  const orderedOk = (src1.match(/^\d+[.)]\s+\S/mg) || []).length >= 3
  const unorderedOk = (src2.match(/^[-*+]\s+\S/mg) || []).length >= 3
  const passed = orderedOk && unorderedOk

  useEffect(() => {
    if (passed) markDone()
  }, [passed, markDone])

  return (
    <LessonPage
      id="lists"
      module="m2"
      moduleName="模块二 · 核心语法精讲"
      time="60min"
      icon="📋"
      title="列表专题：有序 / 无序"
      subtitle="列表是写作中最常用的结构——步骤、清单、要点全靠它。"
      goals={['会写有序列表（1. 2. 3.）', '会写无序列表（- 开头）', '理解符号后的空格要求']}
    >
      <Section num={1} title="自动编号演示">
        <Callout type="info" title="神奇之处">
          有序列表不用手动编号！你只需要写 <code>1. </code> 开头，Markdown 会自动按顺序编号：
        </Callout>
        <div className="card" style={{ padding: '16px 18px', marginTop: 8 }}>
          <MarkdownPreview source={'1. 打开编辑器\n1. 输入内容\n1. 保存发布'} />
          <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 8 }}>
            上面源码里写的都是 1.，渲染后自动变成了 1、2、3。
          </div>
        </div>
      </Section>

      <Section num={2} title="符号切换演示">
        <SymbolDemo />
      </Section>

      <Section num={3} title="动手练习（两关）">
        <Exercise num={1} title="写一个 3 步操作步骤（有序列表）" done={orderedOk} doneLabel="步骤写好了">
          <MdEditor
            value={src1}
            onChange={setSrc1}
            height={170}
            placeholder={'1. 打开浏览器\n2. 输入网址\n3. 点击开始'}
            hint={orderedOk ? '✅ 检测到至少 3 行有序列表' : '每行用 数字. 开头，例如 1. 打开浏览器'}
          />
        </Exercise>
        <Exercise num={2} title="写一个购物清单（无序列表）" done={unorderedOk} doneLabel="清单写好了">
          <MdEditor
            value={src2}
            onChange={setSrc2}
            height={170}
            placeholder={'- 牛奶\n- 面包\n- 鸡蛋'}
            hint={unorderedOk ? '✅ 检测到至少 3 行无序列表' : '每行用 - 加空格开头，例如 - 牛奶'}
          />
        </Exercise>
        {passed && (
          <Callout type="tip" title="关卡通过">
            🎉 有序列表和无序列表都会写了！下一关「链接与图片」已解锁。
          </Callout>
        )}
      </Section>
    </LessonPage>
  )
}
