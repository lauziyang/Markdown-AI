import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'
import Quiz from '../../../components/Quiz.jsx'
import { simulateStream, aiDocReport, aiSummary, aiStyleAnalyze, aiGenerateQuiz } from '../../../lib/ai.js'

/* 预置示例文档：故意留了几处待改进点（无表格、无链接、行尾空格、口语词） */
const SAMPLE_DOC = `# 给新同学的 Markdown 入门指南

## 为什么学 Markdown

Markdown 是一种轻量级标记语言，用简单的符号就能写出结构清晰的文档，学习成本低，其实迁移性也挺强的，一份 Markdown 可以到处用。  
GitHub、Notion、飞书文档都支持它，学会之后写笔记、写文档的效率会明显提升吧。

## 怎么开始

安装一个支持 Markdown 的编辑器，比如 VS Code，装上 Markdown 插件就能边写边预览。第一次写建议从标题和列表开始，然后逐步尝试表格、代码块和链接。

## 常见误区

- 标题的 # 后面一定要有空格
- 列表符号要用 - 加空格
- 中文标点不要和 Markdown 符号混在一起
`

export default function DocAnalyze() {
  const { done, markDone } = useLessonComplete('doc-analyze')
  const [src, setSrc] = useState(SAMPLE_DOC)
  const [tab, setTab] = useState('report')
  const [report, setReport] = useState(null)
  const [history, setHistory] = useState([]) // 评分-修改-再评分 的分数历史
  const [styleResult, setStyleResult] = useState(null)
  const [summary, setSummary] = useState('')
  const [quiz, setQuiz] = useState(null)
  const [busy, setBusy] = useState(false)
  const [quizPassed, setQuizPassed] = useState(false)

  const runReport = async () => {
    setBusy(true)
    setReport(null)
    await new Promise((r) => setTimeout(r, 500))
    const r = aiDocReport(src)
    setReport(r)
    // 记录本次评分（反馈循环）
    const t = new Date()
    setHistory((h) => [...h, { score: r.score, time: `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}` }])
    setBusy(false)
  }

  const runSummary = async () => {
    setBusy(true)
    setSummary('')
    const result = aiSummary(src)
    await simulateStream(result, (c) => setSummary(c), 12)
    setBusy(false)
  }

  const runStyle = async () => {
    setBusy(true)
    setStyleResult(null)
    await new Promise((r) => setTimeout(r, 400))
    setStyleResult(aiStyleAnalyze(src))
    setBusy(false)
  }

  const runQuiz = () => {
    setBusy(true)
    setTimeout(() => {
      setQuiz(aiGenerateQuiz(src))
      setBusy(false)
    }, 500)
  }

  const improved = history.length >= 2 && history[history.length - 1].score > history[0].score
  const passed = improved || summary.length > 20 || styleResult !== null || quizPassed
  useEffect(() => {
    if (passed) markDone()
  }, [passed, markDone])

  return (
    <LessonPage
      id="doc-analyze"
      module="m5"
      moduleName="模块五 · AI 辅助与数据分析"
      time="40min"
      icon="🧠"
      title="文档智能分析"
      subtitle="写完文档只是第一步——让 AI 给文档做体检、看语言风格、提取摘要，甚至直接从文档出几道测验题，还能「评分-修改-再评分」见证进步。"
      goals={['会用 AI 给文档做结构化体检并改进', '体验「评分-修改-再评分」的反馈循环', '会用 AI 分析语言风格并调整语气', '会用 AI 提取摘要、生成测验题']}
    >
      <Section num={1} title="输入一篇文档">
        <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: '0 0 12px' }}>
          下面是预置示例（藏了几处待改进点），也可以换成你自己的文档。之后在下方<b>切换 4 种分析能力</b>。
        </p>
        <MdEditor
          value={src}
          onChange={setSrc}
          height={240}
          placeholder="粘贴或输入一篇 Markdown 文档…"
          hint="示例文档：标题层级、加粗、列表齐全，但没有表格、没有链接、行尾有空格，还藏了两个口语词——看看 AI 能不能发现"
        />
      </Section>

      <Section num={2} title="4 种分析能力（点标签切换）">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {[
            { id: 'report', icon: '🩺', label: '文档体检' },
            { id: 'style', icon: '🎨', label: '语言风格' },
            { id: 'summary', icon: '📋', label: '摘要提取' },
            { id: 'quiz', icon: '🎯', label: 'AI 出题' },
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

        {/* 文档体检 + 评分-修改-再评分反馈循环 */}
        {tab === 'report' && (
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <b>🩺 文档体检报告</b>
              <button className="btn btn-sm btn-primary" style={{ marginLeft: 'auto' }} onClick={runReport} disabled={busy}>
                {busy ? '⏳ 体检中…' : '🩺 开始体检'}
              </button>
            </div>

            {/* 反馈循环：历史评分 */}
            {history.length > 0 && (
              <div className="demo-frame" style={{ marginBottom: 12 }}>
                <b style={{ display: 'block', marginBottom: 8 }}>📈 评分-修改-再评分（反馈循环）</b>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
                  {history.map((h, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 20, fontWeight: 900, padding: '4px 10px', borderRadius: 8,
                          color: h.score >= 80 ? 'var(--ok)' : h.score >= 60 ? 'var(--warn)' : '#e11d48',
                          background: 'var(--bg-soft)',
                        }}
                      >
                        {h.score}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
                        {i === 0 ? '首次' : `第${i + 1}次`} {h.time}
                      </div>
                    </div>
                  ))}
                  {history.length >= 2 && (
                    <div style={{ padding: '4px 10px', borderRadius: 8, background: 'var(--bg-soft)' }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>
                        {improved ? '⬆️ 分数提升！' : history[history.length - 1].score === history[0].score ? '➡️ 分数持平' : '⬇️ 分数下降'}
                      </span>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                        {history[history.length - 1].score - history[0].score >= 0 ? `+${history[history.length - 1].score - history[0].score}` : history[history.length - 1].score - history[0].score}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 8 }}>
                  💡 玩法：看完建议 → 去上方编辑器修改文档 → 再点「开始体检」→ 观察分数变化。改得越到位，分数涨得越多。
                </div>
              </div>
            )}

            {report ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 34, fontWeight: 900, color: report.score >= 80 ? 'var(--ok)' : report.score >= 60 ? 'var(--warn)' : '#e11d48' }}>
                      {report.score}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>结构评分 / 100</div>
                  </div>
                  <div className="progress-track" style={{ flex: 1, height: 10 }}>
                    <i style={{ width: `${report.score}%`, background: report.score >= 80 ? 'var(--ok)' : report.score >= 60 ? 'var(--warn)' : '#e11d48' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
                  {report.checks.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, lineHeight: 1.6 }}>
                      <span style={{ width: 22, textAlign: 'center' }}>{c.ok ? '✅' : '⬜'}</span>
                      <b style={{ flexShrink: 0 }}>{c.name}</b>
                      <span style={{ color: c.ok ? 'var(--ok)' : 'var(--text-faint)', fontSize: 12.5 }}>{c.tip}</span>
                    </div>
                  ))}
                </div>
                {report.suggestions.length > 0 && (
                  <div className="demo-frame">
                    <b style={{ display: 'block', marginBottom: 6 }}>💡 改进建议</b>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.9 }}>
                      {report.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: 0 }}>
                点击「开始体检」，AI 会从标题层级、表格、代码块、链接、排版规范等维度给文档打分。
                建议体检 ≥ 2 次（修改后再检一次），体验「评分-修改-再评分」反馈循环。
              </p>
            )}
          </div>
        )}

        {/* 语言风格分析 */}
        {tab === 'style' && (
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <b>🎨 语言风格分析</b>
              <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>正式/口语程度、语气强度、句长分布</span>
              <button className="btn btn-sm btn-primary" style={{ marginLeft: 'auto' }} onClick={runStyle} disabled={busy}>
                {busy ? '⏳ 分析中…' : '🎨 分析风格'}
              </button>
            </div>
            {styleResult ? (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span className="chip chip-accent">🎭 风格：{styleResult.style}</span>
                  <span className="chip">🗣️ 语气：{styleResult.tone}</span>
                  <span className="chip">📏 平均句长：{styleResult.avgLen} 字</span>
                </div>
                <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 13.5 }}>
                    <b>📊 句子长度分布</b>（共 {styleResult.dist.total} 句）
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <div style={{ flex: styleResult.dist.short || 1, background: 'var(--accent)', opacity: 0.85, borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 12.5, minWidth: 60 }}>
                        短句 {styleResult.dist.short}
                      </div>
                      <div style={{ flex: styleResult.dist.mid || 1, background: 'var(--warn)', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 12.5, minWidth: 60 }}>
                        中句 {styleResult.dist.mid}
                      </div>
                      <div style={{ flex: styleResult.dist.long || 1, background: '#e11d48', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 12.5, minWidth: 60 }}>
                        长句 {styleResult.dist.long}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13.5 }}>
                    <b>🔍 特征统计</b>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                      <span className="chip">口语词 {styleResult.counts.oral} 处</span>
                      <span className="chip">书面词 {styleResult.counts.formal} 处</span>
                      <span className="chip">感叹号 {styleResult.counts.exclaim} 个</span>
                      <span className="chip">问句 {styleResult.counts.question} 个</span>
                    </div>
                  </div>
                </div>
                <div className="demo-frame">
                  <b style={{ display: 'block', marginBottom: 6 }}>💡 风格建议</b>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.9 }}>
                    {styleResult.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                  <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 8 }}>
                    想改成正式公文风？把文档交给配套的 <b>md2doc 工具</b>（模块五 · AI 辅助写作页有在线转换器）即可直接生成公文 docx。
                  </div>
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: 0 }}>
                点击「分析风格」，AI 会从口语/书面用词、语气强度、句子长度分布三个维度给文档做「风格体检」。
              </p>
            )}
          </div>
        )}

        {/* 摘要提取 */}
        {tab === 'summary' && (
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <b>📋 全文摘要 + 要点提取</b>
              <button className="btn btn-sm btn-primary" style={{ marginLeft: 'auto' }} onClick={runSummary} disabled={busy}>
                {busy ? '⏳ 摘要中…' : '🤖 生成摘要'}
              </button>
            </div>
            <pre
              style={{
                background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10,
                padding: '12px 14px', fontSize: 13.5, lineHeight: 1.9, minHeight: 100, margin: 0, whiteSpace: 'pre-wrap',
              }}
            >
              {summary || '点击生成，长文变一页纸：摘要 + 章节清单 + 数字统计 + 待办提取。'}
            </pre>
          </div>
        )}

        {/* AI 出题 */}
        {tab === 'quiz' && (
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <b>🎯 AI 出题</b>
              <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>根据文档内容生成测验题，做完还能自测</span>
              <button className="btn btn-sm btn-primary" style={{ marginLeft: 'auto' }} onClick={runQuiz} disabled={busy}>
                {busy ? '⏳ 出题中…' : '🤖 生成 3 道题'}
              </button>
            </div>
            {quiz ? (
              <Quiz
                questions={quiz}
                passScore={66}
                onPass={() => setQuizPassed(true)}
                title="AI 生成的测验"
              />
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: 0 }}>
                点击「生成 3 道题」——注意 AI 出的题质量也需要人工把关，这正是「人机协作」的边界。
              </p>
            )}
          </div>
        )}
      </Section>

      <Section num={3} title="练习：完成任意一种分析">
        <Exercise num={1} title="用 AI 完成一次文档分析（体检 / 风格 / 摘要 / 出题任选其一）" done={done} doneLabel="智能分析师">
          <p style={{ marginTop: 0, fontSize: 13.5, color: 'var(--text-soft)' }}>
            推荐流程：先「🩺 文档体检」看评分和建议 → 按建议改两处再体检，<b>体验「评分-修改-再评分」分数上涨</b> →
            再试试「🎨 语言风格」看藏了什么口语词 → 最后「🎯 AI 出题」用文档内容考考自己。
            完成「修改后再体检且分数提升」即可通过本课练习。
          </p>
          {done && (
            <Callout type="tip">
              <b>🎉 智能分析师！</b>体检反馈循环、风格分析、摘要、出题——你已掌握 AI 处理文档的多种姿势。
              下一课「场景模板库」，用模板 + AI 的组合快速开始任何写作任务。
            </Callout>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
