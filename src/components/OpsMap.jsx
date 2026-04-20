import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwYTM2ODY2ZC1mNGU0LTQ0Y2UtOGQzMy1jZDBhZDVlZWEzNDYiLCJpZCI6NDIwODMzLCJpYXQiOjE3NzY3MDE5OTl9.D9dOYKG61iRG5BwALqpZVsB0niDdsNVd6hFGRzBy1YY'

const SEV_COLORS = {
  critical:   '#e24b4a',
  elevated:   '#ef9f27',
  monitor:    '#378add',
  earthquake: '#b077dd',
}

export default function GlobeMap({ incidents, aircraft, flyTo }) {
  const mountRef   = useRef(null)
  const viewerRef  = useRef(null)
  const handlerRef = useRef(null)
  const heatmapRef = useRef(null)
  const [layer, setLayer]   = useState('Globe')
  const [popup, setPopup]   = useState(null)
  const [showHeat, setShowHeat] = useState(false)
  const [search, setSearch] = useState('')

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
    })

    // Disable default click-to-fly behavior
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
    viewer.trackedEntity = undefined

    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#020408')
    viewer.scene.globe.enableLighting = false
    viewer.scene.globe.showGroundAtmosphere = true
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a0d12')

    // Dark imagery filter
    viewer.imageryLayers.get(0).brightness = 0.6
    viewer.imageryLayers.get(0).contrast = 1.2
    viewer.imageryLayers.get(0).saturation = 0.5
    viewer.imageryLayers.get(0).hue = 0.55

    // Add OpenStreetMap labels overlay
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

    // Click handler — show custom popup, no fly
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



  // Render aircraft on globe
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    // Remove old aircraft
    const toRemove = viewer.entities.values.filter(e => e.id && String(e.id).startsWith('ac-'))
    toRemove.forEach(e => viewer.entities.remove(e))

    if (!aircraft || !aircraft.length) return

    aircraft.forEach((ac, i) => {
      const isMil = ac.type === 'military'
      viewer.entities.add({
        id: 'ac-' + (ac.icao || i),
        position: Cesium.Cartesian3.fromDegrees(ac.lon, ac.lat, (ac.altitude || 10000)),
        point: {
          pixelSize: isMil ? 7 : 4,
          color: isMil
            ? Cesium.Color.fromCssColorString('#ff6b35')
            : Cesium.Color.fromCssColorString('#378add').withAlpha(0.6),
          outlineColor: isMil
            ? Cesium.Color.fromCssColorString('#ff6b35').withAlpha(0.3)
            : Cesium.Color.fromCssColorString('#378add').withAlpha(0.2),
          outlineWidth: 3,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 1e7, 0.3),
        },
        name: ac.callsign || 'Unknown',
        description:
          '<div style="background:#0d1117;color:#c8cfd8;font-family:Courier New,monospace;padding:10px;border-radius:4px;border-left:3px solid ' + (isMil ? '#ff6b35' : '#378add') + '">' +
          '<b style="color:' + (isMil ? '#ff6b35' : '#378add') + '">' + (isMil ? 'MILITARY' : 'CIVIL') + '</b><br/>' +
          'Callsign: ' + (ac.callsign || 'N/A') + '<br/>' +
          'Alt: ' + Math.round((ac.altitude || 0) / 0.3048).toLocaleString() + ' ft<br/>' +
          'Speed: ' + Math.round((ac.velocity || 0) * 1.944) + ' kts<br/>' +
          'Heading: ' + (ac.heading || 0) + '°' +
          '</div>',
      })
    })
  }, [aircraft])


  // Heatmap overlay
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    // Remove old heatmap
    if (heatmapRef.current) {
      viewer.dataSources.remove(heatmapRef.current)
      heatmapRef.current = null
    }

    if (!showHeat || !incidents.length) return

    // Build grid — 20x10 degree cells
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
          hierarchy: Cesium.Cartesian3.fromDegreesArray([
            gx, gy, gx+30, gy, gx+30, gy+15, gx, gy+15
          ]),
          material: new Cesium.ColorMaterialProperty(
            new Cesium.Color(r/255, g/255, b/255, 0.75)
          ),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          classificationType: Cesium.ClassificationType.TERRAIN,
        }
      })
    })

    viewer.dataSources.add(ds)
    heatmapRef.current = ds

  }, [incidents, showHeat])

  // Fly to location when intel feed item clicked
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

    // Simple geocode using Nominatim (free, no key)
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data && data[0]) {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
              parseFloat(data[0].lon),
              parseFloat(data[0].lat),
              800000
            ),
            duration: 2,
          })
          setSearch('')
        }
      }).catch(console.error)
  }

  const tabs = ['Globe', 'Aircraft', 'Naval', 'Weather', 'HEAT']

  const tagColor = (inc) => SEV_COLORS[inc.type === 'earthquake' ? 'earthquake' : inc.severity] || SEV_COLORS.monitor

  return (
    <div className="panel" style={{ position: 'relative' }}>
      <div className="panel-header">
        <div style={{ display: 'flex', gap: 8 }}>
          {tabs.map((l) => (
            <span key={l} onClick={() => l === 'HEAT' ? setShowHeat(h => !h) : setLayer(l)} style={{
              fontSize: 9, padding: '2px 7px', borderRadius: 2, cursor: 'pointer',
              color: l === 'HEAT' ? (showHeat ? '#e24b4a' : '#5a3a3a') : (layer === l ? '#378add' : '#2a3a4a'),
              border: l === 'HEAT' ? (showHeat ? '1px solid #a32d2d' : '1px solid #3a2020') : (layer === l ? '1px solid #1e3a55' : '1px solid transparent'),
              background: l === 'HEAT' ? (showHeat ? '#1a0808' : 'transparent') : (layer === l ? '#0a1825' : 'transparent'),
            }}>{l}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search location..."
            style={{
              background: '#060809', border: '1px solid #1e2530', borderRadius: 3,
              color: '#c8cfd8', fontSize: 9, padding: '2px 6px', width: 120,
              outline: 'none', fontFamily: 'Courier New'
            }}
          />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            onClick={() => setShowHeat(h => !h)}
            style={{
              fontSize: 8, padding: '2px 7px', borderRadius: 2, cursor: 'pointer',
              color: showHeat ? '#e24b4a' : '#2a3a4a',
              border: showHeat ? '1px solid #a32d2d' : '1px solid #1e2530',
              background: showHeat ? '#1a0808' : 'transparent',
              letterSpacing: '0.5px',
            }}>
            HEATMAP
          </span>
          <span style={{ fontSize: 9, color: '#378add' }}>{incidents.length} PLOTTED</span>
        </div>
        </div>
      </div>

      {layer === 'Naval' ? (
        <iframe src="https://www.marinetraffic.com/en/ais/embed/maptype:0/shownames:1/mmsi:0/shipid:0/fleet:0/fleet_id:0/vtypes:0/showmenu:0/remember:0" style={{ flex: 1, border: 'none', minHeight: 0 }} title="Ship Tracker" />
      ) : layer === 'Aircraft' ? (
        <iframe src="https://globe.adsbexchange.com/" style={{ flex: 1, border: 'none', minHeight: 0 }} title="Flight Tracker" />
      ) : layer === 'Weather' ? (
        <iframe src="https://embed.windy.com/embed2.html?lat=20&lon=10&zoom=3&level=surface&overlay=wind&menu=&message=&marker=&forecast=12&detailLat=20&detailLon=10&detail=&metricWind=default&metricTemp=default&radarRange=-1" style={{ flex: 1, border: 'none', minHeight: 0 }} title="Weather" />
      ) : (
        <div ref={mountRef} style={{ flex: 1, minHeight: 0, position: 'relative' }} onClick={e => { if (e.target === mountRef.current) setPopup(null) }} />
      )}

      {popup && (
        <div style={{
          position: 'absolute',
          left: Math.min(popup.x + 12, 400),
          top: Math.max(popup.y - 80, 50),
          background: '#0d1117',
          border: '1px solid #1e2530',
          borderLeft: '3px solid ' + tagColor(popup.inc),
          borderRadius: 4,
          padding: '10px 12px',
          zIndex: 100,
          maxWidth: 240,
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 10, color: tagColor(popup.inc), fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 }}>
            {popup.inc.type === 'earthquake' ? 'SEISMIC M' + Number(popup.inc.mag || 0).toFixed(1) : (popup.inc.severity || '').toUpperCase()}
          </div>
          <div style={{ fontSize: 10, color: '#c8cfd8', lineHeight: 1.5, marginBottom: 6 }}>
            {popup.inc.title}
          </div>
          <div style={{ fontSize: 9, color: '#3a5060' }}>
            {Number(popup.inc.lat).toFixed(3)}, {Number(popup.inc.lon).toFixed(3)}
          </div>
          {popup.inc.url && (
            <a href={popup.inc.url} target="_blank" rel="noreferrer"
              style={{ fontSize: 9, color: '#378add', display: 'block', marginTop: 5, pointerEvents: 'all' }}>
              View Source
            </a>
          )}
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 10, left: 10, zIndex: 10,
        background: '#0d111799', padding: '6px 8px', borderRadius: 3,
        border: '1px solid #1e2530',
        display: layer === 'Globe' ? 'flex' : 'none',
        flexDirection: 'column', gap: 4
      }}>
        {[['critical','#e24b4a'],['elevated','#ef9f27'],['monitor','#378add'],['seismic','#b077dd'],['aircraft','#ff6b35']].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 8, color: '#3a4a58', textTransform: 'uppercase' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
