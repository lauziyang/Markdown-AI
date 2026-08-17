import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'
import { simulateStream, aiConvertText } from '../../../lib/ai.js'
import { copyText } from '../../../lib/utils.js'

/* 场景 A 预置示例：一段没有格式的纯文本 */
const TEXT_SAMPLE = `本周工作汇报
1. 完成了登录模块的开发与联调
2. 修复了三个线上 bug，并补充了回归测试
3. 更新了接口文档，标注了变更点

下周计划
- 推进性能优化
- 组织一次代码评审
负责人：小明
日期：周五`

/* 场景 B 预置示例：一段平铺、层级不清的 Markdown */
const MD_SAMPLE = `# 本周工作汇报

本周完成：
1. 完成登录模块开发
2. 修复三个线上 bug
3. 更新接口文档
下周计划：
- 性能优化
- 代码评审
风险：第三方接口不稳定`

/* 场景 C 示例结果：一段「公文风」Markdown（模拟 Word 识别后的输出） */
const WORD_SAMPLE = `# 关于举办技术培训的通知

各科室：

为提升团队 Markdown 写作能力，现定于本周五举办技术培训，有关事项通知如下。

## 培训安排

| 时间 | 内容 | 主讲 |
| ---- | ---- | ---- |
| 09:00 | Markdown 基础 | 张老师 |
| 10:30 | AI 辅助写作 | 李老师 |

## 注意事项

1. 请自带笔记本电脑
2. 请提前安装 VS Code
3. 会议期间请保持安静

特此通知。

办公室
2025年__月__日`

const TABS = [
  { id: 'text', icon: '📝', label: '纯文本 → Markdown' },
  { id: 'md', icon: '🧱', label: 'Markdown → 更结构化' },
  { id: 'word', icon: '📄', label: 'Word → Markdown（示意）' },
]

/* 场景 C 的示意流程步骤 */
const WORD_STEPS = ['上传 Word', 'AI 识别', '内容转换', '输出 Markdown']

/* 复制按钮（复用 copyText） */
function CopyBtn({ text }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      className="btn btn-sm"
      disabled={!text}
      onClick={async () => {
        await copyText(text)
        setOk(true)
        setTimeout(() => setOk(false), 1500)
      }}
    >
      {ok ? '✓ 已复制' : '📋 复制结果'}
    </button>
  )
}

