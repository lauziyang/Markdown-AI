import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete, CopyBlock } from '../../../components/ui.jsx'
import { MarkdownPreview } from '../../../lib/md.jsx'

/* ============================================================
   四个仓库区
   ============================================================ */
const ZONES = [
  { key: 'working', icon: '📝', name: '工作区', desc: '你正在写代码 / 文档的地方' },
  { key: 'staged', icon: '📦', name: '暂存区', desc: '已经 git add 选中的修改' },
  { key: 'committed', icon: '🏠', name: '本地仓库', desc: '已经 git commit 保存的历史' },
  { key: 'pushed', icon: '☁️', name: '远程仓库', desc: '已经 git push 同步到 GitHub' },
]

const FILE_CONTENT = `# Markdown 学习项目

一个帮助新手快速上手 Markdown 的交互式教程网站。`

/* 冲突示例：小明和小红同时改了同一行 */
const CONFLICT_DOC = `# 项目简介

<<<<<<< HEAD
这是小明的版本：本项目是一个 Markdown 学习网站。
=======
这是小红的版本：本项目帮助小白快速上手 Markdown。
>>>>>>> feature-red

## 功能

- 交互式教程
- 实时预览
- 实战练习`

/* ============================================================
   演示 1：工作区 → 暂存区 → 本地仓库 → 远程仓库
   ============================================================ */
