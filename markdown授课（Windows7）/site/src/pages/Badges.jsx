import React from 'react'
import Layout from '../components/Layout.jsx'
import { BADGES, useProgress } from '../lib/progress.jsx'

/* 徽章墙 */
export default function Badges() {
  const { isDone } = useProgress()
  const earned = BADGES.filter((b) => isDone(b.module === 'm1' ? 'intro' : lessonOf(b.module))).length

  return (
    <Layout title="徽章墙" crumbs="成就">
      <div className="page-hero">
        <div className="eyebrow">🏅 徽章墙</div>
        <h1>我的成就</h1>
        <p className="sub">每完成一个模块就能点亮一枚徽章，共 6 枚。当前已点亮 {earned}/6。</p>
      </div>
      <div className="grid-3" style={{ marginTop: 10 }}>
        {BADGES.map((b) => {
          const has = isDone(lessonOf(b.module))
          return (
            <div key={b.id} className={`badge-card ${has ? 'earned' : ''}`}>
              <div className="b-icon">{b.icon}</div>
              <div className="b-name">{b.name}</div>
              <div className="b-desc">{b.desc}</div>
              {has && <div style={{ marginTop: 6, fontSize: 16 }}>✨</div>}
            </div>
          )
        })}
      </div>
      <div className="callout info" style={{ marginTop: 22 }}>
        <span className="co-icon">💡</span>
        <div>
          <b>小提示：</b>完成每个模块里的所有课程（含练习与小测验）即可点亮对应徽章。
          进度和徽章保存在你的浏览器本地（localStorage），换设备不会同步。
        </div>
      </div>
    </Layout>
  )
}

function lessonOf(mid) {
  const map = { m1: 'intro', m2: 'headings', m3: 'tables', m4: 'mermaid', m5: 'assistant', m6: 'quiz' }
  return map[mid]
}
