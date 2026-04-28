import { useState, useEffect } from 'react'

export default function WatchList({ feedItems, incidents }) {
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sigint-watchlist') || '[]') }
    catch { return [] }
  })
  const [expanded, setExpanded] = useState(false)

  const saveItem = (item) => {
    const entry = {
      id: Date.now(),
      title: item.title,
      source: item.source,
      url: item.url,
      severity: item.severity,
      savedAt: new Date().toISOString(),
      type: item.type || 'news'
    }
    const next = [entry, ...saved].slice(0, 50)
    setSaved(next)
    localStorage.setItem('sigint-watchlist', JSON.stringify(next))
  }

  const removeItem = (id) => {
    const next = saved.filter(s => s.id !== id)
    setSaved(next)
    localStorage.setItem('sigint-watchlist', JSON.stringify(next))
  }

  const getSevColor = (s) => s === 'critical' ? '#e24b4a' : s === 'elevated' ? '#ef9f27' : '#378add'

  const formatTime = (iso) => {
    try { return new Date(iso).toUTCString().slice(0, 22) }
    catch { return '' }
  }

  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, marginBottom: 5, flexShrink: 0 }}>
      <div onClick={() => setExpanded(!expanded)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 12px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 1.5, fontWeight: 'bold' }}>WATCHLIST</span>
          {saved.length > 0 && (
            <span style={{ fontSize: 8, background: '#0a1825', color: '#378add', border: '1px solid #1e3a55', borderRadius: 2, padding: '1px 5px' }}>
              {saved.length} SAVED
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, color: '#2a3a4a' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #1a2030', maxHeight: 200, overflowY: 'auto' }}>
          {saved.length === 0 && (
            <div style={{ padding: '12px', fontSize: 9, color: '#2a3545', textAlign: 'center' }}>
              No saved items — bookmark feed items to track them
            </div>
          )}
          {saved.map(item => (
            <div key={item.id} style={{ padding: '6px 12px', borderBottom: '1px solid #0a1020', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 7, color: getSevColor(item.severity), fontWeight: 'bold' }}>{item.source}</span>
                  <span style={{ fontSize: 7, color: '#2a3545' }}>{formatTime(item.savedAt)}</span>
                </div>
                <div onClick={() => item.url && window.open(item.url, '_blank')}
                  style={{ fontSize: 9, color: '#8a9aaa', cursor: 'pointer', lineHeight: 1.4 }}>
                  {item.title}
                </div>
              </div>
              <span onClick={() => removeItem(item.id)} style={{ fontSize: 10, color: '#3a4a58', cursor: 'pointer', flexShrink: 0 }}>✕</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
