import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { previousLesson, useProgress } from './lib/progress.jsx'
import { LockScreen } from './components/ui.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const PathPage = lazy(() => import('./pages/Path.jsx'))
const BadgesPage = lazy(() => import('./pages/Badges.jsx'))

// 模块一
const Intro = lazy(() => import('./pages/learn/intro.jsx'))
const Setup = lazy(() => import('./pages/learn/setup.jsx'))
const StylePage = lazy(() => import('./pages/learn/core/style.jsx'))

// 模块二
const CoreHub = lazy(() => import('./pages/learn/core/CoreHub.jsx'))
const Headings = lazy(() => import('./pages/learn/core/headings.jsx'))
const Emphasis = lazy(() => import('./pages/learn/core/emphasis.jsx'))
const Lists = lazy(() => import('./pages/learn/core/lists.jsx'))
const Links = lazy(() => import('./pages/learn/core/links.jsx'))
const Playground = lazy(() => import('./pages/learn/core/playground.jsx'))

// 模块三
const Tables = lazy(() => import('./pages/learn/advanced/tables.jsx'))
const CodeLab = lazy(() => import('./pages/learn/advanced/code.jsx'))
const Tasks = lazy(() => import('./pages/learn/advanced/tasks.jsx'))
const Escape = lazy(() => import('./pages/learn/advanced/escape.jsx'))

// 模块四
const Mermaid = lazy(() => import('./pages/learn/advanced/mermaid.jsx'))
const Latex = lazy(() => import('./pages/learn/advanced/latex.jsx'))
const HtmlMix = lazy(() => import('./pages/learn/advanced/html.jsx'))
const Toc = lazy(() => import('./pages/learn/advanced/toc.jsx'))

// 模块五
const Assistant = lazy(() => import('./pages/learn/ai/assistant.jsx'))
const DataAnalyze = lazy(() => import('./pages/learn/ai/data-analyze.jsx'))
const SqlHelper = lazy(() => import('./pages/learn/ai/sql-helper.jsx'))
const SqlReport = lazy(() => import('./pages/learn/ai/sql-report.jsx'))
const SqlRules = lazy(() => import('./pages/learn/ai/sql-rules.jsx'))
const DocAnalyze = lazy(() => import('./pages/learn/ai/doc-analyze.jsx'))
const Templates = lazy(() => import('./pages/learn/ai/templates.jsx'))

// 模块六（结业测试）
const QuizPage = lazy(() => import('./pages/learn/exam/quiz.jsx'))
const Challenge = lazy(() => import('./pages/learn/exam/challenge.jsx'))
const AiExam = lazy(() => import('./pages/learn/exam/ai-exam.jsx'))

/** 课程门禁：未解锁则显示锁屏 */
function Gate({ id, children }) {
  const { isUnlocked } = useProgress()
  if (!isUnlocked(id)) {
    const prev = previousLesson(id)
    return <LockScreen nextPath={prev.path} nextTitle={prev.title} />
  }
  return children
}

function Page({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: 'var(--text-faint)' }}>⏳ 加载中…</div>}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <Page>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/path" element={<PathPage />} />
        <Route path="/badges" element={<BadgesPage />} />

        <Route path="/learn/intro" element={<Gate id="intro"><Intro /></Gate>} />
        <Route path="/learn/setup" element={<Gate id="setup"><Setup /></Gate>} />
        <Route path="/learn/core/style" element={<Gate id="style"><StylePage /></Gate>} />

        <Route path="/learn/core" element={<Gate id="core-hub"><CoreHub /></Gate>} />
        <Route path="/learn/core/headings" element={<Gate id="headings"><Headings /></Gate>} />
        <Route path="/learn/core/emphasis" element={<Gate id="emphasis"><Emphasis /></Gate>} />
        <Route path="/learn/core/lists" element={<Gate id="lists"><Lists /></Gate>} />
        <Route path="/learn/core/links" element={<Gate id="links"><Links /></Gate>} />
        <Route path="/learn/core/playground" element={<Gate id="playground"><Playground /></Gate>} />

        <Route path="/learn/advanced/tables" element={<Gate id="tables"><Tables /></Gate>} />
        <Route path="/learn/advanced/code" element={<Gate id="code"><CodeLab /></Gate>} />
        <Route path="/learn/advanced/tasks" element={<Gate id="tasks"><Tasks /></Gate>} />
        <Route path="/learn/advanced/escape" element={<Gate id="escape"><Escape /></Gate>} />

        <Route path="/learn/advanced/mermaid" element={<Gate id="mermaid"><Mermaid /></Gate>} />
        <Route path="/learn/advanced/latex" element={<Gate id="latex"><Latex /></Gate>} />
        <Route path="/learn/advanced/html" element={<Gate id="html"><HtmlMix /></Gate>} />
        <Route path="/learn/advanced/toc" element={<Gate id="toc"><Toc /></Gate>} />

        <Route path="/learn/ai/assistant" element={<Gate id="assistant"><Assistant /></Gate>} />
        <Route path="/learn/ai/data-analyze" element={<Gate id="data-analyze"><DataAnalyze /></Gate>} />
        <Route path="/learn/ai/sql-helper" element={<Gate id="sql-helper"><SqlHelper /></Gate>} />
        <Route path="/learn/ai/sql-report" element={<Gate id="sql-report"><SqlReport /></Gate>} />
        <Route path="/learn/ai/sql-rules" element={<Gate id="sql-rules"><SqlRules /></Gate>} />
        <Route path="/learn/ai/doc-analyze" element={<Gate id="doc-analyze"><DocAnalyze /></Gate>} />
        <Route path="/learn/ai/templates" element={<Gate id="templates"><Templates /></Gate>} />

        <Route path="/learn/exam/quiz" element={<Gate id="quiz"><QuizPage /></Gate>} />
        <Route path="/learn/exam/challenge" element={<Gate id="challenge"><Challenge /></Gate>} />
        <Route path="/learn/exam/ai-exam" element={<Gate id="ai-exam"><AiExam /></Gate>} />

        <Route path="*" element={<Home />} />
      </Routes>
    </Page>
  )
}
