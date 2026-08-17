import React, { useEffect, useRef, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete, CopyBlock } from '../../../components/ui.jsx'
import { MarkdownPreview } from '../../../lib/md.jsx'
import { extractHeadings, headingsToMarkdown, sampleLongDoc } from '../../../lib/utils.js'

export default function Toc() {
  const { done, markDone } = useLessonComplete('toc')
  const [doc, setDoc] = useState(() => sampleLongDoc())
  const [generated, setGenerated] = useState(false)
  const [headings, setHeadings] = useState([])
  const [visibleCount, setVisibleCount] = useState(0)
  const [showToc, setShowToc] = useState(true)
  const [activeId, setActiveId] = useState(null)
  const docRef = useRef(null)

  /* 动画：逐条“长出”目录项 */
  useEffect(() => {
    if (!generated) return
    if (visibleCount < headings.length) {
      const t = setTimeout(() => setVisibleCount((v) => v + 1), 120)
      return () => clearTimeout(t)
    }
  }, [generated, visibleCount, headings.length])

  /* 练习：点击过「生成目录」即通关 */
  useEffect(() => {
    if (generated) markDone()
  }, [generated, markDone])

  const generate = () => {
    setHeadings(extractHeadings(doc))
    setGenerated(true)
    setVisibleCount(0)
    setShowToc(true)
  }

  /* 点击目录项：在渲染文档里按标题文字找到对应位置并滚动过去 */
  const jumpTo = (h) => {
    setActiveId(h.id)
    setTimeout(() => setActiveId(null), 1500)
    const els = docRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6')
    if (!els) return
    for (const el of els) {
      const text = (el.textContent || '').trim().replace(/[*_`]/g, '')
      if (text === h.text) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        el.style.transition = 'background-color 0.4s ease'
        el.style.backgroundColor = 'rgba(99,102,241,0.16)'
        setTimeout(() => {
          el.style.backgroundColor = ''
        }, 1500)
        return
      }
    }
  }

  const tocMarkdown = headingsToMarkdown(headings)

  return (
    <LessonPage
      id="toc"
      module="m4"
      moduleName="模块四 · 高级应用"
      time="60min"
      icon="📑"
      title="自动生成目录（TOC）"
      subtitle="长文档最大的敌人是「找不到」。让工具从标题里自动提取一份目录，一键跳转，阅读效率翻倍。"
      goals={['知道 TOC 是怎么从标题提取出来的', '体验有目录 vs 无目录的阅读差别', '能看懂 TOC 对应的 Markdown 源码']}
    >
      <Section num={1} title="什么是 TOC？">
        <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 10px' }}>
          <b>TOC（Table of Contents）就是目录。</b>它的原理很简单：把文档里的标题（<code>#</code>、<code>##</code>、<code>###</code>…）
          按层级列出来，点击就能跳到对应位置。
        </p>
        <div className="grid-2">
          <div className="demo-frame">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: 'var(--text-soft)' }}>📜 没有目录时</div>
            <div style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.8 }}>
              想找「自动生成目录」这一节？只能<b>从头往下翻</b>，翻过一大段才能找到。长文档（几百行）会让人崩溃。
            </div>
          </div>
          <div className="demo-frame">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: 'var(--text-soft)' }}>📑 有目录时</div>
            <div style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.8 }}>
              目录把所有标题列在开头，<b>点一下就跳过去</b>，还能一眼看出整篇文档的结构，像地图一样。
            </div>
          </div>
        </div>
        <Callout type="info">
          GitHub、Typora、VitePress 等工具都支持自动目录。本节课我们就自己动手实现一次「提取标题 → 生成目录」。
        </Callout>
      </Section>

      <Section num={2} title="动手生成你的第一个目录">
        <Exercise num={1} title="生成目录" done={done} doneLabel="目录生成成功！">
          <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 10px' }}>
            下方已经填好一篇示例长文档，你也可以换成自己的文章。点击「生成目录」，看目录项是怎么<b>一条一条长出来</b>的；
            再点目录项，文档会自动滚动到对应标题。
          </p>
          <textarea
            className="ex-input"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13, minHeight: 220 }}
            value={doc}
            onChange={(e) => setDoc(e.target.value)}
            spellCheck={false}
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0 14px' }}>
            <button className="btn btn-primary" onClick={generate}>📑 生成目录</button>
            {generated && (
              <button className="btn btn-ghost" onClick={() => setShowToc((v) => !v)}>
                {showToc ? '📜 切换到「无目录」看看' : '📑 切换回「有目录」'}
              </button>
            )}
          </div>

          {generated && (
            <div className="grid-2">
              <div className="demo-frame" style={{ maxHeight: 460, overflow: 'auto' }}>
                {showToc ? (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--text-soft)' }}>
                      📑 自动生成的目录（点击可跳转）
                    </div>
                    {headings.slice(0, visibleCount).map((h) => (
                      <div
                        key={h.id}
                        onClick={() => jumpTo(h)}
                        style={{
                          padding: '5px 8px',
                          paddingLeft: 8 + (h.level - 1) * 18,
                          borderRadius: 8,
                          cursor: 'pointer',
                          marginBottom: 2,
                          background: activeId === h.id ? 'var(--accent-soft)' : 'transparent',
                          color: activeId === h.id ? 'var(--accent)' : 'var(--text)',
                          fontSize: h.level === 1 ? 14 : 13,
                          fontWeight: h.level === 1 ? 700 : 500,
                        }}
                      >
                        {h.level > 1 ? '└ ' : ''}{h.text}
                      </div>
                    ))}
                    {visibleCount < headings.length && (
                      <div style={{ fontSize: 12, color: 'var(--text-faint)', padding: '4px 8px' }}>⏳ 正在生成…</div>
                    )}
                  </>
                ) : (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                    <div style={{ fontSize: 30, marginBottom: 8 }}>📜</div>
                    没有目录时，读者只能<b>从头翻到尾</b>去找想看的小节。长文档的阅读体验一下就变差了——这就是 TOC 的价值。
                  </div>
                )}
              </div>
              <div className="demo-frame" ref={docRef} style={{ maxHeight: 460, overflow: 'auto' }}>
                <MarkdownPreview source={doc} />
              </div>
            </div>
          )}

          {!generated && (
            <div className="demo-frame" style={{ color: 'var(--text-faint)', fontSize: 13, textAlign: 'center', padding: 18 }}>
              点击「生成目录」后，这里会并排显示<b>目录面板</b>和<b>文档预览</b>。
            </div>
          )}

          {done && (
            <div style={{ marginTop: 12 }}>
              <Callout type="tip">
                <b>🎉 通关成功！</b>目录就是从标题里「长」出来的。模块四「高级应用」到此全部完成——
                下一课《AI 辅助写作》已解锁，进入模块五「AI 辅助与数据分析」！
              </Callout>
            </div>
          )}
        </Exercise>
      </Section>

      <Section num={3} title="目录也是 Markdown：看看源码">
        <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 10px' }}>
          目录本质是一份<b>嵌套列表</b>的 Markdown 源码：二级标题缩进 1 格，三级标题缩进 2 格……
          用 <code>headingsToMarkdown()</code> 就能自动生成：
        </p>
        {generated ? (
          <CopyBlock code={tocMarkdown} lang="markdown" label="生成的 TOC 源码" />
        ) : (
          <div className="card" style={{ padding: '16px 18px', color: 'var(--text-faint)', fontSize: 13.5 }}>
            先在上方点击「生成目录」，这里会显示对应的 Markdown 源码。
          </div>
        )}
        <Callout type="tip" title="进阶玩法">
          支持「自动目录」的渲染器（GitHub、VitePress 等）通常有专门的目录指令或侧边栏，
          不需要手动粘贴这份列表；但当你需要<b>手动插入</b>目录时，这份源码直接粘到文档开头就能用。
        </Callout>
      </Section>
    </LessonPage>
  )
}
