import { useState, useEffect, useRef } from 'react'

const DEFAULT_KEYWORDS = ['iran', 'nuclear', 'missile', 'attack', 'strike', 'war']

const getSevColor = (sev) =>
  sev === 'critical' ? 'var(--critical)' : sev === 'elevated' ? 'var(--elevated)' : 'var(--blue)'

export default function AlertSystem({ feedItems }) {
  const [keywords, setKeywords] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sigint-keywords') || 'null') || DEFAULT_KEYWORDS }
    catch { return DEFAULT_KEYWORDS }
  })
  const [input, setInput] = useState('')
  const [alerts, setAlerts] = useState([])
  const [expanded, setExpanded] = useState(false)
  const [flash, setFlash] = useState(false)
  const seenRef = useRef(new Set())

  useEffect(() => {
    if (!feedItems?.length) return
    const newAlerts = []
    feedItems.forEach(item => {
      const id = item.url || item.title
      if (seenRef.current.has(id)) return
      const text = (item.title + ' ' + (item.summary || '')).toLowerCase()
      const matched = keywords.filter(k => text.includes(k.toLowerCase()))
      if (matched.length > 0) {
        seenRef.current.add(id)
        newAlerts.push({ id, title: item.title, source: item.source, severity: item.severity, matched, time: new Date().toISOString() })
      }
    })
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 20))
      setFlash(true)
      setTimeout(() => setFlash(false), 3000)
    }
  }, [feedItems, keywords])

  const addKeyword = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      const kw = input.trim().toLowerCase()
      if (!keywords.includes(kw)) {
        const next = [...keywords, kw]
        setKeywords(next)
        localStorage.setItem('sigint-keywords', JSON.stringify(next))
      }
      setInput('')
    }
  }

  const removeKeyword = (kw) => {
    const next = keywords.filter(k => k !== kw)
    setKeywords(next)
    localStorage.setItem('sigint-keywords', JSON.stringify(next))
  }

  return (
    <div className="collapse-row" style={{
      border: flash ? '1px solid rgba(255,45,85,0.5)' : undefined,
      animation: flash ? 'flashBorder 0.8s ease-in-out 3' : undefined,
      background: flash ? 'rgba(255,45,85,0.04)' : undefined,
    }}>
      <div className="collapse-header" onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {flash && (
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--critical)',
              boxShadow: '0 0 8px rgba(255,45,85,0.6)',
              animation: 'pulseScale 0.6s ease-in-out infinite',
              flexShrink: 0,
            }} />
          )}
          <span className="collapse-title" style={{ color: flash ? 'var(--critical)' : undefined }}>
            Keyword Alerts
          </span>
          {alerts.length > 0 && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700,
              padding: '1px 6px', borderRadius: 3,
              background: 'rgba(255,45,85,0.12)', color: 'var(--critical)',
              border: '1px solid rgba(255,45,85,0.35)',
            }}>
              {alerts.length} HITS
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)' }}>
            {keywords.length} watching
          </span>
          <span style={{ fontSize: 9, color: 'var(--text-dim)', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--t-fast)' }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--border)', animation: 'fadeSlideIn var(--t-mid) var(--ease-snap)' }}>
          {/* Keywords */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, paddingTop: 10, marginBottom: 10 }}>
            {keywords.map(kw => (
              <span
                key={kw}
                onClick={() => removeKeyword(kw)}
                style={{
                  fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 500,
                  padding: '3px 8px', borderRadius: 4,
                  background: 'rgba(10,132,255,0.1)', color: 'var(--blue)',
                  border: '1px solid rgba(10,132,255,0.3)', cursor: 'pointer',
                  transition: 'background var(--t-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,45,85,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(10,132,255,0.1)'}
              >
                {kw} ×
              </span>
            ))}
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={addKeyword}
              placeholder="+ add keyword"
              style={{
                background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                borderRadius: 4, color: 'var(--text-secondary)', fontSize: 9,
                padding: '3px 8px', outline: 'none', width: 100,
                fontFamily: 'var(--font-mono)',
                transition: 'border-color var(--t-fast)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--border-glow)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {alerts.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 600, letterSpacing: 1.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recent Hits</span>
                <span onClick={() => { setAlerts([]); seenRef.current.clear() }}
                  style={{ fontFamily: 'var(--font-sans)', fontSize: 8, color: 'var(--text-dim)', cursor: 'pointer', letterSpacing: 1 }}>CLEAR</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
                {alerts.map((alert, i) => {
                  const c = getSevColor(alert.severity)
                  return (
                    <div key={i} style={{
                      background: 'var(--bg-card)', border: `1px solid ${c}25`,
                      borderLeft: `2px solid ${c}`, borderRadius: 5, padding: '6px 10px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 600, color: 'var(--blue)' }}>{alert.source}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-dim)' }}>
                          {alert.matched.map(k => `"${k}"`).join(', ')}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{alert.title}</div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--text-dim)', textAlign: 'center', padding: '8px 0' }}>
              Monitoring {keywords.length} keywords — no hits
            </div>
          )}
        </div>
      )}
    </div>
  )
}
