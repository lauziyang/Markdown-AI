import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { todayStr } from './utils.js'

/* ============================================================
   课程注册表：所有课程序列（用于解锁与进度统计）
   ============================================================

   结构（v2）：
   模块一 · 初识与样式    intro / setup / style
   模块二 · 核心语法精讲  core-hub / headings / emphasis / lists / links / playground
   模块三 · 进阶语法精讲  tables / code / tasks / escape
   模块四 · 高级应用      mermaid / latex / html / toc
   模块五 · AI 辅助与数据分析  assistant / data-analyze / doc-analyze / templates
   模块六 · 结业测试      quiz / challenge / ai-exam
   ============================================================ */

export const MODULES = [
  {
    id: 'm1',
    icon: '📘',
    name: '模块一 · 初识与样式',
    time: '40min',
    desc: '是什么、为什么用、样式定制',
    path: '/learn/intro',
  },
  {
    id: 'm2',
    icon: '📗',
    name: '模块二 · 核心语法精讲',
    time: '60min',
    desc: '标题、段落、强调、列表、链接、图片',
    path: '/learn/core',
  },
  {
    id: 'm3',
    icon: '📙',
    name: '模块三 · 进阶语法精讲',
    time: '45min',
    desc: '表格、代码块、引用、任务列表、转义',
    path: '/learn/advanced/tables',
  },
  {
    id: 'm4',
    icon: '📕',
    name: '模块四 · 高级应用',
    time: '60min',
    desc: '图表(Mermaid)、公式(LaTeX)、HTML混写、TOC',
    path: '/learn/advanced/mermaid',
  },
  {
    id: 'm5',
    icon: '🤖',
    name: '模块五 · AI 辅助与数据分析',
    time: '75min',
    desc: 'AI 写作、表格/SQL 分析、文档体检、场景模板',
    path: '/learn/ai/assistant',
  },
  {
    id: 'm6',
    icon: '🎓',
    name: '模块六 · 结业测试',
    time: '60min',
    desc: '进阶测验、综合挑战、AI 知识测验',
    path: '/learn/exam/quiz',
  },
]

// 门禁课程序列：每课解锁依赖前一课完成
export const LESSON_SEQUENCE = [
  { id: 'intro', path: '/learn/intro', title: 'Markdown 是什么', module: 'm1' },
  { id: 'setup', path: '/learn/setup', title: '环境搭建', module: 'm1' },
  { id: 'style', path: '/learn/core/style', title: '样式自定义', module: 'm1' },
  { id: 'core-hub', path: '/learn/core', title: '语法卡片矩阵', module: 'm2', hub: true },
  { id: 'headings', path: '/learn/core/headings', title: '标题', module: 'm2' },
  { id: 'emphasis', path: '/learn/core/emphasis', title: '强调（加粗/斜体/删除线）', module: 'm2' },
  { id: 'lists', path: '/learn/core/lists', title: '列表', module: 'm2' },
  { id: 'links', path: '/learn/core/links', title: '链接与图片', module: 'm2' },
  { id: 'playground', path: '/learn/core/playground', title: '综合练习场', module: 'm2' },
  { id: 'tables', path: '/learn/advanced/tables', title: '表格构建器', module: 'm3' },
  { id: 'code', path: '/learn/advanced/code', title: '代码块高亮实验室', module: 'm3' },
  { id: 'tasks', path: '/learn/advanced/tasks', title: '任务列表', module: 'm3' },
  { id: 'escape', path: '/learn/advanced/escape', title: '转义字符游戏', module: 'm3' },
  { id: 'mermaid', path: '/learn/advanced/mermaid', title: 'Mermaid 图表工坊', module: 'm4' },
  { id: 'latex', path: '/learn/advanced/latex', title: 'LaTeX 公式编辑', module: 'm4' },
  { id: 'html', path: '/learn/advanced/html', title: 'HTML 混写', module: 'm4' },
  { id: 'toc', path: '/learn/advanced/toc', title: '自动生成目录', module: 'm4' },
  { id: 'assistant', path: '/learn/ai/assistant', title: 'AI 辅助写作', module: 'm5' },
  { id: 'data-analyze', path: '/learn/ai/data-analyze', title: '表格数据分析', module: 'm5' },
  { id: 'sql-helper', path: '/learn/ai/sql-helper', title: '让 AI 帮你写 SQL', module: 'm5' },
  { id: 'sql-report', path: '/learn/ai/sql-report', title: '查询结果 → AI 解读 → 报告', module: 'm5' },
  { id: 'sql-rules', path: '/learn/ai/sql-rules', title: 'AI + SQL 的边界与规范', module: 'm5' },
  { id: 'doc-analyze', path: '/learn/ai/doc-analyze', title: '文档智能分析', module: 'm5' },
  { id: 'templates', path: '/learn/ai/templates', title: '场景模板库', module: 'm5' },
  { id: 'quiz', path: '/learn/exam/quiz', title: '进阶小测验', module: 'm6' },
  { id: 'challenge', path: '/learn/exam/challenge', title: '综合挑战', module: 'm6' },
  { id: 'ai-exam', path: '/learn/exam/ai-exam', title: 'AI 知识测验', module: 'm6' },
]

