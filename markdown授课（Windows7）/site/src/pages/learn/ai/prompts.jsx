import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import { PROMPTS } from '../../../lib/ai.js'
import { copyText } from '../../../lib/utils.js'

/* 进阶玩法：3 条自定义提示词 */
const ADVANCED = [
  {
    text: '把这份 Markdown 按周报格式改写：保留全部要点，补充【本周亮点】和【风险与求助】两个小节',
    desc: '周报改写：一键把散内容整理成领导爱看的周报',
  },
  {
    text: '用「一句话解释 + 一个小例子」的方式，把这段 Markdown 里的每个语法点讲给我听',
    desc: '语法讲解：让 AI 当你的私人老师',
  },
  {
    text: '把这份 Markdown 改写成 5 页演讲稿，每页一个大标题加 3 个要点，输出为 Markdown',
    desc: '演讲稿 / PPT 化：一份文档变一节课',
  },
]

/* 提示词卡片：复制 + 去试试 */
function PromptCard({ text, desc, onCopied }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await copyText(text)
    setCopied(true)
    onCopied?.()
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, lineHeight: 1.65 }}>{text}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{desc}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-sm" onClick={copy}>
          {copied ? '✓ 已复制' : '📋 复制'}
        </button>
        <Link to="/learn/ai/assistant" className="btn btn-sm btn-primary">
          去试试 →
        </Link>
      </div>
    </div>
  )
}

export default function Prompts() {
  const { done, markDone } = useLessonComplete('prompts')
  const [copiedCount, setCopiedCount] = useState(0)

  /* 练习：复制过任意 1 条提示词 */
  const passed = copiedCount >= 1
  useEffect(() => {
    if (passed) markDone()
  }, [passed, markDone])

  return (
    <LessonPage
      id="prompts"
      module="m6"
      moduleName="模块六 · AI 辅助"
      time="20min"
      icon="📋"
      title="提示词速查表"
      subtitle="跟 AI 说话也有「语法」——记下这些常用提示词，复制即用，让 AI 帮你处理 Markdown 的各种杂活。"
      goals={['掌握 8 条常用 Markdown 提示词', '学会复制即用、去实操页验证', '了解写出好提示词的 3 个技巧']}
    >
      <Section num={1} title="常用提示词（点击即可复制）">
        <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: '0 0 14px' }}>
          下面 8 条提示词覆盖了 Markdown 写作最常见的需求。<b>点「复制」</b>后直接粘给任意 AI 助手就能用；
          点「去试试」会跳到上一课的实操页面，拿生成的大纲验证一条。
        </p>
        <div className="grid-2">
          {PROMPTS.map((p, i) => (
            <PromptCard key={i} text={p.text} desc={p.desc} onCopied={() => setCopiedCount((n) => n + 1)} />
          ))}
        </div>
        {copiedCount > 0 && (
          <div style={{ marginTop: 12 }}>
            <span className="chip chip-ok">📋 已复制 {copiedCount} 条提示词</span>
          </div>
        )}
      </Section>

      <Section num={2} title="进阶玩法：3 条自定义提示词">
        <div className="grid-3">
          {ADVANCED.map((p, i) => (
            <PromptCard key={i} text={p.text} desc={p.desc} onCopied={() => setCopiedCount((n) => n + 1)} />
          ))}
        </div>
      </Section>

      <Section num={3} title="怎么写出好提示词？">
        <Callout type="tip" title="三个小技巧">
          <ol style={{ margin: '6px 0 0', paddingLeft: 20, lineHeight: 2 }}>
            <li><b>具体</b>：说清楚「输入是什么 + 要它做什么」。别只说「帮我优化」，要说「把这份 Markdown 的标题层级整理好」。</li>
            <li><b>给示例</b>：想要什么格式，就贴一段示例给它看。想让 AI 输出表格，就先放一个表格样例。</li>
            <li><b>说明格式要求</b>：要列表就说「用 - 无序列表」，要表格就说「转成表格」，要代码就说「用代码块展示」。</li>
          </ol>
        </Callout>
        <Callout type="info" title="记住一句话">
          提示词 = <b>角色 + 任务 + 输入 + 格式要求</b>。把这四样说清楚，任何 AI 都能变成你的 Markdown 小助手。
        </Callout>
      </Section>

      <Section num={4} title="动手练习">
        <Exercise num={1} title="复制一条提示词" done={done} doneLabel="通过">
          <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 12px' }}>
            点击任意一张卡片上的「复制」按钮，复制成功（出现 ✓ 已复制）即自动通过。
            复制完别忘了点「去试试」，把提示词真正用起来！
          </p>
          {done && (
            <Callout type="tip">
              <b>🎉 恭喜通关！</b>模块六的三课都完成啦——你已获得「AI 搭档」徽章 🤖，整个课程全部完成！
            </Callout>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
