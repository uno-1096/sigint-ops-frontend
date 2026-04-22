import { useState } from 'react'

const TAG_STYLES = {
  CRITICAL:   { bg: '#1a0808', color: '#e24b4a', border: '#a32d2d' },
  MILITARY:   { bg: '#1a1a2e', color: '#afa9ec', border: '#534ab7' },
  DISASTER:   { bg: '#0a1f10', color: '#97c459', border: '#3b6d11' },
  POLITICAL:  { bg: '#1a1208', color: '#ef9f27', border: '#854f0b' },
  NEWS:       { bg: '#0a1020', color: '#378add', border: '#185fa5' },
  PREDICTION: { bg: '#0a1020', color: '#5dcaa5', border: '#0f6e56' },
}

function timeAgo(published) {
  if (!published) return ''
  try {
    const d = new Date(published)
    const diff = Math.floor((Date.now() - d) / 60000)
    if (diff < 1) return 'just now'
    if (diff < 60) return `${diff}m ago`
    return `${Math.floor(diff/60)}h ago`
  } catch { return '' }
}

// Try to find a matching incident for a feed item by keyword
function findMatch(item, incidents) {
  if (!incidents || !incidents.length) return null
  const text = (item.title + ' ' + (item.summary || '')).toLowerCase()
  // Try to match by country code or keyword in incident title
  for (const inc of incidents) {
    const incText = (inc.title || '').toLowerCase()
    // Check if any word >4 chars from inc title appears in feed item
    const words = incText.split(/\s+/).filter(w => w.length > 4)
    if (words.some(w => text.includes(w))) return inc
  }
  return null
}

export default function IntelFeed({ items, incidents, onFlyTo, compact }) {
  const [filter, setFilter] = useState('ALL')

  const tabs = ['ALL','MIL','DIS','POL']
  const filterMap = { ALL: null, MIL: 'MILITARY', DIS: 'DISASTER', POL: 'POLITICAL' }

  const filtered = filter === 'ALL'
    ? items
    : items.filter(i => i.tags && i.tags.includes(filterMap[filter]))

  const handleClick = (item) => {
    if (item.lat && item.lon && onFlyTo) {
      onFlyTo({ lat: item.lat, lon: item.lon, title: item.title })
    } else {
      const match = findMatch(item, incidents)
      if (match && onFlyTo) {
        onFlyTo({ lat: match.lat, lon: match.lon, title: match.title })
      } else if (item.url) {
        window.open(item.url, '_blank')
      }
    }
  }

  return (
    <div className="panel" style={compact ? { border: 'none', borderRadius: 0 } : {}}>
      <div className="panel-header">
        <span className="panel-title">Intel Feed</span>
        <span className="panel-badge">{items.length} ITEMS</span>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #1a2030', flexShrink: 0 }}>
        {tabs.map(t => (
          <div key={t} onClick={() => setFilter(t)} style={{
            flex: 1, fontSize: 8, padding: '5px 3px', textAlign: 'center',
            cursor: 'pointer', letterSpacing: '0.5px', textTransform: 'uppercase',
            color: filter === t ? '#378add' : '#2a3a4a',
            borderBottom: filter === t ? '2px solid #378add' : '2px solid transparent',
          }}>{t}</div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 5, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.length === 0 && (
          <div style={{ fontSize: 10, color: '#2a3545', textAlign: 'center', marginTop: 20 }}>
            Awaiting feed...
          </div>
        )}
        {filtered.map((item, i) => {
          const tag = item.tags?.[0] || 'NEWS'
          const style = TAG_STYLES[tag] || TAG_STYLES.NEWS
          const hasMatch = !!(item.lat && item.lon) || !!findMatch(item, incidents)
          return (
            <div key={i} style={{
              background: '#07090d',
              border: '1px solid #131a22',
              borderRadius: 3, padding: '6px 8px', cursor: 'pointer',
              borderLeft: `2px solid ${style.border}`,
            }}
              onClick={() => handleClick(item)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 8, color: '#378add', letterSpacing: 0.5 }}>
                  {item.source}
                </span>
                <span style={{ fontSize: 8, color: '#1e2f40' }}>
                  {timeAgo(item.published)}
                </span>
              </div>
              {item.image && (
                <img src={item.image} alt="" style={{
                  width: '100%', height: 60, objectFit: 'cover',
                  borderRadius: 2, marginBottom: 4, opacity: 0.85
                }} onError={e => e.target.style.display='none'} />
              )}
              <div style={{ fontSize: 9, color: '#8a9aaa', lineHeight: 1.4, marginBottom: 4 }}>
                {item.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  fontSize: 7, padding: '1px 5px', borderRadius: 2,
                  background: style.bg, color: style.color,
                  border: `1px solid ${style.border}`, letterSpacing: 0.5
                }}>
                  {tag}
                </span>
                {hasMatch && (
                  <span style={{ fontSize: 7, color: '#378add', letterSpacing: 0.5 }}>
                    LOCATE
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
