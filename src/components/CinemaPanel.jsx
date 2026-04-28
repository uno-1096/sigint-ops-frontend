import Hls from 'hls.js'
import { useState } from 'react'

const STREAMS = [
  { name: 'DW News',     url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8', color: '#afa9ec', abbr: 'DW',   type: 'news' },
  { name: 'Al Jazeera',  url: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8',                           color: '#97c459', abbr: 'AJE',  type: 'news' },
  { name: 'France 24',   url: 'https://stream.france24.com/hls/live/2037026/F24_EN_HI_HLS/master.m3u8',      color: '#ef9f27', abbr: 'F24',  type: 'news' },
  { name: 'NASA TV',     url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',        color: '#378add', abbr: 'NASA', type: 'news' },
  { name: 'Bloomberg',   url: 'https://liveproduseast.akamaized.net/us/Channel-BLOOMBERG-US-SHD/master.m3u8', color: '#e24b4a', abbr: 'BLG',  type: 'news' },
  { name: 'Times Square','url': 'https://www.earthcam.com/usa/newyork/timessquare/?cam=tsrobo1',              color: '#5dcaa5', abbr: 'NYC',  type: 'webcam' },
  { name: 'Dubai Marina', url: 'https://www.earthcam.com/uae/dubai/dubaimarina/?cam=dubaimarina',             color: '#b077dd', abbr: 'DXB',  type: 'webcam' },
  { name: 'Tokyo Live',  url: 'https://www.earthcam.com/japan/tokyo/?cam=tokyo',                             color: '#ef9f27', abbr: 'TKY',  type: 'webcam' },
  { name: 'JFK Tower',   url: 'https://www.liveatc.net/play/kjfk_app.pls',                                   color: '#97c459', abbr: 'JFK',  type: 'atc' },
  { name: 'LAX Tower',   url: 'https://www.liveatc.net/play/klax_gnd.pls',                                   color: '#378add', abbr: 'LAX',  type: 'atc' },
  { name: 'LHR Tower',   url: 'https://www.liveatc.net/play/egll_gnd.pls',                                   color: '#afa9ec', abbr: 'LHR',  type: 'atc' },
]

const TYPE_ICONS = { news: '📺', webcam: '📷', atc: '🎙' }

function StreamTile({ stream, active, onSelect, onFullscreen }) {
  return (
    <div
      onClick={() => onSelect(stream)}
      style={{
        background: active ? '#0a1520' : '#060809',
        border: '1px solid ' + (active ? stream.color : '#141a22'),
        borderRadius: 3, padding: '4px 6px',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
        position: 'relative'
      }}
    >
      <div style={{
        width: 22, height: 14, background: '#0a0a0a',
        border: '1px solid ' + stream.color + '55', borderRadius: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 6, color: stream.color, fontWeight: 'bold', flexShrink: 0
      }}>{stream.abbr}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 7, color: active ? '#c8cfd8' : '#3a4a58' }}>{stream.name}</div>
        <div style={{ fontSize: 6, color: '#2a3545' }}>{TYPE_ICONS[stream.type]} {stream.type}</div>
      </div>
      {active && (
        <div
          onClick={e => { e.stopPropagation(); onFullscreen(stream) }}
          style={{ fontSize: 8, color: '#2a3545', cursor: 'pointer', padding: '2px 4px' }}
          title="Fullscreen"
        >⛶</div>
      )}
    </div>
  )
}

export default function CinemaPanel() {
  const [pinned, setPinned]         = useState([STREAMS[0], STREAMS[1]])
  const [gridMode, setGridMode]     = useState('dual')  // single, dual, quad
  const [fullscreen, setFullscreen] = useState(null)
  const [activeType, setActiveType] = useState('all')

  const addToGrid = (stream) => {
    if (pinned.find(s => s.name === stream.name)) {
      setPinned(prev => prev.filter(s => s.name !== stream.name))
      return
    }
    const max = gridMode === 'single' ? 1 : gridMode === 'dual' ? 2 : 4
    if (pinned.length >= max) {
      setPinned(prev => [...prev.slice(1), stream])
    } else {
      setPinned(prev => [...prev, stream])
    }
  }

  const filteredStreams = activeType === 'all'
    ? STREAMS
    : STREAMS.filter(s => s.type === activeType)

  const gridCols = gridMode === 'quad' ? 2 : 1
  const gridRows = gridMode === 'dual' ? 2 : gridMode === 'quad' ? 2 : 1

  return (
    <div className="panel" style={{ position: 'relative' }}>
      <div className="panel-header">
        <span className="panel-title">Cinema</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {['single','dual','quad'].map(m => (
            <span key={m} onClick={() => setGridMode(m)} style={{
              fontSize: 7, padding: '1px 5px', borderRadius: 2, cursor: 'pointer',
              color: gridMode === m ? '#378add' : '#2a3545',
              border: gridMode === m ? '1px solid #1e3a55' : '1px solid #1a2030',
              background: gridMode === m ? '#0a1825' : 'transparent'
            }}>{m.toUpperCase()}</span>
          ))}
        </div>
      </div>

      {/* Stream grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridTemplateRows: `repeat(${gridRows}, 1fr)`,
        gap: 2, padding: '4px 4px 0', flexShrink: 0,
        height: gridMode === 'quad' ? '55%' : gridMode === 'dual' ? '60%' : '45%'
      }}>
        {pinned.slice(0, gridMode === 'single' ? 1 : gridMode === 'dual' ? 2 : 4).map((stream, i) => (
          <div key={i} style={{
            background: '#040608', borderRadius: 2, overflow: 'hidden',
            border: '1px solid #1a2030', position: 'relative'
          }}>
            {stream.type === 'atc' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6 }}>
                <div style={{ fontSize: 18 }}>🎙</div>
                <div style={{ fontSize: 8, color: '#378add' }}>{stream.name}</div>
                <a href={stream.url} target="_blank" rel="noreferrer" style={{
                  fontSize: 8, color: '#97c459', border: '1px solid #3b6d11',
                  padding: '2px 8px', borderRadius: 2, textDecoration: 'none'
                }}>Open Audio</a>
              </div>
            ) : stream.type === 'webcam' ? (
              <iframe
                src={stream.url}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={stream.name}
              />
            ) : (
              <video
                key={stream.url}
                autoPlay muted playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
                ref={el => {
                  if (!el) return
                  if (Hls.isSupported()) {
                    const hls = new Hls({ lowLatencyMode: true })
                    hls.loadSource(stream.url)
                    hls.attachMedia(el)
                  } else {
                    el.src = stream.url
                  }
                }}
              />
            )}
            <div style={{
              position: 'absolute', top: 3, left: 3,
              fontSize: 7, color: stream.color,
              background: '#00000088', padding: '1px 4px', borderRadius: 2
            }}>{stream.abbr}</div>
            <div
              onClick={() => setFullscreen(stream)}
              style={{
                position: 'absolute', top: 3, right: 3,
                fontSize: 10, color: '#ffffff88', cursor: 'pointer',
                background: '#00000088', padding: '1px 4px', borderRadius: 2
              }}
            >⛶</div>
          </div>
        ))}
      </div>

      {/* Type filter tabs */}
      <div style={{ display: 'flex', gap: 3, padding: '4px 4px 0', flexShrink: 0, borderTop: '1px solid #1a2030' }}>
        {['all','news','webcam','atc'].map(t => (
          <span key={t} onClick={() => setActiveType(t)} style={{
            fontSize: 7, padding: '2px 6px', borderRadius: 2, cursor: 'pointer',
            color: activeType === t ? '#378add' : '#2a3545',
            border: activeType === t ? '1px solid #1e3a55' : '1px solid transparent',
            background: activeType === t ? '#0a1825' : 'transparent'
          }}>{t.toUpperCase()}</span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 7, color: '#2a3545' }}>
          {pinned.length}/{gridMode === 'single' ? 1 : gridMode === 'dual' ? 2 : 4} PINNED
        </span>
      </div>

      {/* Stream selector */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: 4,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3
      }}>
        {filteredStreams.map((s, i) => (
          <StreamTile
            key={i}
            stream={s}
            active={!!pinned.find(p => p.name === s.name)}
            onSelect={addToGrid}
            onFullscreen={setFullscreen}
          />
        ))}
      </div>

      <div style={{ padding: '3px 8px', borderTop: '1px solid #1a2030', fontSize: 8, color: '#2a3545', flexShrink: 0 }}>
        CLICK TO PIN · SINGLE/DUAL/QUAD GRID
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000', zIndex: 9999,
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', background: '#0d1117' }}>
            <span style={{ color: fullscreen.color, fontFamily: 'Courier New', fontSize: 12 }}>{fullscreen.name}</span>
            <span onClick={() => setFullscreen(null)} style={{ color: '#e24b4a', cursor: 'pointer', fontSize: 16 }}>✕</span>
          </div>
          <div style={{ flex: 1 }}>
            {fullscreen.type === 'news' ? (
              <video autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                ref={el => {
                  if (!el) return
                  if (Hls.isSupported()) {
                    const hls = new Hls()
                    hls.loadSource(fullscreen.url)
                    hls.attachMedia(el)
                  }
                }}
              />
            ) : fullscreen.type === 'webcam' ? (
              <iframe src={fullscreen.url} style={{ width: '100%', height: '100%', border: 'none' }} title={fullscreen.name} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
                <div style={{ fontSize: 48 }}>🎙</div>
                <div style={{ color: '#378add', fontSize: 16, fontFamily: 'Courier New' }}>{fullscreen.name} ATC</div>
                <a href={fullscreen.url} target="_blank" rel="noreferrer" style={{
                  color: '#97c459', border: '1px solid #3b6d11', padding: '8px 20px',
                  borderRadius: 4, textDecoration: 'none', fontFamily: 'Courier New'
                }}>Open Audio Stream</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
