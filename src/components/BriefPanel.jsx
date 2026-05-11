import { useState } from 'react'

const getColor = (s) => s >= 80 ? 'var(--t7)' : s >= 60 ? 'var(--t5)' : s >= 40 ? 'var(--t3)' : 'var(--t1)'
const getRgb   = (s) => s >= 80 ? '196,75,42' : s >= 60 ? '196,132,42' : s >= 40 ? '74,138,196' : '74,158,106'
const getLabel = (s) => s >= 80 ? 'CRITICAL' : s >= 60 ? 'ELEVATED' : s >= 40 ? 'MODERATE' : 'LOW'

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
          fontFamily:    isHeader ? 'var(--font-data)'    : 'var(--font-display)',
          fontStyle:     isHeader ? 'normal'              : 'italic',
          fontSize:      isHeader ? 8                     : 13,
          fontWeight:    isHeader ? 500                   : 300,
          letterSpacing: isHeader ? '0.15em'              : '0.01em',
          textTransform: isHeader ? 'uppercase'           : 'none',
          color:         isHeader ? 'var(--bronze)'       : 'var(--ivory-2)',
          marginTop:     isHeader ? 10                    : 2,
          lineHeight:    isHeader ? 1.4                   : 1.55,
          paddingLeft:   isHeader ? 8                     : 0,
          borderLeft:    isHeader ? '2px solid rgba(168,118,58,0.4)' : 'none',
        }}>
          {line}
        </div>
      )
    })
}

export default function BriefPanel({ brief, briefUpdated, score }) {
  const [expanded,   setExpanded]   = useState(true)
  const [hdrPressed, setHdrPressed] = useState(false)
  const color = getColor(score)
  const rgb   = getRgb(score)

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
            Sitrep
          </span>
          {briefUpdated && (
            <span style={{
              fontFamily: 'var(--font-data)',
              fontSize: 8,
              letterSpacing: '0.06em',
              color: 'var(--ivory-3)',
            }}>
              {new Date(briefUpdated).toUTCString().slice(0, 22)}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--font-data)',
            fontSize: 8, fontWeight: 500,
            letterSpacing: '0.12em',
            padding: '2px 8px', borderRadius: 3,
            color,
            background: `rgba(${rgb},0.12)`,
            border: `1px solid rgba(${rgb},0.35)`,
          }}>
            {getLabel(score)}
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
          {brief ? formatBrief(brief) : (
            <div style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--ivory-3)',
              textAlign: 'center',
              padding: '14px 0',
            }}>
              Generating intelligence brief…
            </div>
          )}
        </div>
      )}
    </div>
  )
}
