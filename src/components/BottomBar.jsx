import { useEffect, useRef, useState } from 'react'
import { exportPDF } from '../utils/pdfExport'

const getColor = (s) => s >= 80 ? 'var(--critical)' : s >= 60 ? 'var(--elevated)' : s >= 40 ? 'var(--moderate)' : 'var(--low)'
const getLevel = (s) => s >= 80 ? 'CRITICAL' : s >= 60 ? 'ELEVATED' : s >= 40 ? 'MODERATE' : 'LOW'

function NewsTicker({ items }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !items.length) return
    let pos = 0
    const tick = () => {
      pos -= 0.45
      if (pos < -el.scrollWidth / 2) pos = 0
      el.style.transform = `translateX(${pos}px)`
      requestAnimationFrame(tick)
    }
    const id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [items])

  const doubled = [...items, ...items]
  return (
    <div style={{ overflow: 'hidden', flex: 1, display: 'flex', alignItems: 'center' }}>
      <div ref={ref} style={{ display: 'flex', gap: 48, whiteSpace: 'nowrap', willChange: 'transform' }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 700,
              color: item.severity === 'critical' ? 'var(--critical)' : 'var(--elevated)',
              letterSpacing: 0.5,
            }}>[{item.source}]</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--text-secondary)' }}>
              {item.title}
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: 8 }}>◆</span>
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
      a.download = 'sigint-ops-' + new Date().toISOString().slice(0, 10) + '.json'
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
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2)
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5)
      } catch {}
    }
    prevScore.current = score
  }, [score, muted])

  const METRICS = [
    { label: 'Escalation', sub: `${score}/100`, value: getLevel(score), color: getColor(score) },
    { label: 'Incidents',  sub: 'GDELT + USGS', value: activeInc,       color: 'var(--elevated)' },
    { label: 'Sources',    sub: 'RSS / OSINT',  value: sourcesOnline,   color: 'var(--green)' },
    { label: 'Refresh',    sub: 'Auto-polling', value: '20s',            color: 'var(--blue)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
      {/* News ticker */}
      {feedItems?.length > 0 && (
        <div style={{
          background: 'var(--bg-panel)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          borderRadius: 7, padding: '4px 12px',
          display: 'flex', alignItems: 'center', gap: 12,
          overflow: 'hidden', flexShrink: 0,
          boxShadow: 'var(--shadow-panel)',
        }}>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 700,
            letterSpacing: 1.5, color: 'var(--critical)', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ animation: 'pulseScale 1.2s ease-in-out infinite', display: 'inline-block' }}>◉</span>
            LIVE
          </span>
          <NewsTicker items={feedItems.slice(0, 15)} />
          <button
            onClick={() => setMuted(m => !m)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, flexShrink: 0, opacity: muted ? 0.35 : 0.8,
              transition: 'opacity var(--t-fast)',
            }}
            title={muted ? 'Unmute alerts' : 'Mute alerts'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      )}

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
        {METRICS.map((m, i) => (
          <div key={i} className="metric-card">
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 600, letterSpacing: 1.5, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 1 }}>{m.label}</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 8, color: 'var(--text-dim)' }}>{m.sub}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}

        {/* Polymarket */}
        <div className="metric-card" style={{ cursor: 'pointer' }}
          onClick={() => window.open('https://polymarket.com/markets/politics', '_blank')}>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 600, letterSpacing: 1.5, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 1 }}>Prediction</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 8, color: 'var(--text-dim)' }}>Polymarket</div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--purple)' }}>POLY</div>
        </div>

        {/* Export */}
        <div className="metric-card">
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 600, letterSpacing: 1.5, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 1 }}>Export</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 8, color: 'var(--text-dim)' }}>Report</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={exportData} title="JSON" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--teal)',
              transition: 'opacity var(--t-fast)', opacity: 0.7,
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
            >⬇</button>
            <button onClick={() => exportPDF(brief, feedItems, score, activeInc)} title="PDF" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, transition: 'opacity var(--t-fast)', opacity: 0.7,
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
            >📄</button>
          </div>
        </div>
      </div>
    </div>
  )
}
