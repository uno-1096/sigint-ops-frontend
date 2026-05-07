import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const SEV_COLORS = {
  critical:   '#ff2d55',
  elevated:   '#ff9f0a',
  monitor:    '#0a84ff',
  earthquake: '#bf5af2',
}

export default function MobileMap({ incidents, aircraft, flyTo }) {
  const mapRef = useRef(null)
  const [layer, setLayer] = useState('Globe')
  const TABS = ['Globe', 'Aircraft', 'Naval', 'Weather']

  useEffect(() => {
    if (!flyTo || !mapRef.current) return
    mapRef.current.flyTo([flyTo.lat, flyTo.lon], 6, { duration: 1.5 })
  }, [flyTo])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Layer tabs */}
      <div style={{
        display: 'flex', gap: 3, padding: '5px 8px',
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0, overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setLayer(t)}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 600,
              padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
              letterSpacing: 0.8, whiteSpace: 'nowrap',
              color: layer === t ? 'var(--blue)' : 'var(--text-dim)',
              background: layer === t ? 'rgba(10,132,255,0.12)' : 'transparent',
              border: layer === t ? '1px solid rgba(10,132,255,0.3)' : '1px solid transparent',
              transition: 'all var(--t-fast)',
            }}
          >{t}</button>
        ))}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--blue)', padding: '4px 8px', marginLeft: 'auto', alignSelf: 'center' }}>
          {incidents.length} plotted
        </span>
      </div>

      {/* Content */}
      {layer === 'Naval' ? (
        <iframe src="https://www.marinetraffic.com/en/ais/embed/maptype:0/shownames:1/mmsi:0/shipid:0/fleet:0/fleet_id:0/vtypes:0/showmenu:0/remember:0"
          style={{ flex: 1, border: 'none' }} title="Ships" />
      ) : layer === 'Aircraft' ? (
        <iframe src="https://globe.adsbexchange.com/" style={{ flex: 1, border: 'none' }} title="Aircraft" />
      ) : layer === 'Weather' ? (
        <iframe src="https://embed.windy.com/embed2.html?lat=20&lon=10&zoom=3&level=surface&overlay=wind"
          style={{ flex: 1, border: 'none' }} title="Weather" />
      ) : (
        <MapContainer
          center={[20, 10]} zoom={2}
          style={{ flex: 1, minHeight: 0 }}
          ref={mapRef}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {incidents.map((inc, i) => {
            const isQuake = inc.type === 'earthquake'
            const color = SEV_COLORS[isQuake ? 'earthquake' : inc.severity] || SEV_COLORS.monitor
            return (
              <CircleMarker key={i} center={[inc.lat, inc.lon]}
                radius={isQuake ? 7 : 5}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 1.5 }}>
                <Popup>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-panel)', color: 'var(--text-primary)', padding: 10, borderRadius: 6 }}>
                    <div style={{ color, fontWeight: 700, marginBottom: 4 }}>
                      {isQuake ? 'SEISMIC M' + Number(inc.mag || 0).toFixed(1) : (inc.severity || '').toUpperCase()}
                    </div>
                    <div style={{ lineHeight: 1.45 }}>{inc.title}</div>
                    {inc.url && <a href={inc.url} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', fontSize: 10, display: 'block', marginTop: 4 }}>Source →</a>}
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
          {aircraft.map((ac, i) => (
            <CircleMarker key={'ac' + i} center={[ac.lat, ac.lon]}
              radius={ac.type === 'military' ? 5 : 3}
              pathOptions={{ color: '#ff6b35', fillColor: '#ff6b35', fillOpacity: 0.85, weight: 1.5 }}>
              <Popup>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-panel)', color: 'var(--text-primary)', padding: 10 }}>
                  <div style={{ color: '#ff6b35', fontWeight: 700 }}>{ac.type === 'military' ? 'MILITARY' : 'CIVIL'}</div>
                  <div>{ac.callsign}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>ALT: {Math.round(ac.altitude).toLocaleString()} ft</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      )}
    </div>
  )
}
