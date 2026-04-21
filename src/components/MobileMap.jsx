import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const SEV_COLORS = {
  critical:   '#e24b4a',
  elevated:   '#ef9f27',
  monitor:    '#378add',
  earthquake: '#b077dd',
}

export default function MobileMap({ incidents, aircraft, flyTo }) {
  const mapRef = useRef(null)
  const [layer, setLayer] = useState('Globe')

  useEffect(() => {
    if (!flyTo || !mapRef.current) return
    mapRef.current.flyTo([flyTo.lat, flyTo.lon], 6, { duration: 1.5 })
  }, [flyTo])

  const tabs = ['Globe', 'Aircraft', 'Naval', 'Weather']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', gap: 2, padding: '4px 6px',
        background: '#0d1117', borderBottom: '1px solid #1e2530',
        flexShrink: 0, overflowX: 'auto'
      }}>
        {tabs.map(t => (
          <span key={t} onClick={() => setLayer(t)} style={{
            fontSize: 9, padding: '3px 8px', borderRadius: 2, cursor: 'pointer',
            color: layer === t ? '#378add' : '#2a3a4a',
            border: layer === t ? '1px solid #1e3a55' : '1px solid transparent',
            background: layer === t ? '#0a1825' : 'transparent',
            whiteSpace: 'nowrap', fontFamily: 'Courier New'
          }}>{t}</span>
        ))}
        <span style={{ fontSize: 9, color: '#378add', padding: '3px 8px', fontFamily: 'Courier New' }}>
          {incidents.length} PLOTTED
        </span>
      </div>

      {layer === 'Naval' ? (
        <iframe src="https://www.marinetraffic.com/en/ais/embed/maptype:0/shownames:1/mmsi:0/shipid:0/fleet:0/fleet_id:0/vtypes:0/showmenu:0/remember:0"
          style={{ flex: 1, border: 'none' }} title="Ships" />
      ) : layer === 'Aircraft' ? (
        <iframe src="https://globe.adsbexchange.com/"
          style={{ flex: 1, border: 'none' }} title="Aircraft" />
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
                pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 1 }}>
                <Popup>
                  <div style={{ fontFamily: 'Courier New', fontSize: 11, background: '#0d1117', color: '#c8cfd8', padding: 8, borderRadius: 4 }}>
                    <div style={{ color, fontWeight: 'bold', marginBottom: 4 }}>
                      {isQuake ? 'SEISMIC M' + Number(inc.mag||0).toFixed(1) : (inc.severity||'').toUpperCase()}
                    </div>
                    <div style={{ lineHeight: 1.4 }}>{inc.title}</div>
                    {inc.url && <a href={inc.url} target="_blank" rel="noreferrer" style={{ color: '#378add', fontSize: 10 }}>Source</a>}
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
          {aircraft.map((ac, i) => (
            <CircleMarker key={'ac'+i} center={[ac.lat, ac.lon]}
              radius={ac.type === 'military' ? 5 : 3}
              pathOptions={{ color: '#ff6b35', fillColor: '#ff6b35', fillOpacity: 0.8, weight: 1 }}>
              <Popup>
                <div style={{ fontFamily: 'Courier New', fontSize: 11, background: '#0d1117', color: '#c8cfd8', padding: 8 }}>
                  <div style={{ color: '#ff6b35', fontWeight: 'bold' }}>{ac.type === 'military' ? 'MILITARY' : 'CIVIL'}</div>
                  <div>{ac.callsign}</div>
                  <div style={{ fontSize: 10, color: '#5a6a78' }}>ALT: {Math.round(ac.altitude).toLocaleString()} ft</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      )}
    </div>
  )
}
