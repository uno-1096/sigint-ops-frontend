export default function BottomBar({ score, activeInc, sourcesOnline }) {
  const exportData = () => {
    fetch('https://ops.unocloud.us/api/feed')
      .then(r => r.json())
      .then(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `sigint-ops-export-${new Date().toISOString().slice(0,10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      })
  }

  const getLevel = (s) => {
    if (s >= 80) return 'CRITICAL'
    if (s >= 60) return 'ELEVATED'
    if (s >= 40) return 'MODERATE'
    return 'LOW'
  }

  const getColor = (s) => {
    if (s >= 80) return '#e24b4a'
    if (s >= 60) return '#ef9f27'
    if (s >= 40) return '#97c459'
    return '#378add'
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5, flexShrink: 0 }}>

      <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 8, color: '#2a3a4a', letterSpacing: 1, textTransform: 'uppercase' }}>Escalation Level</div>
          <div style={{ fontSize: 8, color: '#3a4a58', marginTop: 1 }}>Score: {score}/100</div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 'bold', color: getColor(score) }}>{getLevel(score)}</div>
      </div>

      <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 8, color: '#2a3a4a', letterSpacing: 1, textTransform: 'uppercase' }}>Active Incidents</div>
          <div style={{ fontSize: 8, color: '#3a4a58', marginTop: 1 }}>GDELT + USGS</div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 'bold', color: '#ef9f27' }}>{activeInc}</div>
      </div>

      <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 8, color: '#2a3a4a', letterSpacing: 1, textTransform: 'uppercase' }}>Sources Online</div>
          <div style={{ fontSize: 8, color: '#3a4a58', marginTop: 1 }}>RSS / OSINT feeds</div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 'bold', color: '#97c459' }}>{sourcesOnline}</div>
      </div>

      <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 8, color: '#2a3a4a', letterSpacing: 1, textTransform: 'uppercase' }}>Data Refresh</div>
          <div style={{ fontSize: 8, color: '#3a4a58', marginTop: 1 }}>Auto-polling interval</div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 'bold', color: '#378add' }}>60s</div>
      </div>

      {/* Polymarket prediction */}
      <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        onClick={() => window.open('https://polymarket.com/markets/politics', '_blank')}>
        <div>
          <div style={{ fontSize: 8, color: '#2a3a4a', letterSpacing: 1, textTransform: 'uppercase' }}>Prediction Mkt</div>
          <div style={{ fontSize: 8, color: '#3a4a58', marginTop: 1 }}>Polymarket — click</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#afa9ec' }}>POLY</div>
      </div>

      {/* Export */}
      <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        onClick={exportData}>
        <div>
          <div style={{ fontSize: 8, color: '#2a3a4a', letterSpacing: 1, textTransform: 'uppercase' }}>Export Intel</div>
          <div style={{ fontSize: 8, color: '#3a4a58', marginTop: 1 }}>Download JSON</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#5dcaa5' }}>EXPORT</div>
      </div>

    </div>
  )
}
