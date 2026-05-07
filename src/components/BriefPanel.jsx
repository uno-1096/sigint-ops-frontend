import { useState } from 'react'

const getColor = (s) => s >= 80 ? 'var(--critical)' : s >= 60 ? 'var(--elevated)' : s >= 40 ? 'var(--moderate)' : 'var(--low)'
const getLabel = (s) => s >= 80 ? 'CRITICAL' : s >= 60 ? 'ELEVATED' : 'MODERATE'

function formatBrief(text) {
  if (!text) return null
  return text.split('\n')
    .map(l => l.replace(/\*\*/g, '').trim())
    .filter(Boolean)
    .map((line, i) => {
      const isHeader = /^[1-5]\./.test(line) ||
        /^(EXECUTIVE SUMMARY|KEY DEVELOPMENTS|REGIONAL|THREAT ASSESSMENT|ANALYST NOTE|SITUATION REPORT|DTG|CLASSIFICATION)/i.test(line)
      return (
        <div key={i} style={{
          fontSize: isHeader ? 9 : 10,
          fontFamily: isHeader ? 'var(--font-sans)' : 'var(--font-mono)',
          color: isHeader ? 'var(--blue)' : 'var(--text-secondary)',
          fontWeight: isHeader ? 700 : 400,
          letterSpacing: isHeader ? 1.5 : 0,
          textTransform: isHeader ? 'uppercase' : 'none',
          marginTop: isHeader ? 10 : 2,
          lineHeight: 1.55,
          paddingLeft: isHeader ? 8 : 0,
          borderLeft: isHeader ? '2px solid rgba(10,132,255,0.4)' : 'none',
        }}>
          {line}
        </div>
      )
    })
}

export default function BriefPanel({ brief, briefUpdated, score }) {
  const [expanded, setExpanded] = useState(true)
  const color = getColor(score)

  return (
    <div className="collapse-row">
      <div className="collapse-header" onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="collapse-title">SITREP</span>
          {briefUpdated && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)' }}>
              {new Date(briefUpdated).toUTCString().slice(0, 22)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 700,
            padding: '2px 8px', borderRadius: 4,
            color, background: color + '18', border: `1px solid ${color}40`,
          }}>
            {getLabel(score)}
          </span>
          <span style={{ fontSize: 9, color: 'var(--text-dim)', transition: 'transform var(--t-fast)', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div className="collapse-body" style={{ maxHeight: 220 }}>
          {brief ? formatBrief(brief) : (
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', padding: '14px 0' }}>
              Generating intelligence brief…
            </div>
          )}
        </div>
      )}
    </div>
  )
}
