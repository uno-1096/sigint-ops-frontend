import { useState, useEffect } from 'react'

function threatMeta(score) {
  if (score >= 80) return { label: 'CRITICAL', color: 'var(--t7)', glow: '0 0 14px rgba(196,75,42,0.45)' }
  if (score >= 60) return { label: 'ELEVATED', color: 'var(--t5)', glow: '0 0 14px rgba(196,132,42,0.4)' }
  if (score >= 40) return { label: 'MODERATE', color: 'var(--t3)', glow: '0 0 14px rgba(74,138,196,0.35)' }
  return               { label: 'LOW',      color: 'var(--t1)', glow: '0 0 14px rgba(74,158,106,0.3)' }
}

const SEG = [
  'var(--t1)','var(--t1)','var(--t1)',
  'var(--t3)','var(--t3)',
  'var(--t5)','var(--t5)',
  'var(--t7)','var(--t7)','var(--t7)',
]

export default function Header({ score, activeInc, sourcesOnline, connected, lastUpdate }) {
  const [time, setTime]       = useState('')
  const [history, setHistory] = useState([])
  const threat = threatMeta(score)

  useEffect(() => {
    if (score > 0) setHistory(prev => [...prev.slice(-29), score])
  }, [score])

  useEffect(() => {
    const tick = () => {
      const n = new Date()
      const pad = v => String(v).padStart(2, '0')
      setTime(`${pad(n.getUTCHours())}:${pad(n.getUTCMinutes())}:${pad(n.getUTCSeconds())}Z`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const filled = Math.round((score / 100) * 10)

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--bg-1)',
      border: '1px solid var(--seam)',
      borderRadius: 6,
      padding: '0 20px',
      height: 52,
      flexShrink: 0,
      boxShadow: 'var(--shadow-panel)',
    }}>

      {/* LEFT — wordmark + live dot + threat badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: connected ? 'var(--pulse)' : 'var(--t7)',
            boxShadow: connected
              ? '0 0 0 2px rgba(61,191,184,0.18), 0 0 8px rgba(61,191,184,0.55)'
              : '0 0 0 2px rgba(196,75,42,0.2), 0 0 8px rgba(196,75,42,0.5)',
            animation: 'pulseScale 2.4s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: 'var(--font-data)',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.22em',
            color: 'var(--ivory)',
          }}>
            SIGINT OPS
          </span>
        </div>

        <div style={{
          fontFamily: 'var(--font-data)',
          fontSize: 8,
          fontWeight: 500,
          letterSpacing: '0.18em',
          padding: '3px 10px',
          borderRadius: 3,
          color: threat.color,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid',
          borderColor: threat.color,
          boxShadow: threat.glow,
          transition: 'color 300ms, border-color 300ms, box-shadow 300ms',
        }}>
          {threat.label}
        </div>
      </div>

      {/* CENTER — score + meter + sparkline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, zIndex: 1 }}>
        {/* Score numeral */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <span style={{
            fontFamily: 'var(--font-data)',
            fontSize: 8,
            fontWeight: 400,
            letterSpacing: '0.2em',
            color: 'var(--ivory-3)',
            textTransform: 'uppercase',
          }}>
            Escalation
          </span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 30,
            fontWeight: 300,
            lineHeight: 1,
            color: threat.color,
            textShadow: threat.glow,
            transition: `color ${300}ms`,
          }}>
            {score}
          </span>
        </div>

        {/* Segmented meter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{
                width: 20,
                height: 4,
                borderRadius: 1,
                background: i < filled ? SEG[i] : 'rgba(255,255,255,0.04)',
                boxShadow: i < filled ? `0 0 5px ${SEG[i]}99` : 'none',
                transition: 'background 0.28s, box-shadow 0.28s',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 7, color: 'var(--ivory-3)', letterSpacing: '0.1em' }}>LOW</span>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 7, color: 'var(--ivory-3)', letterSpacing: '0.1em' }}>CRITICAL</span>
          </div>
        </div>

        {/* Sparkline */}
        <svg width="88" height="30" style={{ opacity: 0.8, overflow: 'visible', flexShrink: 0 }}>
          <defs>
            <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={threat.color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={threat.color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {history.length > 1 && (() => {
            const pts = history.map((v, i) => {
              const x = (i / (history.length - 1)) * 88
              const y = 28 - (v / 100) * 26
              return [x, y]
            })
            const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
            const fill = `${d} L88,30 L0,30 Z`
            return (
              <>
                <path d={fill} fill="url(#spark-fill)" />
                {pts.slice(1).map(([x2, y2], i) => {
                  const [x1, y1] = pts[i]
                  const v = history[i + 1]
                  const c = v >= 80 ? 'var(--t7)' : v >= 60 ? 'var(--t5)' : v >= 40 ? 'var(--t3)' : 'var(--t1)'
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="1.5" strokeLinecap="round" />
                })}
              </>
            )
          })()}
        </svg>
      </div>

      {/* RIGHT — stat pills + clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, zIndex: 1 }}>
        <Stat label="Incidents" value={activeInc}           color="var(--t5)" />
        <Stat label="Sources"   value={`${sourcesOnline}/43`} color="var(--pulse)" />
        <Stat label="Socket"    value={connected ? 'LIVE' : 'OFF'} color={connected ? 'var(--pulse)' : 'var(--t7)'} />

        <div style={{
          fontFamily: 'var(--font-data)',
          fontSize: 11,
          fontWeight: 300,
          letterSpacing: '0.12em',
          color: 'var(--ivory-2)',
          borderLeft: '1px solid var(--seam)',
          paddingLeft: 18,
        }}>
          {time}
        </div>
      </div>
    </header>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{
        fontFamily: 'var(--font-data)',
        fontSize: 7,
        fontWeight: 400,
        letterSpacing: '0.18em',
        color: 'var(--ivory-3)',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-data)',
        fontSize: 12,
        fontWeight: 500,
        color,
      }}>
        {value}
      </span>
    </div>
  )
}
