/* 深度交互测试 v3：正确选择器 + 虚拟时间加速动画 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const list = await (await fetch('http://127.0.0.1:9222/json/list')).json()
  const page = list.find((t) => t.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0
  const pending = new Map()
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } }
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  const evalJS = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    return r.result?.result?.value
  }
  const nav = async (path, wait = 3200) => {
    await send('Page.navigate', { url: `http://localhost:4173/#${path}` })
    await sleep(wait)
  }
  const clickByText = async (re) =>
    evalJS(`(() => { const el = [...document.querySelectorAll('button')].find(b => ${re}.test(b.innerText)); if (el) { el.click(); return true } return false })()`)

  await send('Page.enable'); await send('Runtime.enable')

  await nav('/')
  await evalJS(`localStorage.setItem('mdlearn-progress-v1', JSON.stringify({ lessons: {}, badges: [], streak: { last: '', count: 0 }, theme: 'dark', unlockAll: true }))`)
  await send('Page.reload', { ignoreCache: true })
  await sleep(2500)

  const results = []
  const report = (name, ok, detail = '') => {
    results.push({ name, ok })
    console.log(`${ok ? '✅' : '❌'} ${name} ${detail}`)
  }

  // 1. mermaid：流程图模板渲染
  await nav('/learn/advanced/mermaid')
  await clickByText(/流程图/)
  await sleep(4000)
  const mermaidNodes = await evalJS(`document.querySelectorAll('.mermaid-block svg g.node').length`)
  report('mermaid 渲染 SVG', mermaidNodes > 0, `(${mermaidNodes} 个节点)`)

  // 2. latex：公式渲染 + 通关
  await nav('/learn/advanced/latex')
  await evalJS(`(() => { const el = document.querySelector('.exercise textarea'); const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set; setter.call(el, '\\\\sqrt{x^2 + 1} + \\\\frac{a}{b}'); el.dispatchEvent(new Event('input', { bubbles: true })) })()`)
  await sleep(1800)
  const katexEl = await evalJS(`document.querySelectorAll('.katex').length`)
  const exDone = await evalJS(`JSON.parse(localStorage.getItem('mdlearn-progress-v1')).lessons['latex']`)
  report('latex KaTeX 渲染', katexEl > 0, `(${katexEl} 个公式)`)
  report('latex 自动通关', exDone === 'done')

  // 3. tables：生成表格
  await nav('/learn/advanced/tables')
  await sleep(800)
  await clickByText(/生成表格/)
  await sleep(1200)
  const gridCells = await evalJS(`document.querySelectorAll('.demo-frame table td input').length`)
  const mdOut = await evalJS(`[...document.querySelectorAll('pre')].map(p => p.innerText).find(t => t.includes('|')) || ''`)
  report('tables 生成表格', gridCells >= 9, `(${gridCells} 个单元格)`)
  report('tables 生成源码', /-{3}/.test(mdOut), mdOut.split('\n')[1] || '')

  // 4. tasks：勾选
  await nav('/learn/advanced/tasks')
  await sleep(1000)
  const cbs = await evalJS(`document.querySelectorAll('input[type=checkbox]').length`)
  const toggled = await evalJS(`(() => { const cb = document.querySelector('input[type=checkbox]'); if (!cb) return false; cb.click(); return true })()`)
  await sleep(800)
  const pct = await evalJS(`document.body.innerText.match(/\\d+%/g)?.slice(0, 2)?.join(',') || ''`)
  report('tasks 勾选交互', toggled && cbs >= 3, `(复选框 ${cbs} 个, 进度 ${pct})`)

  // 5. toc：生成目录
  await nav('/learn/advanced/toc')
  await sleep(800)
  await clickByText(/生成目录/)
  await sleep(2000)
  const tocHeadings = await evalJS(`[...document.querySelectorAll('.demo-frame div')].filter(d => /为什么选择|核心语法速览|进阶用法/.test(d.innerText)).length`)
  report('toc 生成目录', tocHeadings >= 3, `(检测到 ${tocHeadings} 个标题)`)

  // 6. quiz：答题
  await nav('/learn/advanced/quiz')
  await sleep(1000)
  const qCount = await evalJS(`document.querySelectorAll('.quiz-q').length`)
  await evalJS(`document.querySelector('.quiz-q .qq-opt:nth-child(2)')?.click()`)
  await sleep(400)
  const optSel = await evalJS(`!!document.querySelector('.quiz-q .qq-opt.sel')`)
  report('quiz 答题交互', qCount >= 8 && optSel, `(${qCount} 题)`)

  // 7. assistant：AI 生成大纲
  await nav('/learn/ai/assistant')
  await sleep(1000)
  await evalJS(`(() => { const el = document.querySelector('input.ex-input'); const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(el, '用 Python 做数据分析'); el.dispatchEvent(new Event('input', { bubbles: true })) })()`)
  await clickByText(/AI 生成大纲/)
  await sleep(3000)
  const aiLen = await evalJS(`document.querySelector('.editor-shell .cm-content')?.innerText?.length || 0`)
  const aiDone = await evalJS(`JSON.parse(localStorage.getItem('mdlearn-progress-v1')).lessons['assistant']`)
  report('assistant AI 生成大纲', aiLen > 150, `(已输出 ${aiLen} 字符, 通关: ${aiDone})`)

  // 8. converter：文本转换启动
  await nav('/learn/ai/converter')
  await sleep(1000)
  await clickByText(/AI 转换/)
  await sleep(2000)
  const convLen = await evalJS(`document.querySelector('.editor-shell .cm-content')?.innerText?.length || 0`)
  report('converter 文本转换启动', convLen > 0, `(已输出 ${convLen} 字符)`)

  // 9. git：add 暂存
  await nav('/learn/workflow/git')
  await sleep(1500)
  await clickByText(/git add|暂存文件/)
  await sleep(600)
  const staged = await evalJS(`document.body.innerText.includes('暂存区')`)
  report('git 流程交互', staged, '')

  // 10. style：主题切换
  await nav('/learn/workflow/style')
  await sleep(1200)
  await clickByText(/暖色|护眼|夜间|极简/)
  await sleep(600)
  const styleChanged = await evalJS(`(() => { const el = document.querySelector('.md-theme-preview'); return !!(el && (el.style.background || el.style.getPropertyValue('--pv-bg'))) })()`)
  report('style 主题切换', styleChanged, '')

  const pass = results.filter((r) => r.ok).length
  console.log(`\n===== 交互测试: ${pass}/${results.length} 通过 =====`)
  ws.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
