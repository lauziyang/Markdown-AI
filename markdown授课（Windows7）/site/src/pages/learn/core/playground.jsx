import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'
import { MarkdownPreview } from '../../../lib/md.jsx'

const RAW = `产品发布说明

大家好，我们很高兴地宣布新版本正式上线

本次更新包含三个重要改进

性能提升，加载速度提升百分之五十

界面优化，全新的深色模式

稳定性修复，修复了若干已知问题

欢迎访问官网了解更多详情`

const ANSWER = `# 产品发布说明

大家好，我们很高兴地宣布新版本正式上线。

本次更新包含三个重要改进：

1. **性能提升**：加载速度提升 50%
2. **界面优化**：全新的深色模式
3. **稳定性修复**：修复了若干已知问题

欢迎访问[官网](https://example.com)了解更多详情。`

export default function Playground() {
  const { done, markDone } = useLessonComplete('playground')
  const [src, setSrc] = useState(RAW)
  const [showAns, setShowAns] = useState(false)
  const [src2, setSrc2] = useState('')
  const [src3, setSrc3] = useState('')

  const hasHeading = /^#\s+\S/m.test(src)
  const hasList = /^\d+[.)]\s+\S/m.test(src)
  const hasBold = /\*\*\S[^*]*\*\*/.test(src)
  const formatOk = hasHeading && hasList && hasBold

  const quoteOk = /^>\s+\S/m.test(src2)
  const hrOk = /^---+\s*$/m.test(src2)
  const brOk = /  \n/.test(src3)

  const allPass = formatOk && quoteOk && hrOk && brOk
  useEffect(() => {
    if (allPass) markDone()
  }, [allPass, markDone])

  return (
    <LessonPage
      id="playground"
      module="m2"
      moduleName="模块二 · 核心语法精讲"
      time="60min"
      icon="🎮"
      title="综合练习场"
      subtitle="把所有学过的语法串起来：格式化一段混乱文本，再看参考答案对比差距。"
      goals={['综合运用标题/列表/强调', '学会引用、分割线、换行', '对照参考答案找差距']}
    >
      <Section num={1} title="格式化一段混乱文本">
        <Callout type="info">
          下面的文本没有任何格式。用 Markdown 给它加上：<b>大标题</b>（#）、<b>有序列表</b>（1. 2. 3.）、
          <b>加粗</b>（**…**），最后把「官网」变成<b>链接</b>。
        </Callout>
        <Exercise num={1} title="动手格式化" done={formatOk} doneLabel="格式化通过">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <span className={`chip ${hasHeading ? 'chip-ok' : ''}`}>{hasHeading ? '✅' : '⬜'} 标题 #</span>
            <span className={`chip ${hasList ? 'chip-ok' : ''}`}>{hasList ? '✅' : '⬜'} 有序列表</span>
            <span className={`chip ${hasBold ? 'chip-ok' : ''}`}>{hasBold ? '✅' : '⬜'} 加粗 **</span>
          </div>
          <MdEditor value={src} onChange={setSrc} height={300} initialMode="split" />
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button className="btn" onClick={() => setShowAns((s) => !s)}>
              {showAns ? '🙈 隐藏参考答案' : '👀 查看参考答案'}
            </button>
            <button className="btn btn-ghost" onClick={() => setSrc(RAW)}>↩️ 重置为原文</button>
          </div>
          {showAns && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--text-soft)' }}>参考答案：</div>
              <CopyAnswer code={ANSWER} />
            </div>
          )}
        </Exercise>
      </Section>

      <Section num={2} title="补充语法：引用 / 分割线 / 换行">
        <div className="grid-2">
          <div className="card" style={{ padding: '14px 16px' }}>
            <b>💬 引用</b>
            <div style={{ fontSize: 13, color: 'var(--text-faint)', margin: '4px 0 8px' }}>行首加 &gt; 加空格</div>
            <MarkdownPreview source={'> 学而不思则罔，思而不学则殆。'} />
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <b>➖ 分割线</b>
            <div style={{ fontSize: 13, color: 'var(--text-faint)', margin: '4px 0 8px' }}>单独一行写 ---</div>
            <MarkdownPreview source={'上段\n\n---\n\n下段'} />
          </div>
        </div>
        <Callout type="warn" title="换行的坑">
          在 Markdown 里，<b>直接回车不会换行</b>（会被当作同一个段落）。要真正换行：行尾加<b>两个空格</b>再回车，
          或者直接<b>空一行</b>开始新段落。
        </Callout>
      </Section>

      <Section num={3} title="补充练习">
        <Exercise num={2} title="引用 + 分割线" done={quoteOk && hrOk} doneLabel="通过">
          <MdEditor
            value={src2}
            onChange={setSrc2}
            height={150}
            placeholder={'> 这是一句引用\n\n---'}
            hint={(quoteOk && hrOk) ? '✅ 引用和分割线都写对了' : '第一行写 > 加一句话，第三行单独写 ---'}
          />
        </Exercise>
        <Exercise num={3} title="正确换行" done={brOk} doneLabel="通过">
          <MdEditor
            value={src3}
            onChange={setSrc3}
            height={150}
            placeholder={'第一行  （行尾两个空格）\n第二行'}
            hint={brOk ? '✅ 检测到行尾双空格换行' : '第一行行尾输入两个空格，再回车写第二行'}
          />
        </Exercise>
        {allPass && (
          <Callout type="tip" title="模块二完成 🎉">
            恭喜！10 个核心语法全部掌握，你获得了「<b>语法大师</b>」徽章！下一模块「进阶语法」已解锁。
          </Callout>
        )}
      </Section>
    </LessonPage>
  )
}

function CopyAnswer({ code }) {
  return (
    <div className="code-block">
      <div className="cb-head">
        <span>参考答案</span>
        <button
          className="cb-copy"
          onClick={async () => {
            const { copyText } = await import('../../../lib/utils.js')
            await copyText(code)
          }}
        >
          📋 复制
        </button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  )
}
