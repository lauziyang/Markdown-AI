import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import { simulateStream, sqlToMarkdown, aiInterpretResult } from '../../../lib/ai.js'
import { copyText } from '../../../lib/utils.js'

/* 预置示例：一段"查询结果"（制表符分隔，模拟数据库客户端输出） */
const RESULT_SAMPLE = `门店	销量	销售额
上海	1450	4350000
北京	1200	3600000
深圳	1100	3300000
广州	980	2940000
成都	850	2550000
武汉	99999	30000000`

/* Markdown 报告 vs Excel/Word 报告的对比 */
const CMP_ROWS = [
  ['数据来源', '手动复制粘贴、格式易乱', '手动排版、图文分离', '查询结果直接粘成表格，零转换'],
  ['依据可核对', '结论与数据分离，难以回溯', '同上', '结论与表格同文，依据可直接引用'],
  ['版本控制', '二进制无法 git diff', '二进制无法 diff', 'git diff 精确到每一处改动'],
  ['发布分享', '需另存/导出、格式漂移', '需导出 PDF/打印', '进网页、博客、文档即用'],
  ['喂给 AI', '需转换格式才能给 AI', '需先复制成文本', '原生 Markdown，AI 直接读懂'],
  ['成本', '需付费软件', '需付费软件', '纯文本，任何编辑器都能写'],
]

