import { useEffect, useRef, useState } from 'react'
import { exportPDF } from '../utils/pdfExport'

function NewsTicker({ items }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let pos = 0
    const tick = () => {
      pos -= 0.5
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
            <span style={{ color: item.severity === 'critical' ? '#e24b4a' : '#ef9f27', marginRight: 6, fontWeight: 'bold' }}>[{item.source}]</span>
            <span style={{ color: '#8a9aaa' }}>{item.title}</span>
            <span style={{ color: '#1e2f40', margin: '0 20px' }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function BottomBar({ score, activeInc, sourcesOnline, feedItems, brief }) {
  const [muted, setMuted] = useState(false)
  const prevScore = useRef(score)

  const exportData = () => {
    fetch('https://ops.unocloud.us/api/feed').then(r => r.json()).then(data => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sigint-ops-' + new Date().toISOString().slice(0,10) + '.json'
      a.click()
      URL.revokeObjectURL(url)
    })
  }

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
      {feedItems && feedItems.length > 0 && (
        <div style={{ background: '#0a0d12', border: '1px solid #1e2530', borderRadius: 4, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <span style={{ fontSize: 8, color: '#e24b4a', fontWeight: 'bold', letterSpacing: 1, flexShrink: 0, fontFamily: 'Courier New' }}>◉ LIVE</span>
          <NewsTicker items={feedItems.slice(0, 15)} />
          <span onClick={() => setMuted(m => !m)} style={{ fontSize: 10, cursor: 'pointer', flexShrink: 0, color: muted ? '#3a4a58' : '#97c459' }}>{muted ? '🔇' : '🔊'}</span>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
        {[
          { label: 'Escalation', sub: 'Score: ' + score + '/100', value: getLevel(score), color: getColor(score) },
          { label: 'Incidents',  sub: 'GDELT + USGS', value: activeInc, color: '#ef9f27' },
          { label: 'Sources',    sub: 'RSS / OSINT',  value: sourcesOnline, color: '#97c459' },
          { label: 'Refresh',    sub: 'Auto-polling', value: '20s', color: '#378add' },
        ].map((m, i) => (
          <div key={i} style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 8, color: '#2a3a4a', letterSpacing: 1, textTransform: 'uppercase' }}>{m.label}</div>
              <div style={{ fontSize: 8, color: '#3a4a58' }}>{m.sub}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: m.color }}>{m.value}</div>
          </div>
        ))}
        <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          onClick={() => window.open('https://polymarket.com/markets/politics', '_blank')}>
          <div>
            <div style={{ fontSize: 8, color: '#2a3a4a', letterSpacing: 1, textTransform: 'uppercase' }}>Prediction</div>
            <div style={{ fontSize: 8, color: '#3a4a58' }}>Polymarket</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#afa9ec' }}>POLY</div>
        </div>
        <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 8, color: '#2a3a4a', letterSpacing: 1, textTransform: 'uppercase' }}>Export</div>
            <div style={{ fontSize: 8, color: '#3a4a58' }}>Report</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span onClick={exportData} style={{ fontSize: 12, color: '#5dcaa5', cursor: 'pointer' }} title="JSON">⬇</span>
            <span onClick={() => exportPDF(brief, feedItems, score, activeInc)} style={{ fontSize: 12, color: '#afa9ec', cursor: 'pointer' }} title="PDF">📄</span>
          </div>
        </div>
      </div>
    </div>
  )
}
