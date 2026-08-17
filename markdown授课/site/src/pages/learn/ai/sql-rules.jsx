import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete, CopyBlock } from '../../../components/ui.jsx'
import { SQL_BUGS } from '../../../lib/ai.js'

/* 三条红线 */
const RED_LINES = [
  {
    icon: '🔒',
    title: '数据安全：敏感数据先脱敏',
    desc: '含客户隐私、身份证、手机号的数据，不要直接喂给外部 AI。先用假数据 / 脱敏字段替代（张三、138****0000），结论一样，风险归零。',
  },
  {
    icon: '🧪',
    title: '结果验证：先跑一遍再说',
    desc: 'AI 生成的 SQL 先到测试环境跑一遍；结果行数、数值量级是否合理，一眼就能看出问题。跑通不等于对，要「看结果合不合理」。',
  },
  {
    icon: '🚫',
    title: '执行红线：增删改必须人确认',
    desc: 'DELETE / DROP / UPDATE 这类破坏性语句，永远不要让 AI 直接执行。执行前先备份、先确认 WHERE 条件——一次误删没有后悔药。',
  },
]

/* 纠错练习组件：判断 AI 输出错在哪 */
function BugCard({ bug, index, onSolved }) {
  const [show, setShow] = useState(false)
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="card" style={{ padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span className="chip" style={{ flexShrink: 0 }}>题 {index + 1}</span>
        <b>{bug.title}</b>
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--text-faint)' }}>
          {revealed ? '✅ 已掌握' : show ? '🔍 已展开' : '💬 猜猜错在哪'}
        </span>
      </div>
      <div style={{ fontSize: 13.5, marginBottom: 6 }}>这段 AI 生成的 SQL 错在哪里？</div>
      <pre
        style={{
          background: '#1f1235', color: '#f8c8dc', borderRadius: 10,
          padding: '10px 12px', fontSize: 12.5, lineHeight: 1.7, margin: 0, overflowX: 'auto',
        }}
      >
        {bug.wrong}
      </pre>
      {!revealed && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <button className="btn btn-sm" onClick={() => { setShow(!show); if (show) setRevealed(true) }}>
            {show ? '✅ 我知道了，确认' : '🔍 先看看我的答案'}
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => { setRevealed(true); onSolved() }}>
            🤔 直接看正确答案
          </button>
        </div>
      )}
      {show && !revealed && (
        <div className="demo-frame" style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7 }}>
          <b>你的猜测：</b>先自己想，再点「确认」对照正确答案——猜错了印象更深 😉
        </div>
      )}
      {revealed && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ok)', marginBottom: 4 }}>✅ 正确答案</div>
          <pre
            style={{
              background: '#0f2415', color: '#c9f0d0', borderRadius: 10,
              padding: '10px 12px', fontSize: 12.5, lineHeight: 1.7, margin: 0, overflowX: 'auto',
            }}
          >
            {bug.right}
          </pre>
          <div style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 8, lineHeight: 1.7 }}>
            📖 {bug.explain}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SqlRules() {
  const { done, markDone } = useLessonComplete('sql-rules')
  const [solved, setSolved] = useState(0)

  const markSolved = () => setSolved((n) => n + 1)

  useEffect(() => {
    if (solved >= SQL_BUGS.length) markDone()
  }, [solved, markDone])

  return (
    <LessonPage
      id="sql-rules"
      module="m5"
      moduleName="模块五 · AI 辅助与数据分析"
      time="25min"
      icon="🛡️"
      title="AI + SQL 的边界与规范"
      subtitle="AI 帮你写 SQL 很香，但有三条红线不能碰——数据安全、结果验证、执行控制。本课用纠错练习把这些规范刻进肌肉记忆。"
      goals={['记住 AI + 数据工作的三条红线', '能识别 AI 生成的常见错误 SQL', '养成「AI 起草、人工把关、数据验证」的习惯']}
    >
      <Section num={1} title="三条红线（先记住再动手）">
        <div className="grid-3">
          {RED_LINES.map((r) => (
            <div className="card" key={r.title} style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 24 }}>{r.icon}</div>
              <b style={{ display: 'block', margin: '6px 0 4px' }}>{r.title}</b>
              <span style={{ fontSize: 12.5, color: 'var(--text-soft)', lineHeight: 1.7 }}>{r.desc}</span>
            </div>
          ))}
        </div>
        <Callout type="warn" style={{ marginTop: 12 }}>
          <b>核心心态：</b>AI 是「效率工具」，不是「可信来源」。<b>AI 起草，人工把关，数据验证，结论自负</b>——
          这四步一步都不能省。
        </Callout>
      </Section>

      <Section num={2} title="纠错练习：找出 AI 的 4 处错误">
        <Exercise num={1} title={`找出全部 ${SQL_BUGS.length} 类错误（当前 ${Math.min(solved, SQL_BUGS.length)}/${SQL_BUGS.length}）`} done={done} doneLabel="规范守门员">
          <p style={{ marginTop: 0, fontSize: 13.5, color: 'var(--text-soft)' }}>
            下面 4 段 SQL 都是「AI 生成的」，每段都藏着 <b>{SQL_BUGS.length} 类典型错误之一</b>。
            先猜错在哪，再点「我知道了」核对——这是防「AI 幻觉」的最好训练。
          </p>
          {SQL_BUGS.map((b, i) => (
            <BugCard key={i} bug={b} index={i} onSolved={markSolved} />
          ))}
          {done && (
            <Callout type="tip">
              <b>🎉 规范守门员！</b>你已经能识别 AI 写 SQL 的常见错误了。这三条红线 + 四个易错点，
              就是 AI + 数据工作里「人」的价值所在。下一课「文档智能分析」，回到文档维度继续进阶。
            </Callout>
          )}
        </Exercise>
      </Section>

      <Section num={3} title="速查卡：AI + SQL 使用规范">
        <div className="grid-2">
          <div className="card" style={{ padding: '14px 16px' }}>
            <b style={{ display: 'block', marginBottom: 8 }}>✅ 应该做</b>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 2, color: 'var(--ok)' }}>
              <li>提示词里带上完整表结构</li>
              <li>说明数据库类型（MySQL / SQL Server…）</li>
              <li>生成后对照真实表核对列名</li>
              <li>先在测试环境跑一遍再上线</li>
              <li>敏感数据先脱敏再交给 AI</li>
            </ul>
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <b style={{ display: 'block', marginBottom: 8 }}>🚫 不要做</b>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 2, color: '#e11d48' }}>
              <li>不核对就让 AI 直接改生产库</li>
              <li>让 AI 执行 DELETE / DROP 而不先备份</li>
              <li>把含隐私的原始数据直接喂给外部 AI</li>
              <li>盲信 AI 的 JOIN / 聚合写法不验证</li>
              <li>把 AI 给的 SQL 当「标准答案」</li>
            </ul>
          </div>
        </div>
      </Section>
    </LessonPage>
  )
}
