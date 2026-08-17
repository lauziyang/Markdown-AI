import React, { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { createTheme } from '@uiw/codemirror-themes'
import { MarkdownPreview } from '../lib/md.jsx'
import { mdStats } from '../lib/utils.js'

const lightTheme = createTheme({
  theme: 'light',
  settings: {
    background: '#ffffff',
    foreground: '#1a2138',
    caret: '#6366f1',
    selection: 'rgba(99,102,241,0.18)',
    lineHighlight: 'rgba(99,102,241,0.06)',
    gutterBackground: '#f8f9fd',
    gutterForeground: '#8b93a8',
  },
  styles: [],
})

const darkTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#10141e',
    foreground: '#e8ebf4',
    caret: '#818cf8',
    selection: 'rgba(129,140,248,0.22)',
    lineHighlight: 'rgba(129,140,248,0.07)',
    gutterBackground: '#10141e',
    gutterForeground: '#6d7690',
  },
  styles: [],
})

/* ============================================================
   双栏实时预览编辑器
   模式：split（分栏） / source（源码） / preview（预览）
   ============================================================ */

export default function MdEditor({
  value,
  onChange,
  height = 360,
  placeholder = '在这里输入 Markdown…',
  initialMode = 'split',
  showStats = true,
  hint,
  mermaidTheme,
  minPreviewHeight = 240,
}) {
  const [mode, setMode] = useState(initialMode)
  const stats = mdStats(value)
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  // 简单跟随主题变化
  const [themeTick, setThemeTick] = useState(0)
  React.useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((t) => t + 1))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  void themeTick

  const cmTheme = isDark ? darkTheme : lightTheme

  return (
    <div className="editor-shell">
      <div className="editor-tabs">
        <button className={`editor-tab ${mode === 'source' ? 'on' : ''}`} onClick={() => setMode('source')}>
          ⌨️ 源码
        </button>
        <button className={`editor-tab ${mode === 'split' ? 'on' : ''}`} onClick={() => setMode('split')}>
          📑 分栏
        </button>
        <button className={`editor-tab ${mode === 'preview' ? 'on' : ''}`} onClick={() => setMode('preview')}>
          👁️ 预览
        </button>
      </div>

      <div className="editor-body">
        {mode !== 'preview' && (
          <div className={`editor-pane ${mode === 'split' ? 'split' : ''}`}>
            <CodeMirror
              value={value}
              onChange={(v) => onChange?.(v)}
              height={`${height}px`}
              theme={cmTheme}
              extensions={[markdown()]}
              placeholder={placeholder}
              basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
            />          </div>
        )}
        {mode !== 'source' && (
          <div className="editor-pane">
            <div className="editor-preview" style={{ minHeight: minPreviewHeight }}>
              <MarkdownPreview source={value} mermaidTheme={mermaidTheme} />
            </div>
          </div>
        )}
      </div>

      {showStats && (
        <div className="editor-stats">
          <span>📝 字数 <b>{stats.chars}</b></span>
          <span>🔠 标题 <b>{stats.headings}</b></span>
          <span>📄 段落 <b>{stats.paragraphs}</b></span>
          <span>🖼️ 图片 <b>{stats.images}</b></span>
          <span>🔗 链接 <b>{stats.links}</b></span>
        </div>
      )}
      {hint && <div className="editor-hint">💬 {hint}</div>}
    </div>
  )
}
