import React, { useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../components/ui.jsx'

const STEPS = [
  {
    icon: '⬇️',
    title: '安装 VS Code',
    detail: '访问 code.visualstudio.com 下载安装。它是目前写 Markdown 最流行的免费编辑器。',
    tips: ['也可以使用 Typora、Obsidian 等工具', '本课以 VS Code 为例'],
  },
  {
    icon: '🧩',
    title: '推荐插件',
    detail: '在 VS Code 扩展商店搜索安装：',
    tips: ['Markdown All in One —— 自动补全/格式化/目录生成', 'Markdown Preview Enhanced —— 增强预览，支持图表公式'],
  },
  {
    icon: '⚡',
    title: '预览快捷键',
    detail: '打开 .md 文件后，按快捷键即可实时预览：',
    tips: ['Mac：⌘ + ⇧ + V', 'Windows：Ctrl + Shift + V', '分屏预览：⌘K V / Ctrl+K V'],
  },
  {
    icon: '🌐',
    title: '在线编辑器（无需安装）',
    detail: '不方便装软件？直接用浏览器在线写：',
    tips: ['StackEdit —— stackedit.io', 'Dillinger —— dillinger.io', 'Typora 官网也有试用版'],
  },
]

export default function Setup() {
  const { done, markDone } = useLessonComplete('setup')
  const [checked, setChecked] = useState([])
  const allChecked = checked.length >= STEPS.length

  return (
    <LessonPage
      id="setup"
      module="m1"
      moduleName="模块一 · 初识 Markdown"
      time="50min"
      icon="🛠️"
      title="环境搭建向导"
      subtitle="4 步搭好写作环境，跟着动图一步步来，每个步骤确认完成即可继续。"
      goals={['安装 VS Code 并推荐插件', '掌握预览快捷键', '知道在线编辑器的备选方案']}
    >
      <Section num={1} title="环境配置向导">
        <div className="timeline">
          {STEPS.map((s, i) => {
            const isChecked = checked.includes(i)
            return (
              <div key={i} className={`tl-step ${isChecked ? 'done' : ''}`}>
                <div className="tl-title">
                  <span style={{ marginRight: 8 }}>{s.icon}</span>
                  {s.title}
                  {isChecked && <span style={{ marginLeft: 8 }}>✅</span>}
                </div>
                <div style={{ color: 'var(--text-soft)', fontSize: 13.5, marginTop: 4 }}>{s.detail}</div>
                <ul style={{ fontSize: 13, color: 'var(--text-soft)', margin: '6px 0 8px', paddingLeft: 20 }}>
                  {s.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                {!isChecked ? (
                  <button className="btn btn-sm" onClick={() => setChecked((c) => [...c, i])}>
                    我已了解 ✓
                  </button>
                ) : (
                  <span className="chip chip-ok">已完成</span>
                )}
              </div>
            )
          })}
        </div>
      </Section>

      <Section num={2} title="动手验证">
        <Callout type="warn">
          <b>提醒：</b>如果暂时无法安装软件，直接打开「在线编辑器」也可以完成本课的全部练习，
          本网站内置的编辑器也能随时练习。
        </Callout>
        <Exercise num={1} title="确认环境就绪" done={done} doneLabel="环境已就绪">
          <p style={{ fontSize: 13.5, color: 'var(--text-soft)' }}>
            完成上方 4 个步骤后，点击下方按钮完成本课（也可以在没装软件的情况下先勾选了解）。
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
            <button
              className={`btn ${allChecked ? 'btn-ok' : ''}`}
              disabled={!allChecked}
              onClick={() => markDone()}
            >
              {allChecked ? '✅ 确认完成，进入下一课' : `请先完成上方 ${STEPS.length - checked.length} 个步骤`}
            </button>
            {done && <span className="chip chip-ok">🎉 环境搭建完成</span>}
          </div>
        </Exercise>
      </Section>
    </LessonPage>
  )
}
