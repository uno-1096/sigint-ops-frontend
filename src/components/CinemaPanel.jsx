import { useState, useEffect, useRef } from 'react'
import Hls from 'hls.js'

const STREAMS = [
  { name: 'DW News',     url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8', color: '#afa9ec', abbr: 'DW' },
  { name: 'Al Jazeera',  url: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8', color: '#97c459', abbr: 'AJE' },
  { name: 'France 24',   url: 'https://stream.france24.com/hls/live/2037026/F24_EN_HI_HLS/master.m3u8', color: '#ef9f27', abbr: 'F24' },
  { name: 'NASA TV',     url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8', color: '#378add', abbr: 'NASA' },
  { name: 'Euronews',    url: 'https://rakuten-euronews-1-gb.samsung.wurl.tv/manifest/playlist.m3u8', color: '#5dcaa5', abbr: 'EUR' },
  { name: 'Bloomberg',   url: 'https://liveproduseast.akamaized.net/us/Channel-BLOOMBERG-US-SHD/master.m3u8', color: '#e24b4a', abbr: 'BLG' },
]

function HLSPlayer({ url, onError }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let hls
    if (Hls.isSupported()) {
      hls = new Hls({ lowLatencyMode: true, maxLoadingDelay: 4 })
      hls.loadSource(url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}))
      hls.on(Hls.Events.ERROR, (e, data) => { if (data.fatal) onError() })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url
      video.play().catch(() => {})
    }
    return () => { if (hls) hls.destroy() }
  }, [url])

  return (
    <video ref={videoRef} muted autoPlay playsInline
      style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
    />
  )
}

export default function CinemaPanel() {
  const [active, setActive] = useState(0)
  const [errors, setErrors] = useState({})

  const markError = (i) => setErrors(prev => ({ ...prev, [i]: true }))

  useEffect(() => { setErrors({}) }, [active])

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Cinema Feeds</span>
        <span className="panel-badge">{STREAMS.filter((_, i) => !errors[i]).length} LIVE</span>
      </div>

      <div style={{ padding: '5px 5px 0', flexShrink: 0 }}>
        <div style={{
          position: 'relative', paddingBottom: '56.25%',
          background: '#040608', borderRadius: 3, overflow: 'hidden',
          border: '1px solid #1a2030'
        }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            {errors[active] ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                <div style={{ fontSize: 9, color: '#3a4a58' }}>Stream offline</div>
                <a href={STREAMS[active].url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 10, color: '#378add' }}>Open direct</a>
              </div>
            ) : (
              <HLSPlayer key={active} url={STREAMS[active].url} onError={() => markError(active)} />
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, padding: 5, flex: 1 }}>
        {STREAMS.map((s, i) => (
          <div key={i} onClick={() => setActive(i)} style={{
            background: active === i ? '#0a1520' : '#060809',
            border: '1px solid ' + (active === i ? s.color : (errors[i] ? '#2a1a1a' : '#141a22')),
            borderRadius: 3, padding: '5px 6px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            opacity: errors[i] ? 0.4 : 1,
          }}>
            <div style={{
              width: 24, height: 15, background: '#0a0a0a',
              border: '1px solid ' + s.color + '55', borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 7, color: s.color, fontWeight: 'bold', flexShrink: 0
            }}>{s.abbr}</div>
            <div style={{ fontSize: 8, color: active === i ? '#c8cfd8' : '#3a4a58' }}>{s.name}</div>
            {active === i && !errors[i] && <div style={{ marginLeft: 'auto', fontSize: 7, color: '#e24b4a' }}>LIVE</div>}
            {errors[i] && <div style={{ marginLeft: 'auto', fontSize: 7, color: '#3a2020' }}>OFF</div>}
          </div>
        ))}
      </div>

      <div style={{ padding: '4px 8px', borderTop: '1px solid #1a2030', fontSize: 9, color: '#2a3545', flexShrink: 0 }}>
        NOW: {STREAMS[active].name} — MUTED
      </div>
    </div>
  )
}
