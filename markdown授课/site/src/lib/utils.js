// 通用小工具

/** 复制文本到剪贴板，返回是否成功 */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return true
    } catch {
      return false
    }
  }
}

/** 简单的 Markdown 统计：字数 / 标题数 / 段落数 / 图片数 */
export function mdStats(src) {
  const text = src || ''
  const lines = text.split('\n')
  const chars = text.replace(/\s/g, '').length
  const headings = lines.filter((l) => /^#{1,6}\s/.test(l)).length
  const images = (text.match(/!\[[^\]]*\]\([^)]*\)/g) || []).length
  const links = (text.match(/\[[^\]]+\]\([^)]*\)/g) || []).length
  const paragraphs = (() => {
    let n = 0
    let inBlock = false
    for (const l of lines) {
      const t = l.trim()
      if (!t || /^(#{1,6}\s|>|\s*[-*+]\s|\s*\d+[.)]\s|```|```|\|)/.test(t) || t.startsWith('```')) {
        inBlock = t.startsWith('```') ? !inBlock : inBlock
        continue
      }
      if (!inBlock) n++
    }
    return n
  })()
  return { chars, headings, paragraphs, images, links }
}

/** 今天的日期 YYYY-MM-DD */
export function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 判断是否锁定的通用函数（由进度上下文提供） */

/** 从 Markdown 源码提取标题层级，用于 TOC */
export function extractHeadings(src) {
  const lines = (src || '').split('\n')
  const out = []
  lines.forEach((line, i) => {
    const m = line.match(/^(#{1,6})\s+(.+?)\s*$/)
    if (m) {
      out.push({
        level: m[1].length,
        text: m[2].replace(/[*_`]/g, ''),
        id: `h-${i}`,
      })
    }
  })
  return out
}

/** 根据标题生成 TOC 的 markdown 源码 */
export function headingsToMarkdown(headings, maxLevel = 3) {
  return headings
    .filter((h) => h.level <= maxLevel)
    .map((h) => `${'  '.repeat(h.level - 1)}- ${h.text}`)
    .join('\n')
}

/** 生成一段示例长文档（用于 TOC 演示） */
export function sampleLongDoc() {
  return `# 使用 Markdown 写技术文档完全指南

## 为什么选择 Markdown

纯文本、随处可写、版本友好，是技术写作的事实标准。

### 与 Word 的区别

Word 强调"所见即所得"，Markdown 强调"内容与样式分离"。

## 核心语法速览

### 标题

用 \`#\` 的数量表示层级。

### 强调与列表

- 加粗：\`**文字**\`
- 斜体：\`*文字*\`
- 有序列表：\`1. 第一步\`

## 进阶用法

### 表格

用管道符 \`|\` 和短横线 \`-\` 绘制表格。

### 代码块

用三个反引号包裹代码，并标注语言。

## 高级应用

### 画图与公式

- Mermaid 画流程图
- LaTeX 写数学公式

### 自动生成目录

利用标题层级自动生成可点击目录。

## 实战工作流

### 从写作到发布

1. 本地编辑
2. Git 提交
3. 构建发布

### 协作规范

统一风格、统一目录结构、定期审查。

## 总结

Markdown 让写作回归内容本身。
`
}
