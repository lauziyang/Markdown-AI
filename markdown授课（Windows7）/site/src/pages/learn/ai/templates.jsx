import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'
import { aiPolish, simulateStream } from '../../../lib/ai.js'
import { copyText } from '../../../lib/utils.js'

/* ============================================================
   5 个高频场景模板（骨架）
   ============================================================ */
const SCENES = [
  {
    key: 'gongwen',
    icon: '📢',
    name: '公文通知',
    fields: ['标题', '发文字号', '主送', '正文', '落款'],
    why: '公文讲究「抬头—正文—落款」三段式：front matter 放发文字号/主送机关，结尾右对齐放落款日期。可直接用配套工具转成公文 docx。',
    md: `---
title: 关于举办 XXX 的通知
发文字号: XX办发〔2025〕X号
主送机关: 各科室、直属单位：
落款: XX办公室
成文日期: 2025年X月X日
---
为……，现定于……，有关事项通知如下。

## 一、总体安排

| 时间 | 内容 | 负责人 |
| ---- | ---- | ------ |
| 09:00 | …… | …… |

## 二、注意事项

1. ……
2. ……

特此通知。`,
  },
  {
    key: 'report',
    icon: '📊',
    name: '数据分析报告',
    fields: ['数据来源', '统计', '结论', '建议'],
    why: '分析报告遵循「数据先行、结论殿后」：先摆表格和统计，再用「结论—依据—建议」结构收尾，让读者先看到结果再看到过程。',
    md: `# XX 数据分析报告

## 一、数据来源与口径

- 数据范围：……
- 统计口径：……

## 二、核心数据

| 指标 | 数值 | 环比 |
| ---- | ---- | ---- |
| 总量 | …… | …… |
| 均值 | …… | …… |

## 三、主要结论

1. **结论一**：……（依据：表格第 X 行数据）
2. **结论二**：……

## 四、建议

- [ ] 建议一：……
- [ ] 建议二：……`,
  },
  {
    key: 'blog',
    icon: '📝',
    name: '博客文章',
    fields: ['标题', '摘要', '正文', '标签'],
    why: '博客用「摘要先行 + 小标题分段」降低阅读门槛：引言给读者「读不读」的判断，小标题帮读者快速扫读。',
    md: `# 我的博客标题

> 一句话摘要：这篇文章想讲什么？

## 正文

在这里写正文内容，多写几段……

### 小标题一

- 要点一
- 要点二

## 标签

- Markdown
- 写作
- 分享`,
  },
  {
    key: 'meeting',
    icon: '📋',
    name: '会议纪要',
    fields: ['时间', '参与人', '议题', '决议'],
    why: '会议纪要的核心是「决议可追踪」：每个议题固定「讨论要点 → 决议」，最后统一收进带勾选框的待办列表，方便会后跟进。',
    md: `# 会议纪要

## 会议信息

- **时间**：____年__月__日 __:__
- **参与人**：…
- **记录人**：…

## 议题一：…

**讨论要点**

1. …
2. …

**决议**：…

## 待办事项

- [ ] 负责人A：完成任务一（截止：__/__）
- [ ] 负责人B：完成任务二（截止：__/__）`,
  },
  {
    key: 'readme',
    icon: '📖',
    name: '项目文档 README',
    fields: ['简介', '安装', '使用', 'API'],
    why: 'README 按「用户视角」排序：先讲清楚项目是什么、怎么装、怎么用，最后才列 API——安装命令放代码块里可直接复制。',
    md: `# 项目名

> 一句话介绍项目是干什么的。

## 简介

- 项目背景：…
- 主要特性：…

## 安装

\`\`\`bash
npm install 你的项目
\`\`\`

## 使用

\`\`\`js
// 示例代码
\`\`\`

## API

| 函数 | 说明 |
| ---- | ---- |
| xxx() | … |
| yyy() | … |`,
  },
  {
    key: 'weekly',
    icon: '📊',
    name: '周报',
    fields: ['本周工作', '下周计划', '问题'],
    why: '周报按「已完成 / 待办 / 求助」三类归档：✅ 给结果、[ ] 给承诺、表格列问题，领导一眼扫完不费劲。',
    md: `# 周报（第__周）

## 本周工作

- ✅ 完成事项一：…
- ✅ 完成事项二：…

## 下周计划

- [ ] 计划一：…
- [ ] 计划二：…

## 遇到的问题

| 问题 | 影响 | 需要的支持 |
| ---- | ---- | ---------- |
| … | … | … |`,
  },
  {
    key: 'note',
    icon: '📚',
    name: '学习笔记',
    fields: ['知识点', '示例', '思考'],
    why: '笔记用「定义 → 示例 → 易错点 → 思考」四段式：示例用代码块、易错点用引用块，把「记住了」升级为「想清楚了」。',
    md: `# 学习笔记：___

## 核心知识点

- 定义：…
- 要点：
  - 要点一
  - 要点二

## 示例

\`\`\`text
这里放一个具体示例
\`\`\`

## 我的思考

- 与已有知识的联系：…
- 可以应用在：…`,
  },
]

