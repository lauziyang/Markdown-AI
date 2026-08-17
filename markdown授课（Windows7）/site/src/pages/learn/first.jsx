import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../components/ui.jsx'
import MdEditor from '../../components/MdEditor.jsx'

function CheckItem({ ok, label }) {
  return (
    <span className={`chip ${ok ? 'chip-ok' : ''}`} style={{ opacity: ok ? 1 : 0.6 }}>
      {ok ? '✅' : '⬜'} {label}
    </span>
  )
}

export default function First() {
  const { done, markDone } = useLessonComplete('first')
  const [src, setSrc] = useState('')

  const hasHeading = /^#{1,6}\s+\S+/m.test(src)
  const hasParagraph = src
    .split('\n')
    .some((l) => l.trim() && !/^#{1,6}\s/.test(l) && !/^!?\[/.test(l.trim()) && !/^\s*[-*+]\s/.test(l.trim()))
  // 支持带链接标题的写法：[文字](网址 "标题") 和 [文字](网址)
  const hasLink = /\[[^\]]+\]\(https?:\/\/[^\s)]+(?:\s+["'][^"']*["'])?\)/.test(src)
  const allPass = hasHeading && hasParagraph && hasLink

  let hint = '示例：第一行 # 加标题，中间写一段话，最后放一个链接'
  if (!hasHeading && !hasParagraph && !hasLink) {
    hint = '试试：第一行写 # 加标题，再写一句自我介绍，最后放一个链接 [文字](网址)'
  } else if (!hasHeading) {
    hint = '还缺标题：第一行以 # 开头，例如 # 我的自我介绍'
  } else if (!hasParagraph) {
    hint = '还缺一段文字：写一句普通的自我介绍句子（标题和链接不算哦）'
  } else if (!hasLink) {
    hint = '还缺链接：写成 [文字](网址)，网址要带 http:// 开头'
  }

  useEffect(() => {
    if (allPass) markDone()
  }, [allPass, markDone])

  return (
    <LessonPage
      id="first"
      module="m1"
      moduleName="模块一 · 初识 Markdown"
      time="50min"
      icon="✍️"
      title="第一个文档：写一段自我介绍"
      subtitle="学以致用——把刚才学的标题、段落、链接组合成一篇像模像样的自我介绍。"
      goals={['综合运用标题 + 段落 + 链接', '理解 Markdown 的「内容即格式」', '通过后解锁模块二']}
    >
      <Section num={1} title="小练习：写一段自我介绍">
        <Callout type="info">
          <b>要求：</b>你的文档需要包含 3 个要素——<b>一个标题</b>（# 开头）、<b>一段文字</b>、
          <b>一个链接</b>（<code>[文字](网址)</code> 格式）。系统会自动检测！
        </Callout>

        <Exercise num={1} title="自我介绍" done={done} doneLabel="模块一完成 🎉">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <CheckItem ok={hasHeading} label="标题 #" />
            <CheckItem ok={hasParagraph} label="一段文字" />
            <CheckItem ok={hasLink} label="链接 [文字](网址)" />
          </div>
          <MdEditor
            value={src}
            onChange={setSrc}
            height={280}
            placeholder={'# 张三的自我介绍\n\n大家好，我是张三，一名热爱写作的工程师。\n\n欢迎访问我的博客：[我的博客](https://example.com)'}
            hint={hint}
          />
          {allPass && (
            <Callout type="tip" title="模块一完成">
              恭喜通关！你已经会用 Markdown 写一篇结构完整的文档了。接下来进入<b>模块二：核心语法精讲</b>，
              开始系统学习 10 个最常用的语法。
            </Callout>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
