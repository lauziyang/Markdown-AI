import React, { useState } from 'react'

/* ============================================================
   小测验组件
   props: questions [{q, options[], answer, explain}]
          passScore (0-100)，默认 80
          onPass 通过时的回调
   ============================================================ */

export default function Quiz({ questions, passScore = 80, onPass, title = '小测验' }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [passed, setPassed] = useState(false)

  const correctCount = questions.filter((q, i) => answers[i] === q.answer).length
  const score = Math.round((correctCount / questions.length) * 100)

  const submit = () => {
    setSubmitted(true)
    if (score >= passScore) {
      setPassed(true)
      onPass?.()
    }
  }

  const reset = () => {
    setAnswers({})
    setSubmitted(false)
    setPassed(false)
  }

  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <h3 style={{ fontSize: 17 }}>📝 {title}</h3>
        {submitted && (
          <span className={`chip ${passed ? 'chip-ok' : 'chip-warn'}`}>
            {passed ? `🎉 ${score} 分 · 通过！` : `${score} 分 · 未达 ${passScore} 分`}
          </span>
        )}
        <span className="chip" style={{ marginLeft: 'auto' }}>
          {correctCount}/{questions.length}
        </span>
      </div>
      <p style={{ color: 'var(--text-soft)', fontSize: 13, marginBottom: 12 }}>
        共 {questions.length} 题，{passScore} 分通过，答题后即时反馈并附讲解。
      </p>

      {questions.map((q, qi) => {
        const chosen = answers[qi]
        const revealed = submitted
        return (
          <div className="quiz-q" key={qi}>
            <div className="qq-title">
              <span style={{ color: 'var(--accent)', flexShrink: 0 }}>{qi + 1}.</span>
              <span>{q.q}</span>
              {q.code && (
                <pre style={{ margin: '4px 0 0', fontSize: 13 }}>{q.code}</pre>
              )}
            </div>
            {q.code && <pre style={{ fontSize: 13 }}>{q.code}</pre>}
            <div className="qq-opts">
              {q.options.map((opt, oi) => {
                let cls = 'qq-opt'
                if (revealed) {
                  if (oi === q.answer) cls += ' correct'
                  else if (chosen === oi) cls += ' wrong'
                } else if (chosen === oi) {
                  cls += ' sel'
                }
                return (
                  <button
                    key={oi}
                    className={cls}
                    disabled={revealed}
                    onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                  >
                    <span style={{ fontWeight: 800, color: 'var(--text-faint)' }}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
            <div className={`qq-explain ${revealed ? 'show' : ''}`}>
              {chosen === q.answer ? '✅ 回答正确！' : `❌ 正确答案是 ${String.fromCharCode(65 + q.answer)}。`}
              {' '}{q.explain}
            </div>
          </div>
        )
      })}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        {!submitted ? (
          <button className="btn btn-primary" onClick={submit} disabled={Object.keys(answers).length < questions.length}>
            提交答卷
          </button>
        ) : (
          <>
            <button className="btn" onClick={reset}>🔁 重新作答</button>
            {passed && <span className="chip chip-ok" style={{ alignSelf: 'center' }}>🏆 已通过，本课完成</span>}
          </>
        )}
        {!submitted && Object.keys(answers).length < questions.length && (
          <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--text-faint)' }}>
            已答 {Object.keys(answers).length}/{questions.length} 题
          </span>
        )}
      </div>
    </div>
  )
}
