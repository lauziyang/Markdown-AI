/* ============================================================
   模拟 AI 引擎（无需 API Key，可替换为真实大模型接口）
   ============================================================ */

/** 流式输出模拟：将 text 逐段输出，调用 onChunk */
export function simulateStream(text, onChunk, interval = 18) {
  return new Promise((resolve) => {
    let i = 0
    const step = Math.max(1, Math.round(text.length / 60))
    const timer = setInterval(() => {
      i = Math.min(text.length, i + step)
      onChunk(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(timer)
        resolve(text)
      }
    }, interval)
  })
}

/** 根据主题生成 Markdown 大纲 */
export function aiOutline(topic) {
  const t = (topic || '我的主题').trim()
  const kind = detectKind(t)
  if (kind === 'meeting') return meetingOutline(t)
  if (kind === 'weekly') return weeklyOutline(t)
  if (kind === 'note') return noteOutline(t)
  if (kind === 'plan') return planOutline(t)
  return tutorialOutline(t)
}

function detectKind(t) {
  if (/会议|例会|周会|复盘/.test(t)) return 'meeting'
  if (/周报|日报|总结/.test(t)) return 'weekly'
  if (/笔记|学习|课堂/.test(t)) return 'note'
  if (/方案|计划|项目|规划/.test(t)) return 'plan'
  return 'tutorial'
}

function tutorialOutline(t) {
  return `# ${t}

## 为什么值得学习

- 解决什么问题：…
- 适合谁：…

## 快速上手

1. 第一步：安装与准备
2. 第二步：写第一个示例
3. 第三步：运行与验证

## 核心概念

### 概念一：…

用一句话解释，再配一个例子。

### 概念二：…

## 常见问题

| 问题 | 解决方案 |
| ---- | -------- |
| 报错 X | 检查… |
| 不会配置 | 参考… |

## 实战练习

> 建议动手完成一个小项目，巩固所学。

## 总结与下一步

- 收获：…
- 延伸学习：…`
}

function meetingOutline(t) {
  return `# ${t} · 会议纪要

## 会议信息

- **时间**：____年__月__日 __:__
- **参与人**：…
- **记录人**：…

## 议题一：…

**讨论要点**

1. …
2. …

**决议**：…

## 议题二：…

**讨论要点**

- …

**决议**：…

## 待办事项

- [ ] 负责人A：完成任务一（截止：__/__）
- [ ] 负责人B：完成任务二（截止：__/__）
- [ ] 全员：补充资料（截止：__/__）`
}

function weeklyOutline(t) {
  return `# ${t}（第__周周报）

## 本周工作

- ✅ 完成事项一：…
- ✅ 完成事项二：…

## 下周计划

- [ ] 计划一：…
- [ ] 计划二：…

## 遇到的问题

| 问题 | 影响 | 需要的支持 |
| ---- | ---- | ---------- |
| … | … | … |

## 风险与思考

- …`
}

function noteOutline(t) {
  return `# 学习笔记：${t}

## 核心知识点

- 定义：…
- 要点：
  - 要点一
  - 要点二

## 示例

\`\`\`text
这里放一个具体示例
\`\`\`

## 易错点

> ⚠️ 容易混淆的地方…

## 我的思考

- 与已知知识的联系：…
- 应用场景：…`
}

function planOutline(t) {
  return `# ${t} · 实施方案

## 背景与目标

- 背景：…
- 目标：…

## 方案对比

| 方案 | 优点 | 缺点 | 结论 |
| ---- | ---- | ---- | ---- |
| 方案A | … | … | 推荐 |
| 方案B | … | … | 备选 |

## 实施步骤

1. **准备阶段**：…
2. **执行阶段**：…
3. **验收阶段**：…

## 里程碑

- [ ] M1：__/__ 完成准备
- [ ] M2：__/__ 完成开发
- [ ] M3：__/__ 完成验收

## 风险与应对

- …`
}

