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

/** 列类型识别：文本 / 月份 / 比率(%) / 单价 / 量额 */
function colKind(headers, ci, rows) {
  const h = headers[ci]
  if (/月|month/i.test(h)) return 'month'
  if (/率|占比|比例|%/.test(h)) return 'rate'
  if (/单价|客单价|均价|人均|per|价/.test(h)) return 'unit'
  if (rows.some((r) => toNum(r[ci]) !== null)) return 'amount'
  return 'text'
}

/** 表格统计摘要：按列类型分别输出（量额列合计、单价列均值、比率列不求和）+ 门店聚合 Top */
export function analyzeTable(md) {
  const { headers, rows } = parseMdTable(md)
  if (!headers.length) return '没有检测到表格。请先粘贴一张 Markdown 表格。'
  const monthCol = headers.findIndex((h) => /月|month/i.test(h))
  const nameCols = headers
    .map((h, ci) => ({ h, ci }))
    .filter(({ ci }) => colKind(headers, ci, rows) === 'text')
  const names = new Set(rows.map((r) => (nameCols[0] ? r[nameCols[0].ci] : r[0])))
  const months = new Set(rows.map((r) => (monthCol >= 0 ? r[monthCol] : '—')))
  const parts = []
  parts.push(
    `共 ${rows.length} 行数据 · ${names.size} 个${nameCols[0] ? headers[nameCols[0].ci] : '对象'}${monthCol >= 0 ? ` · ${months.size} 个时间期（${[...months].sort()[0]} ~ ${[...months].sort().pop()}）` : ''}。`
  )
  parts.push(`列：${headers.join('、')}。`)

  const amountCols = []
  headers.forEach((h, ci) => {
    const kind = colKind(headers, ci, rows)
    const nums = rows.map((r) => toNum(r[ci])).filter((n) => n !== null)
    if (kind === 'text') {
      parts.push(`「${h}」文本列：${new Set(rows.map((r) => r[ci])).size} 个不同值。`)
      return
    }
    if (!nums.length) return
    if (kind === 'month') return
    const max = Math.max(...nums)
    const min = Math.min(...nums)
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length
    if (kind === 'rate') {
      parts.push(`「${h}」比率列：均值 ${fmt(avg)}%，最好 ${fmt(max)}%，最差 ${fmt(min)}%（比率不做合计）。`)
    } else if (kind === 'unit') {
      parts.push(`「${h}」单价列：均值 ${fmt(avg)}，最大 ${fmt(max)}，最小 ${fmt(min)}（单价取均值，不做合计）。`)
    } else {
      amountCols.push(ci)
      const sum = nums.reduce((a, b) => a + b, 0)
      parts.push(`「${h}」量额列：合计 ${fmt(sum)}，均值 ${fmt(avg)}，最大 ${fmt(max)}，最小 ${fmt(min)}。`)
    }
  })

  // Top 排名：按名称列聚合第一个量额列，避免同门店多行重复占榜
  if (amountCols.length && nameCols.length && rows.length > 2) {
    const col = amountCols[0]
    const byName = {}
    rows.forEach((r) => {
      const label = r[nameCols[0].ci]
      const v = toNum(r[col])
      if (v !== null) byName[label] = (byName[label] || 0) + v
    })
    const sorted = Object.entries(byName)
      .map(([label, val]) => ({ label, val }))
      .sort((a, b) => b.val - a.val)
    parts.push(
      `按「${headers[nameCols[0].ci]}」聚合「${headers[col]}」排名前三：${sorted
        .slice(0, 3)
        .map((t) => `${t.label}（${fmt(t.val)}）`)
        .join('、')}。`
    )
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
  // 列选择：优先「量额列」；问题提到比率/单价列时改用对应列
  const monthCol = headers.findIndex((h) => /月|month/i.test(h))
  const pickCol = () => {
    // 问题里提到具体列名 → 用那一列
    const named = headers.findIndex((h, ci) => {
      if (ci === monthCol || ci === 0) return false
      const short = h.replace(/[()（）、%万元]/g, '')
      return q.includes(short) || short.includes(q.replace(/[？?了哪家的]/g, ''))
    })
    if (named > 0) return named
    // 按语义优先：率 → 比率列；单价 → 单价列；否则 → 第一个量额列
    if (/达标率|占比|率|百分比/.test(q)) {
      const rateCol = headers.findIndex((h, ci) => colKind(headers, ci, rows) === 'rate')
      if (rateCol >= 0) return rateCol
    }
    if (/客单价|单价|均价/.test(q)) {
      const unitCol = headers.findIndex((h, ci) => colKind(headers, ci, rows) === 'unit')
      if (unitCol >= 0) return unitCol
    }
    const amtCol = headers.findIndex((h, ci) => ci !== monthCol && ci !== 0 && colKind(headers, ci, rows) === 'amount')
    return amtCol
  }
  const numsCol = pickCol()
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
  // 问合计/总和（排除「一共多少行」这类行数问法）
  if (/合计|总和|一共|总共|总计/.test(q) && !/多少行|几行|几条/.test(q) && numsCol >= 0) {
    const sum = rows.reduce((a, r) => a + (toNum(r[numsCol]) || 0), 0)
    return `「${headers[numsCol]}」列合计为 ${fmt(sum)}。依据：将该列全部数值相加（${rows.length} 行）。`
  }
  // 问均值/平均
  if (/平均|均值/.test(q) && numsCol >= 0) {
    const nums = rows.map((r) => toNum(r[numsCol])).filter((n) => n !== null)
    return `「${headers[numsCol]}」列平均值为 ${fmt(nums.reduce((a, b) => a + b, 0) / nums.length)}。依据：合计 ÷ 行数（${nums.length} 行）。`
  }
  // 问有多少行/几个（排除"哪几行对不上"这类分析型问法）
  if (/多少行|几行|多少条|几个/.test(q) && !/对不上|不匹配|勾稽|矛盾|毛利|销售额|成本|异常/.test(q)) {
    return `表格共有 ${rows.length} 行数据（不含表头）。依据：统计 | 分隔的数据行数。`
  }
  // 问比较：A 比 B 多/少多少（跨门店 或 同门店跨月份）
  const cmpM = q.match(/(.+?)(?:比|vs|对比)(.+?)(多|少|高|低)(?:多少|几个)?[？?]?$/)
  if (cmpM) {
    const findStore = (label) => rows.find((r) => r[0] && (label.includes(r[0]) || r[0].includes(label)))
    const aRow = findStore(cmpM[1])
    const bRow = findStore(cmpM[2])
    // 跨门店比较
    if (aRow && bRow && aRow !== bRow && numsCol >= 0) {
      const va = toNum(aRow[numsCol]) || 0
      const vb = toNum(bRow[numsCol]) || 0
      const diff = va - vb
      return `${aRow[0]} 的「${headers[numsCol]}」为 ${fmt(va)}，${bRow[0]} 为 ${fmt(vb)}，相差 ${fmt(Math.abs(diff))}（${diff >= 0 ? aRow[0] + ' 多' : bRow[0] + ' 多'}）。依据：两行「${headers[numsCol]}」列直接相减。`
    }
    // 同门店跨月份（如「武汉 6 月比 5 月销量多多少」）
    if (aRow && monthCol >= 0 && /月/.test(q) && numsCol >= 0) {
      const name = aRow[0]
      const storeRows = rows.filter((r) => r[0] === name)
      if (storeRows.length >= 2) {
        const sorted = storeRows.slice().sort((x, y) => (String(x[monthCol]) < String(y[monthCol]) ? -1 : 1))
        const cur = sorted[sorted.length - 1]
        const prev = sorted[sorted.length - 2]
        const vc = toNum(cur[numsCol]) || 0
        const vp = toNum(prev[numsCol]) || 0
        const diff = vc - vp
        return `${name} ${cur[monthCol]} 的「${headers[numsCol]}」为 ${fmt(vc)}，${prev[monthCol]} 为 ${fmt(vp)}，${
          diff >= 0 ? `多了 ${fmt(diff)}` : `少了 ${fmt(Math.abs(diff))}`
        }。依据：同门店「${name}」相邻两期数值相减。`
      }
    }
  }
  // 问环比/增长率（需要月份列；「连续增长/下滑」走专门的连续分支）
  if (/环比|增长|涨幅|下降|趋势/.test(q) && !/连续|逐月/.test(q) && monthCol >= 0 && numsCol >= 0) {
    const byMonth = {}
    rows.forEach((r) => {
      const mk = String(r[monthCol])
      byMonth[mk] = byMonth[mk] || []
      byMonth[mk].push({ label: r[0], val: toNum(r[numsCol]) })
    })
    const months = Object.keys(byMonth).sort()
    if (months.length >= 2) {
      const cur = byMonth[months[months.length - 1]].reduce((a, x) => a + (x.val || 0), 0)
      const prev = byMonth[months[months.length - 2]].reduce((a, x) => a + (x.val || 0), 0)
      if (prev !== 0) {
        const rate = ((cur - prev) / prev) * 100
        return `「${headers[numsCol]}」${months[months.length - 1]} 合计 ${fmt(cur)}，较 ${months[months.length - 2]} 的 ${fmt(prev)} ${
          rate >= 0 ? `增长 ${fmt(rate)}%` : `下降 ${fmt(Math.abs(rate))}%`
        }。依据：两期合计相减 ÷ 上期。`
      }
    }
  }
  // 问指定对象（门店/某月）的占比：如「北京6月销量占全部门店的比例」
  if (/占比|占多少|比例|百分之/.test(q) && numsCol >= 0) {
    const nameCol = headers.findIndex((h, ci) => colKind(headers, ci, rows) === 'text')
    const name = nameCol >= 0 ? [...new Set(rows.map((r) => r[nameCol]))].find((n) => n && q.includes(n)) : null
    const m = q.match(/(\d{1,2})月/)
    const monthVal = m ? `2025-${String(Number(m[1])).padStart(2, '0')}` : null
    if (name) {
      const pool = monthVal ? rows.filter((r) => String(r[monthCol]) === monthVal) : rows
      const total = pool.reduce((a, r) => a + (toNum(r[numsCol]) || 0), 0)
      const val = pool.filter((r) => r[nameCol] === name).reduce((a, r) => a + (toNum(r[numsCol]) || 0), 0)
      if (total > 0) {
        return `${name}${monthVal ? ` ${monthVal}` : ''}的「${headers[numsCol]}」为 ${fmt(val)}，占${
          monthVal ? '当月' : '全部'
        }「${headers[numsCol]}」的 ${Math.round((val / total) * 100)}%（${fmt(val)} / ${fmt(total)}）。依据：${fmt(val)} ÷ 当月全部${headers[numsCol]}之和。`
      }
    }
    // 无具体对象时的占比：回答总量与最高占比
    const total = rows.reduce((a, r) => a + (toNum(r[numsCol]) || 0), 0)
    if (total > 0) {
      const top = rows
        .map((r) => ({ label: r[0], val: toNum(r[numsCol]) || 0 }))
        .sort((a, b) => b.val - a.val)[0]
      return `「${headers[numsCol]}」总量为 ${fmt(total)}，其中 ${top.label} 占比最高，约 ${Math.round((top.val / total) * 100)}%（${fmt(top.val)}/${fmt(total)}）。依据：各值 ÷ 总量。`
    }
  }
  // 问勾稽矛盾：毛利 与 销售额−成本 对不上的行
  if (/对不上|不匹配|勾稽|矛盾|对账/.test(q) && /毛利|销售额|成本/.test(q)) {
    const ciAmt = headers.findIndex((h) => /销售额|销售金额/.test(h))
    const ciCost = headers.findIndex((h) => /成本/.test(h))
    const ciGross = headers.findIndex((h) => /毛利/.test(h))
    if (ciAmt >= 0 && ciCost >= 0 && ciGross >= 0) {
      const bad = rows.filter((r) => {
        const a = toNum(r[ciAmt])
        const c = toNum(r[ciCost])
        const g = toNum(r[ciGross])
        return a !== null && c !== null && g !== null && Math.abs(g - (a - c)) > 1
      })
      if (bad.length) {
        return `勾稽核对发现 ${bad.length} 行「毛利 ≠ 销售额 − 成本」：${bad
          .map((r) => {
            const a = toNum(r[ciAmt])
            const c = toNum(r[ciCost])
            return `${r[0]} ${r[1] || ''}（毛利 ${fmt(toNum(r[ciGross]))} ≠ ${fmt(a)} − ${fmt(c)} = ${fmt(a - c)}）`
          })
          .join('；')}。依据：逐行计算「销售额 − 成本」并与「毛利」比较。`
      }
      return '勾稽核对全部行：「毛利 = 销售额 − 成本」均成立，数据一致。'
    }
  }
  // 问连续多期增长/下滑的门店：如「哪家门店连续三个月下滑」
  if (/连续|逐月/.test(q) && /下滑|下降|减少|增长|上升|增加/.test(q) && monthCol >= 0) {
    const amtCol = headers.findIndex((h, ci) => ci !== monthCol && ci !== 0 && colKind(headers, ci, rows) === 'amount')
    if (amtCol >= 0) {
      const nameCol = headers.findIndex((h, ci) => colKind(headers, ci, rows) === 'text')
      const labelOf = (r) => (nameCol >= 0 ? r[nameCol] : r[0])
      const names = [...new Set(rows.map(labelOf))]
      const falling = []
      const rising = []
      names.forEach((n) => {
        const vals = rows
          .filter((r) => labelOf(r) === n)
          .sort((a, b) => (String(a[monthCol]) < String(b[monthCol]) ? -1 : 1))
          .map((r) => toNum(r[amtCol]) || 0)
        if (vals.length >= 2 && vals.every((v, i) => i === 0 || v < vals[i - 1])) falling.push(n)
        if (vals.length >= 2 && vals.every((v, i) => i === 0 || v > vals[i - 1])) rising.push(n)
      })
      const down = /下滑|下降|减少/.test(q)
      if (down && falling.length) {
        return `连续下滑的门店：${falling.join('、')}（各期「${headers[amtCol]}」逐期下降，依据：按月份排序后逐期比较）。`
      }
      if (!down && rising.length) {
        return `连续增长的门店：${rising.join('、')}（各期「${headers[amtCol]}」逐期上升，依据：按月份排序后逐期比较）。`
      }
      return `未发现连续${down ? '下滑' : '增长'}的门店（各期「${headers[amtCol]}」存在波动，依据：逐门店按月比较）。`
    }
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

/** 趋势与占比分析：按月环比、门店占比、连续增长/下滑识别（本地模拟） */
export function analyzeTrend(md) {
  const { headers, rows } = parseMdTable(md)
  if (!headers.length) return '没有检测到表格。'
  const monthCol = headers.findIndex((h) => /月|month/i.test(h))
  // 名称列：第一个文本列（门店/商品名）
  const nameCol = headers.findIndex((h, ci) => colKind(headers, ci, rows) === 'text')
  const labelOf = (r) => (nameCol >= 0 ? r[nameCol] : r[0])
  const parts = []
  // 1) 占比：选「第一个量额列」（跳过月份、比率、单价列）
  const firstAmt = headers.findIndex(
    (_, ci) => ci !== monthCol && colKind(headers, ci, rows) === 'amount'
  )
  if (firstAmt >= 0) {
    // 按名称列聚合求和（避免同一门店多行重复计）
    const byLabel = {}
    rows.forEach((r) => {
      const key = labelOf(r)
      byLabel[key] = (byLabel[key] || 0) + (toNum(r[firstAmt]) || 0)
    })
    const total = Object.values(byLabel).reduce((a, b) => a + b, 0)
    if (total > 0) {
      const sorted = Object.entries(byLabel)
        .map(([label, val]) => ({ label, val }))
        .sort((a, b) => b.val - a.val)
      const top = sorted[0]
      const top3 = (sorted[0]?.val || 0) + (sorted[1]?.val || 0) + (sorted[2]?.val || 0)
      parts.push(`【占比】按「${headers[firstAmt]}」计（按${headers[nameCol >= 0 ? nameCol : 0]}汇总），${top.label} 占比最高 ${Math.round((top.val / total) * 100)}%，Top3 合计约 ${Math.round((top3 / total) * 100)}%。`)
    }
  }
  // 2) 环比趋势（有月份列时；只累计量额列，排除比率/单价）
  if (monthCol >= 0) {
    const amtCols = headers
      .map((h, ci) => ({ h, ci }))
      .filter(({ ci }) => colKind(headers, ci, rows) === 'amount')
    const byMonth = {}
    rows.forEach((r) => {
      const mk = String(r[monthCol])
      byMonth[mk] = byMonth[mk] || { total: 0, rows: [] }
      byMonth[mk].rows.push(r)
      amtCols.forEach(({ ci }) => {
        const v = toNum(r[ci])
        if (v !== null) byMonth[mk].total += v
      })
    })
    const months = Object.keys(byMonth).sort()
    if (months.length >= 2) {
      const rates = []
      for (let i = 1; i < months.length; i++) {
        const prev = byMonth[months[i - 1]].total
        const cur = byMonth[months[i]].total
        if (prev !== 0) rates.push({ from: months[i - 1], to: months[i], rate: ((cur - prev) / prev) * 100 })
      }
      const last = rates[rates.length - 1]
      if (last) {
        parts.push(`【环比】${last.to} 较 ${last.from} 整体 ${last.rate >= 0 ? `增长 ${fmt(last.rate)}%` : `下降 ${fmt(Math.abs(last.rate))}%`}（按${headers[firstAmt] ?? '量额'}等量额列合计，比率列不参与）。`)
      }
      // 连续增长/下滑的门店（用第一个量额列）
      if (firstAmt >= 0) {
        const names = [...new Set(rows.map(labelOf))]
        const losers = []
        const winners = []
        names.forEach((name) => {
          const vals = months
            .map((mk) => byMonth[mk].rows.find((r) => labelOf(r) === name))
            .filter(Boolean)
            .map((r) => toNum(r[firstAmt]) || 0)
          if (vals.length >= 2 && vals.every((v, i) => i === 0 || v < vals[i - 1])) losers.push(name)
          if (vals.length >= 2 && vals.every((v, i) => i === 0 || v > vals[i - 1])) winners.push(name)
        })
        if (winners.length) parts.push(`【趋势】${winners.join('、')} 连续增长，势头良好。`)
        if (losers.length) parts.push(`【风险】${losers.join('、')} 连续下滑，建议关注（依据：各期「${headers[firstAmt]}」逐期下降）。`)
      }
    }
  }
  if (!parts.length) parts.push('表格缺少月份列或多期数据，无法做趋势分析；占比分析需要数值列。')
  return parts.join('\n')
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
    const kind = colKind(headers, ci, rows)
    const nums = rows.map((r) => toNum(r[ci])).filter((n) => n !== null)
    if (nums.length < 3) return
    // 3a) 比率列（达标率/占比）：超过 200% 或小于 0 直接判异常（业务语义）
    if (kind === 'rate') {
      const badRate = rows
        .filter((r) => {
          const v = toNum(r[ci])
          return v !== null && (v > 200 || v < 0)
        })
        .map((r) => `${r[0]} ${r[1] || ''}（${fmt(toNum(r[ci]))}%）`)
      if (badRate.length) {
        findings.push({ level: 'error', text: `「${h}」比率列异常：${badRate.join('、')} 超出正常范围（0~200%），疑似数据错误（达标率正常应接近 100%）。` })
      }
      return
    }
    // 3b) 其他数值列：> 3 倍均值
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
  // 5) 勾稽关系校验：毛利 = 销售额 - 成本（误差 < 1 视为一致）
  const ciAmt = headers.findIndex((h) => /销售额|销售金额/.test(h))
  const ciCost = headers.findIndex((h) => /成本/.test(h))
  const ciGross = headers.findIndex((h) => /毛利/.test(h))
  if (ciAmt >= 0 && ciCost >= 0 && ciGross >= 0) {
    const badRows = []
    rows.forEach((r, ri) => {
      const amt = toNum(r[ciAmt])
      const cost = toNum(r[ciCost])
      const gross = toNum(r[ciGross])
      if (amt !== null && cost !== null && gross !== null && Math.abs(gross - (amt - cost)) > 1) {
        badRows.push(`第 ${ri + 2} 行（${r[0]} ${r[1] || ''}）`)
      }
    })
    if (badRows.length) {
      findings.push({
        level: 'error',
        text: `勾稽校验失败：${badRows.slice(0, 3).join('、')}${badRows.length > 3 ? ` 等 ${badRows.length} 处` : ''}的「毛利 ≠ 销售额 − 成本」，数据存在矛盾，请核对原始记录。`,
      })
    }
  }
  // 6) 衍生指标合理性：客单价 = 销售额 ÷ 销量（偏离 3 倍判定异常）
  const ciVol = headers.findIndex((h) => /销量/.test(h))
  const ciPrice = headers.findIndex((h) => /客单价|单价/.test(h))
  if (ciVol >= 0 && ciAmt >= 0 && ciPrice >= 0) {
    const prices = rows.map((r) => toNum(r[ciPrice])).filter((n) => n !== null)
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    const badPrice = rows
      .filter((r) => {
        const p = toNum(r[ciPrice])
        return p !== null && avgPrice !== 0 && Math.abs(p) > Math.abs(avgPrice) * 3
      })
      .map((r) => `${r[0]} ${r[1] || ''}`)
    if (badPrice.length) {
      findings.push({ level: 'error', text: `「客单价」异常：${badPrice.join('、')} 远超均值 ${fmt(avgPrice)} 的 3 倍，疑似数据录入错误。` })
    }
  }
  if (!findings.length) findings.push({ level: 'ok', text: '未发现明显异常：无空单元格、无重复行、数值分布正常、勾稽关系正确、格式统一。' })
  return findings
}

/** 表格 → 图表描述：生成对应的 Mermaid 图表代码 */
export function mermaidSuggest(md, kind = 'bar') {
  const { headers, rows } = parseMdTable(md)
  if (!headers.length) return '```mermaid\n%% 没有检测到表格\n```'
  // 数值列：优先「量额列」（销量/销售额…），其次单价/比率列；排除月份列（2025-04 会被解析成 2025）
  const monthCol = headers.findIndex((h) => /月|month/i.test(h))
  const valCol = headers.findIndex(
    (_, ci) => ci !== monthCol && ci !== 0 && colKind(headers, ci, rows) === 'amount'
  )
  if (valCol < 0) return '```mermaid\n%% 表格中没有数值列，无法生成图表\n```'
  // 名称列：第一个非数值、非月份的列（门店/商品名）
  const nameCol = headers.findIndex(
    (h, ci) => ci !== monthCol && rows.every((r) => toNum(r[ci]) === null || String(r[ci]).trim() === '')
  )
  const labelOf = (r) => (nameCol >= 0 ? r[nameCol] : r[0])
  // 按名称列聚合（同一门店多行 → 求和），避免 x 轴重复、图表拥挤
  const byLabel = {}
  rows.forEach((r) => {
    const label = labelOf(r)
    const v = toNum(r[valCol])
    if (v !== null) byLabel[label] = (byLabel[label] || 0) + v
  })
  const items = Object.entries(byLabel)
    .map(([label, val]) => ({ label, val }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 8)
  if (kind === 'pie') {
    return `\`\`\`mermaid\npie title ${headers[valCol]} 分布\n${items.map((x) => `    "${x.label}" : ${x.val}`).join('\n')}\n\`\`\``
  }
  if (kind === 'timeline') {
    // 时间线：优先按月份聚合，真正体现时间变化趋势
    if (monthCol >= 0) {
      const byMonth = {}
      rows.forEach((r) => {
        const mon = String(r[monthCol])
        const v = toNum(r[valCol])
        if (v !== null) byMonth[mon] = (byMonth[mon] || 0) + v
      })
      const months = Object.keys(byMonth).sort()
      return `\`\`\`mermaid\ntimeline\n    title ${headers[valCol]} 月度趋势\n${months.map((mn) => `    ${mn} : ${byMonth[mn]}`).join('\n')}\n\`\`\``
    }
    // 无月份列：退回按名称展示
    return `\`\`\`mermaid\ntimeline\n    title ${headers[valCol]} 分布\n${items.map((x) => `    ${x.label} : ${x.val}`).join('\n')}\n\`\`\``
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

/* ============================================================
   v3 新增：AI + SQL 数据查询引擎（本地模拟 AI）
   配套教学表：sales（门店 TEXT / 月份 TEXT / 销量 INT / 销售额 DECIMAL）
   ============================================================ */

/** 自然语言 → SQL（规则模拟，带逐行教学注释） */
export function aiSql(question) {
  const q = (question || '').trim()
  if (!q) return '请先输入一个问题。'
  const select = ['门店', '月份', '销量', '销售额']
  const where = []
  const parts = []
  const notes = []

  // 月份筛选
  const m = q.match(/(\d{4})年(\d{1,2})月|(\d{1,2})月/)
  if (m) {
    const mon = m[1] ? `${m[1]}-${String(Number(m[2])).padStart(2, '0')}` : `2025-${String(Number(m[3])).padStart(2, '0')}`
    where.push(`月份 = '${mon}'`)
    notes.push(`识别到时间条件「${m[0]}」→ WHERE 月份 = '${mon}'`)
  }

  // 数值条件
  const gt = q.match(/(大于|超过|高于|>)\s*(\d+)/)
  const lt = q.match(/(小于|低于|<)\s*(\d+)/)
  if (gt) { where.push(`销量 > ${gt[2]}`); notes.push(`识别到筛选条件「${gt[0]}」→ WHERE 销量 > ${gt[2]}`) }
  if (lt) { where.push(`销量 < ${lt[2]}`); notes.push(`识别到筛选条件「${lt[0]}」→ WHERE 销量 < ${lt[2]}`) }

  // 排序与 TopN（先识别"前 N / Top N / N 家门店"这类带数量的排名需求）
  const topN = q.match(/前\s*(\d+)|Top\s*(\d+)|最多的\s*(\d+)|最高的\s*(\d+)|最少的\s*(\d+)|(\d+)\s*家/i)
  const topNNum = topN ? Number(topN[1] || topN[2] || topN[3] || topN[4] || topN[5] || topN[6]) : null
  const wantTopN = topNNum !== null && /最高|最大|最多|前|Top|最低|最小|最少|名/i.test(q) && !/平均|总|合计|SUM|AVG|数量|COUNT/.test(q)
  if (wantTopN) notes.push(`识别到「前 ${topNNum}」→ 用排序 + LIMIT ${topNNum}，而不是 MAX/MIN 聚合`)

  // 聚合（带数量的排名需求优先走排序，不走 MAX/MIN）
  let aggExpr = null
  let aggCol = null
  if (/平均|均值|AVG/.test(q)) { aggExpr = 'AVG(销售额)'; aggCol = 'avg_sales'; notes.push('识别到「平均」→ 用 AVG() 聚合') }
  else if (/总|合计|SUM|加总/.test(q)) { aggExpr = 'SUM(销售额)'; aggCol = 'total_sales'; notes.push('识别到「合计」→ 用 SUM() 聚合') }
  else if (/多少条|几条|数量|COUNT|数一数/.test(q)) { aggExpr = 'COUNT(*)'; aggCol = 'cnt'; notes.push('识别到「数量」→ 用 COUNT(*) 统计行数') }
  else if (!wantTopN && /最高|最大|最多|冠军|MAX/.test(q)) { aggExpr = 'MAX(销量)'; aggCol = 'max_sales'; notes.push('识别到「最高」→ 用 MAX() 聚合') }
  else if (!wantTopN && /最低|最小|最少|MIN/.test(q)) { aggExpr = 'MIN(销量)'; aggCol = 'min_sales'; notes.push('识别到「最低」→ 用 MIN() 聚合') }

  // 多表 JOIN 识别：按城市/区域 → stores；按类别/商品 → products
  const joins = []
  if (/城市|区域|地区/.test(q)) {
    joins.push('INNER JOIN stores ON sales.store_id = stores.id')
    notes.push('识别到「按城市」维度 → 关联 stores 表（销售表只有 store_id，城市名在 stores 表里）')
  }
  if (/类别|品类|商品/.test(q)) {
    joins.push('INNER JOIN products ON sales.product_id = products.id')
    notes.push('识别到「按商品类别」维度 → 关联 products 表')
  }

  // 分组（支持多表维度）
  const group = /按(.+?)(分组|统计|汇总|看)|每家门店|各门店|每个(.+?)(的)?/.exec(q)
  let groupBy = null
  if (joins.length === 0 && (group && /门店/.test(group[1] || '') || /每家门店|各门店/.test(q))) {
    groupBy = '门店'
    notes.push('识别到「按门店分组」→ GROUP BY 门店')
  } else if (/城市|区域|地区/.test(q) && (group || /每个城市|各城市|哪座城市|哪个城市/.test(q))) {
    groupBy = 'stores.城市'
    notes.push('识别到「按城市分组」→ GROUP BY stores.城市（JOIN 后按关联表列分组）')
  } else if (/类别|品类/.test(q) && (group || /每个类别|各类别|哪种/.test(q))) {
    groupBy = 'products.类别'
    notes.push('识别到「按类别分组」→ GROUP BY products.类别')
  }

  // CASE WHEN 分档（"分为高/中/低"）
  let caseExpr = null
  if (/分.{0,3}(高|中|低|档)|分档|档位/.test(q)) {
    caseExpr = `CASE\n    WHEN 销量 >= 1000 THEN '高'\n    WHEN 销量 >= 800 THEN '中'\n    ELSE '低'\n  END AS 档位`
    notes.push('识别到「分档」→ 用 CASE WHEN 按销量阈值分高/中/低三档')
  }

  // 子查询（"高于平均"）
  let subquery = null
  if (/高于平均|超过平均|比平均/.test(q)) {
    subquery = 'WHERE 销量 > (SELECT AVG(销量) FROM sales)'
    notes.push('识别到「高于平均」→ 用子查询 SELECT AVG(销量) 作为阈值，WHERE 比较')
  }

  // 排序与 LIMIT
  let orderBy = null
  let limit = null
  if (aggExpr && groupBy) {
    orderBy = `${aggCol} DESC`
    if (/最多|最高|前|Top/i.test(q)) { orderBy = `${aggCol} DESC`; notes.push('识别到「最多/最高」→ ORDER BY 结果降序') }
    if (/最少|最低/.test(q)) { orderBy = `${aggCol} ASC`; notes.push('识别到「最少/最低」→ ORDER BY 结果升序') }
    if (topNNum) { limit = topNNum; notes.push(`识别到「前 ${limit}」→ LIMIT ${limit}`) }
  } else if (wantTopN) {
    orderBy = /最低|最小|最少/.test(q) ? '销量 ASC' : '销量 DESC'
    limit = topNNum
    notes.push(`识别到排名需求 → ORDER BY 销量 ${orderBy.endsWith('ASC') ? '升序' : '降序'}，LIMIT ${limit}`)
  } else if (/最高|最大|最多|冠军|最低|最小|最少/.test(q)) {
    orderBy = /最高|最大|最多|冠军/.test(q) ? '销量 DESC' : '销量 ASC'
    limit = 1
    notes.push('识别到「最高/最低」→ ORDER BY 排序后 LIMIT 1')
  }

  // 组装 SQL
  let cols
  if (aggExpr && groupBy) cols = `${groupBy}, ${aggExpr} AS ${aggCol}`
  else if (aggExpr) cols = `${aggExpr} AS ${aggCol}`
  else if (caseExpr) cols = `门店, ${caseExpr}`
  else if (joins.length && /城市|区域|地区/.test(q) && !groupBy) cols = 'sales.id, sales.门店, stores.城市, sales.销量'
  else if (joins.length && /类别|品类/.test(q) && !groupBy) cols = 'sales.id, products.名称, products.类别, sales.销量'
  else cols = select.join(', ')
  const lines = ['SELECT ' + cols, 'FROM sales']
  joins.forEach((j) => lines.push(j))
  if (subquery) lines.push(subquery)
  else if (where.length) lines.push('WHERE ' + where.join(' AND '))
  if (groupBy) lines.push('GROUP BY ' + groupBy)
  if (orderBy) lines.push('ORDER BY ' + orderBy)
  if (limit) lines.push('LIMIT ' + limit)

  const sql = lines.join('\n') + ';'
  const explain = notes.length
    ? notes.join('\n')
    : '按问题语义直接选择列；未识别到筛选/聚合条件，先返回全表供确认。'
  return `【生成的 SQL】\n\`\`\`sql\n${sql}\n\`\`\`\n\n【AI 思考过程】\n${explain}\n\n> 💡 教学提示：AI 是根据关键词猜的——表名/列名务必对照真实表结构核对，生成后先在测试环境跑一遍再使用。`
}

/** SQL 查询结果（管道/制表符/逗号分隔）→ Markdown 表格 */
export function sqlToMarkdown(text) {
  const lines = (text || '').trim().split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return '请先粘贴查询结果。'
  const split = (l) => {
    const s = l.trim().replace(/^\|/, '').replace(/\|$/, '')
    if (s.includes('|')) return s.split('|').map((c) => c.trim())
    if (s.includes('\t')) return s.split('\t').map((c) => c.trim())
    return s.split(',').map((c) => c.trim())
  }
  const headers = split(lines[0])
  const rows = lines.slice(1).map(split)
  const sep = headers.map(() => '---').join(' | ')
  const out = [`| ${headers.join(' | ')} |`, `| ${sep} |`]
  rows.forEach((r) => out.push(`| ${r.map((c) => c || ' ').join(' | ')} |`))
  return out.join('\n')
}

/** 解读查询结果 → Markdown 分析报告（数据先行、结论殿后） */
export function aiInterpretResult(mdTable) {
  const { headers, rows } = parseMdTable(mdTable)
  if (!headers.length) return '没有识别到表格，请先用「结果转表格」把查询结果转成 Markdown 表格。'
  // 数值列：排除月份列（2025-05 会被解析成数字）与第一列（通常是门店等文本名）
  const monthCol = headers.findIndex((h) => /月|month/i.test(h))
  const valCols = headers
    .map((h, ci) => ({ h, ci }))
    .filter(({ ci }) => ci !== monthCol && ci !== 0 && rows.some((r) => toNum(r[ci]) !== null))
  if (!valCols.length) return '表格中没有数值列，无法做统计分析。'
  // 名称列：第一个非数值、非月份的列（通常是门店/商品名）
  const nameCol = headers.findIndex(
    (h, ci) => ci !== monthCol && rows.every((r) => toNum(r[ci]) === null || String(r[ci]).trim() === '')
  )
  const labelOf = (r) => (nameCol >= 0 ? r[nameCol] : r[0])
  const parts = [`# 数据分析报告\n`, `## 一、数据概览\n`, `| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`]
  rows.forEach((r) => parts.push(`| ${r.map((c) => c || ' ').join(' | ')} |`))
  parts.push('', '## 二、主要发现')
  const findings = []
  const firstVal = valCols[0]
  const nums = rows.map((r) => toNum(r[firstVal.ci])).filter((n) => n !== null)
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length
  const sorted = rows
    .map((r) => ({ label: labelOf(r), val: toNum(r[firstVal.ci]) }))
    .filter((x) => x.val !== null)
    .sort((a, b) => b.val - a.val)
  if (sorted.length) {
    findings.push(`1. **${sorted[0].label} 领跑**：${firstVal.h} 达 ${fmt(sorted[0].val)}，高于均值 ${fmt(avg)}（依据：表格第 2 行起排序后首位）`)
    if (sorted.length > 1) findings.push(`2. **${sorted[sorted.length - 1].label} 垫底**：${firstVal.h} 仅 ${fmt(sorted[sorted.length - 1].val)}，建议重点分析原因（依据：排序末位）`)
    const outliers = sorted.filter((x) => Math.abs(x.val) > Math.abs(avg) * 3)
    if (outliers.length) findings.push(`3. ⚠️ **疑似异常**：${outliers.map((o) => `${o.label}（${fmt(o.val)}）`).join('、')} 远超均值，请核对源数据（依据：超过均值 3 倍判定）`)
  }
  // 环比发现（识别月份列，按门店比较相邻月份）
  if (monthCol >= 0) {
    const byName = {}
    rows.forEach((r) => {
      byName[labelOf(r)] = byName[labelOf(r)] || []
      byName[labelOf(r)].push({ mon: String(r[monthCol]), val: toNum(r[firstVal.ci]) })
    })
    const mojis = Object.entries(byName)
      .map(([name, arr]) => {
        arr.sort((a, b) => (a.mon < b.mon ? -1 : 1))
        if (arr.length < 2) return null
        const last = arr[arr.length - 1]
        const prev = arr[arr.length - 2]
        if (last.val === null || prev.val === null || prev.val === 0) return null
        const rate = ((last.val - prev.val) / prev.val) * 100
        return { name, from: prev.mon, to: last.mon, rate, val: last.val }
      })
      .filter(Boolean)
    if (mojis.length) {
      const worst = mojis.slice().sort((a, b) => a.rate - b.rate)[0]
      const best = mojis.slice().sort((a, b) => b.rate - a.rate)[0]
      findings.push(`4. **环比**：${best.name} ${best.to} 较 ${best.from} 增长 ${fmt(best.rate)}%；⚠️ ${worst.name} 下降 ${fmt(Math.abs(worst.rate))}%，需关注（依据：${best.name}/${worst.name} 相邻两期 ${firstVal.h} 相除）`)
    }
  }
  parts.push(...(findings.length ? findings : ['1. 数据整体平稳，未发现明显异常（依据：各值均在均值合理范围内）']))
  parts.push('', '## 三、建议')
  parts.push('- [ ] 对领跑门店复盘成功动作，形成可复制经验')
  parts.push('- [ ] 对环比下滑的门店做专项分析，制定改进计划')
  parts.push('- [ ] 用图表（Mermaid）直观呈现趋势')
  parts.push('', '> 💡 本报告由 AI 基于表格数据自动生成——结论都有「依据」可回溯，修改建议请结合业务实际判断。')
  return parts.join('\n')
}

/** SQL 纠错练习题库：AI 常见的 4 类错误 */
export const SQL_BUGS = [
  {
    title: '表名 / 列名拼写错误',
    wrong: 'SELECT 门店, 销量 FROM sale\nWHERE 月份 = \'2025-06\';',
    right: 'SELECT 门店, 销量 FROM sales\nWHERE 月份 = \'2025-06\';',
    explain: '表名是 sales 不是 sale。AI 靠猜，表名列名必须对照真实表结构核对，这是第一守则。',
  },
  {
    title: '聚合列缺少 GROUP BY',
    wrong: 'SELECT 门店, MAX(销量)\nFROM sales\nWHERE 月份 = \'2025-06\';',
    right: 'SELECT 门店, MAX(销量)\nFROM sales\nWHERE 月份 = \'2025-06\'\nGROUP BY 门店;',
    explain: 'SELECT 同时出现普通列（门店）和聚合函数（MAX），必须按普通列 GROUP BY，否则报错或数据错乱。',
  },
  {
    title: 'WHERE 与 HAVING 混用',
    wrong: 'SELECT 门店\nFROM sales\nWHERE MAX(销量) > 1000;',
    right: 'SELECT 门店\nFROM sales\nGROUP BY 门店\nHAVING MAX(销量) > 1000;',
    explain: 'WHERE 只能过滤原始行，不能出现聚合函数；对「分组后的结果」做条件要用 HAVING。',
  },
  {
    title: 'SQL 方言差异（MySQL vs SQL Server）',
    wrong: 'SELECT TOP 3 门店, 销量 FROM sales;   -- 这是 SQL Server 写法',
    right: 'SELECT 门店, 销量 FROM sales\nORDER BY 销量 DESC\nLIMIT 3;   -- MySQL 用 LIMIT',
    explain: '不同数据库方言不同：MySQL 用 LIMIT，SQL Server 用 TOP。问 AI 前要先说明你用的数据库。',
  },
  {
    title: 'JOIN 忘了写关联条件（ON）',
    wrong: 'SELECT stores.城市, SUM(sales.销售额)\nFROM sales\nINNER JOIN stores\nGROUP BY stores.城市;',
    right: 'SELECT stores.城市, SUM(sales.销售额)\nFROM sales\nINNER JOIN stores ON sales.store_id = stores.id\nGROUP BY stores.城市;',
    explain: 'JOIN 必须带 ON 关联条件，否则变成笛卡尔积（行数爆炸、数据全错）。AI 最常漏掉的就是 ON。',
  },
  {
    title: 'CASE WHEN 缺少 END / 条件重叠',
    wrong: 'SELECT 门店,\n  CASE\n    WHEN 销量 >= 1000 THEN \'高\'\n    WHEN 销量 >= 500 THEN \'中\'\n    WHEN 销量 >= 0 THEN \'低\'\n  FROM sales;',
    right: 'SELECT 门店,\n  CASE\n    WHEN 销量 >= 1000 THEN \'高\'\n    WHEN 销量 >= 500 THEN \'中\'\n    ELSE \'低\'\n  END AS 档位\nFROM sales;',
    explain: 'CASE 表达式必须用 END 结束（还常配 AS 别名）；条件从上到下匹配，最后一个分支用 ELSE 兜底最稳妥。',
  },
]
