import { useState, useEffect } from 'react'

export default function BriefPanel({ brief, briefUpdated, score }) {
  const [expanded, setExpanded] = useState(true)
  const [sections, setSections] = useState({})

  useEffect(() => {
    if (!brief) return
    const parsed = {}
    const lines = brief.split('\n')
    let current = null
    lines.forEach(line => {
      if (['EXECUTIVE SUMMARY','KEY DEVELOPMENTS','REGIONAL HOTSPOTS','ANALYST NOTE'].includes(line.trim())) {
        current = line.trim()
        parsed[current] = []
      } else if (current && line.trim()) {
        parsed[current].push(line.trim())
      }
    })
    setSections(parsed)
  }, [brief])

  const getScoreColor = (s) => {
    if (s >= 80) return '#e24b4a'
    if (s >= 60) return '#ef9f27'
    if (s >= 40) return '#97c459'
    return '#378add'
  }

  const formatTime = (iso) => {
    if (!iso) return ''
    try {
      return new Date(iso).toUTCString().slice(0,25)
    } catch { return '' }
  }

  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid #1e2530',
      borderLeft: `3px solid ${getScoreColor(score)}`,
      borderRadius: 4,
      marginBottom: 5,
      flexShrink: 0,
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 12px', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, color: getScoreColor(score), letterSpacing: 1.5, fontWeight: 'bold' }}>
            SITREP
          </span>
          <span style={{ fontSize: 8, color: '#2a3a4a' }}>
            {formatTime(briefUpdated)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, color: '#3a4a58' }}>AI ANALYSIS</span>
          <span style={{ fontSize: 10, color: '#2a3a4a' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{
          padding: '0 12px 10px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          borderTop: '1px solid #1a2030',
        }}>
          {Object.entries(sections).map(([title, lines]) => (
            <div key={title} style={{ paddingTop: 8 }}>
              <div style={{
                fontSize: 8, color: '#2a3545', letterSpacing: 1,
                textTransform: 'uppercase', marginBottom: 4, fontWeight: 'bold'
              }}>
                {title}
              </div>
              {lines.map((line, i) => (
                <div key={i} style={{
                  fontSize: 9, color: line.startsWith('•') ? '#8a9aaa' : '#c8cfd8',
                  lineHeight: 1.5,
                  paddingLeft: line.startsWith('•') ? 4 : 0,
                }}>
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
