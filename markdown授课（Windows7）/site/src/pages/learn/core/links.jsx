import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'
import { MarkdownPreview } from '../../../lib/md.jsx'

/* 分步拆解 [文字](url) */
function LinkBreakdown() {
  const [focus, setFocus] = useState('text')
  const parts = [
    { id: 'text', label: '文字', code: '[访问官网]', note: '方括号里是「显示的文字」——用户看到的就是它' },
    { id: 'url', label: '(url)', code: '(https://example.com)', note: '圆括号里是「目标地址」——点击后跳转的链接' },
  ]
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {parts.map((p) => (
          <button key={p.id} className={`btn btn-sm ${focus === p.id ? 'btn-primary' : ''}`} onClick={() => setFocus(p.id)}>
            查看「{p.label}」部分
          </button>
        ))}
      </div>
      <pre style={{ background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10, padding: '14px 16px', fontSize: 15, margin: 0 }}>
        <span style={focus === 'text' ? { background: 'var(--accent)', color: '#fff', borderRadius: 4, padding: '2px 6px' } : {}}>[访问官网]</span>
        <span style={focus === 'url' ? { background: 'var(--accent-2)', color: '#fff', borderRadius: 4, padding: '2px 6px' } : {}}>(https://example.com)</span>
      </pre>
      <div style={{ marginTop: 10, fontSize: 13.5, color: 'var(--text-soft)' }}>
        {parts.find((p) => p.id === focus).note}
      </div>
    </div>
  )
}

export default function Links() {
  const { done, markDone } = useLessonComplete('links')
  const [src1, setSrc1] = useState('')
  const [src2, setSrc2] = useState('')
  // 支持带标题的链接写法：[文字](网址 "标题")
  const hasLink = /\[[^\]]+\]\(https?:\/\/[^\s)]+(?:\s+["'][^"']*["'])?\)/.test(src1)
  const hasImg = /!\[[^\]]*\]\([^)]+\)/.test(src2)
  const passed = hasLink && hasImg

  useEffect(() => {
    if (passed) markDone()
  }, [passed, markDone])

  return (
    <LessonPage
      id="links"
      module="m2"
      moduleName="模块二 · 核心语法精讲"
      time="60min"
      icon="🔗"
      title="链接与图片"
      subtitle="区别只有一个感叹号：![图片](地址) 显示图片，[文字](地址) 跳转链接。"
      goals={['会写 [文字](url) 链接', '会写 ![替代文字](图片地址)', '理解 ! 号的区别']}
    >
      <Section num={1} title="分步拆解 [文字](url)">
        <LinkBreakdown />
      </Section>

      <Section num={2} title="对比：![] 与 [] 的区别">
        <div className="grid-2">
          <div className="card" style={{ padding: '14px 16px' }}>
            <b style={{ fontSize: 14 }}>🔗 链接：<code>[文字](网址)</code></b>
            <div style={{ borderRadius: 10, border: '1px solid var(--border)', padding: 10, marginTop: 10, background: 'var(--card-2)' }}>
              <MarkdownPreview source={'[点击访问百度](https://www.baidu.com)'} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 8 }}>没有 ! —— 渲染为可点击的文字链接</div>
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <b style={{ fontSize: 14 }}>🖼️ 图片：<code>![替代文字](图片地址)</code></b>
            <div style={{ borderRadius: 10, border: '1px solid var(--border)', padding: 10, marginTop: 10, background: 'var(--card-2)' }}>
              <MarkdownPreview source={'![一张示例图](https://picsum.photos/240/120)'} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 8 }}>多了 ! —— 直接渲染图片本体</div>
          </div>
        </div>
        <Callout type="warn" title="记不住怎么办？">
          只记一句话：<b>图片 = 链接前面加个感叹号</b>。<code>[]()</code> 是链接，<code>![]()</code> 是图片。
        </Callout>
      </Section>

      <Section num={3} title="动手练习">
        <Exercise num={1} title="给文字加超链接" done={hasLink} doneLabel="链接通过">
          <MdEditor
            value={src1}
            onChange={setSrc1}
            height={150}
            placeholder={'欢迎访问 [我的博客](https://example.com)'}
            hint={hasLink ? '✅ 链接写法正确' : '格式：[文字](https://网址)'}
          />
        </Exercise>
        <Exercise num={2} title="插入一张图片" done={hasImg} doneLabel="图片通过">
          <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: '0 0 8px' }}>
            图片地址可以用示例图：<code>https://picsum.photos/200/100</code>
          </p>
          <MdEditor
            value={src2}
            onChange={setSrc2}
            height={150}
            placeholder={'![示例图片](https://picsum.photos/200/100)'}
            hint={hasImg ? '✅ 图片写法正确' : '格式：![替代文字](图片地址)'}
          />
        </Exercise>
        {passed && (
          <Callout type="tip" title="关卡通过">
            🎉 链接和图片都会了！只剩最后一关「综合练习场」了。
          </Callout>
        )}
      </Section>
    </LessonPage>
  )
}
