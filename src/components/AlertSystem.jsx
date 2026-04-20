import { useState, useEffect, useRef } from 'react'

const DEFAULT_KEYWORDS = ['iran', 'nuclear', 'missile', 'attack', 'strike', 'war']

export default function AlertSystem({ feedItems }) {
  const [keywords, setKeywords] = useState(DEFAULT_KEYWORDS)
  const [input, setInput] = useState('')
  const [alerts, setAlerts] = useState([])
  const [expanded, setExpanded] = useState(false)
  const [flash, setFlash] = useState(false)
  const seenRef = useRef(new Set())

  useEffect(() => {
    if (!feedItems || !feedItems.length) return

    const newAlerts = []
    feedItems.forEach(item => {
      const id = item.url || item.title
      if (seenRef.current.has(id)) return

      const text = (item.title + ' ' + (item.summary || '')).toLowerCase()
      const matched = keywords.filter(k => text.includes(k.toLowerCase()))

      if (matched.length > 0) {
        seenRef.current.add(id)
        newAlerts.push({
          id,
          title: item.title,
          source: item.source,
          severity: item.severity,
          matched,
          time: new Date().toISOString(),
        })
      }
    })

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 20))
      setFlash(true)
      setTimeout(() => setFlash(false), 3000)
    }
  }, [feedItems, keywords])

  const addKeyword = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      const kw = input.trim().toLowerCase()
      if (!keywords.includes(kw)) setKeywords(prev => [...prev, kw])
      setInput('')
    }
  }

  const removeKeyword = (kw) => setKeywords(prev => prev.filter(k => k !== kw))
  const clearAlerts = () => { setAlerts([]); seenRef.current.clear() }

  const getSevColor = (sev) => {
    if (sev === 'critical') return '#e24b4a'
    if (sev === 'elevated') return '#ef9f27'
    return '#378add'
  }

  return (
    <div style={{
      background: flash ? '#1a0a0a' : '#0d1117',
      border: `1px solid ${flash ? '#e24b4a' : '#1e2530'}`,
      borderRadius: 4,
      marginBottom: 5,
      flexShrink: 0,
      transition: 'all 0.3s',
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {flash && <div style={{
            width: 7, height: 7, borderRadius: '50%', background: '#e24b4a',
            animation: 'pulse 0.5s infinite'
          }} />}
          <span style={{ fontSize: 9, color: flash ? '#e24b4a' : '#3a4a5a', letterSpacing: 1.5, fontWeight: 'bold' }}>
            KEYWORD ALERTS
          </span>
          {alerts.length > 0 && (
            <span style={{
              fontSize: 8, background: '#1a0808', color: '#e24b4a',
              border: '1px solid #a32d2d', borderRadius: 2, padding: '1px 5px'
            }}>
              {alerts.length} HITS
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 8, color: '#2a3545' }}>{keywords.length} WATCHING</span>
          <span style={{ fontSize: 10, color: '#2a3a4a' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 12px 10px', borderTop: '1px solid #1a2030' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingTop: 8, marginBottom: 8 }}>
            {keywords.map(kw => (
              <span key={kw} onClick={() => removeKeyword(kw)} style={{
                fontSize: 8, padding: '2px 6px', borderRadius: 2,
                background: '#0a1020', color: '#378add',
                border: '1px solid #1e3a55', cursor: 'pointer',
                letterSpacing: 0.5,
              }}>
                {kw} ×
              </span>
            ))}
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={addKeyword}
              placeholder="+ add keyword"
              style={{
                background: '#060809', border: '1px solid #1e2530',
                borderRadius: 2, color: '#c8cfd8', fontSize: 8,
                padding: '2px 6px', outline: 'none', width: 90,
                fontFamily: 'Courier New'
              }}
            />
          </div>

          {alerts.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 8, color: '#2a3545', letterSpacing: 1 }}>RECENT HITS</span>
                <span onClick={clearAlerts} style={{ fontSize: 8, color: '#3a4a58', cursor: 'pointer' }}>CLEAR</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 120, overflowY: 'auto' }}>
                {alerts.map((alert, i) => (
                  <div key={i} style={{
                    background: '#07090d', border: `1px solid ${getSevColor(alert.severity)}33`,
                    borderLeft: `2px solid ${getSevColor(alert.severity)}`,
                    borderRadius: 2, padding: '4px 8px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 8, color: '#378add' }}>{alert.source}</span>
                      <span style={{ fontSize: 7, color: '#1e3a55' }}>
                        {alert.matched.map(k => `"${k}"`).join(', ')}
                      </span>
                    </div>
                    <div style={{ fontSize: 9, color: '#8a9aaa', lineHeight: 1.4 }}>{alert.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alerts.length === 0 && (
            <div style={{ fontSize: 9, color: '#2a3545', textAlign: 'center', padding: '8px 0' }}>
              Monitoring {keywords.length} keywords — no hits yet
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
    </div>
  )
}
