/* CDP 验证脚本：遍历所有路由，检查渲染 + 收集控制台错误 + 截图
   用法：node scripts/verify.mjs <port> <shotsDir>
   需要 Chrome 以 --remote-debugging-port 启动 */

const port = process.argv[2] || 9222
const shotsDir = process.argv[3] || '/tmp/mdlearn-shots'
const base = 'http://localhost:4173'

const ROUTES = [
  { path: '/', title: '首页', sel: ['.hero-banner h1'] },
  { path: '/path', title: '学习路径', sel: ['.page-hero h1'] },
  { path: '/badges', title: '徽章墙', sel: ['.badge-card'] },
  { path: '/learn/intro', title: 'Markdown 是什么', sel: ['.page-hero h1', '.editor-shell'] },
  { path: '/learn/setup', title: '环境搭建', sel: ['.page-hero h1', '.timeline'] },
  { path: '/learn/first', title: '第一个文档', sel: ['.page-hero h1', '.editor-shell'] },
  { path: '/learn/core', title: '语法卡片矩阵', sel: ['.page-hero h1', '.level-card'] },
  { path: '/learn/core/headings', title: '标题专题', sel: ['.page-hero h1', '.editor-shell'] },
  { path: '/learn/core/emphasis', title: '强调专题', sel: ['.page-hero h1', '.editor-shell'] },
  { path: '/learn/core/lists', title: '列表专题', sel: ['.page-hero h1', '.editor-shell'] },
  { path: '/learn/core/links', title: '链接与图片', sel: ['.page-hero h1', '.editor-shell'] },
  { path: '/learn/core/playground', title: '综合练习场', sel: ['.page-hero h1', '.editor-shell'] },
  { path: '/learn/advanced/tables', title: '表格构建器', sel: ['.page-hero h1'] },
  { path: '/learn/advanced/code', title: '代码块', sel: ['.page-hero h1'] },
  { path: '/learn/advanced/tasks', title: '任务列表', sel: ['.page-hero h1'] },
  { path: '/learn/advanced/escape', title: '转义', sel: ['.page-hero h1'] },
  { path: '/learn/advanced/quiz', title: '小测验', sel: ['.page-hero h1', '.quiz-q'] },
  { path: '/learn/advanced/challenge', title: '综合挑战', sel: ['.page-hero h1', '.editor-shell'] },
  { path: '/learn/advanced/mermaid', title: 'Mermaid', sel: ['.page-hero h1'] },
  { path: '/learn/advanced/latex', title: '公式', sel: ['.page-hero h1'] },
  { path: '/learn/advanced/html', title: 'HTML 混写', sel: ['.page-hero h1'] },
  { path: '/learn/advanced/toc', title: '目录生成', sel: ['.page-hero h1'] },
  { path: '/learn/workflow/templates', title: '场景模板', sel: ['.page-hero h1'] },
  { path: '/learn/workflow/publish', title: '发布流程', sel: ['.page-hero h1'] },
  { path: '/learn/workflow/git', title: 'Git', sel: ['.page-hero h1'] },
  { path: '/learn/workflow/style', title: '样式定制', sel: ['.page-hero h1'] },
  { path: '/learn/ai/assistant', title: 'AI 辅助写作', sel: ['.page-hero h1'] },
  { path: '/learn/ai/converter', title: '格式转换', sel: ['.page-hero h1'] },
  { path: '/learn/ai/prompts', title: '提示词速查', sel: ['.page-hero h1'] },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  // 找到 page 类型的调试目标
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const page = list.find((t) => t.type === 'page')
  if (!page) throw new Error('no page target found')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  let msgId = 0
  const pending = new Map()
  const errors = []

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(`[EXC] ${msg.params.exceptionDetails.text}: ${msg.params.exceptionDetails.exception?.description || ''}`.slice(0, 300))
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      errors.push(`[LOG] ${msg.params.entry.text}`.slice(0, 300))
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push(`[CONSOLE] ${msg.params.args.map((a) => a.value || a.description || '').join(' ')}`.slice(0, 300))
    }
  }

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = ++msgId
      pending.set(id, resolve)
      ws.send(JSON.stringify({ id, method, params }))
    })

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Log.enable')

  // 首次加载时写入 unlockAll，便于验证所有页面内容
  await send('Page.navigate', { url: `${base}/#/` })
  await sleep(2500)
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('mdlearn-progress-v1', JSON.stringify({ lessons: {}, badges: [], streak: { last: '', count: 0 }, theme: 'dark', unlockAll: true }))`,
  })
  await send('Page.reload', { ignoreCache: true })
  await sleep(2500)

  const results = []
  for (const route of ROUTES) {
    const pageErrors = []
    errors.length = 0
    try {
      await send('Page.navigate', { url: `${base}/#${route.path}` })
      await sleep(3500)
      // 等待应用挂载
      for (let i = 0; i < 20; i++) {
        const r = await send('Runtime.evaluate', {
          expression: `document.querySelector('#root')?.children.length || 0`,
          returnByValue: true,
        })
        if (r.result?.result?.value > 0) break
        await sleep(300)
      }
      const evalRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const q = (s) => document.querySelectorAll(s).length
          const text = document.body.innerText || ''
          const lock = !!document.querySelector('.lock-screen')
          return {
            selCounts: ${JSON.stringify(route.sel.map((s) => [s]))}.map(([s]) => q(s)),
            hasLock: lock,
            bodyLen: text.length,
            title: document.title,
            h1: (document.querySelector('.page-hero h1, .hero-banner h1')?.innerText || '').slice(0, 60),
          }
        })()`,
        returnByValue: true,
      })
      const data = evalRes.result?.result?.value || {}
      console.log(`  [${route.path}] data:`, JSON.stringify(data).slice(0, 200))
      const selOk = data.selCounts?.every((c) => c > 0) && !data.hasLock
      const ok = selOk && errors.length === 0 && data.bodyLen > 300
      results.push({
        path: route.path,
        ok,
        selOk,
        errors: errors.length,
        hasLock: data.hasLock,
        bodyLen: data.bodyLen,
        h1: data.h1,
      })
      // 截图
      const shot = await send('Page.captureScreenshot', { format: 'png' })
      const fs = await import('node:fs')
      const name = route.path === '/' ? 'home' : route.path.replace(/^\//, '').replace(/\//g, '_')
      fs.writeFileSync(`${shotsDir}/${name}.png`, Buffer.from(shot.result.data, 'base64'))
      for (const e of errors) pageErrors.push(e)
    } catch (e) {
      results.push({ path: route.path, ok: false, error: String(e).slice(0, 200) })
    }
    if (pageErrors.length) console.log(`  errors on ${route.path}:`, pageErrors.slice(0, 3))
  }

  console.log('\n===== 验证结果 =====')
  let pass = 0
  for (const r of results) {
    if (r.ok) pass++
    console.log(`${r.ok ? '✅' : '❌'} ${r.path}${r.ok ? '' : JSON.stringify(r).slice(0, 220)}`)
  }
  console.log(`\n${pass}/${results.length} 通过`)
  ws.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
