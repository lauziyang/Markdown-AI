import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LessonPage, Section, Callout, useLessonComplete } from '../../../components/ui.jsx'
import { MarkdownPreview } from '../../../lib/md.jsx'
import { useProgress } from '../../../lib/progress.jsx'

const CARDS = [
  { icon: '#', name: '标题', desc: '# 数量对应层级', path: '/learn/core/headings', demo: '# 一级标题\n## 二级标题\n### 三级标题' },
  { icon: '**B**', name: '加粗 / 斜体', desc: '**加粗** 与 *斜体*', path: '/learn/core/emphasis', demo: '这是**加粗**，这是*斜体*，~~删除线~~' },
  { icon: '☑️', name: '列表', desc: '有序 1. 2. 3. 与无序 - ', path: '/learn/core/lists', demo: '1. 第一步\n2. 第二步\n\n- 苹果\n- 香蕉' },
  { icon: '🔗', name: '链接 / 图片', desc: '[文字](网址) 与 ![替代](图)', path: '/learn/core/links', demo: '[访问官网](https://example.com)\n\n![示例图片](https://picsum.photos/200/100)' },
  { icon: '💬', name: '引用', desc: '> 引用别人的话', inline: true, demo: '> 学而不思则罔，思而不学则殆。\n> —— 孔子' },
  { icon: '➖', name: '分割线', desc: '--- 三个短横线', inline: true, demo: '上面是正文\n\n---\n\n下面是另一段' },
  { icon: '⏎', name: '换行', desc: '两个空格 或 空一行', inline: true, demo: '第一行，行尾加两个空格  \n第二行才会换行\n\n空一行则是新段落' },
]

const LEVELS = [
  { id: 'headings', icon: '🔠', name: '关卡 1 · 标题', path: '/learn/core/headings' },
  { id: 'emphasis', icon: '🖊️', name: '关卡 2 · 强调', path: '/learn/core/emphasis' },
  { id: 'lists', icon: '📋', name: '关卡 3 · 列表', path: '/learn/core/lists' },
  { id: 'links', icon: '🔗', name: '关卡 4 · 链接与图片', path: '/learn/core/links' },
]

const ERRORS = [
  { bad: '#标题', good: '# 标题', why: '# 后面必须加一个空格' },
  { bad: '**文字（缺少闭合）', good: '**文字**', why: '加粗符号必须成对闭合' },
  { bad: '第一行直接回车换行', good: '第一行加两个空格再换行', why: '行尾加两个空格才会真正换行' },
  { bad: '[文字]（网址用中文括号）', good: '[文字](网址)', why: '链接必须用英文括号' },
  { bad: '-列表 符号后没空格', good: '- 列表 符号后要有空格', why: '列表符号后面要加空格' },
]

