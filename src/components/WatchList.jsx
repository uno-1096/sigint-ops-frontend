import { useState, useEffect } from 'react'

const getSevColor = (s) => s === 'critical' ? 'var(--critical)' : s === 'elevated' ? 'var(--elevated)' : 'var(--blue)'

const formatTime = (iso) => {
  try { return new Date(iso).toUTCString().slice(5, 22) }
  catch { return '' }
}

export default function WatchList() {
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sigint-watchlist') || '[]') }
    catch { return [] }
  })
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const sync = () => {
      try { setSaved(JSON.parse(localStorage.getItem('sigint-watchlist') || '[]')) }
      catch {}
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const removeItem = (id) => {
    const next = saved.filter(s => s.id !== id)
    setSaved(next)
    localStorage.setItem('sigint-watchlist', JSON.stringify(next))
  }

  return (
    <div className="collapse-row">
      <div className="collapse-header" onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="collapse-title">Watchlist</span>
          {saved.length > 0 && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700,
              padding: '1px 6px', borderRadius: 3,
              background: 'rgba(10,132,255,0.12)', color: 'var(--blue)',
              border: '1px solid rgba(10,132,255,0.3)',
            }}>
              {saved.length}
            </span>
          )}
        </div>
        <span style={{ fontSize: 9, color: 'var(--text-dim)', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--t-fast)' }}>▾</span>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', maxHeight: 200, overflowY: 'auto', animation: 'fadeSlideIn var(--t-mid) var(--ease-snap)' }}>
          {saved.length === 0 ? (
            <div style={{ padding: '14px', fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--text-dim)', textAlign: 'center' }}>
              No saved items — bookmark feed items to track them
            </div>
          ) : saved.map(item => (
            <div
              key={item.id}
              style={{
                padding: '7px 14px', borderBottom: '1px solid rgba(255,255,255,0.025)',
                display: 'flex', gap: 10, alignItems: 'flex-start',
                transition: 'background var(--t-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 600, color: getSevColor(item.severity) }}>
                    {item.source}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-dim)' }}>
                    {formatTime(item.savedAt)}
                  </span>
                </div>
                <div
                  onClick={() => item.url && window.open(item.url, '_blank')}
                  style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.4 }}
                >
                  {item.title}
                </div>
              </div>
              <span
                onClick={() => removeItem(item.id)}
                style={{ fontSize: 11, color: 'var(--text-dim)', cursor: 'pointer', flexShrink: 0, transition: 'color var(--t-fast)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--critical)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
              >✕</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
