import React, { useEffect, useRef, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import { MermaidBlock } from '../../../lib/md.jsx'

/* ============================================================
   预设模板：流程图 / 时序图 / 类图 / 状态图 / 甘特图
   ============================================================ */

const THEMES = [
  { value: 'default', label: '默认 default' },
  { value: 'neutral', label: '中性 neutral' },
  { value: 'dark', label: '暗色 dark' },
  { value: 'forest', label: '森林 forest' },
]

const TEMPLATES = [
  {
    name: '流程图',
    icon: '🔀',
    code: `graph TD
  A[开始] --> B{有课吗？}
  B -->|有| C[去上课]
  B -->|没有| D[在家自习]
  C --> E[完成]
  D --> E`,
  },
  {
    name: '时序图',
    icon: '🕐',
    code: `sequenceDiagram
  participant U as 用户
  participant S as 服务器
  participant D as 数据库
  U->>S: 登录请求
  S->>D: 查询用户
  D-->>S: 返回结果
  S-->>U: 登录成功`,
  },
  {
    name: '类图',
    icon: '🧩',
    code: `classDiagram
  class Animal {
    +String name
    +int age
    +eat() void
  }
  class Dog {
    +bark() void
  }
  Animal <|-- Dog`,
  },
  {
    name: '状态图',
    icon: '🔁',
    code: `stateDiagram-v2
  [*] --> 待付款
  待付款 --> 已付款: 支付成功
  已付款 --> 已发货
  已发货 --> 已签收
  已签收 --> [*]`,
  },
  {
    name: '甘特图',
    icon: '📅',
    code: `gantt
  title 项目开发计划
  dateFormat YYYY-MM-DD
  section 准备阶段
  需求分析 :done, a1, 2024-01-01, 7d
  方案设计 :active, a2, 2024-01-08, 5d
  section 开发阶段
  编码实现 :a3, 2024-01-13, 14d
  测试修复 :a4, 2024-01-27, 7d`,
  },
]

/* 语法小抄 */
const CHEAT = [
  { code: 'A --> B', desc: '箭头：从 A 指向 B' },
  { code: 'A -->|是| B', desc: '带文字的箭头（判断分支）' },
  { code: 'A[开始]', desc: '圆角矩形：普通节点' },
  { code: 'A{判断}', desc: '菱形：判断节点' },
  { code: 'A((圆))', desc: '圆形节点' },
  { code: 'A --> B --> C', desc: '一条链：连续画箭头' },
  { code: 'A -.-> B', desc: '虚线箭头' },
  { code: 'A ==> B', desc: '粗箭头' },
]

export default function Mermaid() {
  const { done, markDone } = useLessonComplete('mermaid')
  const [code, setCode] = useState(TEMPLATES[0].code)
  const [theme, setTheme] = useState('default')
  const [exportMsg, setExportMsg] = useState('')
  const previewRef = useRef(null)

  /* 练习：流程图描述「早上起床到出门」 */
  const [exSrc, setExSrc] = useState('')
  const arrowCount = (exSrc.match(/-->/g) || []).length
  const exPassed = /graph\b/.test(exSrc) && arrowCount >= 4
  useEffect(() => {
    if (exPassed) markDone()
  }, [exPassed, markDone])

  const flashMsg = (m) => {
    setExportMsg(m)
    setTimeout(() => setExportMsg(''), 2600)
  }

  /* 导出 SVG：把当前渲染好的 svg 节点序列化成文件 */
  const exportSVG = () => {
    const svg = previewRef.current?.querySelector('svg')
    if (!svg) {
      flashMsg('⏳ 图表还没渲染好，稍等一秒再导出')
      return
    }
    const source = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mermaid-图表.svg'
    a.click()
    URL.revokeObjectURL(url)
    flashMsg('✅ SVG 已下载')
  }

  /* 导出 PNG：把 SVG 画到 canvas 上，再转成 PNG 下载 */
  const exportPNG = () => {
    const svg = previewRef.current?.querySelector('svg')
    if (!svg) {
      flashMsg('⏳ 图表还没渲染好，稍等一秒再导出')
      return
    }
    const rect = svg.getBoundingClientRect()
    const w = Math.max(2, Math.round(rect.width))
    const h = Math.max(2, Math.round(rect.height))
    // 给 SVG 补上明确的宽高，canvas 才能按正确比例绘制
    const raw = new XMLSerializer().serializeToString(svg)
    const source = raw.replace(/<svg([^>]*)>/, (_m, attrs) => {
      const a = attrs.replace(/\swidth="[^"]*"/, '').replace(/\sheight="[^"]*"/, '')
      return `<svg${a} width="${w}" height="${h}">`
    })
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      const dataUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'mermaid-图表.png'
      a.click()
      flashMsg('✅ PNG 已下载')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      flashMsg('❌ 导出失败，请再试一次')
    }
    img.src = url
  }

  return (
    <LessonPage
      id="mermaid"
      module="m4"
      moduleName="模块四 · 高级应用"
      time="60min"
      icon="📈"
      title="Mermaid 图表工坊"
      subtitle="在 Markdown 里用纯文本画出流程图、时序图、甘特图……改一行代码，图表就跟着变。"
      goals={['会用 Mermaid 画 5 种常见图表', '能切换主题并导出 SVG / PNG 图片', '独立画出「早上起床到出门」的流程图']}
    >
      <Section num={1} title="图表工坊：改代码，图表就变">
        <Callout type="info">
          在 Markdown 里用三个反引号包住 <code>mermaid</code> 代码，渲染器就会把它变成图表。
          我们只需要<b>写左侧的文字</b>，画图的事交给渲染器。下面先点几个模板按钮试试手感～
        </Callout>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
          {TEMPLATES.map((t) => (
            <button key={t.name} className="btn btn-sm" onClick={() => setCode(t.code)}>
              {t.icon} {t.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: 'var(--text-soft)' }}>🎨 主题：</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
          >
            {THEMES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button className="btn btn-sm" onClick={exportSVG}>⬇️ 导出 SVG</button>
          <button className="btn btn-sm" onClick={exportPNG}>🖼️ 导出 PNG</button>
          {exportMsg && <span className="chip chip-accent">{exportMsg}</span>}
        </div>

        <div className="grid-2">
          <div className="demo-frame">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--text-soft)' }}>
              ⌨️ Mermaid 代码（直接改）
            </div>
            <textarea
              className="ex-input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13, minHeight: 320 }}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
            />
          </div>
          <div className="demo-frame" ref={previewRef}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--text-soft)' }}>
              🖥️ 实时图表（主题：{theme}）
            </div>
            <div className="mmd-preview-wide">
              <MermaidBlock code={code} theme={theme} naturalWidth />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6 }}>
              💡 图表保持原始大小，甘特图等宽图可以左右滑动查看完整内容
            </div>
          </div>
        </div>
      </Section>

      <Section num={2} title="Mermaid 语法小抄">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
          {CHEAT.map((c) => (
            <div className="card" key={c.code} style={{ padding: '12px 14px' }}>
              <code style={{ background: 'var(--code-bg)', color: 'var(--code-text)', padding: '3px 8px', borderRadius: 6, fontSize: 13 }}>
                {c.code}
              </code>
              <div style={{ fontSize: 12.5, color: 'var(--text-soft)', marginTop: 6 }}>{c.desc}</div>
            </div>
          ))}
        </div>
        <Callout type="tip" title="记不住也没关系">
          画图就记两件事：<b>节点起个名字</b>（写名字就行），<b>连线用箭头</b>（<code>--&gt;</code>）。
          分支判断用菱形 <code>A&#123;判断&#125;</code>，分支上写条件用 <code>|是|</code>。
        </Callout>
      </Section>

      <Section num={3} title="动手练习：画出你的早晨">
        <Exercise num={1} title="用流程图描述「早上起床到出门」" done={done} doneLabel="图表画得不错！">
          <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 10px' }}>
            用 <code>graph</code> 开头，至少连出 <b>4 个箭头（--&gt;）</b>，
            把「起床 → 洗漱 → 吃早饭 → 出门」串成一条流程。下面已经帮你写了开头，接着补完即可：
          </p>
          <textarea
            className="ex-input"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13, minHeight: 170 }}
            value={exSrc}
            onChange={(e) => setExSrc(e.target.value)}
            spellCheck={false}
            placeholder={'graph TD\n  起床[起床] --> 洗漱[洗漱]\n  洗漱 --> 吃早饭[吃早饭]\n  ...'}
          />
          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="chip">箭头数：{arrowCount}（需要 ≥ 4）</span>
            <span className={`chip ${exPassed ? 'chip-ok' : ''}`}>
              {exPassed ? '✅ 检测通过！' : '⏳ 还差一点'}
            </span>
          </div>
          {exSrc.trim() && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--text-soft)' }}>你的流程图长这样：</div>
              <div style={{ overflowX: 'auto' }}>
                <MermaidBlock code={exSrc} theme={theme} />
              </div>
            </div>
          )}
          {done && (
            <div style={{ marginTop: 12 }}>
              <Callout type="tip">
                <b>🎉 通关成功！</b>你已经会用 Mermaid 画流程图了。下一课《LaTeX 公式编辑》已解锁，
                去把数学公式也拿下吧！
              </Callout>
            </div>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
