import React from 'react'

/* 错误边界：单个页面崩溃不拖垮整个应用 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('[页面错误]', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-soft)' }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>😵</div>
          <h2 style={{ marginBottom: 8 }}>这一页出了点小问题</h2>
          <p style={{ fontSize: 13, maxWidth: 520, margin: '0 auto 16px', wordBreak: 'break-all' }}>
            {String(this.state.error?.message || this.state.error).slice(0, 200)}
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            🔄 刷新页面
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
