import { useState, useEffect } from 'react'

const API = 'https://ops.unocloud.us'

export default function PredictionPanel({ score }) {
  const [prediction, setPrediction] = useState(null)
  const [updated, setUpdated] = useState(null)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/prediction`)
      .then(r => r.json())
      .then(d => { setPrediction(d.prediction); setUpdated(d.updated) })
      .catch(console.error)

    const interval = setInterval(() => {
      fetch(`${API}/api/prediction`)
        .then(r => r.json())
        .then(d => { setPrediction(d.prediction); setUpdated(d.updated) })
        .catch(console.error)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const getColor = (s) => s >= 80 ? '#e24b4a' : s >= 60 ? '#ef9f27' : s >= 40 ? '#97c459' : '#378add'

  const formatPrediction = (text) => {
    if (!text) return null
    return text.split('\n').map((line, i) => {
      line = line.trim()
      if (!line) return null
      const isHeader = /^(TRAJECTORY|24H FORECAST|KEY TRIGGERS|KEY DE-ESCALATORS|PROBABILITY|PREDICTIVE ASSESSMENT)/i.test(line)
      return (
        <div key={i} style={{
          fontSize: isHeader ? 9 : 8,
          color: isHeader ? '#ef9f27' : '#8a9aaa',
          fontWeight: isHeader ? 'bold' : 'normal',
          letterSpacing: isHeader ? 1 : 0,
          marginTop: isHeader ? 8 : 2,
          lineHeight: 1.5,
          borderLeft: isHeader ? '2px solid #ef9f2755' : 'none',
          paddingLeft: isHeader ? 6 : 0,
        }}>
          {line}
        </div>
      )
    }).filter(Boolean)
  }

  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, marginBottom: 5, flexShrink: 0 }}>
      <div onClick={() => setExpanded(!expanded)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 12px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 1.5, fontWeight: 'bold' }}>PREDICTIVE ASSESSMENT</span>
          {updated && (
            <span style={{ fontSize: 7, color: '#2a3545' }}>
              {new Date(updated).toUTCString().slice(0, 22)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 2, background: '#1a0f00', color: '#ef9f27', border: '1px solid #ef9f2755' }}>
            AI FORECAST
          </span>
          <span style={{ fontSize: 10, color: '#2a3a4a' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #1a2030', padding: '8px 12px', maxHeight: 220, overflowY: 'auto', fontFamily: 'Courier New' }}>
          {prediction ? formatPrediction(prediction) : (
            <div style={{ fontSize: 8, color: '#2a3545', textAlign: 'center', padding: 12 }}>
              Generating predictive assessment... (requires 3+ history snapshots)
            </div>
          )}
        </div>
      )}
    </div>
  )
}
