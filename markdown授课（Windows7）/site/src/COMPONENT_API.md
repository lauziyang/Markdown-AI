# 组件与约定速查（供页面开发使用）

项目根：`/Users/liuziyang/Documents/vscode/markdown授课/site`
技术栈：React 19 + Vite + JSX（无 TypeScript）。所有组件文件是 `.jsx`。

## 必读示例
- `src/pages/learn/intro.jsx` —— 标准课程页（LessonPage + Section + 练习 + 自动完成）
- `src/pages/learn/core/CoreHub.jsx` —— 带多个交互组件的复杂页
- `src/pages/learn/core/lists.jsx` —— 双练习页
- `src/components/ui.jsx` —— 所有基础组件源码
- `src/components/MdEditor.jsx` —— 编辑器源码
- `src/lib/progress.jsx` —— 课程注册与进度
- `src/lib/utils.js`、`src/lib/ai.js`、`src/lib/md.jsx` —— 工具库

## 路由与文件位置
- 每个页面是一个文件，`export default` 一个组件。
- 模块三页面：`src/pages/learn/advanced/*.jsx`（已有 stub，直接覆盖）
- 模块四页面：同上目录
- 模块五页面：`src/pages/learn/workflow/*.jsx`
- 模块六页面：`src/pages/learn/ai/*.jsx`
- 路由已在 `src/App.jsx` 注册（Gate id 对应 `lib/progress.jsx` 中 LESSON_SEQUENCE 的 id），**不要改 App.jsx 和 progress.jsx**。

## 页面模板
```jsx
import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'

export default function Tables() {
  const { done, markDone } = useLessonComplete('tables')  // 用本课 id
  const [src, setSrc] = useState('')
  // 检测通过条件...
  const passed = ...
  useEffect(() => { if (passed) markDone() }, [passed, markDone])

  return (
    <LessonPage
      id="tables"                      // 与 progress.jsx 中一致
      module="m3"                      // m1..m6
      moduleName="模块三 · 进阶语法精讲"
      time="60min"
      icon="📊"
      title="表格构建器"
      subtitle="……"
      goals={['目标1', '目标2', '目标3']}
    >
      <Section num={1} title="……">
        {/* 内容 */}
      </Section>
      <Exercise num={1} title="……" done={条件} doneLabel="通过">
        {/* 练习内容，通常是一个 MdEditor */}
      </Exercise>
    </LessonPage>
  )
}
```

## 组件 API

### LessonPage
`{ id, module, moduleName, time, icon, title, subtitle, goals: string[], children }`。会渲染侧边栏布局 + 页眉 + 学习目标卡片。`icon` 是 1 个 emoji。

### Section
`{ num: 数字(1,2,3…), title, children, id? }` —— 带编号的内容块。

### Callout
`{ type: 'info'|'tip'|'warn'|'error', title?, icon?, children }`。标题会自动加"："。

### Exercise
`{ num, title, done: boolean, doneLabel?, children }` —— 练习卡片，done 为 true 时显示绿色完成态。

### useLessonComplete(lessonId)
返回 `{ done, markDone }`。练习通过后调用 markDone()（可在 useEffect 里自动触发）。**每页只用一次**。

### MdEditor（双栏实时预览编辑器）
`{ value, onChange, height=360, placeholder, initialMode='split', showStats=true, hint? }`
- 自带「源码/分栏/预览」三种模式切换和字数统计。
- 练习中输入框统一用它（textarea 仅供无法用编辑器的小输入）。
- hint 显示在编辑器底部（通过时给正向反馈）。

### Quiz（选择题测验）
`{ questions: [{ q, options: string[], answer: 0-based, explain }], passScore=80, onPass, title? }`
- 用法示例见模块三 quiz 页需求。答题后即时反馈，80 分以上自动 onPass。

### CopyBlock
`{ code, lang?, label? }` —— 深色代码块 + 复制按钮。

### MarkdownPreview
`{ source, className?, mermaidTheme? }` —— 渲染 Markdown（支持 GFM 表格/任务列表、KaTeX 公式、highlight.js 高亮）。mermaid 代码块（```mermaid）自动渲染为图表。

### MermaidBlock
`{ code, theme='default' }` —— 单独渲染 mermaid 图表（用于图表工坊等页面）。

## 样式 class（见 styles/global.css）
`card, grid-2, grid-3, chip, chip-ok, chip-accent, chip-warn, btn, btn-primary, btn-sm, btn-ghost, btn-ok, demo-frame, timeline/tl-step, level-card, match-pill, progress-track, editor-shell, ex-input(textarea), code-block, path-tree`
主题变量：`--card --border --text --text-soft --text-faint --accent --accent-2 --accent-soft --ok --warn --err --bg-soft --code-bg --code-text --radius`

## 铁律
1. 文件必须是合法 JSX，能通过 `npm run build`。
2. **不要修改** App.jsx、progress.jsx、main.jsx、components/ 下已有文件、styles/。
3. 中文文案，面向"傻子也能看懂"的通俗教学风格。
4. 练习要可自动检测（通过正则或计数），通过即自动 markDone()。
5. 页面底部：全部通过后给一个正向 Callout，说明解锁了下一课/获得徽章。
6. 每个文件顶部 import 写全，不要用未定义变量。
7. 保持每个页面自成一体，可独立编译。
