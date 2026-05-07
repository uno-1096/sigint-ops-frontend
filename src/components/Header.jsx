import { useState, useEffect } from 'react'

function getAlert(score) {
  if (score >= 80) return { label: 'CRITICAL', color: 'var(--critical)', glow: 'var(--shadow-glow-red)' }
  if (score >= 60) return { label: 'ELEVATED', color: 'var(--elevated)', glow: '0 0 12px rgba(255,159,10,0.35)' }
  if (score >= 40) return { label: 'MODERATE', color: 'var(--moderate)', glow: '0 0 12px rgba(48,209,88,0.3)' }
  return { label: 'LOW', color: 'var(--low)', glow: 'var(--shadow-glow-blue)' }
}

const SEG_COLORS = [
  '#1a6e2e','#1e8035','#d67f10','#d67f10',
  '#c84030','#c84030','#ff2d55','#ff2d55','#ff2d55','#ff2d55',
]

export default function Header({ score, activeInc, sourcesOnline, connected, lastUpdate }) {
  const [time, setTime] = useState('')
  const [history, setHistory] = useState([])
  const alert = getAlert(score)

  useEffect(() => {
    if (score > 0) setHistory(prev => [...prev.slice(-29), score])
  }, [score])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const h = String(now.getUTCHours()).padStart(2, '0')
      const m = String(now.getUTCMinutes()).padStart(2, '0')
      const s = String(now.getUTCSeconds()).padStart(2, '0')
      setTime(`${h}:${m}:${s}Z`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const filled = Math.round((score / 100) * 10)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--bg-panel)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      border: '1px solid var(--glass-border)',
      borderRadius: 8,
      padding: '0 16px',
      height: 52,
      flexShrink: 0,
      boxShadow: 'var(--shadow-panel)',
    }}>

      {/* LEFT — brand + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected ? 'var(--moderate)' : 'var(--critical)',
            boxShadow: connected ? '0 0 8px rgba(48,209,88,0.6)' : '0 0 8px rgba(255,45,85,0.6)',
            animation: 'pulseScale 2s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700,
            color: 'var(--text-primary)', letterSpacing: 3,
          }}>SIGINT OPS</span>
        </div>

        <div style={{
          fontSize: 8, fontWeight: 700, letterSpacing: 1.5,
          padding: '3px 10px', borderRadius: 5,
          color: alert.color,
          background: alert.color + '18',
          border: `1px solid ${alert.color}45`,
          boxShadow: alert.glow,
          transition: 'all 0.4s var(--ease-smooth)',
        }}>
          {alert.label}
        </div>
      </div>

      {/* CENTER — escalation meter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 600, letterSpacing: 2, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Escalation Index
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700,
            color: alert.color, lineHeight: 1,
            textShadow: alert.glow,
            transition: 'color 0.4s var(--ease-smooth)',
          }}>
            {score}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{
                width: 22, height: 5, borderRadius: 2,
                background: i < filled ? SEG_COLORS[i] : 'rgba(255,255,255,0.05)',
                boxShadow: i < filled ? `0 0 6px ${SEG_COLORS[i]}88` : 'none',
                transition: 'background 0.3s var(--ease-smooth), box-shadow 0.3s',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 7, color: 'var(--text-dim)', letterSpacing: 1 }}>LOW</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 7, color: 'var(--text-dim)', letterSpacing: 1 }}>CRITICAL</span>
          </div>
        </div>

        {/* Sparkline */}
        <svg width="90" height="32" style={{ opacity: 0.75, overflow: 'visible' }}>
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={alert.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={alert.color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {history.length > 1 && (() => {
            const pts = history.map((v, i) => {
              const x = (i / (history.length - 1)) * 90
              const y = 30 - (v / 100) * 28
              return `${x},${y}`
            })
            const fillPath = `M${pts.join('L')}L90,32L0,32Z`
            return (
              <>
                <path d={fillPath} fill="url(#sparkFill)" />
                {history.map((v, i) => {
                  if (i === 0) return null
                  const x1 = ((i - 1) / (history.length - 1)) * 90
                  const x2 = (i / (history.length - 1)) * 90
                  const y1 = 30 - (history[i - 1] / 100) * 28
                  const y2 = 30 - (v / 100) * 28
                  const col = v >= 80 ? 'var(--critical)' : v >= 60 ? 'var(--elevated)' : 'var(--moderate)'
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth="1.5" strokeLinecap="round" />
                })}
              </>
            )
          })()}
        </svg>
      </div>

      {/* RIGHT — stats + clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Stat label="Incidents" value={activeInc} color="var(--elevated)" />
        <Stat label="Sources" value={`${sourcesOnline}/43`} color="var(--green)" />
        <Stat label="WebSocket" value={connected ? 'LIVE' : 'OFF'} color={connected ? 'var(--green)' : 'var(--critical)'} />
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
          color: 'var(--text-secondary)', letterSpacing: 1.5,
          borderLeft: '1px solid var(--border)', paddingLeft: 16,
        }}>
          {time}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 600, letterSpacing: 1.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color }}>
        {value}
      </span>
    </div>
  )
}
