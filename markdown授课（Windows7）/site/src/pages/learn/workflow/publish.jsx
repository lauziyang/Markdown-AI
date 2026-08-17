import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete } from '../../../components/ui.jsx'
import MdEditor from '../../../components/MdEditor.jsx'
import { MarkdownPreview } from '../../../lib/md.jsx'
import { aiPolish } from '../../../lib/ai.js'
import { copyText } from '../../../lib/utils.js'

/* ============================================================
   发布流程的 5 个步骤
   ============================================================ */
const STEPS = [
  { icon: '✍️', label: '写文档' },
  { icon: '🔍', label: '格式检查' },
  { icon: '📄', label: '导出 PDF' },
  { icon: '⬆️', label: '推送 Git' },
  { icon: '🌐', label: '生成网页' },
]

/* 预填示例文章（故意带 2 处格式问题，方便演示"检查 + 自动修复"） */
const INITIAL_DOC = `#我的第一篇博客文章

这是**摘要**部分，用来吸引读者。

## 正文

*第一段：介绍背景
*第二段：展开论述
*第三段：总结观点

想了解更多？访问[我的博客](https://example.com)。

## 结尾

感谢阅读，欢迎留言讨论！`

/* git 推送动画的逐行输出 */
const GIT_LINES = [
  '$ git add .',
  '> 已将修改加入暂存区',
  '$ git commit -m "发布博客：我的第一篇博客文章"',
  '> 提交成功 → commit 8f3a2b1',
  '$ git push origin main',
  '> 推送成功 → 远程仓库已更新 🎉',
]

const SHARE_LINK = 'https://blog.example.com/post/md-blog-8f3a2b1'

