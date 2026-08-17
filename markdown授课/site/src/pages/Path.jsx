import React from 'react'
import Layout from '../components/Layout.jsx'
import { LESSON_SEQUENCE, MODULES, useProgress } from '../lib/progress.jsx'

/* 学习路径总览图 */
export default function Path() {
  const { isDone, isUnlocked, moduleProgress, totalProgress } = useProgress()
  const tp = totalProgress()

  const treeLines = [
    '🏠 首页',
    '  │',
  ]
  MODULES.forEach((mod, mi) => {
    const lessons = LESSON_SEQUENCE.filter((l) => l.module === mod.id)
    const last = mi === MODULES.length - 1
    const conn = last ? '  ' : '  │'
    treeLines.push(`  ├${last ? '─' : '─'} ${mod.icon} ${mod.name}`)
    lessons.forEach((l, li) => {
      const done = isDone(l.id)
      const unlocked = isUnlocked(l.id)
      const mark = done ? ' ✅' : unlocked ? '' : ' 🔒'
      const prefix = li === lessons.length - 1 ? '       └──' : '       ├──'
      treeLines.push(`  ${conn}${prefix} ${l.title}${mark}`)
    })
    if (!last) treeLines.push('  │')
  })

  return (
    <Layout title="学习路径总览" crumbs="总览">
      <div className="page-hero">
        <div className="eyebrow">🗺️ 学习路径总览图</div>
        <h1>从零到一的完整学习路线</h1>
        <p className="sub">总进度 {tp.done}/{tp.total}（{tp.pct}%）· 按顺序完成每课练习即可解锁下一课。</p>
      </div>

      <div className="grid-2">
        {MODULES.map((mod) => {
          const p = moduleProgress(mod.id)
          return (
            <div className="card" key={mod.id} style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{mod.icon}</span>
                <b>{mod.name}</b>
                <span className="chip" style={{ marginLeft: 'auto' }}>{p.done}/{p.total}</span>
              </div>
              <div className="progress-track">
                <i style={{ width: `${p.pct}%` }} />
              </div>
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-soft)', lineHeight: 2 }}>
                {LESSON_SEQUENCE.filter((l) => l.module === mod.id).map((l) => (
                  <div key={l.id}>
                    {isDone(l.id) ? '✅' : isUnlocked(l.id) ? '🔓' : '🔒'} {l.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 26 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>完整路线图</h2>
        <div className="path-tree">{treeLines.join('\n')}</div>
      </div>
    </Layout>
  )
}
