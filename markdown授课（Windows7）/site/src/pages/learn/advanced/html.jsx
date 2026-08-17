import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete, CopyBlock } from '../../../components/ui.jsx'
import { MarkdownPreview } from '../../../lib/md.jsx'

/* ============================================================
   说明：
   Markdown 允许内嵌 HTML。本站的 MarkdownPreview 与 GitHub / Typora
   一样会渲染常见 HTML 标签（自动清理 script 与事件属性）。
   ============================================================ */

const EXAMPLES = [
  {
    icon: '🎨',
    title: '自定义颜色文字',
    desc: '用 <span style="color:..."> 给文字上色，改颜色值就换一种效果。',
    source:
      '<p>这是<span style="color:#e11d48;font-weight:bold">红色加粗</span>文字，旁边还有<span style="color:#2563eb">蓝色</span>文字。</p>',
  },
  {
    icon: '🖼️',
    title: '调整图片大小',
    desc: '用 <img width="..."> 直接控制图片显示宽度，比 Markdown 语法更灵活。',
    source: '<img src="https://picsum.photos/seed/markdown/640/360" width="260" alt="示例图片" />',
  },
  {
    icon: '📂',
    title: 'details / summary 折叠',
    desc: '把大段内容收进折叠框，读者点一下才展开，长文档更清爽。',
    source:
      '<details>\n<summary>📌 点我展开：方案要点</summary>\n\n<blockquote>折叠起来的内容：Markdown 允许在 HTML 块里继续写 Markdown 语法。</blockquote>\n\n</details>',
  },
  {
    icon: '🎬',
    title: '嵌入 iframe / 视频占位',
    desc: '嵌入视频、地图都靠 iframe，下面是「视频播放器占位」，真实项目里换成 B 站 / YouTube 的嵌入链接即可。',
    source:
      "<iframe srcdoc=\"<p style='text-align:center;padding:16px'>🎬 视频占位：换成 B 站 / YouTube 的嵌入链接就能播放</p>\" width=\"100%\" height=\"130\" style=\"border:1px solid #cbd5e1;border-radius:8px\"></iframe>",
  },
]

/* 练习检测：输入包含 <span 且包含 color: */
const exPassedCheck = (s) => /<\s*span/i.test(s) && /color\s*:/.test(s)

/* 交互沙盒默认内容 */
const SANDBOX_DEFAULT =
  '<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:10px;padding:10px 14px">\n  🍋 <span style="color:#d97706;font-weight:bold">改改这里的颜色和字号</span>，看看效果变化\n</div>'

export default function HtmlMix() {
  const { done, markDone } = useLessonComplete('html')
  const [sandbox, setSandbox] = useState(SANDBOX_DEFAULT)
  /* 练习：写一个带颜色的 span */
  const [exSrc, setExSrc] = useState('')
  const exPassed = exPassedCheck(exSrc)
  useEffect(() => {
    if (exPassed) markDone()
  }, [exPassed, markDone])

  return (
    <LessonPage
      id="html"
      module="m4"
      moduleName="模块四 · 高级应用"
      time="60min"
      icon="🌐"
      title="HTML 混写：给 Markdown 加点「魔法」"
      subtitle="Markdown 允许直接嵌入 HTML，颜色、图片尺寸、折叠框、视频播放器……想要什么效果都能塞进去。"
      goals={['知道 Markdown 可以混写 HTML', '看懂 4 种最常见的 HTML 混写用法', '自己动手改属性看效果变化']}
    >
      <Section num={1} title="四个经典用法：源码 + 效果对照">
        <Callout type="info">
          <b>先说明一个真相：</b>Markdown 允许内嵌 HTML，在 GitHub、Typora 以及本站的预览里，
          HTML 会<b>真正生效</b>。下面每个示例都是「源码 → 实际渲染效果」的对照。
        </Callout>

        {EXAMPLES.map((ex) => (
          <div className="card" key={ex.title} style={{ padding: '16px 18px', marginBottom: 14 }}>
            <b style={{ fontSize: 15 }}>{ex.icon} {ex.title}</b>
            <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: '4px 0 10px' }}>{ex.desc}</p>
            <div className="grid-2">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: 'var(--text-soft)' }}>📝 Markdown 源码</div>
                <CopyBlock code={ex.source} lang="html" label="Markdown+HTML 源码" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: 'var(--text-soft)' }}>🖥️ 渲染效果（HTML 生效）</div>
                <div className="demo-frame">
                  <MarkdownPreview source={ex.source} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </Section>

      <Section num={2} title="动手改改看：实时沙盒">
        <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 10px' }}>
          下面这段「Markdown + HTML」你可以随便改：<b>改颜色值、改字号、改边框宽度</b>……
          右侧是实时渲染效果，改完立刻能看到变化。
        </p>
        <div className="grid-2">
          <div className="demo-frame">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--text-soft)' }}>⌨️ 可编辑的片段（直接改）</div>
            <textarea
              className="ex-input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13, minHeight: 180 }}
              value={sandbox}
              onChange={(e) => setSandbox(e.target.value)}
              spellCheck={false}
            />
          </div>
          <div className="demo-frame">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--text-soft)' }}>🖥️ 实时渲染效果（改这里看变化）</div>
            <MarkdownPreview source={sandbox} />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <Callout type="warn" title="安全第一">
            Markdown 允许内嵌 HTML，但<b>不要在里面写脚本</b>（<code>&lt;script&gt;</code>、<code>onclick</code> 这类）。
            很多平台会屏蔽或转义它们——这是保护你，也是保护读者。本站预览会自动清理这些内容。
          </Callout>
        </div>
      </Section>

      <Section num={3} title="动手练习：写一个带颜色的 span">
        <Exercise num={1} title="写一个带 <span style='color:red'>红色文字</span> 的片段" done={done} doneLabel="HTML 混写成功！">
          <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 10px' }}>
            在下方输入一个包含 <code>&lt;span</code> 且带 <code>color:</code> 属性的片段，
            例如 <code>&lt;span style="color:red"&gt;红色文字&lt;/span&gt;</code>，右侧会实时渲染出红色文字。
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
            <textarea
              className="ex-input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13, minHeight: 90 }}
              value={exSrc}
              onChange={(e) => setExSrc(e.target.value)}
              spellCheck={false}
              placeholder={'<span style="color:red">红色文字</span>'}
            />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--text-soft)' }}>实时渲染效果：</div>
              <div className="demo-frame" style={{ minHeight: 90 }}>
                <MarkdownPreview source={exSrc} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`chip ${exPassed ? 'chip-ok' : ''}`}>
              {exPassed ? '✅ 检测通过：包含 <span 和 color:' : '⏳ 还差一点：需要 <span 和 color:'}
            </span>
          </div>
          {done && (
            <div style={{ marginTop: 12 }}>
              <Callout type="tip">
                <b>🎉 通关成功！</b>你已经会混写 HTML 了。下一课《自动生成目录》已解锁——学学怎么给长文档加一份目录。
              </Callout>
            </div>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