/* 4 条格式检查规则 */
function runChecks(doc) {
  const lines = (doc || '').split('\n')
  const hasHeading = /^#{1,6}\s/m.test(doc)
  const noSpaceHead = []
  const listNoSpace = []
  lines.forEach((l, i) => {
    if (/^#{1,6}[^#\s]/.test(l)) noSpaceHead.push(i + 1)
    if (/^\s*[-*+]\S/.test(l)) listNoSpace.push(i + 1)
  })
  const starCount = (doc.match(/\*\*/g) || []).length
  const starsOk = starCount % 2 === 0
  return {
    hasHeading,
    noSpaceHead,
    listNoSpace,
    starCount,
    starsOk,
    ok: hasHeading && noSpaceHead.length === 0 && starsOk && listNoSpace.length === 0,
  }
}

/* 自绘步骤条：当前步骤高亮，已完成打勾 */
function StepBar({ current }) {
  return (
    <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
      {STEPS.map((s, i) => {
        const n = i + 1
        const state = n < current ? 'done' : n === current ? 'current' : 'todo'
        return (
          <React.Fragment key={n}>
            {i > 0 && (
              <div style={{ flex: 1, minWidth: 20, height: 3, borderRadius: 3, background: n <= current ? 'var(--ok)' : 'var(--border)' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 58 }}>
              <div
                style={{
                  width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 18,
                  background:
                    state === 'done'
                      ? 'var(--ok-soft)'
                      : state === 'current'
                        ? 'linear-gradient(135deg, var(--accent), var(--accent-2))'
                        : 'var(--bg-soft)',
                  color: state === 'current' ? '#fff' : state === 'done' ? 'var(--ok)' : 'var(--text-faint)',
                  border: state === 'current' ? 'none' : '1px solid var(--border)',
                  boxShadow: state === 'current' ? '0 0 0 4px var(--accent-soft)' : 'none',
                }}
              >
                {state === 'done' ? '✓' : s.icon}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: state === 'current' ? 800 : 600,
                  color: state === 'current' ? 'var(--accent)' : 'var(--text-soft)',
                  whiteSpace: 'nowrap',
                }}
              >
                {n}. {s.label}
              </span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* 浏览器样式的网页预览框 */
function BrowserFrame({ title, children }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div
        style={{
          background: 'var(--card-2)', borderBottom: '1px solid var(--border)',
          padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <i style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
        <i style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
        <i style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
        <b style={{ fontSize: 12.5, marginLeft: 8 }}>网页预览</b>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '18px 22px', background: 'var(--card)' }}>{children}</div>
    </div>
  )
}

export default function Publish() {
  const { done, markDone } = useLessonComplete('publish')
  const [step, setStep] = useState(1)
  const [doc, setDoc] = useState(INITIAL_DOC)
  const [checks, setChecks] = useState(null)
  const [exported, setExported] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [pushedDone, setPushedDone] = useState(false)
  const [pushLines, setPushLines] = useState([])
  const [copiedLink, setCopiedLink] = useState(false)
  const [fixMsg, setFixMsg] = useState(null)

  const checksOk = checks?.ok === true
  const finished = step === 6

  useEffect(() => {
    if (finished) markDone()
  }, [finished, markDone])

  /* 步骤 2：开始检查 */
  const startCheck = () => {
    setChecks(runChecks(doc))
    setFixMsg(null)
  }

  /* 步骤 2：自动修复（aiPolish + 补列表空格） */
  const autoFix = () => {
    let fixed = aiPolish(doc)
    fixed = fixed.replace(/^(\s*)([-*+])(\S)/gm, '$1$2 $3') // aiPolish 未覆盖：列表符号后补空格
    setDoc(fixed)
    setChecks(runChecks(fixed))
    setFixMsg('🔧 已自动修复，问题全部清零！')
  }

  /* 步骤 3：导出 PDF */
  const exportPdf = () => {
    setExported(true)
    window.print()
  }

  /* 步骤 4：git 推送动画 */
  const runPush = () => {
    if (pushing) return
    setPushing(true)
    setPushLines([])
    GIT_LINES.forEach((l, i) => {
      setTimeout(() => {
        setPushLines((prev) => [...prev, l])
        if (i === GIT_LINES.length - 1) {
          setPushing(false)
          setPushedDone(true)
        }
      }, i * 550)
    })
  }

  /* 步骤 5：复制分享链接 */
  const copyLink = async () => {
    const ok = await copyText(SHARE_LINK)
    setCopiedLink(ok)
  }

  const canNext = () => {
    if (step === 1) return doc.trim().length > 0
    if (step === 2) return checksOk
    if (step === 3) return exported
    if (step === 4) return pushedDone
    if (step === 5) return copiedLink
    return false
  }

  return (
    <LessonPage
      id="publish"
      module="m5"
      moduleName="模块五 · 实战工作流"
      time="50min"
      icon="🚀"
      title="文档发布流程模拟"
      subtitle="把一篇 Markdown 从草稿变成网上能看的网页，一共 5 步，跟着走一遍就懂了。"
      goals={['理解发布一篇文档的完整流程', '体验格式检查与自动修复', '亲手完成一次从写作到发布的旅程']}
    >
      <style>{`@media print { .sidebar, .header, .no-print { display: none !important; } .layout-content { max-width: 100% !important; padding: 16px !important; } }`}</style>

      <Section num={1} title="一篇文档的发布旅程">
        <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: '0 0 12px', lineHeight: 1.8 }}>
          从写完到上线，Markdown 文档一般要走 5 步：<b>写文档 → 格式检查 → 导出 PDF → 推送到 Git → 生成网页</b>。
          前两步保证「内容对、格式好」，后三步把文档送到读者面前。下面每一步你都可以亲手操作。
        </p>
        <Callout type="info">
          <b>小提示：</b>全部 5 步完成即可获得本课成就。中途想回头修改，随时点「上一步」。
        </Callout>
      </Section>

      <Section num={2} title="5 步发布工作台">
        <Exercise num={1} title="完整走一遍发布流程" done={finished} doneLabel="发布成功">
          <StepBar current={finished ? 6 : step} />

          <div style={{ fontWeight: 800, fontSize: 15, margin: '4px 0 12px' }}>
            {finished ? '✅ 全部完成！' : `第 ${step} 步 · ${STEPS[step - 1].icon} ${STEPS[step - 1].label}`}
          </div>

          {/* 第 1 步：写文档 */}
          {step === 1 && (
            <div className="fade-in">
              <Callout type="tip">
                <b>写文档：</b>编辑器里已经预填了一篇示例文章（含标题、列表、链接）。随便改几个字，让它变成你的文章吧。
              </Callout>
              <MdEditor value={doc} onChange={setDoc} height={320} />
              {doc.trim() && (
                <span className="chip chip-ok" style={{ marginTop: 10 }}>✅ 文档已就绪，可以进入下一步</span>
              )}
            </div>
          )}

          {/* 第 2 步：格式检查 */}
          {step === 2 && (
            <div className="fade-in">
              <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 12px' }}>
                点「开始检查」：AI 会用 4 条规则逐条检查你的文档，有问题的会自动给出修复方案。
              </p>
              <button className="btn btn-primary" onClick={startCheck}>🔍 开始检查</button>

              {checks && (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    {
                      ok: checks.hasHeading,
                      name: '包含标题',
                      detail: checks.hasHeading ? '检测到 # 标题' : '整篇文档没有任何标题',
                    },
                    {
                      ok: checks.noSpaceHead.length === 0,
                      name: '# 后没有缺空格',
                      detail: checks.noSpaceHead.length
                        ? `第 ${checks.noSpaceHead.join('、')} 行 # 后缺空格`
                        : '所有标题的 # 后都有空格',
                    },
                    {
                      ok: checks.starsOk,
                      name: '** 成对闭合',
                      detail: checks.starsOk
                        ? '加粗符号成对'
                        : `检测到 ${checks.starCount} 个 **，数量是奇数，有未闭合的加粗`,
                    },
                    {
                      ok: checks.listNoSpace.length === 0,
                      name: '列表符号后有空格',
                      detail: checks.listNoSpace.length
                        ? `第 ${checks.listNoSpace.join('、')} 行列表符号后缺空格`
                        : '列表符号后都有空格',
                    },
                  ].map((r) => (
                    <div
                      key={r.name}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px',
                        borderRadius: 10, border: '1px solid var(--border)',
                        background: r.ok ? 'var(--ok-soft)' : 'var(--err-soft)',
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{r.ok ? '✅' : '❌'}</span>
                      <b style={{ fontSize: 13.5 }}>{r.name}</b>
                      <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--text-soft)', textAlign: 'right' }}>
                        {r.detail}
                      </span>
                    </div>
                  ))}
                  {checks.ok ? (
                    <span className="chip chip-ok" style={{ alignSelf: 'flex-start' }}>🎉 格式全部通过！</span>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button className="btn btn-primary" onClick={autoFix}>🔧 自动修复（调用 AI 规范化）</button>
                      {fixMsg && <span className="chip chip-ok">{fixMsg}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 第 3 步：导出 PDF */}
          {step === 3 && (
            <div className="fade-in">
              <Callout type="info">
                <b>导出 PDF：</b>点击下方按钮会调用浏览器打印（<kbd>Ctrl/⌘ + P</kbd>），
                在打印窗口里选择「另存为 PDF」即可。本页已添加打印样式，打印时只会输出文档内容区域。
              </Callout>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={exportPdf}>🖨️ 导出 PDF</button>
                {exported && <span className="chip chip-ok">✅ 已导出</span>}
              </div>
            </div>
          )}

          {/* 第 4 步：推送 Git */}
          {step === 4 && (
            <div className="fade-in">
              <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 12px' }}>
                点「开始推送」，看看 Git 三条命令是怎么逐行执行的：
              </p>
              <div
                style={{
                  background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 12,
                  padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 13.5, minHeight: 140,
                }}
              >
                <div style={{ color: 'var(--text-faint)', marginBottom: 8 }}>终端 · 推送日志</div>
                {pushLines.length === 0 && !pushing && (
                  <div style={{ color: 'var(--text-faint)', opacity: 0.6 }}>等待操作…</div>
                )}
                {pushLines.map((l, i) => (
                  <div
                    key={i}
                    style={{
                      color: l.startsWith('$') ? '#a5b4fc' : l.startsWith('>') ? '#6ee7b7' : 'inherit',
                      whiteSpace: 'pre-wrap', margin: '2px 0',
                    }}
                  >
                    {l}
                  </div>
                ))}
                {pushing && <span className="typing-caret" style={{ color: '#e2e8f0' }} />}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={runPush} disabled={pushing || pushedDone}>
                  {pushing ? '⏳ 正在推送…' : '🚀 开始推送'}
                </button>
                {pushedDone && <span className="chip chip-ok">✅ 已推送到远程仓库</span>}
              </div>
            </div>
          )}

          {/* 第 5 步：生成网页 */}
          {step === 5 && (
            <div className="fade-in">
              <BrowserFrame title="blog.example.com">
                <MarkdownPreview source={doc} />
              </BrowserFrame>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--text-soft)' }}>🔗 分享链接：</span>
                <code
                  style={{
                    background: 'var(--bg-soft)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '5px 10px', fontSize: 13,
                  }}
                >
                  {SHARE_LINK}
                </code>
                <button className="btn btn-sm btn-primary" onClick={copyLink}>
                  {copiedLink ? '✅ 已复制' : '📋 复制链接'}
                </button>
              </div>
            </div>
          )}

          {/* 完成 */}
          {step === 6 && (
            <div className="fade-in">
              <div style={{ textAlign: 'center', padding: '26px 10px' }}>
                <div style={{ fontSize: 48 }}>🎉</div>
                <b style={{ fontSize: 18, display: 'block', margin: '10px 0 6px' }}>发布成功！</b>
                <p style={{ color: 'var(--text-soft)', fontSize: 14, maxWidth: 480, margin: '0 auto', lineHeight: 1.8 }}>
                  你已经完整走完了「写文档 → 格式检查 → 导出 PDF → 推送 Git → 生成网页」的发布流程。
                  以后写博客、写文档，都是这个套路。
                </p>
              </div>
            </div>
          )}

          {/* 导航按钮 */}
          <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            {step > 1 && step < 6 && (
              <button className="btn" onClick={() => setStep(step - 1)}>← 上一步</button>
            )}
            {step < 6 && (
              <button className="btn btn-primary" disabled={!canNext()} onClick={() => setStep(step + 1)}>
                {step === 5 ? '🎉 完成发布' : '下一步 →'}
              </button>
            )}
            {step < 6 && !canNext() && (
              <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>完成当前步骤后即可进入下一步</span>
            )}
          </div>

          {finished && (
            <Callout type="tip">
              <b>🎉 发布成功！</b>你已完成本课。下一课「Git + Markdown 工作流」将带你了解团队协作中的版本管理。
            </Callout>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