function GitFlowDemo({ onPushed }) {
  const [stage, setStage] = useState('working')
  const [log, setLog] = useState([])
  const stageIdx = ZONES.findIndex((z) => z.key === stage)

  const run = (cmd) => {
    if (cmd === 'add') {
      setStage('staged')
      setLog((l) => [...l, '$ git add README.md', '→ 修改已进入暂存区 ✅'])
    } else if (cmd === 'commit') {
      setStage('committed')
      setLog((l) => [...l, '$ git commit -m "docs: 完善 README 说明"', '→ 已提交到本地仓库 ✅ (commit 9f2c8a1)'])
    } else {
      setStage('pushed')
      setLog((l) => [...l, '$ git push origin main', '→ 已推送到远程仓库 ✅'])
      onPushed?.()
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {ZONES.map((z, i) => {
          const active = stage === z.key
          const passed = i < stageIdx
          return (
            <div
              key={z.key}
              className="card"
              style={{
                padding: '14px 16px',
                borderColor: active ? 'var(--ok)' : 'var(--border)',
                opacity: passed || active ? 1 : 0.72,
                transition: 'all .2s',
              }}
            >
              <div style={{ fontSize: 22 }}>{z.icon}</div>
              <b style={{ display: 'block', margin: '6px 0 2px' }}>{z.name}</b>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.5, minHeight: 34 }}>{z.desc}</div>
              <div style={{ marginTop: 8 }}>
                {active ? (
                  <span className="chip chip-ok">📄 README.md ✅</span>
                ) : passed ? (
                  <span className="chip">✅ 已通过</span>
                ) : (
                  <span className="chip">空</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 示例文件卡片 */}
      <div className="card" style={{ marginTop: 12, padding: '12px 14px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--text-soft)' }}>
          📄 README.md（示例文件）
        </div>
        <pre
          style={{
            margin: 0, fontSize: 12.5, fontFamily: 'var(--font-mono)',
            background: 'var(--bg-soft)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)',
          }}
        >
          {FILE_CONTENT}
        </pre>
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14, alignItems: 'center' }}>
        {stage === 'working' && (
          <button className="btn btn-primary" onClick={() => run('add')}>git add . → 加入暂存区</button>
        )}
        {stage === 'staged' && (
          <button className="btn btn-primary" onClick={() => run('commit')}>git commit → 提交到本地</button>
        )}
        {stage === 'committed' && (
          <button className="btn btn-primary" onClick={() => run('push')}>git push → 推送到远程</button>
        )}
        {stage === 'pushed' && (
          <span className="chip chip-ok">🚀 add → commit → push 完整流程已完成！</span>
        )}
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => {
            setStage('working')
            setLog([])
          }}
        >
          🔄 重置
        </button>
      </div>

      {/* 终端日志 */}
      <div
        style={{
          marginTop: 14, background: 'var(--code-bg)', color: 'var(--code-text)',
          borderRadius: 12, padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 13.5, minHeight: 88,
        }}
      >
        <div style={{ color: 'var(--text-faint)', marginBottom: 6 }}>终端 · git 命令日志</div>
        {log.length === 0 && <div style={{ color: 'var(--text-faint)', opacity: 0.6 }}>等待操作…</div>}
        {log.map((l, i) => (
          <div key={i} style={{ color: l.startsWith('$') ? '#a5b4fc' : '#6ee7b7', margin: '2px 0', whiteSpace: 'pre-wrap' }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================================================
   演示 2：多人协作冲突模拟
   ============================================================ */
function GithubFrame({ title = 'README.md', children }) {
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
        <b style={{ fontSize: 12.5, marginLeft: 8 }}>GitHub 预览</b>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '18px 22px', background: 'var(--card)' }}>{children}</div>
    </div>
  )
}

function ConflictDemo({ onResolved }) {
  const [choice, setChoice] = useState(null)
  const resolved = choice !== null
  const merged = `# 项目简介

${choice === 'ming' ? '这是小明的版本：本项目是一个 Markdown 学习网站。' : '这是小红的版本：本项目帮助小白快速上手 Markdown。'}

## 功能

- 交互式教程
- 实时预览
- 实战练习`

  const pick = (c) => {
    setChoice(c)
    onResolved?.()
  }

  return (
    <div>
      <div style={{ fontSize: 13.5, color: 'var(--text-soft)', lineHeight: 1.7, marginBottom: 10 }}>
        🧑‍💻 同事<b>小明</b>和<b>小红</b>同时改了 README 的同一行（项目简介），Git 不知道该听谁的，
        就把两个版本都留了下来，并标上冲突标记（<code>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</code> 到{' '}
        <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code> 之间的部分）：
      </div>
      <CopyBlock code={CONFLICT_DOC} lang="diff" label="README.md（存在冲突）" />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
        <button className="btn btn-primary" disabled={resolved} onClick={() => pick('ming')}>
          👦 保留小明的版本
        </button>
        <button className="btn" disabled={resolved} onClick={() => pick('hong')}>
          👧 保留小红的版本
        </button>
        {resolved && <span className="chip chip-ok">✅ 冲突已解决</span>}
        <button className="btn btn-sm btn-ghost" disabled={!resolved} onClick={() => setChoice(null)}>
          🔄 重来
        </button>
      </div>
      {resolved && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8, color: 'var(--text-soft)' }}>
            合并后的文件（就像你在 GitHub 上看到的样子）：
          </div>
          <GithubFrame title="README.md">
            <MarkdownPreview source={merged} />
          </GithubFrame>
        </div>
      )}
    </div>
  )
}

export default function Git() {
  const { done, markDone } = useLessonComplete('git')
  const [pushed, setPushed] = useState(false)
  const [resolved, setResolved] = useState(false)
  const passed = pushed && resolved

  useEffect(() => {
    if (passed) markDone()
  }, [passed, markDone])

  return (
    <LessonPage
      id="git"
      module="m5"
      moduleName="模块五 · 实战工作流"
      time="50min"
      icon="🔀"
      title="Git + Markdown 工作流"
      subtitle="Markdown 是纯文本，天生适合 Git 管理。看看一次编辑从工作区到远程仓库的完整旅程，再体验一把多人协作的冲突解决。"
      goals={['理解工作区 / 暂存区 / 本地仓库 / 远程仓库', '亲手完成 add → commit → push 完整流程', '学会看懂并解决合并冲突']}
    >
      <Section num={1} title="文件的一生：四个仓库区">
        <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: '0 0 12px', lineHeight: 1.8 }}>
          一个文件从「开始编辑」到「别人也能看到」，会依次穿过四个地方：<b>工作区 → 暂存区 → 本地仓库 → 远程仓库</b>。
          每走一步，都要敲一条 git 命令。
        </p>
        <div
          className="card"
          style={{
            padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 8,
            flexWrap: 'wrap', fontSize: 13.5, marginBottom: 8,
          }}
        >
          {['📝 工作区', 'git add', '📦 暂存区', 'git commit', '🏠 本地仓库', 'git push', '☁️ 远程仓库'].map((t, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: 'var(--text-faint)' }}>→</span>}
              <span
                className="chip"
                style={
                  i % 2 === 1
                    ? { background: 'var(--accent-soft)', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }
                    : {}
                }
              >
                {t}
              </span>
            </React.Fragment>
          ))}
        </div>
        <CopyBlock
          code={`# 三步把文档送到 GitHub\ngit add .                 # 1. 加入暂存区\ngit commit -m "说明"       # 2. 提交到本地\ngit push origin main       # 3. 推送到远程`}
          lang="bash"
          label="Git 三连命令"
        />
      </Section>

      <Section num={2} title="冲突是怎么来的？">
        <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: '0 0 12px', lineHeight: 1.8 }}>
          多人协作时，如果<b>两个人同时改了同一行</b>，Git 不知道该保留谁，就会「罢工」——把两边的版本都留下来，
          让你手动选。下面就是 Git 自动生成的冲突标记。
        </p>
        <CopyBlock code={CONFLICT_DOC} lang="diff" label="冲突标记（Git 自动生成）" />
        <Callout type="info">
          <b>怎么读：</b>冲突标记把文件分成三段 —— <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</code> 下面是你（本地）的版本，
          <code>=======</code> 下面是对方的版本，<code>&gt;&gt;&gt;&gt;&gt;&gt;&gt; 分支名</code> 结束。
          你要做的就是：删掉标记，只保留想要的版本。
        </Callout>
      </Section>

      <Section num={3} title="练习：推一次 + 解决一次冲突">
        <Exercise num={1} title="完整 Git 工作流实战（add → commit → push + 解决冲突）" done={passed} doneLabel="Git 入门达成">
          <GitFlowDemo onPushed={() => setPushed(true)} />
          <div style={{ borderTop: '1px dashed var(--border)', margin: '18px 0' }} />
          <div style={{ fontWeight: 800, marginBottom: 8 }}>🧩 第二部分：解决一次多人协作冲突</div>
          <ConflictDemo onResolved={() => setResolved(true)} />
          {passed && (
            <Callout type="tip">
              <b>🎉 干得漂亮！</b>你已掌握 Git + Markdown 的核心协作流程。下一课「样式自定义」教你给文档换皮肤。
            </Callout>
          )}
        </Exercise>
      </Section>
    </LessonPage>
  )
}
