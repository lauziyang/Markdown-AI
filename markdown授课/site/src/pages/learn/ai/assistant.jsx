import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'
import { simulateStream, aiOutline, aiPolish, estimateHandwriteTime, estimateAIWriteTime } from '../../../lib/ai.js'

/* 开场概览：AI 辅助写作的 4 个场景 */
const CARDS = [
  { icon: '✍️', name: '内容生成', sub: '写大纲、列要点', demo: '输入一个主题，AI 立刻给你一份结构完整的 Markdown 大纲，不用再从空白页开始发愁。' },
  { icon: '🧹', name: '格式优化', sub: '补语法、规范排版', demo: '标题的 # 忘加空格？列表符号不统一？AI 一键把整篇文档的格式规范到位。' },
  { icon: '✨', name: '内容润色', sub: '改表达、调风格', demo: '把「我弄好了」改成「已完成并验证」，AI 能按你要求的语气重写整段内容。' },
  { icon: '🔄', name: '格式转换', sub: '纯文本 / MD / Word 互转', demo: '把一段没有格式的纯文本，或 Word 文档，转成结构清晰的 Markdown（下一页实操）。' },
]

/* 对比 aiPolish 前后，找出这次优化到底改了什么（用于提示优化点） */
function detectPolishPoints(before, after) {
  const pts = []
  if (/^#{1,6}[^ #\n]/m.test(before)) pts.push('标题的「#」后面补上了空格：#标题 → # 标题')
  if (/\n{3,}/.test(before)) pts.push('合并了连续 3 行以上的空行，段落间距更统一')
  if (/[ \t]+$/m.test(before)) pts.push('清除了行尾的多余空格')
  if (/^(\s*)[*+](?=\s)/m.test(before)) pts.push('把 * / + 列表符号统一成 - 并保证后面有空格')
  const ls = (before || '').split('\n')
  const hi = ls.findIndex((l) => /^#{1,6} /.test(l))
  if (hi > 0 && ls[hi - 1].trim() !== '') pts.push('给标题前后补上了空行，层级结构更清晰')
  if (!pts.length && before !== after) pts.push('做了一些空白与换行的细节规范')
  if (!pts.length) pts.push('这份内容已经很规范了，几乎不用改 👍')
  return pts
}

/* 效率对比条 */
function TimeBar({ label, mins, max, color }) {
  const pct = Math.max(6, Math.round((mins / Math.max(max, 1)) * 100))
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-soft)' }}>{label}</span>
        <b>约 {mins} 分钟</b>
      </div>
      <div style={{ height: 14, borderRadius: 8, background: 'var(--bg-soft)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 8, background: color, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

export default function Assistant() {
  const { done, markDone } = useLessonComplete('assistant')
  const [active, setActive] = useState(0)
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genStarted, setGenStarted] = useState(false)
  const [optPoints, setOptPoints] = useState([])
  const [polished, setPolished] = useState(false)

  /* 生成大纲：用 simulateStream 模拟 AI 逐字输出 */
  const runGenerate = async () => {
    if (generating) return
    const t = topic.trim() || '我的主题'
    setGenerating(true)
    setOptPoints([])
    setPolished(false)
    setContent('')
    const outline = aiOutline(t)
    await simulateStream(outline, (chunk) => setContent(chunk), 16)
    setGenerating(false)
    setGenStarted(true)
  }

  /* 一键格式优化：aiPolish 回填 + 提示优化点 */
  const runPolish = () => {
    if (!content.trim() || generating) return
    const before = content
    const after = aiPolish(before)
    setContent(after)
    setOptPoints(detectPolishPoints(before, after))
    setPolished(true)
  }

  const hand = estimateHandwriteTime(content)
  const ai = estimateAIWriteTime(content)
  const savedPct = Math.round((1 - ai / hand) * 100)
  const hasContent = content.trim().length > 0

  /* 练习：点击过「AI 生成大纲」且编辑器内容超过 100 字符 */
  const passed = genStarted && content.trim().length > 100
  useEffect(() => {
    if (passed) markDone()
  }, [passed, markDone])

  return (
    <LessonPage
      id="assistant"
      module="m6"
      moduleName="模块六 · AI 辅助"
      time="20min"
      icon="🤖"
      title="AI 辅助写作"
      subtitle="让 AI 帮你写大纲、规范格式、润色表达——花 10 分钟体验「人机协作」的现代写作方式。"
      goals={['了解 AI 能帮 Markdown 写作做什么', '用 AI 生成一份大纲，并在此基础上继续完善', '体验效率对比与一键格式优化']}
    >
      <Section num={1} title="AI + Markdown：能帮你做什么？">
        <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: '0 0 14px' }}>
          下面 4 个场景是 AI 辅助写作最常见的玩法。<b>点一点卡片</b>，看看每个场景的演示说明。
        </p>
        <div className="grid-2">
          {CARDS.map((c, i) => (
            <div
              className="card"
              key={c.name}
              onClick={() => setActive(i)}
              style={{
                padding: '14px 16px',
                cursor: 'pointer',
                borderColor: active === i ? 'var(--accent)' : undefined,
                boxShadow: active === i ? '0 0 0 3px var(--accent-soft)' : undefined,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{c.icon}</span>
                <div>
                  <b style={{ display: 'block' }}>{c.name}</b>
                  <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{c.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="demo-frame" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>{CARDS[active].icon}</span>
            <b>{CARDS[active].name}</b>
            <span className="chip chip-accent" style={{ marginLeft: 'auto' }}>一句话演示</span>
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-soft)', lineHeight: 1.7 }}>{CARDS[active].demo}</div>
        </div>
      </Section>

      <Section num={2} title="实操：用 AI 写一份 Markdown（10 分钟）">
        <Callout type="info" title="先说明：这是「模拟 AI」">
          本页的 AI 功能都是<b>本地模拟</b>的——不需要 API Key、不花钱、不联网，点按钮就能看到逐字流式输出。
          以后想接真实大模型（DeepSeek / GPT / 通义千问…），把 <code>lib/ai.js</code> 里的函数换成真实接口调用即可，页面不用改。
        </Callout>
        <Exercise num={1} title="AI 辅助写作 · 动手练" done={done} doneLabel="通过">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
            <input
              className="ex-input"
              style={{ flex: 1, minWidth: 220 }}
              placeholder="输入一个主题，例如：用 Python 做数据分析"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button className="btn btn-primary" onClick={runGenerate} disabled={generating}>
              {generating ? '⏳ 正在生成…' : genStarted ? '🔄 换个主题重新生成' : '🤖 AI 生成大纲'}
            </button>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)', margin: '-6px 0 12px' }}>
            主题留空也可以，默认生成「我的主题」的教程大纲。
          </div>
          <MdEditor
            value={content}
            onChange={setContent}
            height={380}
            placeholder="生成的 Markdown 大纲会出现在这里，之后你可以自由编辑…"
            hint={
              generating
                ? '⏳ AI 正在逐字生成大纲，请稍候，不要急着编辑…'
                : genStarted
                  ? '🎉 生成完成！现在它是你的文档了，随便改：补充内容、删减小节、调整顺序…'
                  : '点上方「AI 生成大纲」，大纲会流式写入这个编辑器'
            }
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
            <button className="btn" onClick={runPolish} disabled={!hasContent || generating}>
              🧹 AI 优化格式
            </button>
            {polished && optPoints.length > 0 && (
              <span className="chip chip-ok">✅ 已优化并回填到编辑器</span>
            )}
          </div>
          {polished && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-soft)' }}>本次优化点：</div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, lineHeight: 1.9 }}>
                {optPoints.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          {done && (
            <Callout type="tip">
              <b>🎉 通关成功！</b>你已经体验了「AI 生成骨架 + 人工完善内容」的写作流程。
              下一课「格式转换」已解锁，去把各种格式都转成 Markdown 吧。
            </Callout>
          )}
        </Exercise>
      </Section>

      <Section num={3} title="效率对比：纯手写 vs AI 辅助">
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <b>⏱️ 同一份文档，两种写法的耗时估算</b>
            {hasContent ? (
              <span className="chip chip-accent">⚡ AI 帮你省下约 {savedPct}% 的时间</span>
            ) : (
              <span className="chip">先在编辑器里写点内容，这里会自动估算</span>
            )}
          </div>
          <TimeBar label="✍️ 纯手写：边想结构边打字" mins={hand} max={hand} color="var(--warn)" />
          <TimeBar label="🤖 AI 辅助：生成后修改完善" mins={ai} max={hand} color="var(--ok)" />
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 4 }}>
            估算规则（本地模拟）：手写约 0.9 分钟/行，AI 辅助约 0.15 分钟/行。真实世界里 AI 的价值不只是快——
            它还能帮你把「不知道怎么写」变成「照着改」，大幅降低启动成本。
          </div>
        </div>
      </Section>

      <Section num={4} title="AI 的实际应用（延伸阅读）">
        <Callout type="tip" title="你正在用的这个网站">
          这个交互式网站本身就是 AI 生成的！配套的方案文档在项目根目录
          <code>Markdown精讲交互式网站 - 实施方案（4+1结构）.md</code>，
          打开它就能看到网站是怎么被一步步设计出来的——这就是「AI + Markdown 写方案」的真实案例。
        </Callout>
        <Callout type="info" title="配套工具：Markdown 转公文">
          配套的「Markdown 转公文」小程序的 exe 文件由老师提供，统一放到项目根目录
          <code>tools/md2doc/</code> 文件夹，网站会在此预留入口说明。
        </Callout>
        <div className="demo-frame" style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 26 }}>📦</span>
            <div style={{ flex: 1, minWidth: 220 }}>
              <b>工具入口 · Markdown 转公文</b>
              <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 2 }}>
                老师放入 exe 后即可从这里启动，路径：<code>tools/md2doc/</code>
              </div>
            </div>
            <span className="chip">⏳ 等待老师提供 exe 文件</span>
          </div>
        </div>
      </Section>
    </LessonPage>
  )
}
