import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'

/* ============================================================
   综合挑战：写一份技术方案文档
   自动检测清单：标题层级 / 表格 / mermaid 流程图 / 代码块 / 公式
   ============================================================ */

const REQUIREMENTS = [
  { key: 'headings', icon: '🔠', name: '标题层级 ≥ 3 级', tip: '同时用到 #、##、###' },
  { key: 'table', icon: '📊', name: '对比表格', tip: '用 | 和 --- 画一张方案对比表' },
  { key: 'mermaid', icon: '📈', name: '架构流程图', tip: '用 ```mermaid 代码块画架构图' },
  { key: 'code', icon: '💻', name: '示例代码块', tip: '用 ```语言 包一段示例代码' },
  { key: 'formula', icon: '🧮', name: '数学公式', tip: '用 $...$ 或 $$...$$ 写一个公式' },
]

/* 一键插入的文档骨架：结构已备好，表格/图表/代码/公式留给你填（注意：用字符串数组拼接，
   里面的 ``` 不需要转义，比模板字符串更安全） */
const SKELETON = [
  '# 技术方案：为团队搭建 Markdown 文档平台',
  '',
  '## 1. 背景与目标',
  '',
  '> 用一两句话说明：为什么要做这件事？想解决什么问题？',
  '',
  '## 2. 需求分析',
  '',
  '### 2.1 核心需求',
  '',
  '- 需求一：……',
  '- 需求二：……',
  '',
  '### 2.2 非功能性要求',
  '',
  '- 性能：……',
  '- 安全：……',
  '',
  '## 3. 方案对比',
  '',
  '（在这里用表格对比 2~3 个候选方案，例如：| 方案 | 优点 | 缺点 |，第二行写 | --- | --- | --- |）',
  '',
  '## 4. 架构设计',
  '',
  '（在这里用 mermaid 画一张架构图：以 ```mermaid 开头，画完用 ``` 结束）',
  '',
  '## 5. 示例代码',
  '',
  '（在这里放一段示例代码：以 ```js 或 ```python 开头）',
  '',
  '## 6. 数学基础（可选）',
  '',
  '（如有公式，用 $...$ 或 $$...$$ 书写，例如 $E = mc^2$）',
  '',
].join('\n')

export default function Challenge() {
  const { done, markDone } = useLessonComplete('challenge')
  const [src, setSrc] = useState('')

  /* 检测时先去掉代码块，避免把代码里的 $、|、# 误当成结构 */
  const plain = src.replace(/```[\s\S]*?```/g, '')

  const levels = new Set([...plain.matchAll(/^(#{1,6})\s/mg)].map((m) => m[1].length))
  const cHeadings = levels.size >= 3

  const cTable = /^\s*\|.+\|\s*$/m.test(plain) && /^\s*\|[\s\-:|]+\|\s*$/m.test(plain)

  const cMermaid = /```mermaid/.test(src)

  // 代码块必须带语言标识，且不能只是 mermaid 图
  const cCode = /```(?!mermaid)[a-zA-Z]/.test(src)

  const cFormula = /\$\$[\s\S]*?\$\$/.test(plain) || /\$[^$\n]+\$/.test(plain)

  const checks = { headings: cHeadings, table: cTable, mermaid: cMermaid, code: cCode, formula: cFormula }
  const passedCount = REQUIREMENTS.filter((r) => checks[r.key]).length
  const allPass = passedCount === REQUIREMENTS.length

  useEffect(() => {
    if (allPass) markDone()
  }, [allPass, markDone])

  return (
    <LessonPage
      id="challenge"
      module="m6"
      moduleName="模块六 · 结业测试"
      time="60min"
      icon="🏆"
      title="综合挑战：写一份技术方案"
      subtitle="结业第二关！把学过的全部本事——标题、表格、流程图、代码块、公式——组合成一份像样的技术方案文档。"
      goals={['独立完成一份结构完整的技术方案', '熟练组合多种 Markdown 语法', '通过 5 项自动检测，向结业认证冲刺']}
    >
      <Section num={1} title="任务说明与写作提示">
        <div className="grid-2">
          <div className="card" style={{ padding: '16px 18px' }}>
            <b style={{ fontSize: 15 }}>🏆 任务要求</b>
            <ul style={{ margin: '10px 0 0', paddingLeft: 18, lineHeight: 2, fontSize: 13.5 }}>
              {REQUIREMENTS.map((r) => (
                <li key={r.key}>
                  <b>{r.name}</b>（{r.tip}）
                </li>
              ))}
            </ul>
          </div>
          <div className="card" style={{ padding: '16px 18px' }}>
            <b style={{ fontSize: 15 }}>✍️ 写作提示</b>
            <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '8px 0 12px' }}>
              <b>主题自拟</b>：给某个工具或想法写一份技术方案，例如
              「为团队搭建 Markdown 文档平台」「给课程网站加一个 AI 助手」。按「背景 → 需求 → 方案对比 →
              架构设计 → 示例代码」的思路展开就行。
            </p>
            <button className="btn btn-sm btn-ghost" onClick={() => setSrc(SKELETON)}>
              📄 一键插入文档骨架（结构已备好，内容你来填）
            </button>
          </div>
        </div>
      </Section>

      <Section num={2} title="开始挑战">
        <Exercise num={1} title="写一份技术方案文档（满足全部要求即通关）" done={done} doneLabel="文档工匠达成！">
          <div className="card" style={{ padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>📋 自动检测清单（写够就自动通关）</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {REQUIREMENTS.map((r) => {
                const ok = checks[r.key]
                return (
                  <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
                    <span style={{ width: 20, textAlign: 'center' }}>{ok ? '✅' : '⬜'}</span>
                    <span style={{ fontWeight: ok ? 700 : 400, color: ok ? 'var(--ok)' : 'var(--text)' }}>
                      {r.icon} {r.name}
                    </span>
                    {!ok && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>—— {r.tip}</span>}
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: 13 }}>
              {allPass ? (
                <span className="chip chip-ok">🎉 全部满足！自动通关</span>
              ) : (
                <span className="chip">进度：{passedCount}/{REQUIREMENTS.length}</span>
              )}
            </div>
          </div>

          <MdEditor
            value={src}
            onChange={setSrc}
            height={440}
            placeholder={'在这里写你的技术方案文档…\n\n提示：可以先用上方按钮插入骨架，再逐项填内容。'}
            hint={
              allPass
                ? '🎉 太棒了！所有要求都满足了，综合挑战通过！'
                : '试着加入对比表格、mermaid 流程图、示例代码块和数学公式，让清单全部打勾。'
            }
          />

          {done && (
            <div style={{ marginTop: 12 }}>
              <Callout type="tip" title="结业挑战通过">
                <b>🎉 恭喜！综合挑战完成。</b>
                你已经会画图、写公式、混写 HTML、生成目录，还能组合成完整的技术方案。
                最后一关是「AI 知识测验」——答完即可获得<b>「🎓 结业认证」</b>徽章！
              </Callout>
            </div>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
