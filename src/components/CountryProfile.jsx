import { useState } from 'react'

const COUNTRY_COORDS = {
  'Iran':        { lat: 32,   lon: 53,    code: 'IR' },
  'Russia':      { lat: 61,   lon: 105,   code: 'RU' },
  'Israel':      { lat: 31.5, lon: 34.8,  code: 'IL' },
  'Ukraine':     { lat: 49,   lon: 31,    code: 'UA' },
  'China':       { lat: 35,   lon: 105,   code: 'CN' },
  'Syria':       { lat: 35,   lon: 38,    code: 'SY' },
  'Lebanon':     { lat: 33.9, lon: 35.5,  code: 'LB' },
  'Iraq':        { lat: 33,   lon: 44,    code: 'IQ' },
  'Yemen':       { lat: 15.5, lon: 48,    code: 'YE' },
  'Gaza':        { lat: 31.4, lon: 34.3,  code: 'PS' },
  'USA':         { lat: 38,   lon: -97,   code: 'US' },
  'North Korea': { lat: 40,   lon: 127,   code: 'KP' },
}

const getColor = (s) => s >= 80 ? 'var(--critical)' : s >= 60 ? 'var(--elevated)' : s >= 40 ? 'var(--moderate)' : 'var(--low)'

export default function CountryProfile({ feedItems, incidents, onFlyTo }) {
  const [selected, setSelected] = useState(null)
  const [search, setSearch]     = useState('')

  const countries = Object.keys(COUNTRY_COORDS)
  const filtered  = search ? countries.filter(c => c.toLowerCase().includes(search.toLowerCase())) : countries

  const getCountryFeed = (country) => {
    const lo = country.toLowerCase()
    return feedItems.filter(item => (item.title + ' ' + (item.summary || '')).toLowerCase().includes(lo))
  }

  const getCountryInc = (country) => {
    const lo = country.toLowerCase()
    return incidents.filter(inc => (inc.title || '').toLowerCase().includes(lo))
  }

  const selectedFeed   = selected ? getCountryFeed(selected) : []
  const selectedInc    = selected ? getCountryInc(selected) : []
  const activityScore  = Math.min(100, selectedFeed.length * 8 + selectedInc.length * 3)

  return (
    <div className="collapse-row">
      <div style={{ padding: '7px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.12)' }}>
        <span className="collapse-title">Country Profiles</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          style={{
            background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border)',
            borderRadius: 4, color: 'var(--text-secondary)', fontSize: 9,
            padding: '3px 8px', outline: 'none', width: 90,
            fontFamily: 'var(--font-sans)',
            transition: 'border-color var(--t-fast)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--border-glow)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      <div style={{ display: 'flex', height: selected ? 188 : 72 }}>
        {/* Country list */}
        <div style={{ width: 108, borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }}>
          {filtered.map(country => {
            const feed = getCountryFeed(country)
            const isActive = feed.length > 0
            const isSel = selected === country
            const hasCrit = feed.some(f => f.severity === 'critical')
            return (
              <div
                key={country}
                onClick={() => {
                  setSelected(isSel ? null : country)
                  if (COUNTRY_COORDS[country] && onFlyTo)
                    onFlyTo({ lat: COUNTRY_COORDS[country].lat, lon: COUNTRY_COORDS[country].lon, title: country })
                }}
                style={{
                  padding: '5px 10px', cursor: 'pointer', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                  fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: isSel ? 600 : 400,
                  color: isSel ? 'var(--blue)' : isActive ? 'var(--text-primary)' : 'var(--text-dim)',
                  background: isSel ? 'rgba(10,132,255,0.1)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.025)',
                  transition: 'background var(--t-fast), color var(--t-fast)',
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
              >
                <span>{country}</span>
                {feed.length > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, color: hasCrit ? 'var(--critical)' : 'var(--elevated)' }}>
                    {feed.length}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Detail pane */}
        {selected && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', animation: 'fadeSlideIn var(--t-mid) var(--ease-snap)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{selected}</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                padding: '1px 7px', borderRadius: 3,
                color: getColor(activityScore),
                background: getColor(activityScore) + '18',
                border: `1px solid ${getColor(activityScore)}40`,
              }}>
                {activityScore}
              </span>
              {COUNTRY_COORDS[selected] && onFlyTo && (
                <span
                  onClick={() => onFlyTo({ lat: COUNTRY_COORDS[selected].lat, lon: COUNTRY_COORDS[selected].lon, title: selected })}
                  style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 600, color: 'var(--blue)', cursor: 'pointer', marginLeft: 'auto', letterSpacing: 0.5 }}
                >
                  ⊕ FLY TO
                </span>
              )}
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 8, color: 'var(--text-dim)', marginBottom: 6 }}>
              {selectedFeed.length} articles · {selectedInc.length} incidents
            </div>
            {selectedFeed.slice(0, 4).map((item, i) => (
              <div
                key={i}
                onClick={() => item.url && window.open(item.url, '_blank')}
                style={{
                  fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--text-secondary)',
                  padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
                  cursor: 'pointer', lineHeight: 1.4,
                  transition: 'color var(--t-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <span style={{ color: item.severity === 'critical' ? 'var(--critical)' : 'var(--elevated)', marginRight: 5, fontWeight: 600 }}>
                  [{item.source}]
                </span>
                {item.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
