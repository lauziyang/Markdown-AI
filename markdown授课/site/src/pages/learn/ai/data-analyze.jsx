import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete, CopyBlock } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'
import { simulateStream, parseMdTable, analyzeTable, aiTableAnswer, detectTableAnomalies, mermaidSuggest } from '../../../lib/ai.js'
import { copyText } from '../../../lib/utils.js'

/* 预置示例：一张含异常值的销售数据表 */
const SAMPLE_TABLE = `# 2025 上半年各门店销售数据

| 门店 | 月度销量 | 销售额(万元) |
| ---- | -------- | ------------ |
| 北京 | 1200 | 360 |
| 上海 | 1450 | 435 |
| 广州 | 980 | 294 |
| 深圳 | 1100 | 330 |
| 成都 | 850 | 255 |
| 杭州 | 1300 | 390 |
| 武汉 | 99999 | 30000 |
| 西安 | 760 | 228 |
`

const Q_SAMPLES = ['哪家门店销量最高？', '销售额合计是多少？', '哪家门店销量最低？', '平均月度销量是多少？']

export default function DataAnalyze() {
  const { done, markDone } = useLessonComplete('data-analyze')
  const [src, setSrc] = useState(SAMPLE_TABLE)
  const [tab, setTab] = useState('stats') // stats | qa | anomaly | chart
  const [question, setQuestion] = useState('')
  const [statsText, setStatsText] = useState('')
  const [answer, setAnswer] = useState('')
  const [anomalies, setAnomalies] = useState(null)
  const [chartKind, setChartKind] = useState('bar')
  const [chartCode, setChartCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [asked, setAsked] = useState(false)

  const runStats = async () => {
    setBusy(true)
    setStatsText('')
    const result = analyzeTable(src)
    await simulateStream(result, (c) => setStatsText(c), 14)
    setBusy(false)
    setAsked(true)
  }

  const runQA = async () => {
    if (!question.trim()) return
    setBusy(true)
    setAnswer('')
    const result = aiTableAnswer(src, question)
    await simulateStream(result, (c) => setAnswer(c), 12)
    setBusy(false)
    setAsked(true)
  }

  const runAnomaly = async () => {
    setBusy(true)
    setAnomalies(null)
    await new Promise((r) => setTimeout(r, 400))
    setAnomalies(detectTableAnomalies(src))
    setBusy(false)
    setAsked(true)
  }

  const runChart = async () => {
    setBusy(true)
    setChartCode('')
    const code = mermaidSuggest(src, chartKind)
    await simulateStream(code, (c) => setChartCode(c), 8)
    setBusy(false)
    setAsked(true)
  }

  const passed = asked && (statsText.length > 10 || answer.length > 10 || (anomalies && anomalies.length) || chartCode.length > 10)
  useEffect(() => {
    if (passed) markDone()
  }, [passed, markDone])

  const cells = parseMdTable(src)

  return (
    <LessonPage
      id="data-analyze"
      module="m5"
      moduleName="模块五 · AI 辅助与数据分析"
      time="40min"
      icon="📊"
      title="表格数据分析"
      subtitle="AI 不只是写作助手——把一张 Markdown 表格丢给它：统计摘要、自然语言问答、异常值检测、图表建议，一次全搞定。"
      goals={['会用 AI 对表格做统计摘要', '会用自然语言向表格提问', '能识别 AI 找出的异常数据', '能把表格转成图表建议代码']}
    >
      <Section num={1} title="一张表格，AI 能看出什么？">
        <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: '0 0 12px', lineHeight: 1.8 }}>
          下面的表格是预置的示例（<b>注意：武汉行藏了一个异常值</b>）。
          你可以直接用它体验，也可以编辑成你自己的数据。左侧<b>切换 4 种分析能力</b>逐项试试。
        </p>
        <MdEditor
          value={src}
          onChange={setSrc}
          height={260}
          placeholder="粘贴或输入一张 Markdown 表格…"
          hint={cells.headers.length ? `已识别表格：${cells.headers.join(' / ')}，共 ${cells.rows.length} 行数据` : '未识别到表格，请检查 | 分隔格式'}
        />
      </Section>

      <Section num={2} title="4 种分析能力（点标签切换）">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {[
            { id: 'stats', icon: '🧮', label: '统计摘要' },
            { id: 'qa', icon: '💬', label: '表格问答' },
            { id: 'anomaly', icon: '🕵️', label: '异常检测' },
            { id: 'chart', icon: '📈', label: '图表建议' },
          ].map((t) => (
            <button
              key={t.id}
              className={`btn btn-sm ${tab === t.id ? 'btn-primary' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* 统计摘要 */}
        {tab === 'stats' && (
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <b>🧮 统计摘要</b>
              <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>行数、数值列合计 / 均值 / 最大最小、Top 排名</span>
              <button className="btn btn-sm btn-primary" style={{ marginLeft: 'auto' }} onClick={runStats} disabled={busy}>
                {busy ? '⏳ 分析中…' : '🤖 一键分析'}
              </button>
            </div>
            <pre
              style={{
                background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10,
                padding: '12px 14px', fontSize: 13.5, lineHeight: 1.9, minHeight: 90, margin: 0, whiteSpace: 'pre-wrap',
              }}
            >
              {statsText || '点击「一键分析」，AI 会把这张表的统计结论逐字写出来…'}
            </pre>
          </div>
        )}

        {/* 表格问答 */}
        {tab === 'qa' && (
          <div className="card" style={{ padding: '16px 18px' }}>
            <b style={{ display: 'block', marginBottom: 4 }}>💬 表格问答</b>
            <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
              用自然语言提问，AI 从表格里定位答案并给出依据。试试这些问法：
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0 10px' }}>
              {Q_SAMPLES.map((q) => (
                <button key={q} className="chip" style={{ cursor: 'pointer' }} onClick={() => setQuestion(q)}>
                  {q}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                className="ex-input"
                style={{ flex: 1, minWidth: 220 }}
                placeholder="输入问题，例如：哪家门店销售额最高？"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <button className="btn btn-primary" onClick={runQA} disabled={busy || !question.trim()}>
                {busy ? '⏳ 思考中…' : '🤖 提问'}
              </button>
            </div>
            {answer && (
              <div className="demo-frame" style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>🤖 AI 回答</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{answer}</div>
              </div>
            )}
          </div>
        )}

        {/* 异常检测 */}
        {tab === 'anomaly' && (
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <b>🕵️ 异常值检测</b>
              <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>空单元格、重复行、数值异常、格式不统一</span>
              <button className="btn btn-sm btn-primary" style={{ marginLeft: 'auto' }} onClick={runAnomaly} disabled={busy}>
                {busy ? '⏳ 扫描中…' : '🔍 开始扫描'}
              </button>
            </div>
            {anomalies && (
              <div style={{ display: 'grid', gap: 8 }}>
                {anomalies.map((a, i) => (
                  <div
                    key={i}
                    className="card"
                    style={{
                      padding: '10px 14px', margin: 0, fontSize: 13.5, lineHeight: 1.7,
                      ...(a.level === 'error' ? { borderColor: '#e11d48' } : a.level === 'warn' ? { borderColor: '#d97706' } : { borderColor: 'var(--ok)' }),
                    }}
                  >
                    <span style={{ fontWeight: 800, marginRight: 6 }}>
                      {a.level === 'error' ? '❌' : a.level === 'warn' ? '⚠️' : '✅'}
                    </span>
                    {a.text}
                  </div>
                ))}
              </div>
            )}
            {!anomalies && <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: 0 }}>点击扫描，AI 检查示例表格里「武汉」那行藏着什么问题。</p>}
          </div>
        )}

        {/* 图表建议 */}
        {tab === 'chart' && (
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <b>📈 图表建议</b>
              <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>根据表格数据生成 Mermaid 图表代码，可直接贴进「Mermaid 图表工坊」</span>
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                {[
                  { id: 'bar', label: '柱状图' },
                  { id: 'pie', label: '饼图' },
                  { id: 'timeline', label: '时间线' },
                ].map((k) => (
                  <button key={k.id} className={`btn btn-sm ${chartKind === k.id ? 'btn-primary' : ''}`} onClick={() => setChartKind(k.id)}>
                    {k.label}
                  </button>
                ))}
                <button className="btn btn-sm btn-primary" onClick={runChart} disabled={busy}>🤖 生成代码</button>
              </div>
            </div>
            {chartCode ? (
              <>
                <CopyBlock code={chartCode.replace(/^```mermaid\n|```$/g, '')} lang="mermaid" label="Mermaid 图表代码" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <button className="btn btn-sm" onClick={() => copyText(chartCode.replace(/^```mermaid\n|```$/g, ''))}>📋 复制代码</button>
                  <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>打开「模块四 · Mermaid 图表工坊」粘贴预览效果。</span>
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: 0 }}>选一种图表类型，点击「生成代码」。</p>
            )}
          </div>
        )}
      </Section>

      <Section num={3} title="练习：完成任意一种分析">
        <Exercise num={1} title="用 AI 完成一次表格分析（统计 / 问答 / 异常 / 图表任选其一）" done={done} doneLabel="数据分析师">
          <p style={{ marginTop: 0, fontSize: 13.5, color: 'var(--text-soft)' }}>
            操作提示：建议先用「统计摘要」看全貌，再用「异常检测」找问题（提示：看看武汉那行），
            最后用「表格问答」验证你的判断——这就是数据分析的完整闭环：<b>描述 → 诊断 → 验证</b>。
          </p>
          {done && (
            <Callout type="tip">
              <b>🎉 数据分析师！</b>你已经会用 AI 读表格了。下一课「文档智能分析」，
              我们把分析能力用到整篇文档上——体检、摘要、翻译、出题。
            </Callout>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
