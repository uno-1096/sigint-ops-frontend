import { useState, useEffect } from 'react'

const API = 'https://ops.unocloud.us'

function formatPrediction(text) {
  if (!text) return null
  return text.split('\n').map((line, i) => {
    line = line.trim()
    if (!line) return null
    const isHeader = /^(TRAJECTORY|24H FORECAST|KEY TRIGGERS|KEY DE-ESCALATORS|PROBABILITY|PREDICTIVE ASSESSMENT)/i.test(line)
    return (
      <div key={i} style={{
        fontSize: isHeader ? 9 : 10,
        fontFamily: isHeader ? 'var(--font-sans)' : 'var(--font-mono)',
        color: isHeader ? 'var(--amber)' : 'var(--text-secondary)',
        fontWeight: isHeader ? 700 : 400,
        letterSpacing: isHeader ? 1.5 : 0,
        textTransform: isHeader ? 'uppercase' : 'none',
        marginTop: isHeader ? 10 : 2,
        lineHeight: 1.55,
        paddingLeft: isHeader ? 8 : 0,
        borderLeft: isHeader ? '2px solid rgba(255,159,10,0.4)' : 'none',
      }}>
        {line}
      </div>
    )
  }).filter(Boolean)
}

export default function PredictionPanel({ score }) {
  const [prediction, setPrediction] = useState(null)
  const [updated, setUpdated] = useState(null)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    const load = () =>
      fetch(`${API}/api/prediction`)
        .then(r => r.json())
        .then(d => { setPrediction(d.prediction); setUpdated(d.updated) })
        .catch(console.error)
    load()
    const id = setInterval(load, 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="collapse-row">
      <div className="collapse-header" onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="collapse-title">Predictive Assessment</span>
          {updated && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)' }}>
              {new Date(updated).toUTCString().slice(0, 22)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 700,
            padding: '2px 8px', borderRadius: 4,
            color: 'var(--amber)',
            background: 'rgba(255,159,10,0.12)',
            border: '1px solid rgba(255,159,10,0.35)',
          }}>AI FORECAST</span>
          <span style={{ fontSize: 9, color: 'var(--text-dim)', transition: 'transform var(--t-fast)', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div className="collapse-body" style={{ maxHeight: 220 }}>
          {prediction ? formatPrediction(prediction) : (
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', padding: '14px 0' }}>
              Generating predictive assessment… (requires 3+ history snapshots)
            </div>
          )}
        </div>
      )}
    </div>
  )
}
