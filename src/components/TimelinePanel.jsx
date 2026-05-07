import { useEffect, useState } from 'react'

const API = 'https://ops.unocloud.us'
const getColor = (s) => s >= 80 ? 'var(--critical)' : s >= 60 ? 'var(--elevated)' : s >= 40 ? 'var(--moderate)' : 'var(--low)'
const getRawColor = (s) => s >= 80 ? '#ff2d55' : s >= 60 ? '#ff9f0a' : s >= 40 ? '#30d158' : '#0a84ff'

const formatTime = (iso) => {
  try { return new Date(iso).toUTCString().slice(17, 22) + 'Z' }
  catch { return '' }
}

export default function TimelinePanel({ score }) {
  const [history, setHistory] = useState([])
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    const load = () =>
      fetch(`${API}/api/history`).then(r => r.json()).then(setHistory).catch(console.error)
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  const recent = history.slice(-60)

  return (
    <div className="collapse-row">
      <div className="collapse-header" onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="collapse-title">Threat Timeline</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)' }}>
            {history.length} snapshots
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 600, letterSpacing: 1, color: 'var(--text-dim)' }}>24H</span>
          <span style={{ fontSize: 9, color: 'var(--text-dim)', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--t-fast)' }}>▾</span>
        </div>
      </div>

      {/* Sparkline — always visible */}
      <div style={{ padding: '6px 14px 8px', display: 'flex', alignItems: 'flex-end', gap: 2, height: 40, position: 'relative' }}>
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
              opacity: hovered === i ? 1 : 0.6,
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
            fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 600,
            color: getRawColor(recent[hovered].score),
            background: 'var(--bg-panel)', padding: '2px 6px', borderRadius: 4,
            border: '1px solid var(--border)', pointerEvents: 'none',
          }}>
            {formatTime(recent[hovered].ts)} · {recent[hovered].score}
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '8px 14px', maxHeight: 200, overflowY: 'auto', animation: 'fadeSlideIn var(--t-mid) var(--ease-snap)' }}>
          {[...history].reverse().slice(0, 20).map((h, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', width: 56, flexShrink: 0 }}>
                {formatTime(h.ts)}
              </span>
              <div style={{
                width: 28, height: 4, borderRadius: 2,
                background: getRawColor(h.score),
                boxShadow: `0 0 4px ${getRawColor(h.score)}88`,
              }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: getColor(h.score), width: 24, flexShrink: 0 }}>
                {h.score}
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 8, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {h.top_headlines?.[0]?.title || ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
