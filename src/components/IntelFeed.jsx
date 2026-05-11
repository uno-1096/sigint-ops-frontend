import { useState } from 'react'

const TAG_META = {
  CRITICAL:   { color: 'var(--t7)',     rgb: '196,75,42' },
  MILITARY:   { color: 'var(--bronze)', rgb: '168,118,58' },
  DISASTER:   { color: 'var(--t5)',     rgb: '196,132,42' },
  POLITICAL:  { color: 'var(--t3)',     rgb: '74,138,196' },
  NEWS:       { color: 'var(--ivory-2)',rgb: '184,180,170' },
  PREDICTION: { color: 'var(--pulse)',  rgb: '61,191,184' },
}

function timeAgo(published) {
  if (!published) return ''
  try {
    const diff = Math.floor((Date.now() - new Date(published)) / 60000)
    if (diff < 1) return 'now'
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
  { id: 'ALL', label: 'ALL' },
  { id: 'MIL', label: 'MIL' },
  { id: 'DIS', label: 'DIS' },
  { id: 'POL', label: 'POL' },
]
const FILTER_MAP = { ALL: null, MIL: 'MILITARY', DIS: 'DISASTER', POL: 'POLITICAL' }

export default function IntelFeed({ items = [], incidents, onFlyTo, compact, onSave, onSatellite }) {
  console.log('[IntelFeed] render — items.length:', items.length, '| first item:', items[0] ?? null)

  const [filter, setFilter]   = useState('ALL')
  const [customRss, setCustomRss] = useState('')
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [pressedBtn, setPressedBtn] = useState(null)

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
        localStorage.setItem('sigint-custom-rss', JSON.stringify([...saved, customRss.trim()]))
      }
      setCustomRss('')
    }
  }

  return (
    <div
      className="panel"
      style={{
        background: 'var(--bg-1)',
        border: '1px solid var(--seam)',
        ...(compact ? { border: 'none', borderRadius: 0 } : { flex: 1, minHeight: 0 }),
      }}
    >
      {/* Panel header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 12px',
        borderBottom: '1px solid var(--seam)',
        background: 'var(--bg-0)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'var(--font-data)',
          fontSize: 9, fontWeight: 500, letterSpacing: '0.2em',
          color: 'var(--ivory-3)', textTransform: 'uppercase',
        }}>
          Intel Feed
        </span>
        <span style={{
          fontFamily: 'var(--font-data)',
          fontSize: 9, fontWeight: 400, color: 'var(--bronze)',
        }}>
          {items.length}
        </span>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--seam)',
        background: 'var(--bg-0)',
        flexShrink: 0,
      }}>
        {TABS.map(t => {
          const active = filter === t.id
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              style={{
                flex: 1,
                fontFamily: 'var(--font-data)',
                fontSize: 8, fontWeight: active ? 500 : 400,
                letterSpacing: '0.15em',
                padding: '6px 4px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                borderBottom: active ? '2px solid var(--bronze)' : '2px solid transparent',
                color: active ? 'var(--bronze)' : 'var(--ivory-3)',
                transition: 'color 180ms, border-color 180ms',
                boxShadow: active ? 'var(--shadow-btn-rest)' : 'none',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* RSS input */}
      {!compact && (
        <div style={{
          padding: '5px 8px',
          borderBottom: '1px solid var(--seam)',
          background: 'var(--bg-0)',
          flexShrink: 0,
        }}>
          <input
            value={customRss}
            onChange={e => setCustomRss(e.target.value)}
            onKeyDown={addCustomRss}
            placeholder="+ RSS feed URL…"
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid var(--seam)',
              borderRadius: 3,
              color: 'var(--ivory-3)',
              fontSize: 9,
              padding: '4px 8px',
              outline: 'none',
              fontFamily: 'var(--font-data)',
              transition: 'border-color 180ms',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--bronze)'}
            onBlur={e => e.target.style.borderColor = 'var(--seam)'}
          />
        </div>
      )}

      {/* Feed list */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '5px',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {filtered.length === 0 && (
          <div style={{
            fontFamily: 'var(--font-data)', fontSize: 9,
            color: 'var(--ivory-3)', textAlign: 'center', marginTop: 32,
            letterSpacing: '0.15em',
          }}>
            AWAITING FEED
          </div>
        )}

        {filtered.map((item, i) => {
          const tag    = item.tags?.[0] || 'NEWS'
          const meta   = TAG_META[tag] || TAG_META.NEWS
          const hasGeo = !!(item.lat && item.lon) || !!findMatch(item, incidents)
          const isHov  = hoveredIdx === i

          return (
            <div
              key={i}
              onClick={() => handleClick(item)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                background: isHov ? 'var(--bg-2)' : '#1C1C25',
                border: `1px solid ${isHov ? meta.color : 'var(--seam)'}`,
                borderLeft: `3px solid ${meta.color}`,
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'background 180ms, border-color 180ms',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {/* Tag / source / time row */}
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 7,
                padding: '9px 10px 0 10px',
              }}>
                <span style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: 7, fontWeight: 500,
                  letterSpacing: '0.14em',
                  color: meta.color,
                  flexShrink: 0,
                  textTransform: 'uppercase',
                }}>
                  {tag}
                </span>
                <span style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: 8, fontWeight: 300,
                  color: 'var(--bronze)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: 1, minWidth: 0,
                  textTransform: 'uppercase',
                }}>
                  {item.source}
                </span>
                <span style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: 7, fontWeight: 300,
                  color: 'var(--ivory-3)',
                  flexShrink: 0,
                }}>
                  {timeAgo(item.published)}
                </span>
              </div>

              {/* Headline */}
              <div style={{
                padding: '3px 10px 9px 10px',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 13,
                fontWeight: 300,
                color: 'var(--ivory)',
                lineHeight: 1.38,
                display: '-webkit-box',
                WebkitLineClamp: isHov ? 'unset' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {item.title}
              </div>

              {/* Hover-expand detail */}
              <div style={{
                maxHeight: isHov ? '220px' : '0',
                opacity: isHov ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 280ms ease, opacity 200ms',
              }}>
                <div style={{ padding: '0 10px 10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>

                  {item.summary && (
                    <p style={{
                      fontFamily: 'var(--font-data)',
                      fontSize: 9, fontWeight: 300,
                      color: 'var(--ivory-2)',
                      lineHeight: 1.55,
                      margin: 0,
                    }}>
                      {item.summary.slice(0, 200)}{item.summary.length > 200 ? '…' : ''}
                    </p>
                  )}

                  {item.coverage_count > 1 && (
                    <div style={{ fontFamily: 'var(--font-data)', fontSize: 8, color: 'var(--pulse)' }}>
                      {item.coverage_count} sources — {item.coverage_sources?.join(', ')}
                    </div>
                  )}

                  {(item.bias || item.confidence) && (
                    <div style={{ display: 'flex', gap: 5 }}>
                      {item.bias && (
                        <span style={{
                          fontFamily: 'var(--font-data)', fontSize: 7, fontWeight: 500,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          padding: '2px 6px', borderRadius: 2,
                          color: item.bias.color,
                          border: `1px solid ${item.bias.color}55`,
                          background: `${item.bias.color}12`,
                        }}>
                          {item.bias.label}
                        </span>
                      )}
                      {item.confidence && (
                        <span style={{
                          fontFamily: 'var(--font-data)', fontSize: 7, fontWeight: 500,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          padding: '2px 6px', borderRadius: 2,
                          color: item.confidence.color,
                          border: `1px solid ${item.confidence.color}55`,
                          background: `${item.confidence.color}12`,
                        }}>
                          {item.confidence.score}%
                        </span>
                      )}
                    </div>
                  )}

                  {/* Threat bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      flex: 1, height: 2, borderRadius: 1,
                      background: `rgba(${meta.rgb},0.15)`,
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        width: tag === 'CRITICAL' ? '95%' : tag === 'MILITARY' ? '78%' : tag === 'DISASTER' ? '70%' : tag === 'POLITICAL' ? '50%' : '30%',
                        background: meta.color,
                        borderRadius: 1,
                      }} />
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-data)', fontSize: 7,
                      color: meta.color, letterSpacing: '0.1em',
                    }}>
                      {tag}
                    </span>
                  </div>

                  {/* Action row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {hasGeo && (
                      <ActionBtn
                        label="LOCATE"
                        pressed={pressedBtn === `loc-${i}`}
                        onPress={() => { setPressedBtn(`loc-${i}`); setTimeout(() => setPressedBtn(null), 200) }}
                        color="var(--bronze)"
                      />
                    )}
                    {onSave && (
                      <ActionBtn
                        label="SAVE"
                        pressed={pressedBtn === `save-${i}`}
                        onPress={e => { e.stopPropagation(); setPressedBtn(`save-${i}`); setTimeout(() => setPressedBtn(null), 200); onSave(item) }}
                        color="var(--ivory-3)"
                      />
                    )}
                    {onSatellite && item.lat && item.lon && (
                      <ActionBtn
                        label="SAT"
                        pressed={pressedBtn === `sat-${i}`}
                        onPress={e => { e.stopPropagation(); setPressedBtn(`sat-${i}`); setTimeout(() => setPressedBtn(null), 200); onSatellite(item) }}
                        color="var(--pulse)"
                      />
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{
                          fontFamily: 'var(--font-data)', fontSize: 7,
                          fontWeight: 400, letterSpacing: '0.1em',
                          color: 'var(--ivory-3)',
                          textDecoration: 'none',
                          marginLeft: 'auto',
                          opacity: 0.7,
                        }}
                      >
                        SRC ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ActionBtn({ label, pressed, onPress, color }) {
  return (
    <button
      onClick={onPress}
      style={{
        fontFamily: 'var(--font-data)',
        fontSize: 7, fontWeight: 500,
        letterSpacing: '0.12em',
        padding: '3px 8px',
        borderRadius: 2,
        border: `1px solid ${color}55`,
        background: `transparent`,
        color,
        cursor: 'pointer',
        boxShadow: pressed ? 'var(--shadow-btn-active)' : 'var(--shadow-btn-rest)',
        transform: pressed ? 'translateY(1.5px) scale(0.97)' : 'none',
        transition: `transform 180ms var(--ease-spring), box-shadow 120ms`,
      }}
    >
      {label}
    </button>
  )
}
