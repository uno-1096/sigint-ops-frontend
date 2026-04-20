import { useState, useEffect } from 'react'

function getAlertLevel(score) {
  if (score >= 80) return { label: 'CRITICAL', color: '#e24b4a' }
  if (score >= 60) return { label: 'ELEVATED', color: '#ef9f27' }
  if (score >= 40) return { label: 'MODERATE', color: '#97c459' }
  return { label: 'LOW', color: '#378add' }
}

export default function Header({ score, activeInc, sourcesOnline, connected, lastUpdate }) {
  const [time, setTime] = useState('')
  const alert = getAlertLevel(score)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const h = String(now.getUTCHours()).padStart(2,'0')
      const m = String(now.getUTCMinutes()).padStart(2,'0')
      const s = String(now.getUTCSeconds()).padStart(2,'0')
      setTime(`${h}:${m}:${s} UTC`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const segs = 10
  const filled = Math.round((score / 100) * segs)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4,
      padding: '5px 14px', flexShrink: 0
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: connected ? '#97c459' : '#e24b4a',
          animation: 'pulse 1.4s infinite'
        }} />
        <span style={{ fontSize: 13, fontWeight: 'bold', color: '#e0e6ed', letterSpacing: 2 }}>
          SIGINT OPS
        </span>
        <span style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 3,
          letterSpacing: 1, fontWeight: 'bold',
          background: '#1a0808', color: alert.color,
          border: `1px solid ${alert.color}55`
        }}>
          {alert.label}
        </span>
      </div>

      {/* Center — escalation score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 1 }}>ESCALATION INDEX</span>
          <span style={{ fontSize: 22, fontWeight: 'bold', color: alert.color, letterSpacing: 1 }}>
            {score}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: segs }).map((_, i) => {
              const colors = ['#639922','#639922','#ba7517','#ba7517','#d85a30','#d85a30','#e24b4a','#e24b4a','#e24b4a','#e24b4a']
              return (
                <div key={i} style={{
                  width: 20, height: 6, borderRadius: 1,
                  background: colors[i],
                  opacity: i < filled ? 1 : 0.2
                }} />
              )
            })}
          </div>
          <div style={{ fontSize: 8, color: '#2a3545', letterSpacing: 1 }}>LOW ———————————— CRITICAL</div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#3a4a5a' }}>
          INCIDENTS <span style={{ color: '#c8cfd8', fontSize: 11 }}>{activeInc}</span>
        </span>
        <span style={{ fontSize: 10, color: '#3a4a5a' }}>
          SOURCES <span style={{ color: '#378add', fontSize: 11 }}>{sourcesOnline}/43</span>
        </span>
        <span style={{ fontSize: 10, color: '#3a4a5a' }}>
          WS <span style={{ color: connected ? '#97c459' : '#e24b4a', fontSize: 11 }}>
            {connected ? 'LIVE' : 'OFF'}
          </span>
        </span>
        <span style={{ fontSize: 11, color: '#3a5060', letterSpacing: 1 }}>{time}</span>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  )
}
