import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwYTM2ODY2ZC1mNGU0LTQ0Y2UtOGQzMy1jZDBhZDVlZWEzNDYiLCJpZCI6NDIwODMzLCJpYXQiOjE3NzY3MDE5OTl9.D9dOYKG61iRG5BwALqpZVsB0niDdsNVd6hFGRzBy1YY'

// Updated to new palette — must stay raw hex (Cesium can't read CSS vars)
const SEV_COLORS = {
  critical:   '#ff2d55',
  elevated:   '#ff9f0a',
  monitor:    '#0a84ff',
  earthquake: '#bf5af2',
}

const POPUP_CSS = 'background:#06090f;color:#dde6f0;font-family:Inter,system-ui,sans-serif;padding:10px;border-radius:6px'

function addStrategicPin(viewer, loc) {
  const colors = { nuclear: '#ff2d55', military: '#ff9f0a', chokepoint: '#bf5af2' }
  const color = colors[loc.type] || '#0a84ff'
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(loc.lon, loc.lat, 0),
    point: {
      pixelSize: loc.type === 'nuclear' ? 14 : 10,
      color: Cesium.Color.fromCssColorString(color),
      outlineColor: Cesium.Color.fromCssColorString(color).withAlpha(0.4),
      outlineWidth: 8,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    name: loc.name,
    description: `<div style="${POPUP_CSS};border-left:3px solid ${color};min-width:200px">` +
      `<b style="color:${color}">${loc.type.toUpperCase()}</b><br/>` +
      `<b>${loc.name}</b><br/>` +
      `<span style="color:#7a94aa">${loc.country}</span></div>`,
  })
}

