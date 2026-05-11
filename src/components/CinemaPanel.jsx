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

function ModeBtn({ label, active, onClick }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        fontFamily: 'var(--font-data)',
        fontSize: 7, fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '2px 7px', borderRadius: 3,
        cursor: 'pointer',
        color:       active ? 'var(--bronze)'    : 'var(--ivory-3)',
        background:  active ? 'rgba(168,118,58,0.12)' : 'transparent',
        border:      active ? '1px solid rgba(168,118,58,0.4)' : '1px solid var(--seam)',
        transform:   pressed ? 'scale(0.93)' : 'scale(1)',
        boxShadow:   pressed ? 'var(--shadow-btn-active)' : active ? 'var(--shadow-btn-rest)' : 'none',
        transition:  'color var(--t-fast), background var(--t-fast), border-color var(--t-fast), transform var(--t-fast), box-shadow var(--t-fast)',
      }}
    >
      {label}
    </button>
  )
}

function StreamTile({ stream, active, onSelect, onFullscreen }) {
  const [hov,     setHov]     = useState(false)
  const [pressed, setPressed] = useState(false)

  return (
    <div
      onClick={() => onSelect(stream)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background:    active ? `${stream.color}14` : hov ? 'var(--bg-2)' : 'rgba(0,0,0,0.25)',
        border:        `1px solid ${active ? stream.color + '55' : hov ? 'rgba(168,118,58,0.25)' : 'var(--seam)'}`,
        borderRadius:  5,
        padding:       '5px 8px',
        cursor:        'pointer',
        display:       'flex',
        alignItems:    'center',
        gap:           8,
        transform:     pressed ? 'scale(0.97)' : 'scale(1)',
        boxShadow:     pressed ? 'var(--shadow-btn-active)' : 'none',
        transition:    'background var(--t-fast), border-color var(--t-fast), transform var(--t-fast), box-shadow var(--t-fast)',
        userSelect:    'none',
      }}
    >
      <div style={{
        width: 28, height: 18, borderRadius: 3, flexShrink: 0,
        background: active ? stream.color + '22' : 'rgba(0,0,0,0.4)',
        border: `1px solid ${stream.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-data)', fontSize: 6, fontWeight: 500,
        color: active ? stream.color : 'var(--ivory-3)',
        letterSpacing: '0.05em',
      }}>
        {stream.abbr}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: active ? 500 : 400,
          color: active ? 'var(--ivory)' : 'var(--ivory-3)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {stream.name}
        </div>
        <div style={{
          fontFamily: 'var(--font-data)', fontSize: 7,
          letterSpacing: '0.08em',
          color: 'var(--ivory-3)', marginTop: 1,
        }}>
          {TYPE_LABEL[stream.type]}
        </div>
      </div>

      {active && (
        <div
          onClick={e => { e.stopPropagation(); onFullscreen(stream) }}
          title="Fullscreen"
          style={{
            fontSize: 9, color: 'var(--ivory-3)', cursor: 'pointer',
            padding: '2px 4px', borderRadius: 3,
            background: 'rgba(255,255,255,0.06)',
          }}
        >⛶</div>
      )}
    </div>
  )
}

export default function CinemaPanel() {
  const [pinned,     setPinned]     = useState([STREAMS[0], STREAMS[1]])
  const [gridMode,   setGridMode]   = useState('dual')
  const [fullscreen, setFullscreen] = useState(null)
  const [activeType, setActiveType] = useState('all')
  const [closePressed, setClosePressed] = useState(false)

  const addToGrid = (stream) => {
    if (pinned.find(s => s.name === stream.name)) {
      setPinned(prev => prev.filter(s => s.name !== stream.name))
      return
    }
    const max = gridMode === 'single' ? 1 : gridMode === 'dual' ? 2 : 4
    setPinned(prev => prev.length >= max ? [...prev.slice(1), stream] : [...prev, stream])
  }

  const filteredStreams = activeType === 'all' ? STREAMS : STREAMS.filter(s => s.type === activeType)
  const gridMax  = gridMode === 'single' ? 1 : gridMode === 'dual' ? 2 : 4
  const gridCols = gridMode === 'quad' ? 2 : 1
  const gridRows = gridMode === 'quad' ? 2 : gridMode === 'dual' ? 2 : 1
  const gridH    = gridMode === 'quad' ? '52%' : gridMode === 'dual' ? '58%' : '42%'

  return (
    <div className="panel" style={{ background: 'var(--bg-1)', border: '1px solid var(--seam)', position: 'relative' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 12px',
        borderBottom: '1px solid var(--seam)',
        background: 'var(--bg-0)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'var(--font-data)',
          fontSize: 9, fontWeight: 500, letterSpacing: '0.2em',
          color: 'var(--ivory-3)', textTransform: 'uppercase',
        }}>
          Cinema
        </span>
        <div style={{ display: 'flex', gap: 3 }}>
          {['single', 'dual', 'quad'].map(m => (
            <ModeBtn key={m} label={m} active={gridMode === m} onClick={() => setGridMode(m)} />
          ))}
        </div>
      </div>

      {/* ── Video grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridTemplateRows:    `repeat(${gridRows}, 1fr)`,
        gap: 3, padding: '5px 5px 0', flexShrink: 0, height: gridH,
      }}>
        {pinned.slice(0, gridMax).map((stream, i) => (
          <div key={i} style={{
            background: '#000', borderRadius: 5, overflow: 'hidden',
            border: `1px solid ${stream.color}30`, position: 'relative',
          }}>
            {stream.type === 'atc' ? (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%', gap: 8,
                background: 'rgba(0,0,0,0.6)',
              }}>
                <div style={{ fontSize: 22, opacity: 0.5 }}>🎙</div>
                <div style={{
                  fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 500,
                  letterSpacing: '0.1em',
                  color: stream.color,
                }}>
                  {stream.name}
                </div>
                <a
                  href={stream.url} target="_blank" rel="noreferrer"
                  style={{
                    fontFamily: 'var(--font-data)', fontSize: 8, fontWeight: 500,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    textDecoration: 'none',
                    color: 'var(--t1)',
                    border: '1px solid rgba(74,158,106,0.4)',
                    background: 'rgba(74,158,106,0.1)',
                    borderRadius: 3, padding: '3px 10px',
                  }}
                >
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
              fontFamily: 'var(--font-data)', fontSize: 7, fontWeight: 500,
              letterSpacing: '0.08em',
              color: stream.color, background: 'rgba(0,0,0,0.75)',
              padding: '2px 5px', borderRadius: 3,
            }}>
              {stream.abbr}
            </div>
            <div
              onClick={() => setFullscreen(stream)}
              style={{
                position: 'absolute', top: 5, right: 5,
                fontSize: 11, color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
                background: 'rgba(0,0,0,0.75)', padding: '2px 5px', borderRadius: 3,
                transition: 'color var(--t-fast)',
              }}
            >⛶</div>
          </div>
        ))}
      </div>

      {/* ── Type filter ── */}
      <div style={{
        display: 'flex', gap: 3, padding: '5px 5px 0',
        flexShrink: 0, borderTop: '1px solid var(--seam)',
      }}>
        {['all', 'news', 'webcam', 'atc'].map(t => (
          <ModeBtn key={t} label={t} active={activeType === t} onClick={() => setActiveType(t)} />
        ))}
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'var(--font-data)', fontSize: 8,
          color: 'var(--ivory-3)', alignSelf: 'center',
        }}>
          {pinned.length}/{gridMax}
        </span>
      </div>

      {/* ── Stream selector ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '5px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
      }}>
        {filteredStreams.map((s, i) => (
          <StreamTile key={i} stream={s} active={!!pinned.find(p => p.name === s.name)} onSelect={addToGrid} onFullscreen={setFullscreen} />
        ))}
      </div>

      {/* ── Footer hint ── */}
      <div style={{
        padding: '4px 10px',
        borderTop: '1px solid var(--seam)',
        fontFamily: 'var(--font-data)', fontSize: 7,
        letterSpacing: '0.1em',
        color: 'var(--ivory-3)',
        flexShrink: 0,
      }}>
        CLICK TO PIN · SINGLE / DUAL / QUAD
      </div>

      {/* ── Fullscreen overlay ── */}
      {fullscreen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#000', zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          animation: 'fadeSlideIn 0.2s var(--ease-spring)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 20px',
            background: 'var(--bg-1)',
            borderBottom: '1px solid var(--seam)',
          }}>
            <span style={{
              fontFamily: 'var(--font-data)',
              fontSize: 13, fontWeight: 500,
              letterSpacing: '0.18em',
              color: fullscreen.color,
            }}>
              {fullscreen.abbr} — {fullscreen.name}
            </span>
            <button
              onClick={() => setFullscreen(null)}
              onMouseDown={() => setClosePressed(true)}
              onMouseUp={() => setClosePressed(false)}
              onMouseLeave={() => setClosePressed(false)}
              style={{
                background:  'rgba(196,75,42,0.12)',
                border:      '1px solid rgba(196,75,42,0.35)',
                color:       'var(--t7)',
                borderRadius: 4,
                padding:     '4px 14px',
                cursor:      'pointer',
                fontFamily:  'var(--font-data)',
                fontSize:    11, fontWeight: 500,
                letterSpacing: '0.1em',
                transform:   closePressed ? 'scale(0.95)' : 'scale(1)',
                boxShadow:   closePressed ? 'var(--shadow-btn-active)' : 'var(--shadow-btn-rest)',
                transition:  'transform var(--t-fast), box-shadow var(--t-fast)',
              }}
            >
              ✕ CLOSE
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {fullscreen.type === 'news' ? (
              <video autoPlay muted playsInline
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                ref={el => {
                  if (!el) return
                  if (Hls.isSupported()) { const hls = new Hls(); hls.loadSource(fullscreen.url); hls.attachMedia(el) }
                }}
              />
            ) : fullscreen.type === 'webcam' ? (
              <iframe src={fullscreen.url} style={{ width: '100%', height: '100%', border: 'none' }} title={fullscreen.name} />
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%', gap: 20,
              }}>
                <div style={{ fontSize: 64, opacity: 0.35 }}>🎙</div>
                <div style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: 18, fontWeight: 300,
                  letterSpacing: '0.2em',
                  color: 'var(--bronze)',
                }}>
                  {fullscreen.name} ATC
                </div>
                <a
                  href={fullscreen.url} target="_blank" rel="noreferrer"
                  style={{
                    fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 500,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    textDecoration: 'none',
                    color: 'var(--t1)',
                    border: '1px solid rgba(74,158,106,0.4)',
                    background: 'rgba(74,158,106,0.1)',
                    borderRadius: 4, padding: '8px 24px',
                    boxShadow: 'var(--shadow-btn-rest)',
                  }}
                >
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
