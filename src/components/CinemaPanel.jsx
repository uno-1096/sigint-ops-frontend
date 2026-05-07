import Hls from 'hls.js'
import { useState } from 'react'

const STREAMS = [
  { name: 'DW News',      url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',          color: '#bf5af2', abbr: 'DW',   type: 'news' },
  { name: 'Al Jazeera',   url: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8',                                   color: '#30d158', abbr: 'AJE',  type: 'news' },
  { name: 'France 24',    url: 'https://stream.france24.com/hls/live/2037026/F24_EN_HI_HLS/master.m3u8',               color: '#ff9f0a', abbr: 'F24',  type: 'news' },
  { name: 'NASA TV',      url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',                color: '#0a84ff', abbr: 'NASA', type: 'news' },
  { name: 'Bloomberg',    url: 'https://liveproduseast.akamaized.net/us/Channel-BLOOMBERG-US-SHD/master.m3u8',         color: '#ff2d55', abbr: 'BLG',  type: 'news' },
  { name: 'Times Square', url: 'https://www.earthcam.com/usa/newyork/timessquare/?cam=tsrobo1',                        color: '#32ade6', abbr: 'NYC',  type: 'webcam' },
  { name: 'Dubai Marina', url: 'https://www.earthcam.com/uae/dubai/dubaimarina/?cam=dubaimarina',                      color: '#bf5af2', abbr: 'DXB',  type: 'webcam' },
  { name: 'Tokyo Live',   url: 'https://www.earthcam.com/japan/tokyo/?cam=tokyo',                                     color: '#ff9f0a', abbr: 'TKY',  type: 'webcam' },
  { name: 'JFK Tower',    url: 'https://www.liveatc.net/play/kjfk_app.pls',                                           color: '#30d158', abbr: 'JFK',  type: 'atc' },
  { name: 'LAX Tower',    url: 'https://www.liveatc.net/play/klax_gnd.pls',                                           color: '#0a84ff', abbr: 'LAX',  type: 'atc' },
  { name: 'LHR Tower',    url: 'https://www.liveatc.net/play/egll_gnd.pls',                                           color: '#bf5af2', abbr: 'LHR',  type: 'atc' },
]

const TYPE_LABEL = { news: '▶ NEWS', webcam: '◉ CAM', atc: '⊕ ATC' }

function VideoTile({ stream }) {
  return (
    <video
      key={stream.url}
      autoPlay muted playsInline
      style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000', display: 'block' }}
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
  )
}

function StreamTile({ stream, active, onSelect, onFullscreen }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={() => onSelect(stream)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: active ? `${stream.color}14` : 'rgba(0,0,0,0.25)',
        border: `1px solid ${active ? stream.color + '55' : 'var(--border)'}`,
        borderRadius: 5, padding: '5px 8px',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        transition: 'background var(--t-fast), border-color var(--t-fast)',
        ...(hov && !active ? { background: 'var(--bg-hover)', borderColor: 'var(--border-hi)' } : {}),
      }}
    >
      <div style={{
        width: 28, height: 18, borderRadius: 3, flexShrink: 0,
        background: active ? stream.color + '22' : 'rgba(0,0,0,0.4)',
        border: `1px solid ${stream.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 6, fontWeight: 700,
        color: active ? stream.color : 'var(--text-muted)',
        letterSpacing: 0.5,
      }}>{stream.abbr}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 500, color: active ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {stream.name}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-dim)', marginTop: 1 }}>
          {TYPE_LABEL[stream.type]}
        </div>
      </div>

      {active && (
        <div
          onClick={e => { e.stopPropagation(); onFullscreen(stream) }}
          title="Fullscreen"
          style={{ fontSize: 9, color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px', borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}
        >⛶</div>
      )}
    </div>
  )
}

export default function CinemaPanel() {
  const [pinned, setPinned]         = useState([STREAMS[0], STREAMS[1]])
  const [gridMode, setGridMode]     = useState('dual')
  const [fullscreen, setFullscreen] = useState(null)
  const [activeType, setActiveType] = useState('all')

  const addToGrid = (stream) => {
    if (pinned.find(s => s.name === stream.name)) {
      setPinned(prev => prev.filter(s => s.name !== stream.name))
      return
    }
    const max = gridMode === 'single' ? 1 : gridMode === 'dual' ? 2 : 4
    setPinned(prev => prev.length >= max ? [...prev.slice(1), stream] : [...prev, stream])
  }

  const filteredStreams = activeType === 'all' ? STREAMS : STREAMS.filter(s => s.type === activeType)
  const gridMax = gridMode === 'single' ? 1 : gridMode === 'dual' ? 2 : 4
  const gridCols = gridMode === 'quad' ? 2 : 1
  const gridRows = gridMode === 'quad' ? 2 : gridMode === 'dual' ? 2 : 1
  const gridH = gridMode === 'quad' ? '52%' : gridMode === 'dual' ? '58%' : '42%'

  return (
    <div className="panel" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">Cinema</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {['single', 'dual', 'quad'].map(m => (
            <button key={m} onClick={() => setGridMode(m)} style={{
              fontFamily: 'var(--font-sans)', fontSize: 7, fontWeight: 600,
              padding: '2px 7px', borderRadius: 4, cursor: 'pointer',
              letterSpacing: 1, textTransform: 'uppercase',
              color: gridMode === m ? 'var(--blue)' : 'var(--text-dim)',
              background: gridMode === m ? 'rgba(10,132,255,0.12)' : 'transparent',
              border: gridMode === m ? '1px solid rgba(10,132,255,0.35)' : '1px solid var(--border)',
              transition: 'all var(--t-fast)',
            }}>{m}</button>
          ))}
        </div>
      </div>

      {/* Video grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridTemplateRows: `repeat(${gridRows}, 1fr)`,
        gap: 3, padding: '5px 5px 0', flexShrink: 0, height: gridH,
      }}>
        {pinned.slice(0, gridMax).map((stream, i) => (
          <div key={i} style={{
            background: '#000', borderRadius: 5, overflow: 'hidden',
            border: `1px solid ${stream.color}30`, position: 'relative',
          }}>
            {stream.type === 'atc' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, background: 'rgba(0,0,0,0.6)' }}>
                <div style={{ fontSize: 22, opacity: 0.6 }}>🎙</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 500, color: stream.color }}>{stream.name}</div>
                <a href={stream.url} target="_blank" rel="noreferrer" className="btn" style={{ color: 'var(--green)', borderColor: 'rgba(48,209,88,0.4)', background: 'rgba(48,209,88,0.08)', textDecoration: 'none' }}>
                  Open Audio
                </a>
              </div>
            ) : stream.type === 'webcam' ? (
              <iframe src={stream.url} style={{ width: '100%', height: '100%', border: 'none' }} title={stream.name} />
            ) : (
              <VideoTile stream={stream} />
            )}
            <div style={{
              position: 'absolute', top: 5, left: 5,
              fontFamily: 'var(--font-mono)', fontSize: 7, fontWeight: 700,
              color: stream.color, background: 'rgba(0,0,0,0.7)',
              padding: '2px 5px', borderRadius: 3, letterSpacing: 0.5,
            }}>{stream.abbr}</div>
            <div onClick={() => setFullscreen(stream)} style={{
              position: 'absolute', top: 5, right: 5,
              fontSize: 11, color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              background: 'rgba(0,0,0,0.7)', padding: '2px 5px', borderRadius: 3,
              transition: 'color var(--t-fast)',
            }}>⛶</div>
          </div>
        ))}
      </div>

      {/* Type filter */}
      <div style={{ display: 'flex', gap: 3, padding: '5px 5px 0', flexShrink: 0, borderTop: '1px solid var(--border)' }}>
        {['all', 'news', 'webcam', 'atc'].map(t => (
          <button key={t} onClick={() => setActiveType(t)} style={{
            fontFamily: 'var(--font-sans)', fontSize: 7, fontWeight: 600,
            padding: '2px 7px', borderRadius: 4, cursor: 'pointer',
            letterSpacing: 1, textTransform: 'uppercase',
            color: activeType === t ? 'var(--blue)' : 'var(--text-dim)',
            background: activeType === t ? 'rgba(10,132,255,0.12)' : 'transparent',
            border: activeType === t ? '1px solid rgba(10,132,255,0.3)' : '1px solid transparent',
            transition: 'all var(--t-fast)',
          }}>{t}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', alignSelf: 'center' }}>
          {pinned.length}/{gridMax}
        </span>
      </div>

      {/* Stream selector */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '5px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {filteredStreams.map((s, i) => (
          <StreamTile key={i} stream={s} active={!!pinned.find(p => p.name === s.name)} onSelect={addToGrid} onFullscreen={setFullscreen} />
        ))}
      </div>

      <div style={{ padding: '4px 10px', borderTop: '1px solid var(--border)', fontFamily: 'var(--font-sans)', fontSize: 7, color: 'var(--text-dim)', flexShrink: 0, letterSpacing: 1 }}>
        CLICK TO PIN · SINGLE / DUAL / QUAD
      </div>

      {/* Fullscreen */}
      {fullscreen && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column', animation: 'fadeSlideIn 0.2s var(--ease-snap)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: fullscreen.color, letterSpacing: 2 }}>
              {fullscreen.abbr} — {fullscreen.name}
            </span>
            <button onClick={() => setFullscreen(null)} style={{
              background: 'rgba(255,45,85,0.12)', border: '1px solid rgba(255,45,85,0.35)',
              color: 'var(--critical)', borderRadius: 6, padding: '4px 14px',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
            }}>✕ Close</button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {fullscreen.type === 'news' ? (
              <video autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                ref={el => {
                  if (!el) return
                  if (Hls.isSupported()) { const hls = new Hls(); hls.loadSource(fullscreen.url); hls.attachMedia(el) }
                }} />
            ) : fullscreen.type === 'webcam' ? (
              <iframe src={fullscreen.url} style={{ width: '100%', height: '100%', border: 'none' }} title={fullscreen.name} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
                <div style={{ fontSize: 64, opacity: 0.4 }}>🎙</div>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue)', fontSize: 18, letterSpacing: 2 }}>{fullscreen.name} ATC</div>
                <a href={fullscreen.url} target="_blank" rel="noreferrer" className="btn" style={{ fontSize: 13, padding: '10px 28px', textDecoration: 'none' }}>
                  Open Audio Stream
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
