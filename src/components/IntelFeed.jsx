import { useState } from 'react'

const TAG_META = {
  CRITICAL:   { bg: 'rgba(255,45,85,0.12)',   color: '#ff2d55', border: 'rgba(255,45,85,0.4)' },
  MILITARY:   { bg: 'rgba(191,90,242,0.12)',  color: '#bf5af2', border: 'rgba(191,90,242,0.4)' },
  DISASTER:   { bg: 'rgba(48,209,88,0.10)',   color: '#30d158', border: 'rgba(48,209,88,0.35)' },
  POLITICAL:  { bg: 'rgba(255,159,10,0.12)',  color: '#ff9f0a', border: 'rgba(255,159,10,0.4)' },
  NEWS:       { bg: 'rgba(10,132,255,0.10)',  color: '#0a84ff', border: 'rgba(10,132,255,0.35)' },
  PREDICTION: { bg: 'rgba(50,173,230,0.10)',  color: '#32ade6', border: 'rgba(50,173,230,0.35)' },
}

function timeAgo(published) {
  if (!published) return ''
  try {
    const diff = Math.floor((Date.now() - new Date(published)) / 60000)
    if (diff < 1) return 'just now'
    if (diff < 60) return `${diff}m`
    return `${Math.floor(diff / 60)}h`
  } catch { return '' }
}

function findMatch(item, incidents) {
  if (!incidents?.length) return null
  const text = (item.title + ' ' + (item.summary || '')).toLowerCase()
  for (const inc of incidents) {
    const words = (inc.title || '').toLowerCase().split(/\s+/).filter(w => w.length > 4)
    if (words.some(w => text.includes(w))) return inc
  }
  return null
}

const TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'MIL', label: 'Mil' },
  { id: 'DIS', label: 'Dis' },
  { id: 'POL', label: 'Pol' },
]
const FILTER_MAP = { ALL: null, MIL: 'MILITARY', DIS: 'DISASTER', POL: 'POLITICAL' }

export default function IntelFeed({ items, incidents, onFlyTo, compact, onSave, onSatellite }) {
  const [filter, setFilter] = useState('ALL')
  const [customRss, setCustomRss] = useState('')
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const filtered = filter === 'ALL' ? items : items.filter(i => i.tags?.includes(FILTER_MAP[filter]))

  const handleClick = (item) => {
    if (item.lat && item.lon && onFlyTo) {
      onFlyTo({ lat: item.lat, lon: item.lon, title: item.title })
    } else {
      const match = findMatch(item, incidents)
      if (match && onFlyTo) onFlyTo({ lat: match.lat, lon: match.lon, title: match.title })
      else if (item.url) window.open(item.url, '_blank')
    }
  }

  const addCustomRss = (e) => {
    if (e.key === 'Enter' && customRss.trim()) {
      const saved = JSON.parse(localStorage.getItem('sigint-custom-rss') || '[]')
      if (!saved.includes(customRss.trim())) {
        const next = [...saved, customRss.trim()]
        localStorage.setItem('sigint-custom-rss', JSON.stringify(next))
      }
      setCustomRss('')
    }
  }

  return (
    <div className="panel" style={compact ? { border: 'none', borderRadius: 0 } : {}}>
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">Intel Feed</span>
        <span className="panel-badge">{items.length} items</span>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'rgba(0,0,0,0.12)' }}>
        {TABS.map(t => (
          <div
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`tab-pill${filter === t.id ? ' active' : ''}`}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* RSS input */}
      {!compact && (
        <div style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'rgba(0,0,0,0.1)' }}>
          <input
            value={customRss}
            onChange={e => setCustomRss(e.target.value)}
            onKeyDown={addCustomRss}
            placeholder="+ Add RSS feed URL…"
            style={{
              width: '100%', background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border)',
              borderRadius: 4, color: 'var(--text-secondary)',
              fontSize: 9, padding: '4px 8px', outline: 'none',
              fontFamily: 'var(--font-mono)',
              transition: 'border-color var(--t-fast)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--border-glow)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      )}

      {/* Feed list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {filtered.length === 0 && (
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', marginTop: 28 }}>
            Awaiting feed…
          </div>
        )}
        {filtered.map((item, i) => {
          const tag = item.tags?.[0] || 'NEWS'
          const meta = TAG_META[tag] || TAG_META.NEWS
          const hasMatch = !!(item.lat && item.lon) || !!findMatch(item, incidents)
          const isHov = hoveredIdx === i

          return (
            <div
              key={i}
              className="feed-card"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => handleClick(item)}
              style={{
                borderLeft: `2px solid ${meta.border}`,
                background: isHov ? 'var(--bg-hover)' : 'var(--bg-card)',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 600,
                    letterSpacing: 0.5, color: 'var(--blue)',
                  }}>
                    {item.source}
                  </span>
                  {item.bias && (
                    <span className="tag" style={{ background: item.bias.color + '18', color: item.bias.color, borderColor: item.bias.color + '45' }}>
                      {item.bias.label}
                    </span>
                  )}
                  {item.confidence && (
                    <span className="tag" style={{ background: item.confidence.color + '18', color: item.confidence.color, borderColor: item.confidence.color + '45' }}>
                      {item.confidence.score}%
                    </span>
                  )}
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', flexShrink: 0 }}>
                  {timeAgo(item.published)}
                </span>
              </div>

              {/* Image */}
              {item.image && (
                <img src={item.image} alt="" style={{
                  width: '100%', height: 58, objectFit: 'cover',
                  borderRadius: 4, marginBottom: 6,
                  opacity: isHov ? 1 : 0.82,
                  transition: 'opacity var(--t-fast)',
                }} onError={e => e.target.style.display = 'none'} />
              )}

              {/* Title */}
              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 400,
                color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: 6,
              }}>
                {item.title}
              </div>

              {/* Coverage */}
              {item.coverage_count > 1 && (
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 8, color: 'var(--teal)', marginBottom: 5 }}>
                  {item.coverage_count} sources — {item.coverage_sources?.join(', ')}
                </div>
              )}

              {/* Bottom row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span className="tag" style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}>
                  {tag}
                </span>
                {onSave && (
                  <span
                    onClick={e => { e.stopPropagation(); onSave(item) }}
                    title="Save to watchlist"
                    style={{
                      fontSize: 10, cursor: 'pointer', opacity: isHov ? 0.9 : 0.35,
                      transition: 'opacity var(--t-fast)', lineHeight: 1,
                    }}
                  >🔖</span>
                )}
                {onSatellite && item.lat && item.lon && (
                  <span
                    onClick={e => { e.stopPropagation(); onSatellite(item) }}
                    title="Satellite view"
                    style={{
                      fontSize: 10, cursor: 'pointer', opacity: isHov ? 0.9 : 0.35,
                      transition: 'opacity var(--t-fast)', lineHeight: 1,
                    }}
                  >🛰</span>
                )}
                {hasMatch && (
                  <span style={{
                    fontFamily: 'var(--font-sans)', fontSize: 7, fontWeight: 600,
                    color: 'var(--blue)', letterSpacing: 0.8, opacity: isHov ? 1 : 0.6,
                    transition: 'opacity var(--t-fast)',
                  }}>
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
