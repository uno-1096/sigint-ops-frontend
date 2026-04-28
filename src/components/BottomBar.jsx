import { useEffect, useRef, useState } from 'react'

function NewsTicket({ items }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let pos = 0
    const speed = 0.5
    const tick = () => {
      pos -= speed
      if (pos < -el.scrollWidth / 2) pos = 0
      el.style.transform = 'translateX(' + pos + 'px)'
      requestAnimationFrame(tick)
    }
    const id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [items])

  const doubled = [...items, ...items]

  return (
    <div style={{ overflow: 'hidden', flex: 1, display: 'flex', alignItems: 'center' }}>
      <div ref={ref} style={{ display: 'flex', gap: 40, whiteSpace: 'nowrap', willChange: 'transform' }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ fontSize: 9, fontFamily: 'Courier New' }}>
            <span style={{
              color: item.severity === 'critical' ? '#e24b4a' : item.severity === 'elevated' ? '#ef9f27' : '#378add',
              marginRight: 6, fontWeight: 'bold'
            }}>
              [{item.source}]
            </span>
            <span style={{ color: '#8a9aaa' }}>{item.title}</span>
            <span style={{ color: '#1e2f40', margin: '0 20px' }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function BottomBar({ score, activeInc, sourcesOnline, feedItems }) {
  const [muted, setMuted] = useState(false)
  const prevScore = useRef(score)
  const audioRef = useRef(null)

  const exportData = () => {
    fetch('https://ops.unocloud.us/api/feed')
      .then(r => r.json())
      .then(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = 'sigint-ops-export-' + new Date().toISOString().slice(0,10) + '.json'
        a.click()
        URL.revokeObjectURL(url)
      })
  }

  // Alert sound on escalation spike
  useEffect(() => {
    if (muted) return
    if (score >= 80 && prevScore.current < 80) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2)
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.5)
      } catch(e) {}
    }
    prevScore.current = score
  }, [score, muted])

  const getColor = (s) => s >= 80 ? '#e24b4a' : s >= 60 ? '#ef9f27' : s >= 40 ? '#97c459' : '#378add'
  const getLevel = (s) => s >= 80 ? 'CRITICAL' : s >= 60 ? 'ELEVATED' : s >= 40 ? 'MODERATE' : 'LOW'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
      {/* News ticker */}
      {feedItems && feedItems.length > 0 && (
        <div style={{
          background: '#0a0d12', border: '1px solid #1e2530', borderRadius: 4,
          padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden'
        }}>
          <span style={{ fontSize: 8, color: '#e24b4a', fontWeight: 'bold', letterSpacing: 1, flexShrink: 0, fontFamily: 'Courier New' }}>
            ◉ LIVE
          </span>
          <NewsTicket items={feedItems.slice(0, 15)} />
          <span
            onClick={() => setMuted(m => !m)}
            style={{ fontSize: 10, cursor: 'pointer', flexShrink: 0, color: muted ? '#3a4a58' : '#97c459' }}
            title={muted ? 'Unmute alerts' : 'Mute alerts'}
          >{muted ? '🔇' : '🔊'}</span>
        </div>
      )}

      {/* Metrics bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
        <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 8, color: '#2a3a4a', letterSpacing: 1, textTransform: 'uppercase' }}>Escalation</div>
            <div style={{ fontSize: 8, color: '#3a4a58' }}>Score: {score}/100</div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: getColor(score) }}>{getLevel(score)}</div>
        </div>

        <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 8, color: '#2a3a4a', letterSpacing: 1, textTransform: 'uppercase' }}>Incidents</div>
            <div style={{ fontSize: 8, color: '#3a4a58' }}>GDELT + USGS</div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#ef9f27' }}>{activeInc}</div>
        </div>

        <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 8, color: '#2a3a4a', letterSpacing: 1, textTransform: 'uppercase' }}>Sources</div>
            <div style={{ fontSize: 8, color: '#3a4a58' }}>RSS / OSINT</div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#97c459' }}>{sourcesOnline}</div>
        </div>

        <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 8, color: '#2a3a4a', letterSpacing: 1, textTransform: 'uppercase' }}>Refresh</div>
            <div style={{ fontSize: 8, color: '#3a4a58' }}>Auto-polling</div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#378add' }}>20s</div>
        </div>

        <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          onClick={() => window.open('https://polymarket.com/markets/politics', '_blank')}>
          <div>
            <div style={{ fontSize: 8, color: '#2a3a4a', letterSpacing: 1, textTransform: 'uppercase' }}>Prediction</div>
            <div style={{ fontSize: 8, color: '#3a4a58' }}>Polymarket</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#afa9ec' }}>POLY</div>
        </div>

        <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          onClick={exportData}>
          <div>
            <div style={{ fontSize: 8, color: '#2a3a4a', letterSpacing: 1, textTransform: 'uppercase' }}>Export</div>
            <div style={{ fontSize: 8, color: '#3a4a58' }}>Download JSON</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#5dcaa5' }}>⬇</div>
        </div>
      </div>
    </div>
  )
}
