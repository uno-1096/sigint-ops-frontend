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

export default function GlobeMap({ incidents, flyTo }) {
  const mountRef   = useRef(null)
  const viewerRef  = useRef(null)
  const handlerRef = useRef(null)
  const [layer, setLayer]   = useState('Globe')
  const [popup, setPopup]   = useState(null)

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

    // Add OpenStreetMap labels overlay
    const labelProvider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png',
      subdomains: ['a','b','c','d'],
      credit: 'CartoDB',
      minimumLevel: 0,
      maximumLevel: 19,
    })
    const labelLayer = viewer.imageryLayers.addImageryProvider(labelProvider)
    labelLayer.alpha = 0.9

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


  // Fly to location when intel feed item clicked
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed() || !flyTo) return
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(flyTo.lon, flyTo.lat, 2000000),
      duration: 2,
    })
  }, [flyTo])

  const tabs = ['Globe', 'Aircraft', 'Naval', 'Weather']

  const tagColor = (inc) => SEV_COLORS[inc.type === 'earthquake' ? 'earthquake' : inc.severity] || SEV_COLORS.monitor

  return (
    <div className="panel" style={{ position: 'relative' }}>
      <div className="panel-header">
        <div style={{ display: 'flex', gap: 8 }}>
          {tabs.map((l) => (
            <span key={l} onClick={() => setLayer(l)} style={{
              fontSize: 9, padding: '2px 7px', borderRadius: 2, cursor: 'pointer',
              color: layer === l ? '#378add' : '#2a3a4a',
              border: layer === l ? '1px solid #1e3a55' : '1px solid transparent',
              background: layer === l ? '#0a1825' : 'transparent',
            }}>{l}</span>
          ))}
        </div>
        <span style={{ fontSize: 9, color: '#378add' }}>{incidents.length} PLOTTED</span>
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
        {[['critical','#e24b4a'],['elevated','#ef9f27'],['monitor','#378add'],['seismic','#b077dd']].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 8, color: '#3a4a58', textTransform: 'uppercase' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
