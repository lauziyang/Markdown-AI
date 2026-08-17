import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { MODULES, LESSON_SEQUENCE, useProgress } from '../lib/progress.jsx'

/* ============================================================
   侧边栏：模块分组 + 课程序列 + 锁定状态
   ============================================================ */

function SidebarInner({ open, onClose }) {
  const { isUnlocked, isDone, moduleProgress, unlockAll, setUnlockAll, totalProgress, resetProgress } = useProgress()
  const tp = totalProgress()
  const [openGroups, setOpenGroups] = useState(() => {
    const loc = window.location.hash
    const m = MODULES.find((mod) => loc.includes(mod.id.replace('m', '')))
    const o = {}
    for (const mod of MODULES) o[mod.id] = !!m && m.id === mod.id
    return o
  })
  const navigate = useNavigate()

  const toggleGroup = (id) => setOpenGroups((s) => ({ ...s, [id]: !s[id] }))

  const lessonsOf = (mid) => LESSON_SEQUENCE.filter((l) => l.module === mid)

  return (
    <div className={`sidebar ${open ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-badge">M↓</div>
        <div>
          <div className="logo-text">Markdown 精讲</div>
          <div className="logo-sub">交互式学习网站</div>
        </div>
      </div>

      <NavLink to="/" className="nav-item" style={{ marginLeft: 0 }} onClick={onClose}>
        <span className="nav-dot" style={{ background: 'var(--accent)' }} />🏠 首页
      </NavLink>
      <NavLink to="/path" className="nav-item" onClick={onClose}>
        <span className="nav-dot" />🗺️ 学习路径
      </NavLink>
      <NavLink to="/badges" className="nav-item" onClick={onClose}>
        <span className="nav-dot" />🏅 徽章墙
      </NavLink>

      <div style={{ height: 10 }} />

      {MODULES.map((mod) => {
        const lessons = lessonsOf(mod.id)
        const prog = moduleProgress(mod.id)
        const isOpen = openGroups[mod.id]
        return (
          <div key={mod.id} className={`nav-group ${isOpen ? 'open' : ''}`}>
            <div
              className="nav-group-title"
              onClick={() => toggleGroup(mod.id)}
              title={`${prog.done}/${prog.total} 完成`}
            >
              <span>{mod.icon}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {mod.name}
              </span>
              <span className="nav-arrow">▶</span>
            </div>
            {isOpen &&
              lessons.map((l) => {
                const done = isDone(l.id)
                const unlocked = isUnlocked(l.id)
                const active = window.location.hash.includes(l.path)
                if (!unlocked) {
                  return (
                    <div key={l.id} className="nav-item locked" title="完成上一课解锁">
                      <span className="nav-dot" />🔒 {l.title}
                    </div>
                  )
                }
                return (
                  <NavLink
                    key={l.id}
                    to={l.path}
                    className={`nav-item ${active ? 'active' : ''} ${done ? 'done' : ''}`}
                    onClick={onClose}
                  >
                    <span className="nav-dot" />
                    {l.title}
                    {done && <span className="nav-check">✅</span>}
                  </NavLink>
                )
              })}
          </div>
        )
      })}

      <div className="sidebar-footer">
        <div style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center' }}>
          总进度 {tp.done}/{tp.total} · {tp.pct}%
        </div>
        <button
          className="btn btn-ghost btn-sm foot-btn"
          onClick={() => setUnlockAll(!unlockAll)}
          title="开关课程锁，方便自由浏览"
        >
          {unlockAll ? '🔓 自由浏览中（点击锁定）' : '🔒 顺序学习（点击全部解锁）'}
        </button>
        <button
          className="btn btn-ghost btn-sm foot-btn"
          onClick={() => {
            if (window.confirm('确定要清空所有学习进度吗？此操作不可撤销。')) {
              resetProgress()
              setTimeout(() => window.location.reload(), 150)
            }
          }}
          title="清空课程进度、徽章和连续学习天数"
        >
          🗑️ 重置进度
        </button>
      </div>
    </div>
  )
}

/* ============================================================
   顶栏
   ============================================================ */

function Header({ title, crumbs, onMenu }) {
  const { toggleTheme, theme, streak, totalProgress } = useProgress()
  const p = totalProgress()

  return (
    <header className="header">
      <button className="icon-btn menu-btn" onClick={onMenu} title="打开导航">
        ☰
      </button>
      <div className="header-title">
        {crumbs && <span className="crumb">{crumbs}</span>}
        {title}
      </div>
      <div className="header-right">
        <div className="header-progress" title="总进度">
          <span>{p.pct}%</span>
          <span className="bar"><i style={{ width: `${p.pct}%` }} /></span>
          <span>{p.done}/{p.total}</span>
        </div>
        {streak.count > 0 && (
          <span className="streak" title="连续学习天数">🔥 {streak.count} 天</span>
        )}
        <button className="icon-btn" onClick={toggleTheme} title="切换主题">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}

/* ============================================================
   布局外壳
   ============================================================ */

export default function Layout({ children, title, crumbs }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="layout">
      <SidebarInner open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="layout-main">
        <Header title={title} crumbs={crumbs} onMenu={() => setMobileOpen(true)} />
        <main className="layout-content fade-in">{children}</main>
      </div>
    </div>
  )
}