export default function GlobeMap({ incidents, aircraft, flyTo }) {
  const mountRef      = useRef(null)
  const viewerRef     = useRef(null)
  const handlerRef    = useRef(null)
  const strategicRef  = useRef([])
  const weatherRef    = useRef([])
  const heatmapRef    = useRef(null)
  const [layer, setLayer]     = useState('Globe')
  const [popup, setPopup]     = useState(null)
  const [showHeat, setShowHeat] = useState(false)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    fetch('https://ops.unocloud.us/api/weather')
      .then(r => r.json())
      .then(data => { weatherRef.current = data })
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetch('https://ops.unocloud.us/api/strategic')
      .then(r => r.json())
      .then(data => { strategicRef.current = data })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!mountRef.current || viewerRef.current) return

    const viewer = new Cesium.Viewer(mountRef.current, {
      terrainProvider:       new Cesium.EllipsoidTerrainProvider(),
      baseLayerPicker:       false,
      geocoder:              false,
      homeButton:            false,
      sceneModePicker:       false,
      navigationHelpButton:  false,
      animation:             false,
      timeline:              false,
      fullscreenButton:      false,
      selectionIndicator:    false,
      infoBox:               false,
      creditContainer:       document.createElement('div'),
      contextOptions: {
        webgl: {
          alpha: false,
          antialias: true,
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: false,
          depth: true,
          stencil: false,
          anisotropy: 1,
          powerPreference: 'high-performance',
        }
      }
    })

    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
    viewer.trackedEntity = undefined

    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#020408')
    viewer.scene.globe.enableLighting = false
    viewer.scene.globe.showGroundAtmosphere = true
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a0d12')

    viewer.imageryLayers.get(0).brightness = 0.6
    viewer.imageryLayers.get(0).contrast = 1.2
    viewer.imageryLayers.get(0).saturation = 0.5
    viewer.imageryLayers.get(0).hue = 0.55

    const labelProvider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png',
      subdomains: ['a','b','c','d'],
      credit: 'CartoDB',
      minimumLevel: 0,
      maximumLevel: 19,
    })
    const labelLayer = viewer.imageryLayers.addImageryProvider(labelProvider)
    labelLayer.alpha = 0.8
    labelLayer.minimumTerrainLevel = 3

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(10, 20, 18000000),
    })

    viewerRef.current = viewer

    return () => {
      if (handlerRef.current) handlerRef.current.destroy()
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    viewer.entities.removeAll()

    incidents.forEach((inc) => {
      const isQuake = inc.type === 'earthquake'
      const color   = SEV_COLORS[isQuake ? 'earthquake' : inc.severity] || SEV_COLORS.monitor

      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(inc.lon, inc.lat, 0),
        point: {
          pixelSize:                isQuake ? 11 : 9,
          color:                    Cesium.Color.fromCssColorString(color),
          outlineColor:             Cesium.Color.fromCssColorString(color).withAlpha(0.35),
          outlineWidth:             5,
          heightReference:          Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance:          new Cesium.NearFarScalar(1e6, 1.5, 1e8, 0.4),
        },
        properties: { incident: inc },
      })
    })

    if (handlerRef.current) handlerRef.current.destroy()
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction(e => {
      const picked = viewer.scene.pick(e.position)
      if (Cesium.defined(picked) && picked.id && picked.id.properties) {
        const inc = picked.id.properties.incident.getValue()
        setPopup({ inc, x: e.position.x, y: e.position.y })
      } else {
        setPopup(null)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    handlerRef.current = handler
  }, [incidents])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    const toRemove = viewer.entities.values.filter(e => e.id && String(e.id).startsWith('ac-'))
    toRemove.forEach(e => viewer.entities.remove(e))

    if (!aircraft || !aircraft.length) return

    aircraft.forEach((ac, i) => {
      const isMil  = ac.type === 'military'
      const color  = isMil ? '#ff6b35' : '#0a84ff'
      viewer.entities.add({
        id: 'ac-' + (ac.icao || i),
        position: Cesium.Cartesian3.fromDegrees(ac.lon, ac.lat, (ac.altitude || 10000)),
        point: {
          pixelSize: isMil ? 7 : 4,
          color: Cesium.Color.fromCssColorString(color).withAlpha(isMil ? 1 : 0.7),
          outlineColor: Cesium.Color.fromCssColorString(color).withAlpha(0.3),
          outlineWidth: 3,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 1e7, 0.3),
        },
        name: ac.callsign || 'Unknown',
        description:
          `<div style="${POPUP_CSS};border-left:3px solid ${color}">` +
          `<b style="color:${color}">${isMil ? 'MILITARY' : 'CIVIL'}</b><br/>` +
          `Callsign: ${ac.callsign || 'N/A'}<br/>` +
          `Alt: ${Math.round((ac.altitude || 0) / 0.3048).toLocaleString()} ft<br/>` +
          `Speed: ${Math.round((ac.velocity || 0) * 1.944)} kts<br/>` +
          `Heading: ${ac.heading || 0}°</div>`,
      })
    })
  }, [aircraft])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    if (heatmapRef.current) {
      viewer.dataSources.remove(heatmapRef.current)
      heatmapRef.current = null
    }

    if (!showHeat || !incidents.length) return

    const grid = {}
    incidents.forEach(inc => {
      const gx = Math.floor(inc.lon / 30) * 30
      const gy = Math.floor(inc.lat / 15) * 15
      const key = `${gx},${gy}`
      grid[key] = (grid[key] || 0) + 1
    })

    const max = Math.max(...Object.values(grid))
    const ds  = new Cesium.CustomDataSource('heatmap')

    Object.entries(grid).forEach(([key, count]) => {
      const [gx, gy] = key.split(',').map(Number)
      const intensity = count / max
      const r = Math.round(intensity * 220)
      const g = Math.round((1 - intensity) * 80)
      const b = 20
      ds.entities.add({
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray([gx, gy, gx+30, gy, gx+30, gy+15, gx, gy+15]),
          material: new Cesium.ColorMaterialProperty(new Cesium.Color(r/255, g/255, b/255, 0.75)),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          classificationType: Cesium.ClassificationType.TERRAIN,
        }
      })
    })

    viewer.dataSources.add(ds)
    heatmapRef.current = ds
  }, [incidents, showHeat])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    viewer.entities.removeAll()

    if (layer === 'Weather') {
      weatherRef.current.forEach(w => {
        if (!w.lat || !w.lon) return
        const color = w.type === 'disaster' ? '#ff2d55' : '#ff9f0a'
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(w.lon, w.lat, 0),
          point: {
            pixelSize: 12,
            color: Cesium.Color.fromCssColorString(color),
            outlineColor: Cesium.Color.fromCssColorString(color).withAlpha(0.3),
            outlineWidth: 6,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          name: w.title,
          description: `<div style="${POPUP_CSS};border-left:3px solid ${color}">` +
            `<b style="color:${color}">${(w.type || 'WEATHER').toUpperCase()}</b><br/>` +
            `${w.title}<br/><span style="color:#7a94aa">${w.source || ''}</span></div>`,
        })
      })
    }

    if (layer === 'INTEL') {
      const locs = strategicRef.current
      if (!locs || !locs.length) {
        fetch('https://ops.unocloud.us/api/strategic')
          .then(r => r.json())
          .then(data => {
            strategicRef.current = data
            data.forEach(loc => addStrategicPin(viewer, loc))
          })
      } else {
        locs.forEach(loc => addStrategicPin(viewer, loc))
      }
    }
  }, [layer])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed() || !flyTo) return
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(flyTo.lon, flyTo.lat, 2000000),
      duration: 2,
    })
  }, [flyTo])

  const handleSearch = (e) => {
    if (e.key !== 'Enter' || !search.trim()) return
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data?.[0]) {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(parseFloat(data[0].lon), parseFloat(data[0].lat), 800000),
            duration: 2,
          })
          setSearch('')
        }
      }).catch(console.error)
  }

  const tagColor = (inc) => SEV_COLORS[inc.type === 'earthquake' ? 'earthquake' : inc.severity] || SEV_COLORS.monitor
  const LAYER_TABS = ['Globe', 'Aircraft', 'Naval', 'Weather', 'INTEL']

  return (
    <div className="panel" style={{ position: 'relative' }}>
      {/* Toolbar */}
      <div className="panel-header" style={{ gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {LAYER_TABS.map(l => (
            <button
              key={l}
              onClick={() => setLayer(l)}
              style={{
                fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 600,
                padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                letterSpacing: 1, textTransform: 'uppercase',
                color: layer === l ? 'var(--blue)' : 'var(--text-dim)',
                background: layer === l ? 'rgba(10,132,255,0.12)' : 'transparent',
                border: layer === l ? '1px solid rgba(10,132,255,0.3)' : '1px solid var(--border)',
                transition: 'all var(--t-fast)',
              }}
            >{l}</button>
          ))}
          {/* Heat toggle */}
          <button
            onClick={() => setShowHeat(h => !h)}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 600,
              padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
              letterSpacing: 1, textTransform: 'uppercase',
              color: showHeat ? 'var(--critical)' : 'var(--text-dim)',
              background: showHeat ? 'rgba(255,45,85,0.12)' : 'transparent',
              border: showHeat ? '1px solid rgba(255,45,85,0.4)' : '1px solid var(--border)',
              transition: 'all var(--t-fast)',
            }}
          >HEAT</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search location…"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--border)',
              borderRadius: 5, color: 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)', fontSize: 9,
              padding: '4px 8px', width: 130, outline: 'none',
              transition: 'border-color var(--t-fast)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--border-glow)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color: 'var(--blue)' }}>
            {incidents.length} plotted
          </span>
        </div>
      </div>

      {/* Map layers */}
      {layer === 'Naval' ? (
        <iframe src="https://www.marinetraffic.com/en/ais/embed/maptype:0/shownames:1/mmsi:0/shipid:0/fleet:0/fleet_id:0/vtypes:0/showmenu:0/remember:0"
          style={{ flex: 1, border: 'none', minHeight: 0 }} title="Ship Tracker" />
      ) : layer === 'Aircraft' ? (
        <iframe src="https://globe.adsbexchange.com/" style={{ flex: 1, border: 'none', minHeight: 0 }} title="Flight Tracker" />
      ) : layer === 'Weather' ? (
        <iframe src="https://embed.windy.com/embed2.html?lat=20&lon=10&zoom=3&level=surface&overlay=wind&menu=&message=&marker=&forecast=12&detailLat=20&detailLon=10&detail=&metricWind=default&metricTemp=default&radarRange=-1"
          style={{ flex: 1, border: 'none', minHeight: 0 }} title="Weather" />
      ) : (
        <div
          ref={mountRef}
          style={{ flex: 1, minHeight: 0, position: 'relative' }}
          onClick={e => { if (e.target === mountRef.current) setPopup(null) }}
        />
      )}

      {/* Click popup */}
      {popup && (
        <div style={{
          position: 'absolute',
          left: Math.min(popup.x + 14, 400),
          top: Math.max(popup.y - 90, 50),
          background: 'var(--bg-panel)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          borderLeft: `3px solid ${tagColor(popup.inc)}`,
          borderRadius: 8,
          padding: '10px 14px',
          zIndex: 100,
          maxWidth: 260,
          pointerEvents: 'none',
          boxShadow: 'var(--shadow-panel)',
          animation: 'fadeSlideIn 0.15s var(--ease-snap)',
        }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
            color: tagColor(popup.inc), letterSpacing: 1.5,
            textTransform: 'uppercase', marginBottom: 6,
          }}>
            {popup.inc.type === 'earthquake'
              ? 'SEISMIC M' + Number(popup.inc.mag || 0).toFixed(1)
              : (popup.inc.severity || '').toUpperCase()}
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 6 }}>
            {popup.inc.title}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>
            {Number(popup.inc.lat).toFixed(3)}, {Number(popup.inc.lon).toFixed(3)}
          </div>
          {popup.inc.url && (
            <a href={popup.inc.url} target="_blank" rel="noreferrer"
              style={{
                fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 600,
                color: 'var(--blue)', display: 'block', marginTop: 6,
                pointerEvents: 'all', textDecoration: 'none', letterSpacing: 0.5,
              }}
            >View Source →</a>
          )}
        </div>
      )}

      {/* Legend */}
      {layer === 'Globe' && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 10,
          background: 'rgba(6,9,15,0.82)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '8px 10px', borderRadius: 7,
          border: '1px solid var(--glass-border)',
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          {[
            ['Critical',  SEV_COLORS.critical],
            ['Elevated',  SEV_COLORS.elevated],
            ['Monitor',   SEV_COLORS.monitor],
            ['Seismic',   SEV_COLORS.earthquake],
            ['Aircraft',  '#ff6b35'],
          ].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}88` }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: 0.5 }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
