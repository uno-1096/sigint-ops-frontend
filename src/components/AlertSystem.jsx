import { useState, useEffect, useRef } from 'react'

const DEFAULT_KEYWORDS = ['iran', 'nuclear', 'missile', 'attack', 'strike', 'war']

const getSevColor = (sev) =>
  sev === 'critical' ? 'var(--t7)' : sev === 'elevated' ? 'var(--t5)' : 'var(--t3)'

const getSevRgb = (sev) =>
  sev === 'critical' ? '196,75,42' : sev === 'elevated' ? '196,132,42' : '74,138,196'

export default function AlertSystem({ feedItems }) {
  const [keywords, setKeywords] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sigint-keywords') || 'null') || DEFAULT_KEYWORDS }
    catch { return DEFAULT_KEYWORDS }
  })
  const [input, setInput]       = useState('')
  const [alerts, setAlerts]     = useState([])
  const [expanded, setExpanded] = useState(false)
  const [flash, setFlash]       = useState(false)
  const [hdrPressed, setHdrPressed] = useState(false)
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
    <div
      className="collapse-row"
      style={{
        background: 'var(--bg-1)',
        border: flash ? '1px solid rgba(196,75,42,0.55)' : '1px solid var(--seam)',
        boxShadow: flash
          ? 'var(--shadow-panel), inset 0 0 28px rgba(196,75,42,0.05)'
          : 'var(--shadow-panel)',
        transition: `border-color var(--t-mid), box-shadow var(--t-mid)`,
      }}
    >
      {/* ── Collapse header ── */}
      <div
        className="collapse-header"
        onMouseDown={() => setHdrPressed(true)}
        onMouseUp={() => setHdrPressed(false)}
        onMouseLeave={() => setHdrPressed(false)}
        onClick={() => setExpanded(v => !v)}
        style={{
          transform: hdrPressed ? 'scale(0.995)' : 'scale(1)',
          transition: `transform var(--t-fast)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {flash && (
            <div style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: 'var(--t7)',
              boxShadow: '0 0 0 2px rgba(196,75,42,0.18), 0 0 8px rgba(196,75,42,0.6)',
              animation: 'pulseScale 0.6s ease-in-out infinite',
            }} />
          )}

          <span style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 15,
            fontWeight: 400,
            letterSpacing: '0.02em',
            color: flash ? 'var(--t7)' : 'var(--ivory)',
            transition: `color var(--t-mid)`,
          }}>
            Keyword Alerts
          </span>

          {alerts.length > 0 && (
            <span style={{
              fontFamily: 'var(--font-data)',
              fontSize: 8, fontWeight: 500,
              letterSpacing: '0.12em',
              padding: '2px 6px', borderRadius: 3,
              background: 'rgba(196,75,42,0.12)',
              color: 'var(--t7)',
              border: '1px solid rgba(196,75,42,0.35)',
            }}>
              {alerts.length} HITS
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--font-data)',
            fontSize: 8, letterSpacing: '0.1em',
            color: 'var(--ivory-3)',
          }}>
            {keywords.length} watching
          </span>
          <span style={{
            fontFamily: 'var(--font-data)',
            fontSize: 9, color: 'var(--ivory-3)',
            display: 'inline-block',
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: `transform var(--t-fast)`,
          }}>▾</span>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div style={{
          padding: '0 14px 12px',
          borderTop: '1px solid var(--seam)',
          animation: 'fadeSlideIn var(--t-mid) var(--ease-spring)',
        }}>

          {/* Keyword pills + input */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, paddingTop: 10, marginBottom: 10 }}>
            {keywords.map(kw => (
              <KeywordPill key={kw} label={kw} onRemove={() => removeKeyword(kw)} />
            ))}
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={addKeyword}
              placeholder="+ keyword"
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid var(--seam)',
                borderRadius: 4,
                color: 'var(--ivory-2)',
                fontSize: 9,
                padding: '3px 8px',
                outline: 'none',
                width: 88,
                fontFamily: 'var(--font-data)',
                letterSpacing: '0.08em',
                transition: `border-color var(--t-fast)`,
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--bronze)' }}
              onBlur={e =>  { e.target.style.borderColor = 'var(--seam)' }}
            />
          </div>

          {alerts.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: 8, fontWeight: 500,
                  letterSpacing: '0.15em',
                  color: 'var(--ivory-3)',
                  textTransform: 'uppercase',
                }}>
                  Recent Hits
                </span>
                <ClearBtn onClick={() => { setAlerts([]); seenRef.current.clear() }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
                {alerts.map((alert, i) => (
                  <AlertCard key={i} alert={alert} />
                ))}
              </div>
            </>
          ) : (
            <div style={{
              fontFamily: 'var(--font-data)',
              fontSize: 9, letterSpacing: '0.06em',
              color: 'var(--ivory-3)',
              textAlign: 'center',
              padding: '8px 0',
            }}>
              Monitoring {keywords.length} keywords — no hits
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function KeywordPill({ label, onRemove }) {
  const [pressed, setPressed]   = useState(false)
  const [hovered, setHovered]   = useState(false)
  return (
    <span
      onClick={onRemove}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setPressed(false); setHovered(false) }}
      style={{
        fontFamily: 'var(--font-data)',
        fontSize: 8, fontWeight: 400,
        letterSpacing: '0.08em',
        padding: '3px 8px', borderRadius: 4,
        background: hovered ? 'rgba(196,75,42,0.12)' : 'rgba(74,138,196,0.1)',
        color: hovered ? 'var(--t7)' : 'var(--t3)',
        border: `1px solid ${hovered ? 'rgba(196,75,42,0.35)' : 'rgba(74,138,196,0.3)'}`,
        cursor: 'pointer',
        userSelect: 'none',
        transform: pressed ? 'scale(0.93)' : 'scale(1)',
        boxShadow: pressed ? 'var(--shadow-btn-active)' : 'var(--shadow-btn-rest)',
        transition: `background var(--t-fast), color var(--t-fast), border-color var(--t-fast), transform var(--t-fast), box-shadow var(--t-fast)`,
      }}
    >
      {label} ×
    </span>
  )
}

function ClearBtn({ onClick }) {
  const [pressed, setPressed] = useState(false)
  return (
    <span
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        fontFamily: 'var(--font-data)',
        fontSize: 8, fontWeight: 400,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: pressed ? 'var(--ivory-2)' : 'var(--ivory-3)',
        cursor: 'pointer',
        userSelect: 'none',
        padding: '2px 6px', borderRadius: 3,
        border: '1px solid transparent',
        transform: pressed ? 'scale(0.93)' : 'scale(1)',
        boxShadow: pressed ? 'var(--shadow-btn-active)' : 'none',
        transition: `color var(--t-fast), transform var(--t-fast), box-shadow var(--t-fast)`,
      }}
    >
      Clear
    </span>
  )
}

function AlertCard({ alert }) {
  const c   = getSevColor(alert.severity)
  const rgb = getSevRgb(alert.severity)
  return (
    <div style={{
      background: 'var(--bg-2)',
      border: `1px solid rgba(${rgb},0.18)`,
      borderLeft: `2px solid ${c}`,
      borderRadius: 5,
      padding: '6px 10px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{
          fontFamily: 'var(--font-data)',
          fontSize: 8, fontWeight: 500,
          letterSpacing: '0.1em',
          color: 'var(--bronze)',
        }}>
          {alert.source}
        </span>
        <span style={{
          fontFamily: 'var(--font-data)',
          fontSize: 7, letterSpacing: '0.06em',
          color: 'var(--ivory-3)',
        }}>
          {alert.matched.map(k => `"${k}"`).join(', ')}
        </span>
      </div>
      <div style={{
        fontFamily: 'var(--font-data)',
        fontSize: 9, letterSpacing: '0.04em',
        color: 'var(--ivory-2)',
        lineHeight: 1.4,
      }}>
        {alert.title}
      </div>
    </div>
  )
}