/* 常见错误匹配游戏：先点 ❌ 再点 ✅ */
function MatchGame() {
  const [sel, setSel] = useState(null)
  const [pairs, setPairs] = useState({})
  const [wrongFlash, setWrongFlash] = useState(null)

  const pickBad = (i) => {
    if (pairs[i] !== undefined) return
    setSel(i)
    setWrongFlash(null)
  }
  const pickGood = (gi) => {
    if (sel === null) return
    if (ERRORS[sel].good === ERRORS[gi].good) {
      setPairs((p) => ({ ...p, [sel]: gi }))
      setSel(null)
    } else {
      setWrongFlash(gi)
      setTimeout(() => setWrongFlash(null), 600)
    }
  }

  const doneCount = Object.keys(pairs).length
  const allDone = doneCount === ERRORS.length

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 13 }}>❌ 错误写法</div>
          {ERRORS.map((e, i) => (
            <div
              key={i}
              className="match-pill"
              style={{ display: 'block', margin: '6px 0', ...(pairs[i] !== undefined ? { opacity: 0.55 } : {}) }}
              onClick={() => pickBad(i)}
            >
              {pairs[i] !== undefined ? '✅ ' : '❌ '}{e.bad}
            </div>
          ))}
        </div>
        <div style={{ color: 'var(--text-faint)', textAlign: 'center' }}>→</div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 13 }}>✅ 正确写法</div>
          {ERRORS.map((e, gi) => (
            <div
              key={gi}
              className={`match-pill ${pairs[gi] !== undefined ? 'paired' : ''} ${wrongFlash === gi ? 'match-flash' : ''}`}
              style={{ display: 'block', margin: '6px 0' }}
              onClick={() => pickGood(gi)}
            >
              {e.good}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        {allDone ? (
          <span className="chip chip-ok">🎉 全部配对正确！你对易错点已经心里有数了</span>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>
            已配对 {doneCount}/{ERRORS.length} 组 —— 先点左边错误写法，再点右边对应的正确写法
          </span>
        )}
      </div>
      <style>{`.match-flash { border-color: var(--err) !important; background: var(--err-soft) !important; }`}</style>
    </div>
  )
}

export default function CoreHub() {
  const { done, markDone } = useLessonComplete('core-hub')
  const { isDone, isUnlocked } = useProgress()
  const [openInline, setOpenInline] = useState(null)

  // 5 个子课全部完成 -> 本页（语法卡片矩阵）自动完成
  const childrenIds = ['headings', 'emphasis', 'lists', 'links', 'playground']
  const allChildrenDone = childrenIds.every((id) => isDone(id))
  useEffect(() => {
    if (allChildrenDone) markDone()
  }, [allChildrenDone, markDone])

  return (
    <LessonPage
      id="core-hub"
      module="m2"
      moduleName="模块二 · 核心语法精讲"
      time="60min"
      icon="📗"
      title="语法卡片矩阵"
      subtitle="10 个最常用的语法，覆盖日常写作 80% 场景。点开卡片看讲解，完成练习即闯关成功。"
      goals={['掌握 10 个高频语法', '通过 4 个闯关关卡', '识别常见错误写法']}
    >
      <Section num={1} title="语法卡片矩阵">
        <div className="grid-3">
          {CARDS.map((c) => (
            <div className="card" key={c.name} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14, fontFamily: 'var(--font-mono)' }}>
                  {c.icon}
                </span>
                <b>{c.name}</b>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{c.desc}</div>
              <div style={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card-2)', padding: '8px 10px', maxHeight: 96, overflow: 'hidden' }}>
                <MarkdownPreview source={c.demo} />
              </div>
              {c.path ? (
                <Link to={c.path} className="btn btn-sm btn-primary" style={{ justifyContent: 'center' }}>
                  去学习 →
                </Link>
              ) : (
                <button className="btn btn-sm" onClick={() => setOpenInline(openInline === c.name ? null : c.name)}>
                  {openInline === c.name ? '收起 ▲' : '展开练习 ▼'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 内嵌练习：引用 / 分割线 / 换行 */}
        {openInline && (
          <InlineDemo name={openInline} />
        )}
      </Section>

      <Section num={2} title="闯关模式">
        {LEVELS.map((lv) => {
          const lvDone = isDone(lv.id)
          const unlocked = isUnlocked(lv.id)
          const isActive = unlocked && !lvDone
          return (
            <div key={lv.id} className={`level-card ${lvDone ? 'done' : ''} ${isActive ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}>
              <div className="lv-icon">{lvDone ? '🏆' : lv.icon}</div>
              <div className="lv-body">
                <div className="lv-title">
                  {lv.name}
                  {lvDone && <span className="chip chip-ok" style={{ fontSize: 11 }}>⭐ 已完成</span>}
                  {isActive && <span className="chip chip-accent" style={{ fontSize: 11 }}>🔓 进行中</span>}
                  {!unlocked && <span className="chip" style={{ fontSize: 11 }}>🔒 未解锁</span>}
                </div>
              </div>
              {unlocked ? (
                <Link to={lv.path} className="btn btn-sm">
                  {lvDone ? '复习' : '开始'}
                </Link>
              ) : (
                <span style={{ fontSize: 18 }}>🔒</span>
              )}
            </div>
          )
        })}
        <Callout type="info">
          每关 3-5 个小任务，全部通关即可获得「<b>语法大师</b>」徽章（完成整个模块二自动点亮）。
        </Callout>
      </Section>

      <Section num={3} title="常见错误对照">
        <MatchGame />
      </Section>

      <Section num={4} title="综合练习场">
        <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <b>格式化一段混乱文本</b>
            <div style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 4 }}>
              给你一段没有任何格式的纯文本，用 Markdown 给它加上标题、列表、强调，再对比参考答案。
            </div>
          </div>
          <Link to="/learn/core/playground" className="btn btn-primary">🎮 进入综合练习场</Link>
        </div>
      </Section>
    </LessonPage>
  )
}

/* 内嵌演示：引用/分割线/换行 */
function InlineDemo({ name }) {
  const [src, setSrc] = useState('')
  const demos = {
    引用: { hint: '输入 > 加空格，再写一句话，例如：> 读书使人进步', check: (s) => /^>\s+\S/m.test(s) },
    分割线: { hint: '单独一行输入 --- 即可生成分割线', check: (s) => /^---+$/m.test(s) },
    换行: { hint: '第一行行尾加两个空格再回车，第二行才会换行', check: (s) => /  \n/.test(s) || /\n\n/.test(s) },
  }
  const d = demos[name]
  const passed = d?.check(src)
  return (
    <div className="exercise" style={{ marginTop: 14 }}>
      <div className="exercise-head">
        <span className="ex-num">✏️</span>
        <span className="ex-title">{name} · 动手练</span>
        {passed && <span className="chip chip-ok" style={{ marginLeft: 'auto' }}>✅ 写法正确</span>}
      </div>
      <div className="exercise-body">
        <textarea
          className="ex-input"
          rows={4}
          placeholder={d?.hint}
          value={src}
          onChange={(e) => setSrc(e.target.value)}
        />
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--text-soft)' }}>渲染效果：</div>
          <MarkdownPreview source={src} />
        </div>
      </div>
    </div>
  )
}