export default function SqlReport() {
  const { done, markDone } = useLessonComplete('sql-report')
  const [resultText, setResultText] = useState(RESULT_SAMPLE)
  const [mdTable, setMdTable] = useState('')
  const [report, setReport] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('convert') // convert | report | why
  const [converted, setConverted] = useState(false)

  const convert = async () => {
    if (!resultText.trim() || busy) return
    setBusy(true)
    setMdTable('')
    const md = sqlToMarkdown(resultText)
    await simulateStream(md, (c) => setMdTable(c), 8)
    setBusy(false)
    setConverted(true)
  }

  const genReport = async () => {
    if (!mdTable.trim() || busy) return
    setBusy(true)
    setReport('')
    const r = aiInterpretResult(mdTable)
    await simulateStream(r, (c) => setReport(c), 10)
    setBusy(false)
  }

  const passed = converted && report.length > 20
  useEffect(() => {
    if (passed) markDone()
  }, [passed, markDone])

  return (
    <LessonPage
      id="sql-report"
      module="m5"
      moduleName="模块五 · AI 辅助与数据分析"
      time="30min"
      icon="📈"
      title="查询结果 → AI 解读 → 报告"
      subtitle="SQL 查完数据只是第一步——把结果转成 Markdown 表格，让 AI 帮你解读成一份带结论和依据的分析报告。"
      goals={['会把 SQL 查询结果转成 Markdown 表格', '会让 AI 基于表格生成带依据的分析报告', '理解 Markdown 报告相比 Excel / Word 的优势']}
    >
      <Section num={1} title="完整数据链路：四步闭环">
        <div className="demo-frame">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13.5 }}>
            <span className="chip chip-accent">① 自然语言提问</span> →
            <span className="chip chip-accent">② AI 生成 SQL</span> →
            <span className="chip chip-accent">③ 查询结果转 Markdown 表格</span> →
            <span className="chip chip-accent">④ AI 解读生成报告</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 10, lineHeight: 1.8 }}>
            上一课学了 ①②，这一课打通 ③④。<b>注意：整条链路里数据始终是「纯文本 Markdown」</b>——
            这是它能被 AI 读取、能进 git、能被任何人复现的关键。
          </div>
        </div>
      </Section>

      <Section num={2} title="三步实操（按顺序点）">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {[
            { id: 'convert', icon: '🔁', label: '① 结果转表格' },
            { id: 'report', icon: '🤖', label: '② AI 解读报告' },
            { id: 'why', icon: '💡', label: '③ 为什么是 Markdown？' },
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

        {/* ① 结果转表格 */}
        {tab === 'convert' && (
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <b>🔁 查询结果 → Markdown 表格</b>
              <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>支持 | / 制表符 / 逗号分隔的查询结果</span>
              <button className="btn btn-sm btn-primary" style={{ marginLeft: 'auto' }} onClick={convert} disabled={busy}>
                {busy ? '⏳ 转换中…' : '🔁 转换'}
              </button>
            </div>
            <textarea
              className="ex-input"
              style={{ width: '100%', minHeight: 130, boxSizing: 'border-box', fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 12.5 }}
              placeholder={'粘贴数据库客户端输出的查询结果…\n支持：\n  门店\t销量\t销售额 （制表符）\n  门店|销量|销售额 （管道）'}
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
            />
            {mdTable && (
              <>
                <div style={{ fontSize: 12.5, fontWeight: 700, margin: '12px 0 6px', color: 'var(--ok)' }}>
                  ✅ 生成的 Markdown 表格（可复制进任意文档）
                </div>
                <pre
                  style={{
                    background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10,
                    padding: '12px 14px', fontSize: 13, lineHeight: 1.8, margin: 0, overflowX: 'auto',
                  }}
                >
                  {mdTable}
                </pre>
                <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => copyText(mdTable)}>📋 复制表格</button>
              </>
            )}
          </div>
        )}

        {/* ② AI 解读报告 */}
        {tab === 'report' && (
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <b>🤖 AI 解读 → 分析报告</b>
              <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>数据先行、结论殿后，每条结论都带依据</span>
              <button className="btn btn-sm btn-primary" style={{ marginLeft: 'auto' }} onClick={genReport} disabled={busy || !mdTable}>
                {busy ? '⏳ 分析中…' : '🤖 生成报告'}
              </button>
            </div>
            {!mdTable && <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: 0 }}>先到「① 结果转表格」把查询结果转换一下，再回来生成报告。</p>}
            {report && (
              <pre
                style={{
                  background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10,
                  padding: '12px 14px', fontSize: 13, lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap',
                }}
              >
                {report}
              </pre>
            )}
          </div>
        )}

        {/* ③ 为什么是 Markdown？ */}
        {tab === 'why' && (
          <div className="card" style={{ padding: '16px 18px' }}>
            <b style={{ display: 'block', marginBottom: 10 }}>💡 同样的报告，为什么用 Markdown 而不是 Excel / Word？</b>
            <div style={{ overflowX: 'auto' }}>
              <table className="cmp-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 620 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border)' }}>维度</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border)' }}>Excel 报告</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border)' }}>Word 报告</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border)' }}>Markdown 报告 ✅</th>
                  </tr>
                </thead>
                <tbody>
                  {CMP_ROWS.map((r) => (
                    <tr key={r[0]}>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--border-soft, #eee)', fontWeight: 700, whiteSpace: 'nowrap' }}>{r[0]}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--border-soft, #eee)', color: 'var(--text-soft)' }}>{r[1]}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--border-soft, #eee)', color: 'var(--text-soft)' }}>{r[2]}</td>
                      <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--border-soft, #eee)', color: 'var(--ok)' }}>{r[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Callout type="tip" style={{ marginTop: 12 }}>
              <b>一句话总结：</b>数据分析报告的终点不该是「某个软件的私有格式」，而应是<b>可读、可查、可版本控制、可喂给 AI</b> 的纯文本——
              Markdown 就是这条链路的最佳载体。
            </Callout>
          </div>
        )}
      </Section>

      <Section num={3} title="练习：完成一条完整链路">
        <Exercise num={1} title="完成「结果转表格 + AI 生成报告」两步" done={done} doneLabel="数据报告师">
          <p style={{ marginTop: 0, fontSize: 13.5, color: 'var(--text-soft)' }}>
            推荐流程：① 点「转换」把示例查询结果变成表格 → ② 切到「AI 解读报告」点「生成报告」→
            观察报告里的<b>「依据：……」</b>——每一条结论都能回溯到表格里的哪一行，这就是 Markdown 报告的核心优势。
            （提示：示例数据里武汉那行藏了个异常值，看看 AI 发现了没有。）
          </p>
          {done && (
            <Callout type="tip">
              <b>🎉 数据报告师！</b>你已经打通「提问 → SQL → 表格 → 报告」完整链路。下一课「AI + SQL 的边界与规范」，
              学学哪些事情不能交给 AI。
            </Callout>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
