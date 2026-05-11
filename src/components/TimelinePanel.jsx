import { useEffect, useState } from 'react'

const API = 'https://ops.unocloud.us'

const getColor    = (s) => s >= 80 ? 'var(--t7)' : s >= 60 ? 'var(--t5)' : s >= 40 ? 'var(--t3)' : 'var(--t1)'
const getRawColor = (s) => s >= 80 ? '#C44B2A'   : s >= 60 ? '#C4842A'   : s >= 40 ? '#4A8AC4'   : '#4A9E6A'

const formatTime = (iso) => {
  try { return new Date(iso).toUTCString().slice(17, 22) + 'Z' }
  catch { return '' }
}

export default function TimelinePanel({ score }) {
  const [history,    setHistory]    = useState([])
  const [expanded,   setExpanded]   = useState(false)
  const [hovered,    setHovered]    = useState(null)
  const [hdrPressed, setHdrPressed] = useState(false)

  useEffect(() => {
    const load = () =>
      fetch(`${API}/api/history`).then(r => r.json()).then(setHistory).catch(console.error)
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  const recent = history.slice(-60)

  return (
    <div className="collapse-row" style={{
      background: 'var(--bg-1)',
      border: '1px solid var(--seam)',
      boxShadow: 'var(--shadow-panel)',
    }}>
      {/* ── Header ── */}
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
            Threat Timeline
          </span>
          <span style={{
            fontFamily: 'var(--font-data)',
            fontSize: 8,
            letterSpacing: '0.08em',
            color: 'var(--ivory-3)',
          }}>
            {history.length} snapshots
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--font-data)',
            fontSize: 8, fontWeight: 500,
            letterSpacing: '0.15em',
            color: 'var(--ivory-3)',
          }}>
            24H
          </span>
          <span style={{
            fontFamily: 'var(--font-data)',
            fontSize: 9, color: 'var(--ivory-3)',
            display: 'inline-block',
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform var(--t-fast)',
          }}>▾</span>
        </div>
      </div>

      {/* ── Sparkline — always visible ── */}
      <div style={{
        padding: '6px 14px 8px',
        display: 'flex', alignItems: 'flex-end', gap: 2,
        height: 40, position: 'relative',
        borderTop: '1px solid var(--seam)',
      }}>
        {recent.map((h, i) => (
          <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            title={`${formatTime(h.ts)} — ${h.score}`}
            style={{
              flex: 1, minWidth: 2,
              height: `${Math.max(3, (h.score / 100) * 32)}px`,
              background: getRawColor(h.score),
              borderRadius: '2px 2px 0 0',
              opacity: hovered === i ? 1 : 0.55,
              boxShadow: hovered === i ? `0 0 6px ${getRawColor(h.score)}` : 'none',
              transform: hovered === i ? 'scaleY(1.1)' : 'scaleY(1)',
              transformOrigin: 'bottom',
              cursor: 'default',
              transition: 'opacity var(--t-fast), box-shadow var(--t-fast), transform var(--t-fast)',
            }}
          />
        ))}
        {hovered !== null && recent[hovered] && (
          <div style={{
            position: 'absolute', top: 2, left: 14,
            fontFamily: 'var(--font-data)', fontSize: 8, fontWeight: 500,
            letterSpacing: '0.08em',
            color: getRawColor(recent[hovered].score),
            background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 3,
            border: '1px solid var(--seam)', pointerEvents: 'none',
          }}>
            {formatTime(recent[hovered].ts)} · {recent[hovered].score}
          </div>
        )}
      </div>

      {/* ── Expanded snapshot list ── */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--seam)',
          padding: '8px 14px',
          maxHeight: 200, overflowY: 'auto',
          animation: 'fadeSlideIn var(--t-mid) var(--ease-spring)',
        }}>
          {[...history].reverse().slice(0, 20).map((h, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '5px 0',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
            }}>
              <span style={{
                fontFamily: 'var(--font-data)', fontSize: 8,
                letterSpacing: '0.06em',
                color: 'var(--ivory-3)',
                width: 56, flexShrink: 0,
              }}>
                {formatTime(h.ts)}
              </span>
              <div style={{
                width: 28, height: 4, borderRadius: 2,
                background: getRawColor(h.score),
                boxShadow: `0 0 4px ${getRawColor(h.score)}88`,
              }} />
              <span style={{
                fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 500,
                color: getColor(h.score),
                width: 24, flexShrink: 0,
              }}>
                {h.score}
              </span>
              <span style={{
                fontFamily: 'var(--font-data)', fontSize: 8,
                letterSpacing: '0.04em',
                color: 'var(--ivory-3)',
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {h.top_headlines?.[0]?.title || ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
