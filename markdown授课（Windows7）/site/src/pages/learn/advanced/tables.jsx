import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, CopyBlock, useLessonComplete } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'
import { MarkdownPreview } from '../../../lib/md.jsx'
import { copyText } from '../../../lib/utils.js'

/* ============================================================
   表格工具函数：网格 <-> Markdown 源码（双向转换）
   ============================================================ */

const SEP = { left: ':---', center: ':---:', right: '---:' }

function tableToMarkdown(rows, aligns) {
  if (!rows.length || !rows[0].length) return ''
  const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
  const lines = [rows[0].map(esc)]
  lines.push(aligns.map((a) => SEP[a] || '---'))
  rows.slice(1).forEach((r) => lines.push(r.map(esc)))
  return lines.map((r) => `| ${r.join(' | ')} |`).join('\n')
}

function parseTable(md) {
  const lines = (md || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.includes('|'))
  let sepIdx = -1
  lines.forEach((l, i) => {
    const t = l.replace(/^\|/, '').replace(/\|$/, '')
    if (sepIdx < 0 && t.includes('-') && /^[\s:|-]+$/.test(t)) sepIdx = i
  })
  if (sepIdx < 1) return null
  const cells = (line) =>
    line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim().replace(/\\\|/g, '|'))
  const header = cells(lines[sepIdx - 1])
  const seps = lines[sepIdx]
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())
  const aligns = seps.map((c) => {
    if (c.startsWith(':') && c.endsWith(':')) return 'center'
    if (c.endsWith(':')) return 'right'
    return 'left'
  })
  const rows = [header]
  for (let i = sepIdx + 1; i < lines.length; i++) rows.push(cells(lines[i]))
  const cols = Math.max(...rows.map((r) => r.length))
  const pad = (r) => {
    const out = [...r]
    while (out.length < cols) out.push('')
    return out
  }
  while (aligns.length < cols) aligns.push('left')
  return { rows: rows.map(pad), aligns }
}

const EXAMPLE_TABLE = `| 姓名 | 年龄 | 城市 |
| --- | --- | --- |
| 张三 | 25 | 北京 |
| 李四 | 30 | 上海 |`

const SAMPLE_TABLE = `| 水果 | 价格 | 甜度 |
| :--- | ---: | :---: |
| 苹果 | 5 元 | 高 |
| 香蕉 | 3 元 | 中 |`

/* ============================================================
   可视化表格构建器
   ============================================================ */

