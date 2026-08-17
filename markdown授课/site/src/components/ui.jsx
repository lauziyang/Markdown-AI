import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout.jsx'
import { useProgress } from '../lib/progress.jsx'
import { copyText } from '../lib/utils.js'

/* ============================================================
   基础 UI 组件
   ============================================================ */

export function Section({ num, title, children, id }) {
  return (
    <section className="section" id={id}>
      <div className="section-head">
        {num && <span className="sec-no">{num}</span>}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  )
}

export function Callout({ type = 'info', icon, title, children }) {
  const icons = { tip: '💡', warn: '⚠️', info: 'ℹ️', error: '🚫' }
  return (
    <div className={`callout ${type}`}>
      <span className="co-icon">{icon || icons[type]}</span>
      <div>
        {title && <b>{title}：</b>}
        {children}
      </div>
    </div>
  )
}

export function CopyBlock({ code, lang = 'markdown', label }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="code-block">
      <div className="cb-head">
        <span>{label || (lang ? `${lang} 代码` : '代码')}</span>
        <button
          className="cb-copy"
          onClick={async () => {
            await copyText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          {copied ? '✓ 已复制' : '📋 复制'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

/* ============================================================
   课程页外壳：标题 / 目标 / 完成状态
   ============================================================ */

export function LessonPage({ id, module, moduleName, time, icon, title, subtitle, goals = [], children }) {
  const { isDone } = useProgress()
  const done = isDone(id)
  return (
    <Layout title={title} crumbs={moduleName}>
      <div className="page-hero">
        <div className="eyebrow">
          <span>{icon}</span>
          {moduleName}
          {done && <span className="chip chip-ok">✅ 已通关</span>}
        </div>
        <h1>{title}</h1>
        <p className="sub">{subtitle}</p>
        {goals.length > 0 && (
          <div className="goals">
            {goals.map((g, i) => (
              <div className="goal-item" key={i}>
                <span className="g-icon">🎯</span>
                <span>{g}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {children}
    </Layout>
  )
}

/* ============================================================
   练习外壳 + 完成标记 Hook
   ============================================================ */

export function useLessonComplete(id) {
  const { completeLesson, isDone } = useProgress()
  return {
    done: isDone(id),
    markDone: () => completeLesson(id),
  }
}

export function Exercise({ num, title, done = false, doneLabel = '完成', children, extra }) {
  return (
    <div className={`exercise ${done ? 'exercise-done' : ''}`}>
      <div className="exercise-head">
        <span className="ex-num">{num}</span>
        <span className="ex-title">{title}</span>
        <span className="ex-badge">
          {done ? (
            <span className="chip chip-ok">✅ {doneLabel}</span>
          ) : (
            <span className="chip">待完成</span>
          )}
        </span>
      </div>
      <div className="exercise-body">{children}</div>
      {extra}
    </div>
  )
}

/** 检测按钮 + 反馈 */
export function CheckFeedback({ checked, ok, message, onCheck, children }) {
  return (
    <div style={{ marginTop: 10 }}>
      {children && <div style={{ marginBottom: 8 }}>{children}</div>}
      <div className={`feedback ${checked ? 'show' : ''} ${ok ? 'ok' : 'bad'}`}>
        {ok ? `🎉 ${message || '回答正确！'}` : `❌ ${message || '再试一次吧'}`}
      </div>
    </div>
  )
}

/* ============================================================
   锁屏页（未解锁课程）
   ============================================================ */

export function LockScreen({ nextPath, nextTitle }) {
  const navigate = useNavigate()
  return (
    <Layout title="未解锁">
      <div className="lock-screen">
        <div className="ls-icon">🔒</div>
        <h2>这一课还没解锁</h2>
        <p style={{ color: 'var(--text-soft)', maxWidth: 420 }}>
          先完成上一课《{nextTitle}》的练习，就能解锁本课啦～
        </p>
        <button className="btn btn-primary" onClick={() => navigate(nextPath)}>
          📖 去完成《{nextTitle}》
        </button>
      </div>
    </Layout>
  )
}
