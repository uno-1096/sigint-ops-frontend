import React, { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import GlobeMap from './components/OpsMap'
import MobileMap from './components/MobileMap'
import IntelFeed from './components/IntelFeed'
import CinemaPanel from './components/CinemaPanel'
import Header from './components/Header'
import BottomBar from './components/BottomBar'
import BriefPanel from './components/BriefPanel'
import AlertSystem from './components/AlertSystem'
import ThemeToggle from './components/ThemeToggle'
import TimelinePanel from './components/TimelinePanel'
import CountryProfile from './components/CountryProfile'
import { exportPDF } from './utils/pdfExport'
import WatchList from './components/WatchList'
import PredictionPanel from './components/PredictionPanel'
import SatellitePanel from './components/SatellitePanel'
import './App.css'

class GlobeErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { crashed: false } }
  static getDerivedStateFromError() { return { crashed: true } }
  render() {
    if (this.state.crashed) {
      return (
        <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--ivory-3)', letterSpacing: '0.2em' }}>
            GLOBE OFFLINE
          </span>
        </div>
      )
    }
    return this.props.children
  }
}

const API = 'https://ops.unocloud.us'
const isMobile = () => window.innerWidth < 1024 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

export default function App() {
  const [incidents, setIncidents]         = useState([])
  const [feedItems, setFeedItems]         = useState([])
  const [aircraft, setAircraft]           = useState([])
  const [score, setScore]                 = useState(0)
  const [activeInc, setActiveInc]         = useState(0)
  const [sourcesOnline, setSourcesOnline] = useState(0)
  const [connected, setConnected]         = useState(false)
  const [lastUpdate, setLastUpdate]       = useState(null)
  const [flyTo, setFlyTo]                 = useState(null)
  const [brief, setBrief]                 = useState(null)
  const [briefUpdated, setBriefUpdated]   = useState(null)
  const [mobile, setMobile]               = useState(isMobile())
  const [mobileTab, setMobileTab]         = useState('globe')
  const [darkMode, setDarkMode]           = useState(true)
  const [satelliteInc, setSatelliteInc]   = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    const onResize = () => setMobile(isMobile())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    fetch(`${API}/api/score`).then(r => r.json()).then(d => {
      setScore(d.score)
      setActiveInc(d.active_incidents)
      setSourcesOnline(d.sources_online)
    }).catch(console.error)

    fetch(`${API}/api/feed`).then(r => r.json()).then(setFeedItems).catch(console.error)
    fetch(`${API}/api/incidents`).then(r => r.json()).then(setIncidents).catch(console.error)
    fetch(`${API}/api/earthquakes`).then(r => r.json()).then(d => setIncidents(prev => [...prev, ...d])).catch(console.error)
    fetch(`${API}/api/aircraft`).then(r => r.json()).then(setAircraft).catch(console.error)
    fetch(`${API}/api/brief`).then(r => r.json()).then(d => {
      setBrief(d.brief)
      setBriefUpdated(d.updated)
    }).catch(console.error)

    const socket = io(API, { transports: ['websocket', 'polling'] })
    socketRef.current = socket
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('state_update', (data) => {
      if (data.feed_items) setFeedItems(data.feed_items)
      if (data.escalation_score !== undefined) setScore(data.escalation_score)
      if (data.active_incidents !== undefined) setActiveInc(data.active_incidents)
      if (data.incidents) setIncidents([...data.incidents, ...(data.earthquakes || [])])
      if (data.aircraft) setAircraft(data.aircraft)
      if (data.brief) {
        setBrief(data.brief)
        setBriefUpdated(data.brief_updated)
      }
      setLastUpdate(new Date())
    })
    return () => socket.disconnect()
  }, [])

  const getScoreColor = (s) => {
    if (s >= 80) return '#C44B2A'
    if (s >= 60) return '#C4842A'
    if (s >= 40) return '#4A8AC4'
    return '#4A9E6A'
  }

  const getAlertLabel = (s) => {
    if (s >= 80) return 'CRITICAL'
    if (s >= 60) return 'ELEVATED'
    if (s >= 40) return 'MODERATE'
    return 'LOW'
  }

  const handleFlyTo = (loc) => {
    setFlyTo(loc)
    setMobileTab('globe')
  }

  /* ── Mobile layout ── */
  if (mobile) {
    const alertColor = getScoreColor(score)
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg-0)',
        overflow: 'hidden',
        fontFamily: 'var(--font-data)',
      }}>

        {/* Mobile header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-1)',
          borderBottom: '1px solid var(--seam)',
          padding: '10px 16px', flexShrink: 0,
          boxShadow: 'var(--shadow-panel)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: connected ? 'var(--pulse)' : 'var(--t7)',
              boxShadow: connected
                ? '0 0 0 2px rgba(61,191,184,0.18), 0 0 8px rgba(61,191,184,0.55)'
                : '0 0 0 2px rgba(196,75,42,0.2), 0 0 8px rgba(196,75,42,0.5)',
              animation: 'pulseScale 2.4s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: 'var(--font-data)',
              fontSize: 14, fontWeight: 500,
              letterSpacing: '0.22em',
              color: 'var(--ivory)',
            }}>
              SIGINT OPS
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 500,
              letterSpacing: '0.14em',
              padding: '3px 10px', borderRadius: 4,
              color: alertColor,
              background: alertColor + '18',
              border: `1px solid ${alertColor}45`,
            }}>
              {getAlertLabel(score)}
            </span>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 24, fontWeight: 300,
              color: alertColor,
            }}>
              {score}
            </span>
            <ThemeToggle onTheme={setDarkMode} />
          </div>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {mobileTab === 'globe' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ height: '52%', flexShrink: 0 }}>
                <MobileMap incidents={incidents} aircraft={aircraft} flyTo={flyTo} />
              </div>
              <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid var(--seam)' }}>
                <IntelFeed items={feedItems} incidents={incidents} onFlyTo={(loc) => setFlyTo(loc)} compact={true} />
              </div>
            </div>
          )}

          {mobileTab === 'feed' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <IntelFeed items={feedItems} incidents={incidents} onFlyTo={handleFlyTo} />
            </div>
          )}

          {mobileTab === 'brief' && (
            <div style={{ height: '100%', overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <BriefPanel brief={brief} briefUpdated={briefUpdated} score={score} />
              <PredictionPanel score={score} />
              <TimelinePanel score={score} />
            </div>
          )}

          {mobileTab === 'cinema' && (
            <CinemaPanel />
          )}
        </div>

        {/* Bottom tab bar */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          background: 'var(--bg-1)',
          borderTop: '1px solid var(--seam)',
          flexShrink: 0,
        }}>
          {[
            { id: 'globe',  icon: '🌍', label: 'Globe' },
            { id: 'feed',   icon: '📡', label: 'Feed' },
            { id: 'brief',  icon: '📋', label: 'Brief' },
            { id: 'cinema', icon: '📺', label: 'Cinema' },
          ].map(tab => {
            const isActive = mobileTab === tab.id
            return (
              <div
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '10px 0', cursor: 'pointer',
                  borderTop: isActive ? `2px solid ${alertColor}` : '2px solid transparent',
                  background: isActive ? alertColor + '0d' : 'transparent',
                  transition: 'background var(--t-mid)',
                }}
              >
                <span style={{ fontSize: 20 }}>{tab.icon}</span>
                <span style={{
                  fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 500,
                  letterSpacing: '0.1em', marginTop: 3,
                  color: isActive ? alertColor : 'var(--ivory-3)',
                  transition: 'color var(--t-mid)',
                }}>
                  {tab.label}
                </span>
              </div>
            )
          })}
        </div>

      </div>
    )
  }

  /* ── Desktop bento layout ── */
  return (
    <div className="ops-root">
      <Header score={score} activeInc={activeInc} sourcesOnline={sourcesOnline} connected={connected} lastUpdate={lastUpdate} />

      <div className="ops-body">

        {/* Left column: Cinema — spans both grid rows */}
        <div style={{ gridArea: 'left', display: 'grid', gridTemplateRows: '1fr', minHeight: 0, minWidth: 0 }}>
          <CinemaPanel />
        </div>

        {/* Globe — top center cell */}
        <div style={{ gridArea: 'globe', display: 'grid', gridTemplateRows: '1fr', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
          <GlobeErrorBoundary>
            <GlobeMap incidents={incidents} aircraft={aircraft} flyTo={flyTo} />
          </GlobeErrorBoundary>
        </div>

        {/* Right column: Intel Feed — spans both grid rows */}
        <div style={{ gridArea: 'right', display: 'flex', flexDirection: 'column', alignSelf: 'stretch', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
          <IntelFeed
            items={feedItems}
            incidents={incidents}
            onFlyTo={setFlyTo}
            onSatellite={setSatelliteInc}
            onSave={(item) => {
              const saved = JSON.parse(localStorage.getItem('sigint-watchlist') || '[]')
              localStorage.setItem('sigint-watchlist', JSON.stringify(
                [{ ...item, id: Date.now(), savedAt: new Date().toISOString() }, ...saved].slice(0, 50)
              ))
            }}
          />
        </div>

        {/* Bench — bottom center: collapse panels side by side */}
        <div style={{
          gridArea: 'bench',
          display: 'flex',
          gap: 5,
          alignItems: 'flex-start',
        }}>
          {[
            <BriefPanel      key="brief"    brief={brief} briefUpdated={briefUpdated} score={score} />,
            <PredictionPanel key="pred"     score={score} />,
            <AlertSystem     key="alert"    feedItems={feedItems} />,
            <TimelinePanel   key="timeline" score={score} />,
            <CountryProfile  key="country"  feedItems={feedItems} incidents={incidents} onFlyTo={setFlyTo} />,
            <WatchList       key="watch" />,
          ].map((panel, i) => (
            <div
              key={panel.key}
              style={{
                flex: 1, minWidth: 140,
                animation: `mountIn var(--t-slow) var(--ease-spring) ${i * 55}ms both`,
              }}
            >
              {panel}
            </div>
          ))}
        </div>

      </div>

      {satelliteInc && <SatellitePanel incident={satelliteInc} onClose={() => setSatelliteInc(null)} />}
      <BottomBar score={score} activeInc={activeInc} sourcesOnline={sourcesOnline} feedItems={feedItems} brief={brief} />
    </div>
  )
}
