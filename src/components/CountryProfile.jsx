import { useState, useEffect } from 'react'

const API = 'https://ops.unocloud.us'

const COUNTRY_COORDS = {
  'Iran': { lat: 32, lon: 53, code: 'IR' },
  'Russia': { lat: 61, lon: 105, code: 'RU' },
  'Israel': { lat: 31.5, lon: 34.8, code: 'IL' },
  'Ukraine': { lat: 49, lon: 31, code: 'UA' },
  'China': { lat: 35, lon: 105, code: 'CN' },
  'Syria': { lat: 35, lon: 38, code: 'SY' },
  'Lebanon': { lat: 33.9, lon: 35.5, code: 'LB' },
  'Iraq': { lat: 33, lon: 44, code: 'IQ' },
  'Yemen': { lat: 15.5, lon: 48, code: 'YE' },
  'Gaza': { lat: 31.4, lon: 34.3, code: 'PS' },
  'USA': { lat: 38, lon: -97, code: 'US' },
  'North Korea': { lat: 40, lon: 127, code: 'KP' },
}

export default function CountryProfile({ feedItems, incidents, onFlyTo }) {
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  const countries = Object.keys(COUNTRY_COORDS)
  const filtered = search
    ? countries.filter(c => c.toLowerCase().includes(search.toLowerCase()))
    : countries

  const getCountryFeed = (country) => {
    const lower = country.toLowerCase()
    return feedItems.filter(item =>
      (item.title + ' ' + (item.summary || '')).toLowerCase().includes(lower)
    )
  }

  const getCountryIncidents = (country) => {
    const lower = country.toLowerCase()
    return incidents.filter(inc =>
      (inc.title || '').toLowerCase().includes(lower)
    )
  }

  const getScoreColor = (s) => s >= 80 ? '#e24b4a' : s >= 60 ? '#ef9f27' : s >= 40 ? '#97c459' : '#378add'

  const selectedFeed = selected ? getCountryFeed(selected) : []
  const selectedInc  = selected ? getCountryIncidents(selected) : []
  const activityScore = Math.min(100, (selectedFeed.length * 8) + (selectedInc.length * 3))

  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e2530', borderRadius: 4, marginBottom: 5, flexShrink: 0 }}>
      <div style={{ padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1a2030' }}>
        <span style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 1.5, fontWeight: 'bold' }}>COUNTRY PROFILES</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search country..."
          style={{ background: '#060809', border: '1px solid #1e2530', borderRadius: 2, color: '#c8cfd8', fontSize: 8, padding: '2px 6px', outline: 'none', fontFamily: 'Courier New', width: 100 }}
        />
      </div>

      <div style={{ display: 'flex', height: selected ? 180 : 60 }}>
        {/* Country list */}
        <div style={{ width: 100, borderRight: '1px solid #1a2030', overflowY: 'auto', flexShrink: 0 }}>
          {filtered.map(country => {
            const feed = getCountryFeed(country)
            const isActive = feed.length > 0
            return (
              <div key={country} onClick={() => {
                setSelected(selected === country ? null : country)
                if (COUNTRY_COORDS[country] && onFlyTo) {
                  onFlyTo({ lat: COUNTRY_COORDS[country].lat, lon: COUNTRY_COORDS[country].lon, title: country })
                }
              }} style={{
                padding: '4px 8px', cursor: 'pointer', fontSize: 8,
                color: selected === country ? '#378add' : isActive ? '#c8cfd8' : '#2a3545',
                background: selected === country ? '#0a1825' : 'transparent',
                borderBottom: '1px solid #0a1020',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span>{country}</span>
                {feed.length > 0 && (
                  <span style={{ fontSize: 7, color: feed.some(f => f.severity === 'critical') ? '#e24b4a' : '#ef9f27' }}>
                    {feed.length}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Country detail */}
        {selected && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#c8cfd8', fontWeight: 'bold' }}>{selected}</span>
              <span style={{ fontSize: 9, color: getScoreColor(activityScore), padding: '1px 6px', background: getScoreColor(activityScore) + '22', border: '1px solid ' + getScoreColor(activityScore) + '55', borderRadius: 2 }}>
                Activity: {activityScore}
              </span>
              {onFlyTo && COUNTRY_COORDS[selected] && (
                <span onClick={() => onFlyTo({ lat: COUNTRY_COORDS[selected].lat, lon: COUNTRY_COORDS[selected].lon, title: selected })}
                  style={{ fontSize: 8, color: '#378add', cursor: 'pointer', marginLeft: 'auto' }}>
                  🌍 Fly to
                </span>
              )}
            </div>
            <div style={{ fontSize: 8, color: '#3a4a58', marginBottom: 4 }}>
              {selectedFeed.length} news items · {selectedInc.length} incidents
            </div>
            {selectedFeed.slice(0, 4).map((item, i) => (
              <div key={i} onClick={() => item.url && window.open(item.url, '_blank')} style={{
                fontSize: 8, color: '#8a9aaa', padding: '3px 0',
                borderBottom: '1px solid #0a1020', cursor: 'pointer',
                lineHeight: 1.4
              }}>
                <span style={{ color: item.severity === 'critical' ? '#e24b4a' : '#ef9f27', marginRight: 4 }}>
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
