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
        fontFamily:    isHeader ? 'var(--font-data)'    : 'var(--font-display)',
        fontStyle:     isHeader ? 'normal'              : 'italic',
        fontSize:      isHeader ? 8                     : 13,
        fontWeight:    isHeader ? 500                   : 300,
        letterSpacing: isHeader ? '0.15em'              : '0.01em',
        textTransform: isHeader ? 'uppercase'           : 'none',
        color:         isHeader ? 'var(--t5)'           : 'var(--ivory-2)',
        marginTop:     isHeader ? 10                    : 2,
        lineHeight:    1.55,
        paddingLeft:   isHeader ? 8                     : 0,
        borderLeft:    isHeader ? '2px solid rgba(196,132,42,0.4)' : 'none',
      }}>
        {line}
      </div>
    )
  }).filter(Boolean)
}

export default function PredictionPanel({ score }) {
  const [prediction, setPrediction] = useState(null)
  const [updated,    setUpdated]    = useState(null)
  const [expanded,   setExpanded]   = useState(true)
  const [hdrPressed, setHdrPressed] = useState(false)

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
    <div className="collapse-row" style={{
      background: 'var(--bg-1)',
      border: '1px solid var(--seam)',
      boxShadow: 'var(--shadow-panel)',
    }}>
      <div
        className="collapse-header"
        onMouseDown={() => setHdrPressed(true)}
        onMouseUp={() => setHdrPressed(false)}
        onMouseLeave={() => setHdrPressed(false)}
        onClick={() => setExpanded(v => !v)}
        style={{
          transform: hdrPressed ? 'scale(0.995)' : 'scale(1)',
          transition: 'transform var(--t-fast)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 15,
            fontWeight: 400,
            letterSpacing: '0.02em',
            color: 'var(--ivory)',
          }}>
            Predictive Assessment
          </span>
          {updated && (
            <span style={{
              fontFamily: 'var(--font-data)',
              fontSize: 8,
              letterSpacing: '0.06em',
              color: 'var(--ivory-3)',
            }}>
              {new Date(updated).toUTCString().slice(0, 22)}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--font-data)',
            fontSize: 8, fontWeight: 500,
            letterSpacing: '0.12em',
            padding: '2px 8px', borderRadius: 3,
            color: 'var(--t5)',
            background: 'rgba(196,132,42,0.12)',
            border: '1px solid rgba(196,132,42,0.35)',
          }}>
            AI FORECAST
          </span>
          <span style={{
            fontFamily: 'var(--font-data)',
            fontSize: 9, color: 'var(--ivory-3)',
            display: 'inline-block',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--t-fast)',
          }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div
          className="collapse-body"
          style={{
            maxHeight: 220,
            borderTop: '1px solid var(--seam)',
            animation: 'fadeSlideIn var(--t-mid) var(--ease-spring)',
          }}
        >
          {prediction ? formatPrediction(prediction) : (
            <div style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--ivory-3)',
              textAlign: 'center',
              padding: '14px 0',
            }}>
              Generating predictive assessment… (requires 3+ history snapshots)
            </div>
          )}
        </div>
      )}
    </div>
  )
}
