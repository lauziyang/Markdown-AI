import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete, CopyBlock } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'
import { simulateStream, parseMdTable, analyzeTable, analyzeTrend, aiTableAnswer, detectTableAnomalies, mermaidSuggest } from '../../../lib/ai.js'
import { copyText } from '../../../lib/utils.js'

/* 预置示例：多维度销售数据（6 门店 × 2 个月，含两处异常与一条下滑趋势） */
const SAMPLE_TABLE = `# 门店销售数据分析（2025 年 5-6 月）

| 门店 | 月份 | 销量 | 销售额(万) | 成本(万) | 毛利(万) |
| ---- | ---- | ---- | ---------- | -------- | -------- |
| 北京 | 2025-05 | 1150 | 345 | 240 | 105 |
| 北京 | 2025-06 | 1200 | 360 | 250 | 110 |
| 上海 | 2025-05 | 1380 | 414 | 280 | 134 |
| 上海 | 2025-06 | 1450 | 435 | 300 | 135 |
| 广州 | 2025-05 | 1005 | 302 | 220 | 82 |
| 广州 | 2025-06 | 980 | 294 | 215 | 79 |
| 深圳 | 2025-05 | 1060 | 318 | 230 | 88 |
| 深圳 | 2025-06 | 1100 | 330 | 240 | 90 |
| 成都 | 2025-05 | 920 | 276 | 210 | 66 |
| 成都 | 2025-06 | 850 | 255 | 200 | 55 |
| 武汉 | 2025-05 | 1300 | 390 | 99999 | 88 |
| 武汉 | 2025-06 | 99999 | 30000 | 400 | 99999 |
`

const Q_SAMPLES = [
  '哪家门店6月销量最高？',
  '6月销售额合计是多少？',
  '武汉6月比5月销量多多少？',
  '北京6月销量占全部门店的比例？',
  '6月较5月整体销售额环比增长多少？',
  '哪家门店6月成本异常？',
]

/* Excel vs Markdown 逐项对比表 */
const EXCEL_CMP = [
  ['文件格式', '二进制（.xlsx 本质是 zip 包）', '纯文本，人人可读'],
  ['AI 读取', '需解析器，合并单元格/公式易出错', '零解析损耗，直接读取'],
  ['依据可核对', 'AI 读了哪些单元格很难验证', '每一行每一列一目了然，依据可核对'],
  ['版本控制', '二进制无法 git diff', 'git diff 精确到每一处改动'],
  ['团队协作', '并发编辑易冲突、锁文件', '文本可合并，冲突可读可解'],
  ['与文档一体', '独立附件，文档与数据分离', '表格就是文档的一部分'],
  ['适用场景', '复杂计算、图表透视、多人填报', '轻量数据 + 文档一体化 + 喂给 AI'],
]

/* 两种喂数据方式的模拟输出 */
const EXCEL_SIM = `收到文件「销售数据.xlsx」（本地模拟）

AI 处理过程：
1. 解析二进制格式（.xlsx 实际是一个 zip 包）…
2. 打开 3 个工作表，跳过 1 个空表…
3. ⚠️ 检测到 2 处合并单元格，取值以左上角为准…
4. ⚠️ 1 列是公式结果，部分单元格返回的是公式文本…

读取完成，但存在解析损耗：你看不到 AI 到底读了哪些单元格，
合并单元格和公式可能导致数据丢失或错位。

对比右侧的 Markdown 表格方式：纯文本直接读取、零损耗、
每行每列可见可核对、git diff 可追踪变化。`

const MD_SIM = `收到 Markdown 表格（就是上方编辑器里的内容）

AI 处理过程：
1. 按 | 分隔符逐行读取表头与数据…
2. 共识别 12 行数据、6 列（门店 / 月份 / 销量 / 销售额 / 成本 / 毛利）…
3. 数值列直接可用于计算，无解析损耗…
4. 所有单元格内容对 AI 和人类完全透明…

读取完成，零损耗。任何一行都可以作为分析结论的「依据」直接引用，
且这份表格本身就在文档里，跟着文档一起进 git 版本库。

这正是「Markdown 表格 + AI」优于「Excel 上传」的核心原因。`