/* 场景 B 的轻量转换：平铺 Markdown → 标题 + 列表 + 表格（简单启发式） */
function structureMd(text) {
  const lines = (text || '').split('\n').map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return ''
  const out = []
  const items = []
  let first = true
  for (const line of lines) {
    if (first) {
      out.push(`# ${line.replace(/^#+\s*/, '')}`)
      first = false
      continue
    }
    if (/^#{1,6}\s/.test(line)) {
      out.push('', line)
      continue
    }
    if (/[：:]\s*$/.test(line)) {
      out.push('', `## ${line.replace(/[：:]\s*$/, '')}`, '')
      continue
    }
    const num = line.match(/^(\d+)[.、]\s*(.*)$/)
    if (num) {
      out.push(`1. ${num[2]}`)
      items.push(num[2])
      continue
    }
    const dash = line.match(/^[-*•]\s*(.*)$/)
    if (dash) {
      out.push(`- ${dash[1]}`)
      items.push(dash[1])
      continue
    }
    const kv = line.match(/^([^：:]{1,12})[：:](.*)$/)
    if (kv) {
      out.push(`**${kv[1]}**：${kv[2]}`)
      continue
    }
    out.push(line)
    items.push(line)
  }
  out.push('', '## 本周概览', '', '| 分类 | 数量 |', '| ---- | ---- |', `| 工作事项 | ${items.length} 项 |`, '| 待办完成 | 进行中 |')
  return out.join('\n')
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default function Converter() {
  const { done, markDone } = useLessonComplete('converter')
  const [tab, setTab] = useState('text')

  /* 场景 A：纯文本 → Markdown */
  const [textInput, setTextInput] = useState(TEXT_SAMPLE)
  const [textResult, setTextResult] = useState('')
  const [textBusy, setTextBusy] = useState(false)
  const [textClicked, setTextClicked] = useState(false)

  /* 场景 B：Markdown → 更结构化 */
  const [mdInput, setMdInput] = useState(MD_SAMPLE)
  const [mdResult, setMdResult] = useState('')
  const [mdBusy, setMdBusy] = useState(false)
  const [mdClicked, setMdClicked] = useState(false)

  /* 场景 C：Word → Markdown（示意流程动画） */
  const [wordStep, setWordStep] = useState(0)
  const [wordRunning, setWordRunning] = useState(false)
  const [wordPreview, setWordPreview] = useState('')
  const [wordClicked, setWordClicked] = useState(false)

  const runText = async () => {
    if (textBusy) return
    setTextBusy(true)
    setTextClicked(true)
    setTextResult('')
    await simulateStream(aiConvertText(textInput), (c) => setTextResult(c), 18)
    setTextBusy(false)
  }

  const runMd = async () => {
    if (mdBusy) return
    setMdBusy(true)
    setMdClicked(true)
    setMdResult('')
    await simulateStream(structureMd(mdInput), (c) => setMdResult(c), 18)
    setMdBusy(false)
  }

  const runWord = async () => {
    if (wordRunning) return
    setWordRunning(true)
    setWordClicked(true)
    setWordStep(0)
    setWordPreview('')
    for (let i = 1; i <= 4; i++) {
      await sleep(450)
      setWordStep(i)
    }
    await simulateStream(WORD_SAMPLE, (c) => setWordPreview(c), 22)
    setWordRunning(false)
  }

  /* 三个场景都完成一次转换（点击过转换按钮且编辑器有输出） */
  const textDone = textClicked && textResult.trim().length > 0
  const mdDone = mdClicked && mdResult.trim().length > 0
  const wordDone = wordClicked && wordPreview.trim().length > 0
  const passed = textDone && mdDone && wordDone
  useEffect(() => {
    if (passed) markDone()
  }, [passed, markDone])

  const tabDone = (id) => (id === 'text' ? textDone : id === 'md' ? mdDone : wordDone)

  return (
    <LessonPage
      id="converter"
      module="m6"
      moduleName="模块六 · AI 辅助"
      time="20min"
      icon="🔄"
      title="AI 格式转换器"
      subtitle="纯文本、平铺的 Markdown、Word 文档——让 AI 把它们统统变成结构清晰的 Markdown。"
      goals={['把纯文本转成 Markdown', '把平铺内容整理成表格 / 列表 / 代码块', '了解 Word 转 Markdown 的真实流程']}
    >
      <Section num={1} title="三种转换场景">
        <Callout type="info" title="先说明：同样是「模拟 AI」">
          本页转换由 <code>lib/ai.js</code> 的本地函数完成，不需要 API Key。
          场景 ③ 的 Word 解析是<b>示意流程</b>——真实项目里接上文档解析服务即可实现。
        </Callout>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`btn btn-sm ${tab === t.id ? 'btn-primary' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label} {tabDone(t.id) ? ' ✅' : ''}
            </button>
          ))}
        </div>

        {tab === 'text' && (
          <div>
            <Callout type="tip" title="怎么玩">
              把一段<b>没有格式的纯文本</b>贴进左边（已预置示例），点「AI 转换」，
              AI 会自动识别标题、列表、标签并转成 Markdown，右边实时预览。转换完可以复制结果。
            </Callout>
            <div className="grid-2" style={{ alignItems: 'flex-start' }}>
              <div className="card" style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📥 原始纯文本</div>
                <textarea
                  className="ex-input"
                  rows={8}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
                <div style={{ marginTop: 10 }}>
                  <button className="btn btn-primary" onClick={runText} disabled={textBusy}>
                    {textBusy ? '⏳ AI 转换中…' : '🤖 AI 转换'}
                  </button>
                  {textDone && <span className="chip chip-ok" style={{ marginLeft: 8 }}>✅ 转换完成</span>}
                </div>
              </div>
              <div className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>📤 转换结果（Markdown）</span>
                  <span style={{ marginLeft: 'auto' }}>
                    <CopyBtn text={textResult} />
                  </span>
                </div>
                <MdEditor value={textResult} onChange={setTextResult} height={280} showStats={false} />
              </div>
            </div>
          </div>
        )}

        {tab === 'md' && (
          <div>
            <Callout type="tip" title="怎么玩">
              给 AI 一段<b>平铺的 Markdown</b>（内容挤在一起、层级不清），
              AI 会把它整理成<b>标题 + 列表 + 表格</b>的结构化文档，右边实时预览。
            </Callout>
            <div className="grid-2" style={{ alignItems: 'flex-start' }}>
              <div className="card" style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📥 平铺的 Markdown</div>
                <textarea
                  className="ex-input"
                  rows={8}
                  value={mdInput}
                  onChange={(e) => setMdInput(e.target.value)}
                />
                <div style={{ marginTop: 10 }}>
                  <button className="btn btn-primary" onClick={runMd} disabled={mdBusy}>
                    {mdBusy ? '⏳ AI 整理中…' : '🤖 AI 转成结构化'}
                  </button>
                  {mdDone && <span className="chip chip-ok" style={{ marginLeft: 8 }}>✅ 转换完成</span>}
                </div>
              </div>
              <div className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>📤 结构化结果</span>
                  <span style={{ marginLeft: 'auto' }}>
                    <CopyBtn text={mdResult} />
                  </span>
                </div>
                <MdEditor value={mdResult} onChange={setMdResult} height={280} showStats={false} />
              </div>
            </div>
          </div>
        )}

        {tab === 'word' && (
          <div>
            <Callout type="warn" title="本页做不了真实 Word 解析">
              Word 是二进制格式，浏览器里直接解析很麻烦。这里展示的是<b>示意流程</b>：
              真实产品里，上传 Word 后由 AI 识别内容、再转成 Markdown。下面我们用动画模拟整个过程。
            </Callout>
            <div className="demo-frame" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <b>📄 Word → Markdown 示意流程</b>
                {wordRunning ? (
                  <span className="chip chip-accent">⏳ 处理中，请稍候…</span>
                ) : wordDone ? (
                  <span className="chip chip-ok">✅ 转换完成</span>
                ) : (
                  <span className="chip">未开始</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {WORD_STEPS.map((s, i) => (
                  <span
                    key={s}
                    className="chip"
                    style={{
                      opacity: wordStep > i ? 1 : 0.45,
                      background: wordStep > i ? 'var(--accent-soft)' : 'var(--bg-soft)',
                      color: wordStep > i ? 'var(--accent)' : 'var(--text-faint)',
                    }}
                  >
                    {wordStep > i ? '✓ ' : ''}{['📤', '🔍', '🔄', '📄'][i]} {s}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <button className="btn btn-primary" onClick={runWord} disabled={wordRunning}>
                  {wordRunning ? '⏳ 模拟转换中…' : wordClicked ? '🔄 再演示一次' : '📤 模拟上传 Word 文档'}
                </button>
              </div>
            </div>
            {wordPreview && (
              <div className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>📤 识别出的 Markdown（示例结果）</span>
                  <span style={{ marginLeft: 'auto' }}>
                    <CopyBtn text={wordPreview} />
                  </span>
                </div>
                <MdEditor value={wordPreview} onChange={setWordPreview} height={300} showStats={false} />
              </div>
            )}
          </div>
        )}
      </Section>

      <Section num={2} title="动手练习">
        <Exercise num={1} title="格式转换 · 动手练" done={done} doneLabel="通过">
          <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 12px' }}>
            三个场景各完成一次转换：<b>① 纯文本 → Markdown</b>、<b>② Markdown → 结构化</b>、
            <b>③ Word → Markdown 示意</b>。每个场景点击转换按钮、编辑器出现输出后，对应标签会出现 ✅，
            三个都完成后自动通过。
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className={`chip ${textDone ? 'chip-ok' : ''}`}>{textDone ? '✅ ① 已完成' : '① 待完成'}</span>
            <span className={`chip ${mdDone ? 'chip-ok' : ''}`}>{mdDone ? '✅ ② 已完成' : '② 待完成'}</span>
            <span className={`chip ${wordDone ? 'chip-ok' : ''}`}>{wordDone ? '✅ ③ 已完成' : '③ 待完成'}</span>
          </div>
          {done && (
            <Callout type="tip">
              <b>🎉 通关成功！</b>你已经掌握了 AI 格式转换的三种常见场景，下一课「提示词速查」已解锁。
            </Callout>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