/* 用字符串比较算出 AI 做了哪些修改（通俗版 diff 说明） */
function calcNotes(before, after) {
  if (before === after) return []
  const notes = []
  if (/^(#{1,6})(?!#)\s*([^#\s])/m.test(before)) notes.push('标题「#」后补上了空格（#标题 → # 标题）')
  if (/^(\s*)[*+](?=\s)/m.test(before)) notes.push('列表符号统一成了「-」')
  if (/^(\s*)[-*+]\S/m.test(before)) notes.push('列表符号后补上了空格（-内容 → - 内容）')
  if (/[ \t]+$/m.test(before)) notes.push('去掉了行尾的多余空格')
  if (/\n{3,}/.test(before)) notes.push('合并了连续的空行')
  const bLines = before.split('\n')
  const aLines = after.split('\n')
  let diff = 0
  const max = Math.max(bLines.length, aLines.length)
  for (let i = 0; i < max; i++) {
    if ((bLines[i] || '') !== (aLines[i] || '')) diff++
  }
  notes.push(`共 ${diff} 行内容发生了变化`)
  return notes
}

/* 练习：选场景 → 生成骨架 → 写内容 */
function TemplateExercise({ onPass }) {
  const [exSrc, setExSrc] = useState('')
  const lines = exSrc.split('\n').filter((l) => l.trim()).length
  const headings = (exSrc.match(/^#{1,6}\s/mg) || []).length
  const passed = exSrc.trim().length > 0 && lines > 5 && headings >= 2

  useEffect(() => {
    if (passed) onPass()
  }, [passed, onPass])

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {SCENES.map((s) => (
          <button key={s.key} className="btn btn-sm" onClick={() => setExSrc(s.md)}>
            {s.icon} {s.name}
          </button>
        ))}
        <button className="btn btn-sm btn-ghost" onClick={() => setExSrc('')}>
          🗑️ 清空
        </button>
      </div>
      <MdEditor
        value={exSrc}
        onChange={setExSrc}
        height={300}
        hint={
          passed
            ? '🎉 内容已经超过 5 行、包含 2 个以上标题，练习通过！'
            : '先点一个场景按钮生成骨架，再补充你自己的内容（至少 5 行、2 个以上 # 标题）'
        }
      />
    </div>
  )
}

export default function Templates() {
  const { done, markDone } = useLessonComplete('templates')
  const [sel, setSel] = useState(null) // 当前选中的场景
  const [src, setSrc] = useState('') // 编辑器内容
  const [checking, setChecking] = useState(false)
  const [before, setBefore] = useState(null) // AI 检查前的源码快照
  const [after, setAfter] = useState('') // AI 修复后的文本（流式显示）
  const [notes, setNotes] = useState([]) // 修复说明
  const [applied, setApplied] = useState(false)

  const pick = (key) => {
    const s = SCENES.find((x) => x.key === key)
    setSel(s)
    setSrc(s.md)
    setBefore(null)
    setAfter('')
    setNotes([])
    setApplied(false)
  }

  const check = async () => {
    if (!src.trim()) return
    setChecking(true)
    setApplied(false)
    const polished = aiPolish(src)
    setBefore(src)
    setNotes(calcNotes(src, polished))
    setAfter('')
    await simulateStream(polished, (c) => setAfter(c), 14)
    setChecking(false)
  }

  const apply = () => {
    if (after) setSrc(after)
    setApplied(true)
  }

  return (
    <LessonPage
      id="templates"
      module="m5"
      moduleName="模块五 · AI 辅助与数据分析"
      time="40min"
      icon="📝"
      title="场景模板库"
      subtitle="别从零开始！7 个高频写作场景，一键生成 Markdown 骨架，你只需要填内容——每个模板都附「为什么这样搭」的讲解。"
      goals={['认识 7 个常见写作场景的模板结构', '会用骨架快速开始写作', '理解模板背后的结构设计思路', '体验 AI 自动检查并修复格式']}
    >
      <Section num={1} title="7 个高频场景模板">
        <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: '0 0 12px' }}>
          点一个卡片，对应的 Markdown 骨架就会填进下方编辑器。每个卡片都标注了<b>结构设计思路</b>——
          模板不只是「抄个格式」，而是帮你理解「为什么这样搭」。
        </p>
        <div className="grid-2">
          {SCENES.map((s) => (
            <div
              key={s.key}
              className="card"
              style={{
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all .15s',
                ...(sel?.key === s.key
                  ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft)' }
                  : {}),
              }}
              onClick={() => pick(s.key)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <b style={{ flex: 1 }}>{s.name}</b>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ padding: '2px 10px', fontSize: 12 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    copyText(s.md)
                  }}
                  title="复制整个模板骨架"
                >
                  📋 复制
                </button>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', margin: '8px 0 6px' }}>
                {s.fields.map((f) => (
                  <span key={f} className="chip" style={{ fontSize: 11 }}>
                    {f}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-soft)', lineHeight: 1.7, minHeight: 34 }}>
                💡 {s.why}
              </div>
              <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--accent)', fontWeight: 700 }}>
                {sel?.key === s.key ? '✅ 已选择，骨架已填入编辑器' : '点击生成骨架 →'}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section num={2} title="填充骨架 + AI 格式检查">
        <MdEditor
          value={src}
          onChange={setSrc}
          height={340}
          placeholder="先点上面的场景卡片，或直接输入 Markdown…"
          hint={sel ? `正在编辑：${sel.icon} ${sel.name}` : '点一个场景卡片，让 AI 帮你搭好骨架'}
        />

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '14px 0 4px' }}>
          <button className="btn btn-primary" onClick={check} disabled={checking || !src.trim()}>
            {checking ? '⏳ AI 检查中…' : '🤖 AI 检查格式'}
          </button>
          {applied && <span className="chip chip-ok">✅ 修复已应用回编辑器</span>}
        </div>

        {before !== null && (
          <div style={{ marginTop: 14 }}>
            {notes.length === 0 ? (
              <Callout type="tip">
                <b>格式很规范！</b>AI 没有发现需要修复的地方，继续保持。
              </Callout>
            ) : (
              <>
                <div style={{ fontWeight: 800, margin: '10px 0 8px' }}>🔍 AI 帮你补了哪些格式：</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {notes.map((n) => (
                    <span key={n} className="chip chip-ok" style={{ fontSize: 12.5 }}>
                      ✅ {n}
                    </span>
                  ))}
                </div>
                <div className="grid-2">
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--text-soft)' }}>
                      修复前
                    </div>
                    <pre
                      style={{
                        background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10,
                        padding: '12px 14px', fontSize: 13, maxHeight: 260, overflow: 'auto', margin: 0,
                      }}
                    >
                      {before}
                    </pre>
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--ok)' }}>
                      修复后（AI 输出）
                    </div>
                    <pre
                      style={{
                        background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10,
                        padding: '12px 14px', fontSize: 13, maxHeight: 260, overflow: 'auto', margin: 0,
                      }}
                    >
                      {after || '…'}
                    </pre>
                  </div>
                </div>
                <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={apply} disabled={checking || !after}>
                  ✅ 把修复后的内容写回编辑器
                </button>
              </>
            )}
          </div>
        )}
      </Section>

      <Section num={3} title="练习：从模板开始写一篇文档">
        <Exercise num={1} title="选场景 → 生成骨架 → 写出 5 行以上内容" done={done} doneLabel="模板新手出师">
          <TemplateExercise onPass={markDone} />
          {done && (
            <Callout type="tip">
              <b>🎉 恭喜出师！</b>你已经会从模板快速开始写作了。至此「AI 辅助与数据分析」模块全部完成——
              下一课进入<b>模块六「结业测试」</b>，检验一下你的全部所学！
            </Callout>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
