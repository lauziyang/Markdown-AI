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

/* ============================================================
   v2 新增：表格数据分析引擎（本地模拟 AI）
   ============================================================ */

/** 从 Markdown 中提取第一张表格 → { headers, rows } */
export function parseMdTable(md) {
  const lines = (md || '').split(/\r?\n/)
  let headers = []
  const rows = []
  let inTable = false
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line.includes('|')) { inTable = false; i++; continue }
    if (i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      headers = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
      i += 2
      inTable = true
      continue
    }
    if (inTable) rows.push(line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()))
    i++
  }
  return { headers, rows }
}

function toNum(v) {
  const n = parseFloat(String(v).replace(/[,，%元¥￥]/g, ''))
  return Number.isFinite(n) ? n : null
}

/** 表格统计摘要：行数 / 数值列合计、均值、最大最小、Top3 */
export function analyzeTable(md) {
  const { headers, rows } = parseMdTable(md)
  if (!headers.length) return '没有检测到表格。请先粘贴一张 Markdown 表格。'
  const parts = [`共 ${rows.length} 行数据，列：${headers.join('、')}。`]
  headers.forEach((h, ci) => {
    const nums = rows.map((r) => toNum(r[ci])).filter((n) => n !== null)
    if (!nums.length) {
      parts.push(`「${h}」为文本列，非重复值 ${new Set(rows.map((r) => r[ci])).size} 个。`)
      return
    }
    const sum = nums.reduce((a, b) => a + b, 0)
    const avg = sum / nums.length
    const max = Math.max(...nums)
    const min = Math.min(...nums)
    parts.push(
      `「${h}」数值列：合计 ${fmt(sum)}，均值 ${fmt(avg)}，最大 ${fmt(max)}，最小 ${fmt(min)}。`
    )
  })
  // Top3（用第一列文本 + 第一数值列）
  const firstNumCol = headers.findIndex((_, ci) => rows.some((r) => toNum(r[ci]) !== null))
  if (firstNumCol >= 0 && rows.length > 2) {
    const top = [...rows]
      .map((r) => ({ label: r[0], val: toNum(r[firstNumCol]) }))
      .filter((x) => x.val !== null)
      .sort((a, b) => b.val - a.val)
      .slice(0, 3)
    if (top.length) parts.push(`按「${headers[firstNumCol]}」排名前三：${top.map((t) => `${t.label}（${fmt(t.val)}）`).join('、')}。`)
  }
  return parts.join('\n')
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

/** 表格问答：根据问题关键词定位数据并给出带依据的答案 */
export function aiTableAnswer(md, question) {
  const { headers, rows } = parseMdTable(md)
  if (!headers.length) return '没有检测到表格，请先粘贴一张 Markdown 表格再提问。'
  const q = (question || '').trim()
  if (!q) return '请先输入一个问题，例如「哪个月销量最高？」'
  const numsCol = headers.findIndex((_, ci) => rows.some((r) => toNum(r[ci]) !== null))
  const firstCol = 0
  // 问最大/最高
  if (/最大|最高|最多|冠军|第一/.test(q) && numsCol >= 0) {
    const best = rows
      .map((r) => ({ label: r[firstCol], val: toNum(r[numsCol]) }))
      .filter((x) => x.val !== null)
      .sort((a, b) => b.val - a.val)[0]
    return best
      ? `按「${headers[numsCol]}」看，${best.label} 最高，为 ${fmt(best.val)}。依据：表格「${headers[firstCol]}」列与「${headers[numsCol]}」列对比。`
      : '该列没有可比较的数值。'
  }
  // 问最小/最低
  if (/最小|最低|最少|垫底/.test(q) && numsCol >= 0) {
    const worst = rows
      .map((r) => ({ label: r[firstCol], val: toNum(r[numsCol]) }))
      .filter((x) => x.val !== null)
      .sort((a, b) => a.val - b.val)[0]
    return worst
      ? `按「${headers[numsCol]}」看，${worst.label} 最低，为 ${fmt(worst.val)}。依据：对表格该列全部数值排序取最小值。`
      : '该列没有可比较的数值。'
  }
  // 问合计/总和
  if (/合计|总和|一共|总共|总计/.test(q) && numsCol >= 0) {
    const sum = rows.reduce((a, r) => a + (toNum(r[numsCol]) || 0), 0)
    return `「${headers[numsCol]}」列合计为 ${fmt(sum)}。依据：将该列全部数值相加（${rows.length} 行）。`
  }
  // 问均值/平均
  if (/平均|均值/.test(q) && numsCol >= 0) {
    const nums = rows.map((r) => toNum(r[numsCol])).filter((n) => n !== null)
    return `「${headers[numsCol]}」列平均值为 ${fmt(nums.reduce((a, b) => a + b, 0) / nums.length)}。依据：合计 ÷ 行数（${nums.length} 行）。`
  }
  // 问有多少行/几个
  if (/多少行|几行|多少条|几个/.test(q)) {
    return `表格共有 ${rows.length} 行数据（不含表头）。依据：统计 | 分隔的数据行数。`
  }
  // 问某一行/某人
  const rowHit = rows.find((r) => r.some((c) => c.includes(q.replace(/[？?的]/, ''))))
  if (rowHit) {
    const kv = headers.map((h, ci) => `${h}：${rowHit[ci] || '—'}`).join('，')
    return `找到记录：${kv}。依据：在表格中按「${q.replace(/[？?]/, '')}」检索第一列命中的行。`
  }
  return (
    `我理解你的问题是在问「${q}」。分析这张表（${headers.join('、')}）后，` +
    `建议查看数值列进行对比。你可以试试这样问：「哪一行 ${headers[numsCol >= 0 ? numsCol : 0]} 最大？」`
  )
}

/** 异常值检测：数字远超 3 倍均值、空单元格、重复行、格式不统一 */
export function detectTableAnomalies(md) {
  const { headers, rows } = parseMdTable(md)
  if (!headers.length) return []
  const findings = []
  // 1) 空单元格
  const emptyCells = []
  rows.forEach((r, ri) => r.forEach((c, ci) => { if (!String(c).trim()) emptyCells.push(`第 ${ri + 2} 行「${headers[ci] || ci + 1} 列」`) }))
  if (emptyCells.length) findings.push({ level: 'warn', text: `发现 ${emptyCells.length} 处空单元格：${emptyCells.slice(0, 3).join('、')}${emptyCells.length > 3 ? ' 等' : ''}。` })
  // 2) 重复行
  const seen = {}
  rows.forEach((r) => { const k = r.join('|'); seen[k] = (seen[k] || 0) + 1 })
  const dups = Object.entries(seen).filter(([, n]) => n > 1)
  if (dups.length) findings.push({ level: 'warn', text: `发现 ${dups.length} 组重复行（每组 ${dups[0][1]} 次），建议去重。` })
  // 3) 数值异常（> 3 倍均值）
  headers.forEach((h, ci) => {
    const nums = rows.map((r) => toNum(r[ci])).filter((n) => n !== null)
    if (nums.length < 3) return
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length
    const outliers = rows
      .map((r, ri) => ({ label: r[0], val: toNum(r[ci]), ri }))
      .filter((x) => x.val !== null && Math.abs(x.val) > Math.abs(avg) * 3 && avg !== 0)
    if (outliers.length) {
      findings.push({
        level: 'error',
        text: `「${h}」列有 ${outliers.length} 个疑似异常值（远超均值 ${fmt(avg)} 的 3 倍）：${outliers.map((o) => `${o.label}（${fmt(o.val)}）`).join('、')}。请核对原始数据。`,
      })
    }
  })
  // 4) 数字格式不统一
  const mixed = []
  headers.forEach((h, ci) => {
    const vals = rows.map((r) => r[ci]).filter(Boolean)
    if (vals.some((v) => /\d{1,3},\d{3}/.test(v)) && vals.some((v) => /^\d+$/.test(v))) {
      mixed.push(`「${h}」列`)
    }
  })
  if (mixed.length) findings.push({ level: 'warn', text: `${mixed.join('、')}存在千分位格式不统一（如 1000 与 1,000 混用），建议统一。` })
  if (!findings.length) findings.push({ level: 'ok', text: '未发现明显异常：无空单元格、无重复行、数值分布正常、格式统一。' })
  return findings
}

/** 表格 → 图表描述：生成对应的 Mermaid 图表代码 */
export function mermaidSuggest(md, kind = 'bar') {
  const { headers, rows } = parseMdTable(md)
  if (!headers.length) return '```mermaid\n%% 没有检测到表格\n```'
  const valCol = headers.findIndex((_, ci) => rows.some((r) => toNum(r[ci]) !== null))
  if (valCol < 0) return '```mermaid\n%% 表格中没有数值列，无法生成图表\n```'
  const items = rows
    .map((r) => ({ label: r[0], val: toNum(r[valCol]) }))
    .filter((x) => x.val !== null)
    .slice(0, 8)
  if (kind === 'pie') {
    return `\`\`\`mermaid\npie title ${headers[valCol]} 分布\n${items.map((x) => `    "${x.label}" : ${x.val}`).join('\n')}\n\`\`\``
  }
  if (kind === 'timeline') {
    return `\`\`\`mermaid\ntimeline\ntitle ${headers[valCol]} 变化\n${items.map((x) => `    ${x.label} : ${x.val}`).join('\n')}\n\`\`\``
  }
  return `\`\`\`mermaid\nxychart-beta\n    title "${headers[valCol]} 对比"\n    x-axis [${items.map((x) => `"${x.label}"`).join(', ')}]\n    y-axis "${headers[valCol]}"\n    bar [${items.map((x) => x.val).join(', ')}]\n\`\`\``
}

/* ============================================================
   v2 新增：文档智能分析引擎（本地模拟 AI）
   ============================================================ */

/** 文档体检：结构完整度评分 + 检查项 + 改进建议 */
export function aiDocReport(md) {
  const text = md || ''
  const plain = text.replace(/```[\s\S]*?```/g, '')
  const checks = []
  // 标题层级
  const levels = new Set([...plain.matchAll(/^(#{1,6})\s/mg)].map((m) => m[1].length))
  if (levels.size >= 3) checks.push({ name: '标题层级', ok: true, tip: '使用了 3 级及以上标题，结构清晰' })
  else if (levels.size >= 2) checks.push({ name: '标题层级', ok: false, tip: '建议用到 3 级标题（# / ## / ###），层级越分明越好读' })
  else checks.push({ name: '标题层级', ok: false, tip: '几乎没有标题，读者无法快速定位内容' })
  // 表格
  const hasTable = /^\s*\|.+\|\s*$/m.test(plain) && /^\s*\|[\s\-:|]+\|\s*$/m.test(plain)
  checks.push({ name: '表格使用', ok: hasTable, tip: hasTable ? '有对比表格，数据表达清晰' : '建议用表格呈现对比类信息，比如方案对比、进度统计' })
  // 代码块
  const hasCode = /```[a-zA-Z]/.test(text)
  checks.push({ name: '代码块', ok: hasCode, tip: hasCode ? '代码块带语言标注，利于高亮' : '涉及代码/命令时请用 ```语言 包裹，便于高亮与复制' })
  // 强调
  const hasBold = /\*\*[^*]+\*\*/.test(plain)
  checks.push({ name: '强调与要点', ok: hasBold, tip: hasBold ? '使用了加粗突出要点' : '用 **加粗** 突出每段的核心结论，帮助读者扫读' })
  // 链接
  const hasLink = /\[[^\]]+\]\([^)]+\)/.test(plain)
  checks.push({ name: '引用与链接', ok: hasLink, tip: hasLink ? '包含链接引用' : '参考资料建议用 [文字](地址) 形式给出链接' })
  // 行尾空格/空行规范
  const trailing = (plain.match(/[ \t]+$/gm) || []).length
  const longPara = plain.split(/\n{2,}/).some((p) => p.length > 400 && !/^#{1,6} /.test(p))
  if (trailing) checks.push({ name: '排版规范', ok: false, tip: `有 ${trailing} 处行尾多余空格，建议清理` })
  else if (longPara) checks.push({ name: '排版规范', ok: false, tip: '存在超过 400 字的超长段落，建议拆分成小段或加小标题' })
  else checks.push({ name: '排版规范', ok: true, tip: '无行尾空格，段落长度适中' })

  const okCount = checks.filter((c) => c.ok).length
  const score = Math.max(10, Math.round((okCount / checks.length) * 100))
  const suggestions = checks.filter((c) => !c.ok).map((c) => c.tip)
  return { score, checks, suggestions, total: checks.length, okCount }
}

/** 全文摘要 + 要点提取 */
export function aiSummary(md) {
  const text = (md || '').replace(/```[\s\S]*?```/g, '（代码块略）')
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return '没有内容可以摘要。'
  const title = (text.match(/^#\s+(.+)$/m) || [])[1] || '未命名文档'
  const headings = [...text.matchAll(/^#{2,4}\s+(.+)$/mg)].map((m) => m[1]).slice(0, 6)
  const sentences = text.replace(/[#>*|`-]/g, '').split(/[。！？\n]/).map((s) => s.trim()).filter((s) => s.length >= 12 && s.length <= 60)
  const intro = sentences.slice(0, 2).join('；')
  const bullets = []
  if (headings.length) bullets.push(`文档包含 ${headings.length} 个章节：${headings.slice(0, 4).join('、')}${headings.length > 4 ? ' 等' : ''}`)
  if (sentences.length > 2) bullets.push(`核心内容：${sentences[1]}`)
  const nums = text.match(/[\d]+[.、％%]?/g)
  if (nums) bullets.push(`全文提及数字 ${nums.length} 处（如 ${nums.slice(0, 3).join('、')}…），可能包含统计数据`)
  const todo = (text.match(/- \[ \]/g) || []).length
  if (todo) bullets.push(`包含 ${todo} 项待办事项`)
  return `【摘要】${title}：${intro}。\n\n【要点】\n- ${bullets.join('\n- ') || '暂未提取到显著要点，建议补充标题与关键句。'}`
}

/** 语言风格分析：口语/正式程度、语气强度、句长分布与建议（本地模拟） */
export function aiStyleAnalyze(md) {
  const text = (md || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#>*|`\-_]/g, '')
    .trim()
  if (!text) return null
  const sentences = text.split(/[。！？!?；;\n]/).map((s) => s.trim()).filter(Boolean)
  const n = Math.max(sentences.length, 1)
  const avgLen = Math.round(text.length / n)

  const ORAL = ['吧', '啊', '哦', '呢', '反正', '好像', '挺', '有点', '其实', '就是', '真的', '感觉', '哈', '嘛']
  const FORMAL = ['鉴于', '兹', '依据', '现将', '特此', '综上', '予以', '务必', '敬请', '为贯彻', '现就', '根据', '特制定', '妥否', '呈报']
  let oral = 0
  let formal = 0
  for (const w of ORAL) oral += (text.match(new RegExp(w, 'g')) || []).length
  for (const w of FORMAL) formal += (text.match(new RegExp(w, 'g')) || []).length
  const exclaim = (text.match(/[！!]/g) || []).length
  const question = (text.match(/[？?]/g) || []).length

  const short = sentences.filter((s) => s.length < 15).length
  const mid = sentences.filter((s) => s.length >= 15 && s.length < 40).length
  const long = sentences.filter((s) => s.length >= 40).length

  let tone = '中性、客观'
  if (formal >= 2) tone = '正式、公文风'
  else if (oral >= 2 && exclaim > 0) tone = '口语化、情绪饱满'
  else if (oral > formal) tone = '偏口语化、亲切'
  else if (formal > oral) tone = '偏正式、书面'

  let style = '说明/叙事风格'
  const shortRatio = short / n
  if (shortRatio > 0.6 && avgLen < 14) style = '口语化短句风格'
  else if (formal >= 2 && avgLen > 20) style = '正式书面风格'
  else if (avgLen >= 24) style = '长句密集的书面风格'

  const suggestions = []
  if (oral >= 2) suggestions.push(`出现 ${oral} 处口语词（如「反正、其实、有点」），正式场合建议替换为书面语`)
  if (exclaim >= 2) suggestions.push(`有 ${exclaim} 个感叹号，语气偏强；公文 / 报告类文档建议克制使用`)
  if (long >= 2) suggestions.push(`有 ${long} 个超过 40 字的超长句，建议拆分，单句控制在 30 字内更易读`)
  if (shortRatio > 0.6) suggestions.push('短句过多显得零碎，可适当合并，让行文更连贯')
  if (!suggestions.length) suggestions.push('语言风格均衡，正式度与可读性搭配良好')

  return {
    style,
    tone,
    avgLen,
    counts: { oral, formal, exclaim, question },
    dist: { short, mid, long, total: n },
    suggestions,
  }
}

/** 多轮对话续写：根据用户的修改反馈继续优化（模拟） */
export function aiContinue(content, feedback) {
  const c = content || ''
  const f = (feedback || '').trim()
  const out = []
  if (/更正式|正式一点|公文/.test(f)) {
    out.push('已将语气调整为更正式的风格：')
    out.push('- 补充了背景说明与目的陈述')
    out.push('- 替换口语化表达为书面语')
  } else if (/更简短|精简|压缩/.test(f)) {
    out.push('已精简内容，突出核心信息：')
    out.push('- 合并了重复的要点')
    out.push('- 每节保留一个结论句')
  } else if (/加例子|示例|举例/.test(f)) {
    out.push('已为关键概念补充示例：')
    out.push('```text\n示例：以「我的主题」为例，第一步先…\n```')
  } else if (/加表格|表格/.test(f)) {
    out.push('已把对比信息整理成表格：')
    out.push('| 方案 | 优点 | 缺点 |')
    out.push('| ---- | ---- | ---- |')
    out.push('| 方案A | … | … |')
    out.push('| 方案B | … | … |')
  } else {
    out.push(`已根据你的反馈「${f || '继续完善'}」做了以下调整：`)
    out.push('- 重新梳理了段落间的逻辑衔接')
    out.push('- 强化了开头「结论先行」的表达')
    out.push('- 检查并规范了 Markdown 格式')
  }
  out.push('', '> 💡 提示：真实使用中，你可以继续追问「为什么这样改？」或「再具体一点」，AI 会基于对话上下文持续迭代。')
  return out.join('\n')
}

/** AI 出题：从文档内容生成 3 道测验题（模拟） */
export function aiGenerateQuiz(md) {
  const text = (md || '').replace(/```[\s\S]*?```/g, '')
  const title = (text.match(/^#\s+(.+)$/m) || [])[1] || '这篇文档'
  const headings = [...text.matchAll(/^#{2,4}\s+(.+)$/mg)].map((m) => m[1]).slice(0, 3)
  const questions = [
    {
      q: `通读《${title}》后，你认为文档最核心的主题是什么？`,
      options: [headings[0] || '开篇提到的内容', '与标题无关的内容', '代码实现细节', '作者个人经历'],
      answer: 0,
      explain: `文档标题与首个小标题「${headings[0] || '开篇'}」共同定义了主题，这正是「标题即大纲」的体现。`,
    },
  ]
  if (headings.length >= 2) {
    questions.push({
      q: `文档的第二个章节「${headings[1]}」在整体结构中主要起什么作用？`,
      options: ['承上启下，展开核心内容', '纯装饰，可以删除', '提供代码', '写联系方式'],
      answer: 0,
      explain: '一篇好文档按「背景 → 展开 → 总结」推进，中间章节负责把主题讲透。',
    })
  }
  questions.push({
    q: 'AI 出题这道功能本身说明：AI 能帮我们做什么？',
    options: ['批量生成练习题、加速内容生产', '代替人类思考', '让文档自己会写自己', '以上都不对'],
    answer: 0,
    explain: 'AI 擅长「基于已有内容批量派生」，但答案质量仍需人工把关——这正是「人机协作」的边界。',
  })
  return questions
}