/** 纯文本 -> Markdown 启发式转换 */
export function aiConvertText(text) {
  const lines = (text || '').split('\n').map((l) => l.trim())
  const out = []
  let first = true
  let prevBlank = true
  for (const line of lines) {
    if (!line) {
      if (out.length && out[out.length - 1] !== '') out.push('')
      prevBlank = true
      continue
    }
    if (first) {
      out.push(`# ${line}`)
      first = false
      prevBlank = false
      continue
    }
    // 有序列表
    if (/^(\d+[.、]|[一二三四五六七八九十]+[、.])/.test(line)) {
      out.push(`1. ${line.replace(/^\d+[.、]|[一二三四五六七八九十]+[、.]/, '').trim()}`)
      prevBlank = false
      continue
    }
    // 无序列表符号
    if (/^[•·▪●◦\-*]\s/.test(line)) {
      out.push(`- ${line.replace(/^[•·▪●◦\-*]\s*/, '')}`)
      prevBlank = false
      continue
    }
    // 短行 + 前面有空行 -> 视为小标题
    if (prevBlank && line.length <= 24 && !/[。！？；，、]/.test(line)) {
      out.push(`## ${line}`)
      prevBlank = false
      continue
    }
    // 带冒号的短标签 -> 加粗
    const m = line.match(/^([^：]{1,14})：(.*)$/)
    if (m && m[1].length <= 14) {
      out.push(`**${m[1]}**：${m[2]}`)
      prevBlank = false
      continue
    }
    out.push(line)
    prevBlank = false
  }
  // 合并多余空行
  const res = []
  let blank = false
  for (const l of out) {
    if (!l) {
      if (!blank) res.push('')
      blank = true
    } else {
      res.push(l)
      blank = false
    }
  }
  return res.join('\n').trim()
}

/** 格式优化：规范空格、空行、标题写法 */
export function aiPolish(md) {
  let s = (md || '').replace(/\r\n/g, '\n')
  // 标题 # 后补空格
  s = s.replace(/^(#{1,6})(?!#)\s*([^#\s])/gm, '$1 $2')
  // 确保标题前后有空行
  s = s.replace(/\n+(#{1,6} .+)\n+/g, '\n\n$1\n\n')
  // 列表符号统一为 - 且后跟空格
  s = s.replace(/^(\s*)[*+](?=\s)/gm, '$1-')
  // 去除行尾空格
  s = s.replace(/[ \t]+$/gm, '')
  // 合并连续 3 个以上空行
  s = s.replace(/\n{3,}/g, '\n\n')
  return s.trim() + '\n'
}

/** 效率对比演示用的"手写"耗时估算 */
export function estimateHandwriteTime(md) {
  const lines = (md || '').split('\n').length
  return Math.max(2, Math.round(lines * 0.9 + 3))
}
export function estimateAIWriteTime(md) {
  const lines = (md || '').split('\n').length
  return Math.max(1, Math.round(lines * 0.15 + 2))
}

/** 常用提示词 */
export const PROMPTS = [
  {
    text: '把这段文字转成 Markdown 格式',
    desc: '纯文本 → 结构化 Markdown',
  },
  {
    text: '帮我优化这份 README 的结构',
    desc: '完善章节与层级',
  },
  {
    text: '为这篇博客生成一个 Markdown 表格形式的目录',
    desc: '表格化 TOC',
  },
  {
    text: '检查这段 Markdown 语法是否有误，并修正',
    desc: '语法纠错',
  },
  {
    text: '把下面的会议记录整理成 Markdown 待办列表',
    desc: '待办抽取',
  },
  {
    text: '为「{主题}」写一份 Markdown 格式的教程大纲',
    desc: '大纲生成',
  },
  {
    text: '把这份 Markdown 改写成适合发布到博客的风格',
    desc: '风格改写',
  },
  {
    text: '将这段 Markdown 中的要点提炼成表格',
    desc: '表格提炼',
  },
]
