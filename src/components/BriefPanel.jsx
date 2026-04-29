import { useState } from 'react'

export default function BriefPanel({ brief, briefUpdated, score }) {
  const [expanded, setExpanded] = useState(true)

  const getScoreColor = (s) => s >= 80 ? '#e24b4a' : s >= 60 ? '#ef9f27' : s >= 40 ? '#97c459' : '#378add'

  const formatBrief = (text) => {
    if (!text) return null
    // Clean markdown bold markers
    const lines = text.split('\n').map(l => l.replace(/\*\*/g, '').trim()).filter(l => l)
    return lines.map((line, i) => {
      const isSectionHeader = /^[1-5]\./.test(line) || 
        /^(EXECUTIVE SUMMARY|KEY DEVELOPMENTS|REGIONAL|THREAT ASSESSMENT|ANALYST NOTE|SITUATION REPORT|DTG|CLASSIFICATION)/i.test(line)
      return (
        <div key={i} style={{
          fontSize: isSectionHeader ? 9 : 8,
          color: isSectionHeader ? '#378add' : '#8a9aaa',
          fontWeight: isSectionHeader ? 'bold' : 'normal',
          letterSpacing: isSectionHeader ? 1 : 0,
          marginTop: isSectionHeader ? 8 : 2,
          lineHeight: 1.5,
          borderLeft: isSectionHeader ? '2px solid #1e3a55' : 'none',
          paddingLeft: isSectionHeader ? 6 : 0,
        }}>
          {line}
        </div>
      )
    })
  }

  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, marginBottom: 5, flexShrink: 0 }}>
      <div onClick={() => setExpanded(!expanded)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 12px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 1.5, fontWeight: 'bold' }}>SITREP</span>
          {briefUpdated && (
            <span style={{ fontSize: 7, color: '#2a3545' }}>
              {new Date(briefUpdated).toUTCString().slice(0, 22)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 2, background: getScoreColor(score) + '22', color: getScoreColor(score), border: '1px solid ' + getScoreColor(score) + '55' }}>
            {score >= 80 ? 'CRITICAL' : score >= 60 ? 'ELEVATED' : 'MODERATE'}
          </span>
          <span style={{ fontSize: 10, color: '#2a3a4a' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #1a2030', padding: '8px 12px', maxHeight: 220, overflowY: 'auto', fontFamily: 'Courier New' }}>
          {brief ? formatBrief(brief) : (
            <div style={{ fontSize: 8, color: '#2a3545', textAlign: 'center', padding: 12 }}>
              Generating intelligence brief...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
