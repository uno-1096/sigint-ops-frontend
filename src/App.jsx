import { useEffect, useState, useRef } from 'react'
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
    if (s >= 80) return '#ff2d55'
    if (s >= 60) return '#ff9f0a'
    if (s >= 40) return '#30d158'
    return '#0a84ff'
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

  if (mobile) {
    const alertColor = getScoreColor(score)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-root)', overflow: 'hidden', fontFamily: 'var(--font-sans)' }}>

        {/* Mobile header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-panel)',
          backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
          borderBottom: '1px solid var(--glass-border)',
          padding: '10px 16px', flexShrink: 0,
          boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? 'var(--moderate)' : 'var(--critical)',
              boxShadow: connected ? '0 0 8px rgba(48,209,88,0.6)' : '0 0 8px rgba(255,45,85,0.6)',
              animation: 'pulseScale 2s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 3 }}>
              SIGINT OPS
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
              padding: '3px 10px', borderRadius: 5,
              color: alertColor, background: alertColor + '18',
              border: `1px solid ${alertColor}45`,
            }}>
              {getAlertLabel(score)}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: alertColor }}>
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
              <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid var(--border)' }}>
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
            <div style={{ height: '100%', overflowY: 'auto', padding: 10 }}>
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
          background: 'var(--bg-panel)',
          backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
          borderTop: '1px solid var(--glass-border)',
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
                  fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 600,
                  letterSpacing: 1, marginTop: 3,
                  color: isActive ? alertColor : 'var(--text-dim)',
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

  return (
    <div className="ops-root">
      <Header score={score} activeInc={activeInc} sourcesOnline={sourcesOnline} connected={connected} lastUpdate={lastUpdate} />
      {!mobile && <TimelinePanel score={score} />}
      {!mobile && <PredictionPanel score={score} />}
      {!mobile && <BriefPanel brief={brief} briefUpdated={briefUpdated} score={score} />}
      {!mobile && <AlertSystem feedItems={feedItems} />}
      {!mobile && <CountryProfile feedItems={feedItems} incidents={incidents} onFlyTo={setFlyTo} />}
      {!mobile && <WatchList />}
      <div className="ops-body">
        <CinemaPanel />
        <GlobeMap incidents={incidents} aircraft={aircraft} flyTo={flyTo} />
        <IntelFeed items={feedItems} incidents={incidents} onFlyTo={setFlyTo} onSatellite={setSatelliteInc} onSave={(item) => { const saved = JSON.parse(localStorage.getItem('sigint-watchlist') || '[]'); localStorage.setItem('sigint-watchlist', JSON.stringify([{...item, id: Date.now(), savedAt: new Date().toISOString()}, ...saved].slice(0,50))) }} />
      </div>
      {satelliteInc && <SatellitePanel incident={satelliteInc} onClose={() => setSatelliteInc(null)} />}
      <BottomBar score={score} activeInc={activeInc} sourcesOnline={sourcesOnline} feedItems={feedItems} brief={brief} />
    </div>
  )
}