export default function DataAnalyze() {
  const { done, markDone } = useLessonComplete('data-analyze')
  const [src, setSrc] = useState(SAMPLE_TABLE)
  const [tab, setTab] = useState('stats') // stats | trend | qa | anomaly | chart
  const [question, setQuestion] = useState('')
  const [statsText, setStatsText] = useState('')
  const [trendText, setTrendText] = useState('')
  const [answer, setAnswer] = useState('')
  const [anomalies, setAnomalies] = useState(null)
  const [chartKind, setChartKind] = useState('bar')
  const [chartCode, setChartCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [asked, setAsked] = useState(false)
  const [excelMode, setExcelMode] = useState('')
  const [simOut, setSimOut] = useState('')
  const [simBusy, setSimBusy] = useState(false)

  const runStats = async () => {
    setBusy(true)
    setStatsText('')
    const result = analyzeTable(src)
    await simulateStream(result, (c) => setStatsText(c), 14)
    setBusy(false)
    setAsked(true)
  }

  const runTrend = async () => {
    setBusy(true)
    setTrendText('')
    const result = analyzeTrend(src)
    await simulateStream(result, (c) => setTrendText(c), 14)
    setBusy(false)
    setAsked(true)
  }

  const simExcel = async () => {
    if (simBusy) return
    setSimBusy(true)
    setExcelMode('excel')
    setSimOut('')
    await simulateStream(EXCEL_SIM, (c) => setSimOut(c), 10)
    setSimBusy(false)
    setAsked(true)
  }

  const simMarkdown = async () => {
    if (simBusy) return
    setSimBusy(true)
    setExcelMode('md')
    setSimOut('')
    await simulateStream(MD_SIM, (c) => setSimOut(c), 10)
    setSimBusy(false)
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

  const passed = asked && (statsText.length > 10 || trendText.length > 10 || answer.length > 10 || (anomalies && anomalies.length) || chartCode.length > 10)
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
          示例表格是 <b>6 家门店 × 2 个月</b>的销售数据（销量、销售额、成本、毛利），
          <b>藏着两处异常值和一条下滑趋势</b>，还考验你能否发现「毛利 = 销售额 - 成本」被破坏的行。
          你可以直接用它体验，也可以编辑成你自己的数据。左侧<b>切换 5 种分析能力</b>逐项试试。
        </p>
        <MdEditor
          value={src}
          onChange={setSrc}
          height={260}
          placeholder="粘贴或输入一张 Markdown 表格…"
          hint={cells.headers.length ? `已识别表格：${cells.headers.join(' / ')}，共 ${cells.rows.length} 行数据` : '未识别到表格，请检查 | 分隔格式'}
        />
      </Section>

      <Section num={2} title="5 种分析能力（点标签切换）">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {[
            { id: 'stats', icon: '🧮', label: '统计摘要' },
            { id: 'trend', icon: '📉', label: '趋势与占比' },
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
              <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>行数、各数值列合计 / 均值 / 最大最小、Top 排名</span>
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
              {statsText || '点击「一键分析」，AI 会把这张表所有数值列的统计结论逐字写出来…'}
            </pre>
          </div>
        )}

        {/* 趋势与占比 */}
        {tab === 'trend' && (
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <b>📉 趋势与占比分析</b>
              <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>门店占比、月度环比、连续增长 / 下滑识别</span>
              <button className="btn btn-sm btn-primary" style={{ marginLeft: 'auto' }} onClick={runTrend} disabled={busy}>
                {busy ? '⏳ 分析中…' : '🤖 分析趋势'}
              </button>
            </div>
            <pre
              style={{
                background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10,
                padding: '12px 14px', fontSize: 13.5, lineHeight: 1.9, minHeight: 100, margin: 0, whiteSpace: 'pre-wrap',
              }}
            >
              {trendText || '点击「分析趋势」——注意观察：哪家门店 6 月较 5 月下滑了？毛利和成本的异常会不会影响结论？'}
            </pre>
            <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 10 }}>
              💡 教学点：分析「数据怎么变」（趋势）比只看「数据是多少」（统计）更进一步——环比、占比、连续趋势是商业分析的基本功。
            </div>
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

      <Section num={3} title="对比：直接把 Excel 上传给 AI 会怎样？">
        <Callout type="info" title="先想一个问题">
          很多人习惯把数据存在 Excel 里，然后直接把 <code>.xlsx</code> 文件丢给 AI。这样做能行，
          但和「Markdown 表格」方式相比，代价是什么？下面用模拟演示对比给你看。
        </Callout>

        {/* 交互演示：两种喂数据方式 */}
        <div className="card" style={{ padding: '16px 18px', marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <b>🎬 模拟演示：同一份数据，两种喂法</b>
            <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>点按钮看 AI 分别会经历什么</span>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button className={`btn btn-sm ${excelMode === 'excel' ? 'btn-primary' : ''}`} onClick={simExcel} disabled={simBusy}>
                📤 上传 Excel 给 AI
              </button>
              <button className={`btn btn-sm ${excelMode === 'md' ? 'btn-primary' : ''}`} onClick={simMarkdown} disabled={simBusy}>
                📋 用 Markdown 表格
              </button>
            </div>
          </div>
          <pre
            style={{
              background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10,
              padding: '12px 14px', fontSize: 13, lineHeight: 1.9, minHeight: 140, margin: 0, whiteSpace: 'pre-wrap',
            }}
          >
            {simOut || '选择一种方式，看看 AI 读取这组数据的过程…'}
          </pre>
        </div>

        {/* 静态对比表 */}
        <div className="card" style={{ padding: '16px 18px', marginTop: 12 }}>
          <b style={{ display: 'block', marginBottom: 10 }}>📊 两种方式逐项对比</b>
          <div style={{ overflowX: 'auto' }}>
            <table className="cmp-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 560 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border)' }}>维度</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border)' }}>📤 Excel 直接上传</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border)' }}>📋 Markdown 表格 ✅</th>
                </tr>
              </thead>
              <tbody>
                {EXCEL_CMP.map((r) => (
                  <tr key={r[0]}>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--border-soft, #eee)', fontWeight: 700, whiteSpace: 'nowrap' }}>{r[0]}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--border-soft, #eee)', color: 'var(--text-soft)' }}>{r[1]}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--border-soft, #eee)', color: 'var(--ok)' }}>{r[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Callout type="tip" style={{ marginTop: 12 }}>
            <b>结论：</b>Markdown 表格是「<b>纯文本优先</b>」——AI 零解析损耗、依据可核对、可 diff、可进版本库；
            Excel 是二进制格式，AI 读取要解析、易出错，且你很难验证 AI 到底读了什么。给 AI 喂数据，Markdown 是更优解。
          </Callout>
        </div>
      </Section>

      <Section num={4} title="练习：完成任意一种分析">
        <Exercise num={1} title="用 AI 完成一次表格分析（统计 / 问答 / 异常 / 图表任选其一）" done={done} doneLabel="数据分析师">
          <p style={{ marginTop: 0, fontSize: 13.5, color: 'var(--text-soft)' }}>
            操作提示：建议按「<b>描述 → 诊断 → 验证 → 判断</b>」四步走——
            先用「统计摘要」看全貌 → 用「趋势与占比」看变化 → 用「异常检测」找问题（提示：武汉 5 月成本 99999、6 月销量 99999，
            还有一行「毛利 ≠ 销售额 - 成本」）→ 最后用「表格问答」验证你的判断。
            完成任意一种分析即可通关。
          </p>
          {done && (
            <Callout type="tip">
              <b>🎉 数据分析师！</b>你已经会用 AI 读表格了。下一课「让 AI 帮你写 SQL」——
              学会用一句话让 AI 从数据库里取数。
            </Callout>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