function TableBuilder({ onPass }) {
  const [colsInput, setColsInput] = useState(3)
  const [rowsInput, setRowsInput] = useState(3)
  const [grid, setGrid] = useState(null) // { rows: string[][], aligns: string[] }
  const [parseSrc, setParseSrc] = useState('')
  const [parseMsg, setParseMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const generate = () => {
    const c = Math.min(6, Math.max(1, Number(colsInput) || 3))
    const r = Math.min(6, Math.max(1, Number(rowsInput) || 3))
    setGrid({
      rows: Array.from({ length: r }, (_, i) =>
        Array.from({ length: c }, (_, j) => (i === 0 ? `表头${j + 1}` : ''))
      ),
      aligns: Array(c).fill('left'),
    })
    setCopied(false)
  }

  const setCell = (i, j, val) => {
    setGrid((g) => {
      if (!g) return g
      const rows = g.rows.map((r) => [...r])
      rows[i][j] = val
      return { ...g, rows }
    })
  }

  const setAlign = (j, val) => {
    setGrid((g) => (g ? { ...g, aligns: g.aligns.map((a, k) => (k === j ? val : a)) } : g))
  }

  const md = grid ? tableToMarkdown(grid.rows, grid.aligns) : ''

  const copy = async () => {
    await copyText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const doParse = () => {
    const parsed = parseTable(parseSrc)
    if (!parsed) {
      setParseMsg('没解析出表格 😅 检查一下：表头下面要有一行由短横线组成的「分隔行」')
      return
    }
    setGrid(parsed)
    setColsInput(parsed.rows[0].length)
    setRowsInput(parsed.rows.length)
    setCopied(false)
    setParseMsg(`✅ 解析成功：${parsed.rows[0].length} 列 × ${parsed.rows.length} 行，已同步进网格`)
  }

  const fillSample = () => {
    setParseSrc(SAMPLE_TABLE)
    setParseMsg('')
  }

  const passed =
    !!grid &&
    grid.rows.length >= 3 &&
    grid.rows[0].length >= 3 &&
    grid.rows.flat().filter((c) => String(c ?? '').trim() !== '').length >= 3

  useEffect(() => {
    if (passed) onPass()
  }, [passed, onPass])

  return (
    <div>
      {/* 顶部控制：列数 / 行数 / 生成 */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: 'var(--text-soft)' }}>
          列数（1-6）
          <br />
          <input
            type="number"
            min={1}
            max={6}
            value={colsInput}
            onChange={(e) => setColsInput(e.target.value)}
            className="ex-input"
            style={{ width: 76, marginTop: 4 }}
          />
        </label>
        <label style={{ fontSize: 13, color: 'var(--text-soft)' }}>
          行数（1-6）
          <br />
          <input
            type="number"
            min={1}
            max={6}
            value={rowsInput}
            onChange={(e) => setRowsInput(e.target.value)}
            className="ex-input"
            style={{ width: 76, marginTop: 4 }}
          />
        </label>
        <button className="btn btn-primary" onClick={generate}>🛠️ 生成表格</button>
        {passed && <span className="chip chip-ok">✅ 3×3 条件已满足</span>}
      </div>

      {!grid ? (
        <div className="card" style={{ padding: '18px 20px', color: 'var(--text-faint)', textAlign: 'center' }}>
          点击「生成表格」，然后在格子里填内容 👆
        </div>
      ) : (
        <div className="grid-2">
          {/* 左侧：可编辑网格 + 对齐 */}
          <div className="demo-frame" style={{ padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
              ✏️ 可编辑网格（第一行是表头，每列表头可切换对齐）
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13.5 }}>
                <thead>
                  <tr>
                    {grid.aligns.map((a, j) => (
                      <th key={j} style={{ border: '1px solid var(--border)', padding: 5, background: 'var(--bg-soft)' }}>
                        <select
                          value={a}
                          onChange={(e) => setAlign(j, e.target.value)}
                          style={{
                            width: '100%', fontSize: 12.5, padding: '3px 4px', borderRadius: 6,
                            border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)',
                          }}
                        >
                          <option value="left">左对齐</option>
                          <option value="center">居中</option>
                          <option value="right">右对齐</option>
                        </select>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grid.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} style={{ border: '1px solid var(--border)', padding: 4 }}>
                          <input
                            value={cell}
                            onChange={(e) => setCell(i, j, e.target.value)}
                            placeholder={i === 0 ? '表头' : '内容'}
                            style={{
                              width: '100%', boxSizing: 'border-box', minWidth: 64,
                              padding: '5px 7px', borderRadius: 6, fontSize: 13.5,
                              border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)',
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 8 }}>
              表头一行的每列都有一个下拉框，试试切换对齐方式，看看右边源码里冒号的位置怎么变～
            </div>
          </div>

          {/* 右侧：生成的 Markdown 源码 */}
          <div className="demo-frame" style={{ padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📝 生成的 Markdown 源码</div>
            <pre
              style={{
                background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10,
                padding: '12px 14px', fontSize: 13, lineHeight: 1.7, fontFamily: 'var(--font-mono)',
                margin: 0, overflowX: 'auto', minHeight: 96,
              }}
            >
              {md || '（空）'}
            </pre>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn btn-sm btn-primary" onClick={copy}>
                {copied ? '✓ 已复制' : '📋 复制源码'}
              </button>
              <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
                单元格里的 | 会自动转义成 \|，不会破坏表格
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 实时预览 */}
      {grid && (
        <div className="card" style={{ padding: '16px 18px', marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>👀 实时预览（渲染效果）</div>
          <MarkdownPreview source={md} />
        </div>
      )}

      {/* 从 Markdown 解析回来 */}
      <div className="card" style={{ padding: '16px 18px', marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🔁 从 Markdown 解析（双向同步）</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-soft)', marginBottom: 8 }}>
          把别人给的表格源码粘进来，点「解析回网格」，它就会变成上面那个可编辑网格，改完又能导回源码。
        </div>
        <textarea
          className="ex-input"
          rows={4}
          value={parseSrc}
          onChange={(e) => setParseSrc(e.target.value)}
          placeholder={'| 姓名 | 年龄 |\n| --- | --- |\n| 张三 | 25 |'}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
        />
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-sm" onClick={fillSample}>🎁 填入示例</button>
          <button className="btn btn-sm btn-primary" onClick={doParse}>🔁 解析回网格</button>
          {parseMsg && <span style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>{parseMsg}</span>}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   页面
   ============================================================ */

const ALIGN_CARDS = [
  { sym: ':---', name: '左对齐', tip: '冒号在左边' },
  { sym: ':---:', name: '居中', tip: '冒号在两边' },
  { sym: '---:', name: '右对齐', tip: '冒号在右边' },
]

export default function Tables() {
  const { done, markDone } = useLessonComplete('tables')
  const [freeSrc, setFreeSrc] = useState('')

  return (
    <LessonPage
      id="tables"
      module="m3"
      moduleName="模块三 · 进阶语法精讲"
      time="60min"
      icon="📊"
      title="表格构建器"
      subtitle="表格是 Markdown 里最像「表格」的语法。这一课我们用可视化工具，把表头、分隔行、对齐方式一次搞清楚。"
      goals={['看懂表格的骨架：表头行 + 分隔行', '掌握三种对齐方式 :--- / :---: / ---:', '亲手构建一个 3×3 表格并通关']}
    >
      <Section num={1} title="表格的骨架：就两行">
        <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.8 }}>
          Markdown 表格其实是<b>用纯文本画的格子</b>：最上面一行是表头，紧接着一行是「分隔行」（由短横线
          <code>---</code> 组成），下面就是内容行。行与列之间用竖线 <code>|</code> 隔开。
        </p>
        <CopyBlock code={EXAMPLE_TABLE} lang="markdown" label="表格源码" />
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>渲染效果：</div>
          <MarkdownPreview source={EXAMPLE_TABLE} />
        </div>
        <Callout type="info">
          <b>记忆口诀：</b>表格 = 表头行 + 分隔行 + 内容行。分隔行里的短横线数量随便写，但<b>至少要有 1 个</b>，
          而且表头和分隔行之间<b>不能空行</b>。
        </Callout>
      </Section>

      <Section num={2} title="对齐方式：冒号放在哪">
        <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.8 }}>
          分隔行里藏着小机关：<b>冒号的位置</b>决定这一列靠左、居中还是靠右。规则一句话——
          <b>冒号在哪边，内容就往哪边靠</b>。
        </p>
        <div className="grid-3">
          {ALIGN_CARDS.map((a) => (
            <div className="card" key={a.sym} style={{ padding: '14px 16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent)', fontWeight: 700 }}>{a.sym}</div>
              <b style={{ display: 'block', margin: '6px 0 2px' }}>{a.name}</b>
              <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{a.tip}</span>
            </div>
          ))}
        </div>
        <div className="demo-frame" style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>三种对齐放在一起看：</div>
          <MarkdownPreview source={'| 左对齐 | 居中 | 右对齐 |\n| :--- | :---: | ---: |\n| 苹果 | 苹果 | 苹果 |\n| 香蕉 | 香蕉 | 香蕉 |'} />
        </div>
      </Section>

      <Section num={3} title="🎯 练习：构建你的第一个表格">
        <Exercise num={1} title="生成至少 3×3 的表格并填好内容" done={done} doneLabel="表格大师">
          <TableBuilder onPass={markDone} />
          {done && (
            <Callout type="tip" title="通关">
              <b>太棒了！</b>你已经会亲手「画」表格了。下一课《代码块高亮实验室》已经解锁，去把代码也变得漂漂亮亮吧～
            </Callout>
          )}
        </Exercise>
      </Section>

      <Section num={4} title="✏️ 自主练习区">
        <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 10px' }}>
          这里是自由练习场——随便写表格、随便改格式，<b>不会被判定对错</b>。
          试着手写一张表格（表头行 + 分隔行），看看冒号怎么放才能对齐。
        </p>
        <MdEditor
          value={freeSrc}
          onChange={setFreeSrc}
          height={240}
          initialMode="split"
          placeholder={'| 姓名 | 年龄 |\n| :--- | ---: |\n| 张三 | 25 |\n| 李四 | 30 |'}
          hint="提示：第二行是分隔行，冒号在左=左对齐，在右=右对齐，两边都有=居中"
        />
      </Section>

      <Section num={5} title="下一步">
        {done ? (
          <Callout type="tip" title="获得徽章">
            你已完成「表格构建器」，模块三进度 +1！继续完成其余课程，集齐模块三就能点亮「<b>进阶语法大师</b>」徽章。
          </Callout>
        ) : (
          <p style={{ color: 'var(--text-faint)' }}>完成上面的练习后，这里会出现通关彩蛋 🎉</p>
        )}
      </Section>
    </LessonPage>
  )
}
