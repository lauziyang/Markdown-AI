import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, CopyBlock, useLessonComplete } from '../../../components/ui.jsx'
import { MarkdownPreview } from '../../../lib/md.jsx'

/* ============================================================
   转义游戏：挑战原文 & 参考答案
   ============================================================ */

const CHALLENGE = `# 这是标题

*这是斜体*

_这也是斜体_

~~删除线~~

> 引用的话`

const ANSWER = `\\# 这是标题

\\*这是斜体\\*

\\_这也是斜体\\_

\\~~删除线~~

\\> 引用的话`

function EscapeGame({ onPass }) {
  const [src, setSrc] = useState('')
  const [showAns, setShowAns] = useState(false)

  // 数一数有几处反斜杠转义（\# \* \_ \[ \] \` \~ \> 等）
  const escapes = (src.match(/\\[#*_\[\]`~>]/g) || [])
  // 通关：至少 2 处转义，且没有行首开头的 #（避免出现标题）
  const passed = escapes.length >= 2 && !/^#/m.test(src)

  useEffect(() => {
    if (passed) onPass()
  }, [passed, onPass])

  return (
    <div>
      <div className="grid-2">
        {/* 挑战原文 */}
        <div className="demo-frame">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>😱 挑战原文（不转义的下场）</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginBottom: 8 }}>
            这些符号会被 Markdown「吃掉」，变成标题、斜体、删除线和引用：
          </div>
          <pre
            style={{
              background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10,
              padding: '12px 14px', fontSize: 13, fontFamily: 'var(--font-mono)', margin: 0, lineHeight: 1.8,
            }}
          >
            {CHALLENGE}
          </pre>
          <div style={{ fontSize: 13, fontWeight: 700, margin: '12px 0 6px' }}>它现在被渲染成了这样：</div>
          <MarkdownPreview source={CHALLENGE} />
        </div>

        {/* 用户输入 */}
        <div className="demo-frame">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🛡️ 你来转义</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginBottom: 8 }}>
            在特殊符号前面加上反斜杠 <code>\</code>，让它们全部显示成普通字符（至少转义 2 处）。
          </div>
          <textarea
            className="ex-input"
            rows={7}
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            placeholder={'\\# 这是标题\n\n\\*这是斜体\\*'}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5 }}
          />
          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-sm" onClick={() => setShowAns(true)}>👀 显示答案</button>
            {passed && <span className="chip chip-ok">✅ 转义成功！全部变成普通字符</span>}
            <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>已转义 {escapes.length} 处</span>
          </div>
          {showAns && (
            <div style={{ marginTop: 12 }}>
              <CopyBlock code={ANSWER} lang="markdown" label="参考答案" />
            </div>
          )}
        </div>
      </div>

      {/* 用户输入的渲染效果 */}
      <div className="card" style={{ padding: '16px 18px', marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
          👀 你输入的渲染效果（应该是清一色的纯文本，没有大标题、没有斜体）
        </div>
        {src.trim() ? (
          <MarkdownPreview source={src} />
        ) : (
          <p style={{ color: 'var(--text-faint)', fontSize: 13, margin: 0 }}>
            把转义后的文字写进上面的输入框，这里会实时显示渲染结果。
          </p>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   页面
   ============================================================ */

export default function Escape() {
  const { done, markDone } = useLessonComplete('escape')

  return (
    <LessonPage
      id="escape"
      module="m3"
      moduleName="模块三 · 进阶语法精讲"
      time="60min"
      icon="🛡️"
      title="转义字符游戏"
      subtitle="有些符号在 Markdown 里自带魔法：# 会变标题、* 会变斜体。这一课学怎么给它们泼一盆冷水，让它们变回普通字符。"
      goals={['理解为什么需要转义', '学会用反斜杠 \\ 让特殊符号现出原形', '通关转义挑战']}
    >
      <Section num={1} title="特殊符号的「魔法」和解药">
        <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.8 }}>
          在 Markdown 里，<code>#</code>、<code>*</code>、<code>_</code>、<code>[</code>、<code>]</code>、
          <code>~</code>、<code>&gt;</code> 这些符号有特殊含义，会被当成语法吃掉。想让它们老老实实显示成普通字符，
          只需要在它们<b>前面加一个反斜杠 <code>\</code></b>，这个操作就叫「转义」。
        </p>
        <div className="grid-2">
          <div className="demo-frame">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>❌ 不转义</div>
            <pre
              style={{
                background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10,
                padding: '10px 12px', fontSize: 13, fontFamily: 'var(--font-mono)', margin: 0,
              }}
            >
              *这是斜体*
            </pre>
            <div style={{ fontSize: 12.5, color: 'var(--text-faint)', margin: '8px 0 4px' }}>渲染成：</div>
            <MarkdownPreview source={'*这是斜体*'} />
          </div>
          <div className="demo-frame">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>✅ 加反斜杠转义</div>
            <pre
              style={{
                background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10,
                padding: '10px 12px', fontSize: 13, fontFamily: 'var(--font-mono)', margin: 0,
              }}
            >
              \*这是斜体\*
            </pre>
            <div style={{ fontSize: 12.5, color: 'var(--text-faint)', margin: '8px 0 4px' }}>渲染成：</div>
            <MarkdownPreview source={'\\*这是斜体\\*'} />
          </div>
        </div>
        <Callout type="info">
          <b>记忆口诀：</b>特殊符号前面加个 <code>\</code>，魔法就失效了，符号现出原形。
        </Callout>
      </Section>

      <Section num={2} title="🎯 练习：转义大作战">
        <Exercise num={1} title="把挑战原文全部转义成普通字符" done={done} doneLabel="转义大师">
          <EscapeGame onPass={markDone} />
          {done && (
            <Callout type="tip" title="通关">
              <b>厉害！</b>你已经掌握了反斜杠转义。下一课《进阶语法小测验》已经解锁，去检验一下整个模块三的成果吧～
            </Callout>
          )}
        </Exercise>
      </Section>

      <Section num={3} title="下一步">
        {done ? (
          <Callout type="tip" title="获得徽章">
            你已完成「转义字符游戏」，模块三进度 +1！完成最后的小测验，就能点亮「<b>进阶语法大师</b>」徽章。
          </Callout>
        ) : (
          <p style={{ color: 'var(--text-faint)' }}>完成上面的练习后，这里会出现通关彩蛋 🎉</p>
        )}
      </Section>
    </LessonPage>
  )
}