export const BADGES = [
  { id: 'beginner', icon: '🌱', name: '初识者', desc: '完成模块一', module: 'm1' },
  { id: 'syntax-master', icon: '⚡', name: '语法大师', desc: '完成模块二', module: 'm2' },
  { id: 'table-expert', icon: '📊', name: '表格专家', desc: '完成模块三', module: 'm3' },
  { id: 'diagram-pro', icon: '📈', name: '图表达人', desc: '完成模块四', module: 'm4' },
  { id: 'ai-helper', icon: '🤖', name: 'AI 搭档', desc: '完成模块五', module: 'm5' },
  { id: 'graduate', icon: '🎓', name: '结业认证', desc: '完成模块六', module: 'm6' },
]

const STORAGE_KEY = 'mdlearn-progress-v1'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { lessons: {}, badges: [], streak: { last: '', count: 0 }, theme: 'dark', unlockAll: false }
}

const ProgressContext = createContext(null)

export function ProgressProvider({ children }) {
  const [state, setState] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  const value = useMemo(() => {
    /** 标记某课完成（首次完成还会返回 true） */
    const completeLesson = (id) => {
      let newly = false
      setState((s) => {
        if (s.lessons[id] === 'done') return s
        newly = true
        const lessons = { ...s.lessons, [id]: 'done' }
        const doneIds = LESSON_SEQUENCE.filter((l) => lessons[l.id] === 'done').map((l) => l.module)
        const badges = s.badges.slice()
        for (const b of BADGES) {
          const allDone = LESSON_SEQUENCE.filter((l) => l.module === b.module).every(
            (l) => lessons[l.id] === 'done'
          )
          if (allDone && !badges.includes(b.id)) badges.push(b.id)
        }
        // 连续学习天数
        const t = todayStr()
        let streak = s.streak
        if (streak.last === t) {
          // 同日不重复计算
        } else if (streak.last === yesterdayStr()) {
          streak = { last: t, count: streak.count + 1 }
        } else {
          streak = { last: t, count: 1 }
        }
        return { ...s, lessons, badges, streak }
      })
      return newly
    }

    const lessonIndex = (id) => LESSON_SEQUENCE.findIndex((l) => l.id === id)
    /** 该课是否已解锁（顺序解锁；总览页不参与"上一步"门禁，避免死锁） */
    const isUnlocked = (id) => {
      if (state.unlockAll) return true
      const i = lessonIndex(id)
      if (i <= 0) return true
      for (let j = i - 1; j >= 0; j--) {
        if (!LESSON_SEQUENCE[j].hub) {
          return state.lessons[LESSON_SEQUENCE[j].id] === 'done'
        }
      }
      return true
    }
    const isDone = (id) => state.lessons[id] === 'done'

    const moduleDoneIds = (mid) =>
      LESSON_SEQUENCE.filter((l) => l.module === mid && state.lessons[l.id] === 'done').map((l) => l.id)
    const moduleProgress = (mid) => {
      const all = LESSON_SEQUENCE.filter((l) => l.module === mid)
      const done = all.filter((l) => state.lessons[l.id] === 'done').length
      return { done, total: all.length, pct: Math.round((done / all.length) * 100) }
    }
    const totalProgress = () => {
      const done = LESSON_SEQUENCE.filter((l) => state.lessons[l.id] === 'done').length
      return { done, total: LESSON_SEQUENCE.length, pct: Math.round((done / LESSON_SEQUENCE.length) * 100) }
    }

    const setTheme = (theme) => setState((s) => ({ ...s, theme }))
    const toggleTheme = () =>
      setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))
    const setUnlockAll = (v) => setState((s) => ({ ...s, unlockAll: v }))
    /** 重置全部学习进度（保留主题设置） */
    const resetProgress = () =>
      setState((s) => ({
        lessons: {},
        badges: [],
        streak: { last: '', count: 0 },
        theme: s.theme,
        unlockAll: false,
      }))

    return {
      ...state,
      completeLesson,
      isUnlocked,
      isDone,
      moduleProgress,
      totalProgress,
      moduleDoneIds,
      setTheme,
      toggleTheme,
      setUnlockAll,
      resetProgress,
    }
  }, [state])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', value.theme || 'dark')
  }, [value.theme])

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  return useContext(ProgressContext)
}

/** 找到一课"真正的前一课"（跳过总览页），用于解锁提示 */
export function previousLesson(id) {
  const i = LESSON_SEQUENCE.findIndex((l) => l.id === id)
  if (i <= 0) return LESSON_SEQUENCE[0]
  for (let j = i - 1; j >= 0; j--) {
    if (!LESSON_SEQUENCE[j].hub) return LESSON_SEQUENCE[j]
  }
  return LESSON_SEQUENCE[0]
}

function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
