import React from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { MODULES, BADGES, useProgress } from '../lib/progress.jsx'

const BADGE_LESSON = { m1: 'intro', m2: 'headings', m3: 'tables', m4: 'mermaid', m5: 'assistant', m6: 'quiz' }

export default function Home() {
  const { moduleProgress, totalProgress, streak, isDone } = useProgress()
  const tp = totalProgress()

  // 找第一个未完成的模块作为"继续学习"入口
  let continuePath = '/learn/intro'
  for (const mod of MODULES) {
    if (moduleProgress(mod.id).pct < 100) {
      continuePath = mod.path
      break
    }
  }
  if (tp.done === tp.total) continuePath = '/badges'

  const earnedBadges = BADGES.filter((b) => isDone(BADGE_LESSON[b.module])).length

  return (
    <Layout title="首页">
      <div className="hero-banner">
        <h1>📝 Markdown 精讲 · 交互式学习</h1>
        <p>
          不用死记硬背，通过 <b>交互式动画</b> 与 <b>亲手操作</b>，一步步理解每个知识点——
          从「是什么」到「实战工作流」，保证<b>傻子也能看懂</b>。
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to={continuePath} className="btn btn-primary">
            {tp.done > 0 ? '▶️ 继续学习' : '🚀 开始学习'}
          </Link>
          <Link to="/path" className="btn">🗺️ 查看学习路径</Link>
        </div>
        <div className="hero-meta" style={{ marginTop: 18 }}>
          <span>📚 6 大模块 · 27 课</span>
          <span>⏱️ 总时长约 340 分钟</span>
          <span>🔥 连续学习 {streak.count} 天</span>
          <span>🏆 已获徽章 {earnedBadges}/6</span>
        </div>
      </div>

      <div style={{ margin: '22px 0 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{ fontSize: 18 }}>我的总进度</h2>
        <div className="progress-track" style={{ flex: 1, maxWidth: 320 }}>
          <i style={{ width: `${tp.pct}%` }} />
        </div>
        <b style={{ color: 'var(--accent)' }}>{tp.pct}%</b>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        {MODULES.map((mod) => {
          const p = moduleProgress(mod.id)
          return (
            <Link key={mod.id} to={mod.path} className="module-card">
              <div className="mc-top">
                <div className="mc-icon">{mod.icon}</div>
                <div>
                  <div className="mc-title">{mod.name}</div>
                  <div className="mc-desc">{mod.desc}</div>
                </div>
              </div>
              <div className="mc-foot">
                <div className="progress-track" style={{ flex: 1 }}>
                  <i style={{ width: `${p.pct}%` }} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-soft)' }}>{p.pct}%</span>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="card" style={{ padding: '18px 22px', marginTop: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>💡 学习建议</h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-soft)', fontSize: 14 }}>
          <li>每个知识点都配有「边写边看」的实时编辑器，看完立刻动手。</li>
          <li>完成练习后会自动记录进度、解锁下一课并颁发徽章。</li>
          <li>遇到写错的语法不用怕，网站会给出友好的错误提示和自动修复。</li>
          <li>建议按顺序学习，也可以点击左下角「全部解锁」自由浏览。</li>
        </ul>
      </div>
    </Layout>
  )
}
