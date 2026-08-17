import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'
import Quiz from '../../../components/Quiz.jsx'
import { simulateStream, aiDocReport, aiSummary, aiTranslate, aiGenerateQuiz } from '../../../lib/ai.js'

/* 预置示例文档：故意留了几处待改进点（无表格、无链接、行尾空格） */
const SAMPLE_DOC = `# 给新同学的 Markdown 入门指南

## 为什么学 Markdown

Markdown 是一种轻量级标记语言，用简单的符号就能写出结构清晰的文档。学习成本低，迁移性强，一份 Markdown 可以到处用。  
GitHub、Notion、飞书文档都支持它，学会之后写笔记、写文档的效率会明显提升。

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
  const [summary, setSummary] = useState('')
  const [transDir, setTransDir] = useState('zh2en')
  const [transText, setTransText] = useState('')
  const [transOut, setTransOut] = useState('')
  const [quiz, setQuiz] = useState(null)
  const [busy, setBusy] = useState(false)
  const [quizPassed, setQuizPassed] = useState(false)

  const runReport = async () => {
    setBusy(true)
    setReport(null)
    await new Promise((r) => setTimeout(r, 500))
    setReport(aiDocReport(src))
    setBusy(false)
  }

  const runSummary = async () => {
    setBusy(true)
    setSummary('')
    const result = aiSummary(src)
    await simulateStream(result, (c) => setSummary(c), 12)
    setBusy(false)
  }

  const runTranslate = async () => {
    setBusy(true)
    setTransOut('')
    const result = aiTranslate(transText, transDir)
    await simulateStream(result, (c) => setTransOut(c), 10)
    setBusy(false)
  }

  const runQuiz = () => {
    setBusy(true)
    setTimeout(() => {
      setQuiz(aiGenerateQuiz(src))
      setBusy(false)
    }, 500)
  }

  const passed = report?.score >= 60 || summary.length > 20 || transOut.length > 20 || quizPassed
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
      subtitle="写完文档只是第一步——让 AI 给文档做体检、出摘要、翻译润色，甚至直接从文档出几道测验题。"
      goals={['会用 AI 给文档做结构化体检并改进', '会用 AI 提取全文摘要与要点', '理解 AI 翻译的直译/意译差异', '体验 AI 从文档生成测验题']}
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
          hint="示例文档：标题层级、加粗、列表齐全，但没有表格、没有链接、行尾还有空格——看看 AI 能不能发现"
        />
      </Section>

      <Section num={2} title="4 种分析能力（点标签切换）">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {[
            { id: 'report', icon: '🩺', label: '文档体检' },
            { id: 'summary', icon: '📋', label: '摘要提取' },
            { id: 'translate', icon: '🌐', label: 'AI 翻译' },
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

        {/* 文档体检 */}
        {tab === 'report' && (
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <b>🩺 文档体检报告</b>
              <button className="btn btn-sm btn-primary" style={{ marginLeft: 'auto' }} onClick={runReport} disabled={busy}>
                {busy ? '⏳ 体检中…' : '🩺 开始体检'}
              </button>
            </div>
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
              <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: 0 }}>点击「开始体检」，AI 会从标题层级、表格、代码块、链接、排版规范等维度给文档打分。</p>
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

        {/* 翻译 */}
        {tab === 'translate' && (
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <b>🌐 AI 翻译</b>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { id: 'zh2en', label: '中 → 英' },
                  { id: 'en2zh', label: '英 → 中' },
                ].map((d) => (
                  <button key={d.id} className={`btn btn-sm ${transDir === d.id ? 'btn-primary' : ''}`} onClick={() => setTransDir(d.id)}>
                    {d.label}
                  </button>
                ))}
              </div>
              <button className="btn btn-sm btn-primary" style={{ marginLeft: 'auto' }} onClick={runTranslate} disabled={busy || !transText.trim()}>
                {busy ? '⏳ 翻译中…' : '🤖 翻译'}
              </button>
            </div>
            <textarea
              className="ex-input"
              style={{ width: '100%', minHeight: 90, boxSizing: 'border-box', fontFamily: 'inherit' }}
              placeholder="输入要翻译的文字…"
              value={transText}
              onChange={(e) => setTransText(e.target.value)}
            />
            {transOut && (
              <div className="demo-frame" style={{ marginTop: 12, whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.8 }}>
                {transOut}
              </div>
            )}
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
        <Exercise num={1} title="用 AI 完成一次文档分析（体检 / 摘要 / 翻译 / 出题任选其一）" done={done} doneLabel="智能分析师">
          <p style={{ marginTop: 0, fontSize: 13.5, color: 'var(--text-soft)' }}>
            推荐流程：先「🩺 文档体检」看评分和建议 → 按建议改两处再体检对比分数变化 →
            最后「🎯 AI 出题」用文档内容考考自己。体检分数 60+ 就算通过本课练习。
          </p>
          {done && (
            <Callout type="tip">
              <b>🎉 智能分析师！</b>体检、摘要、翻译、出题——你已掌握 AI 处理文档的四种姿势。
              下一课「场景模板库」，用模板 + AI 的组合快速开始任何写作任务。
            </Callout>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
