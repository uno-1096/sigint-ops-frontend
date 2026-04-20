export default function BottomBar({ score, activeInc, sourcesOnline }) {
  const getLevel = (s) => {
    if (s >= 80) return 'CRITICAL'
    if (s >= 60) return 'ELEVATED'
    if (s >= 40) return 'MODERATE'
    return 'LOW'
  }

  const metrics = [
    { label: 'Escalation Level', value: getLevel(score),   sub: `Score: ${score}/100`,     color: score >= 60 ? '#e24b4a' : score >= 40 ? '#ef9f27' : '#97c459' },
    { label: 'Active Incidents', value: activeInc,          sub: 'GDELT + USGS',            color: '#ef9f27' },
    { label: 'Sources Online',   value: `${sourcesOnline}`, sub: 'RSS / OSINT feeds',       color: '#97c459' },
    { label: 'Data Refresh',     value: '60s',              sub: 'Auto-polling interval',   color: '#378add' },
  ]

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 5, flexShrink: 0
    }}>
      {metrics.map((m, i) => (
        <div key={i} style={{
          background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4,
          padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 8, color: '#2a3a4a', letterSpacing: 1, textTransform: 'uppercase' }}>
              {m.label}
            </div>
            <div style={{ fontSize: 8, color: '#3a4a58', marginTop: 1 }}>{m.sub}</div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: m.color }}>{m.value}</div>
        </div>
      ))}
    </div>
  )
}
