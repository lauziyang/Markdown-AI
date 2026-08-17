import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete, CopyBlock } from '../../../components/ui.jsx'
import { simulateStream, aiSql } from '../../../lib/ai.js'
import { copyText } from '../../../lib/utils.js'

/* 教学表结构（AI 生成 SQL 的前提信息） */
const TABLE_SCHEMA = `sales（销售表）
- 门店：TEXT  例：上海 / 北京
- 月份：TEXT  例：2025-06
- 销量：INT   例：1450
- 销售额：DECIMAL  例：4350000`

const Q_SAMPLES = [
  '6月销量最高的3家门店',
  '每家门店的平均销售额',
  '6月销售额合计是多少',
  '销量大于1000的门店',
  '2025年3月销量最低的门店',
  '6月一共有多少条销售记录',
]

/* AI 写 SQL 的 4 个易错点 */
const PITFALLS = [
  { icon: '🔤', title: '表名 / 列名拼错', desc: 'AI 是「猜」的——sale ≠ sales。生成后必须对照真实表结构核对每个名字。' },
  { icon: '🧩', title: '聚合列忘了 GROUP BY', desc: 'SELECT 同时出现普通列和聚合函数时，必须按普通列 GROUP BY，否则报错或数据错乱。' },
  { icon: '⚖️', title: 'WHERE 与 HAVING 混用', desc: 'WHERE 只能过滤原始行（不能出现聚合函数）；对分组结果做条件要用 HAVING。' },
  { icon: '🗣️', title: 'SQL 方言差异', desc: 'MySQL 用 LIMIT，SQL Server 用 TOP 3，PostgreSQL 也有细微差别——先告诉 AI 你用的数据库。' },
]

export default function SqlHelper() {
  const { done, markDone } = useLessonComplete('sql-helper')
  const [question, setQuestion] = useState('')
  const [output, setOutput] = useState('')
  const [busy, setBusy] = useState(false)
  const [generated, setGenerated] = useState(false)

  const run = async () => {
    if (!question.trim() || busy) return
    setBusy(true)
    setOutput('')
    const result = aiSql(question)
    await simulateStream(result, (c) => setOutput(c), 12)
    setBusy(false)
    setGenerated(true)
  }

  useEffect(() => {
    if (generated) markDone()
  }, [generated, markDone])

  return (
    <LessonPage
      id="sql-helper"
      module="m5"
      moduleName="模块五 · AI 辅助与数据分析"
      time="30min"
      icon="🗄️"
      title="让 AI 帮你写 SQL"
      subtitle="不会写 SQL？没关系——用一句话说清楚你要查什么，AI 帮你生成 SQL，你负责核对。"
      goals={['理解「表结构 + 需求 + 输出格式」的提示词模式', '会用自然语言让 AI 生成 SQL', '知道 AI 写 SQL 的 4 个常见易错点']}
    >
      <Section num={1} title="为什么可以放心让 AI 写 SQL？">
        <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: '0 0 12px', lineHeight: 1.8 }}>
          SQL 是高度<b>规则化</b>的语言：只要表结构清楚、需求明确，生成 SQL 正是 AI 最擅长的任务。
          关键是把「表结构」喂给 AI——这就是本课的提示词三要素：
        </p>
        <div className="grid-3">
          <div className="card" style={{ padding: '14px 16px' }}>
            <b>📋 1. 表结构</b>
            <p style={{ fontSize: 12.5, color: 'var(--text-soft)', margin: '6px 0 0' }}>告诉 AI 有哪些表和列、什么类型，它才不会猜错名字。</p>
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <b>🎯 2. 需求</b>
            <p style={{ fontSize: 12.5, color: 'var(--text-soft)', margin: '6px 0 0' }}>用一句话说清「查什么 + 什么条件 + 要几个」。越具体越好。</p>
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <b>📤 3. 输出格式</b>
            <p style={{ fontSize: 12.5, color: 'var(--text-soft)', margin: '6px 0 0' }}>「只输出 SQL 代码」「MySQL 语法」——限定方言避免踩坑。</p>
          </div>
        </div>
        <Callout type="info" style={{ marginTop: 12 }}>
          <b>本课教学表：</b>以下所有演示都围绕这张 <code>sales</code> 表。
          <CopyBlock code={TABLE_SCHEMA} lang="text" label="sales 表结构" />
        </Callout>
      </Section>

      <Section num={2} title="实操：一句话生成 SQL">
        <Exercise num={1} title="用自然语言生成一次 SQL（任意问题即可通关）" done={done} doneLabel="SQL 好帮手">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {Q_SAMPLES.map((q) => (
              <button key={q} className="chip" style={{ cursor: 'pointer' }} onClick={() => setQuestion(q)}>
                {q}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              className="ex-input"
              style={{ flex: 1, minWidth: 240 }}
              placeholder="用一句话说出你要查什么，例如：6月销量最高的3家门店"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button className="btn btn-primary" onClick={run} disabled={busy || !question.trim()}>
              {busy ? '⏳ 生成中…' : '🤖 生成 SQL'}
            </button>
          </div>
          {output && (
            <div className="demo-frame" style={{ marginTop: 12, whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.9 }}>
              {output}
              <div style={{ marginTop: 10 }}>
                <button className="btn btn-sm" onClick={() => copyText(output)}>📋 复制</button>
              </div>
            </div>
          )}
        </Exercise>
      </Section>

      <Section num={3} title="AI 写 SQL 的 4 个易错点（重点）">
        <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 12px' }}>
          AI 生成的 SQL <b>必须人工核对</b>。这 4 类错误最常见，下次拿到 AI 输出先按这个清单检查：
        </p>
        <div className="grid-2">
          {PITFALLS.map((p) => (
            <div className="card" key={p.title} style={{ padding: '14px 16px' }}>
              <b style={{ display: 'block', marginBottom: 6 }}>{p.icon} {p.title}</b>
              <span style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.7 }}>{p.desc}</span>
            </div>
          ))}
        </div>
        <Callout type="tip" style={{ marginTop: 12 }}>
          <b>黄金流程：</b>AI 起草 → 对照表结构核对名字 → 测试环境跑一遍 → 看结果合不合理 → 才用到真实数据。
          AI 写 SQL 省的是「打字时间」，不是「检查责任」。
        </Callout>
      </Section>

      <Section num={4} title="下一步">
        {done ? (
          <Callout type="tip">
            <b>🎉 SQL 好帮手！</b>你已经会用自然语言让 AI 生成 SQL 了。下一课「查询结果 → AI 解读 → 报告」，
            我们把查出来的数据变成一份漂亮的 Markdown 报告。
          </Callout>
        ) : (
          <p style={{ color: 'var(--text-faint)' }}>先生成一次 SQL，这里会出现通关彩蛋 🎉</p>
        )}
      </Section>
    </LessonPage>
  )
}
