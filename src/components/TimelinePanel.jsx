import { useEffect, useState } from 'react'

const API = 'https://ops.unocloud.us'

export default function TimelinePanel({ score }) {
  const [history, setHistory] = useState([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/history`)
      .then(r => r.json())
      .then(setHistory)
      .catch(console.error)

    const interval = setInterval(() => {
      fetch(`${API}/api/history`)
        .then(r => r.json())
        .then(setHistory)
        .catch(console.error)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const getColor = (s) => s >= 80 ? '#e24b4a' : s >= 60 ? '#ef9f27' : s >= 40 ? '#97c459' : '#378add'

  const formatTime = (iso) => {
    try {
      const d = new Date(iso)
      return d.toUTCString().slice(17, 22) + ' UTC'
    } catch { return '' }
  }

  const max = Math.max(...history.map(h => h.score), 1)
  const w = 100 / Math.max(history.length, 1)

  return (
    <div style={{
      background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4,
      marginBottom: 5, flexShrink: 0
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 12px', cursor: 'pointer'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 1.5, fontWeight: 'bold' }}>
            THREAT TIMELINE
          </span>
          <span style={{ fontSize: 8, color: '#2a3545' }}>{history.length} snapshots</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 8, color: '#2a3545' }}>24H HISTORY</span>
          <span style={{ fontSize: 10, color: '#2a3a4a' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Sparkline always visible */}
      <div style={{ padding: '0 12px 6px', display: 'flex', alignItems: 'flex-end', gap: 1, height: 32 }}>
        {history.slice(-60).map((h, i) => (
          <div
            key={i}
            title={`${formatTime(h.ts)} — Score: ${h.score}`}
            style={{
              flex: 1, minWidth: 2,
              height: `${(h.score / 100) * 28}px`,
              background: getColor(h.score),
              opacity: 0.7,
              borderRadius: '1px 1px 0 0',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #1a2030', padding: '8px 12px', maxHeight: 200, overflowY: 'auto' }}>
          {[...history].reverse().slice(0, 20).map((h, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '4px 0', borderBottom: '1px solid #0a1020'
            }}>
              <span style={{ fontSize: 8, color: '#2a3545', width: 65, flexShrink: 0 }}>
                {formatTime(h.ts)}
              </span>
              <div style={{
                width: 30, height: 6, borderRadius: 1,
                background: getColor(h.score), opacity: 0.8
              }} />
              <span style={{ fontSize: 9, color: getColor(h.score), width: 25, flexShrink: 0 }}>
                {h.score}
              </span>
              <span style={{ fontSize: 8, color: '#4a5a68', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {h.top_headlines?.[0]?.title || ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
