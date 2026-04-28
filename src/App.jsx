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
import './App.css'

const API = 'https://ops.unocloud.us'
const isMobile = () => window.innerWidth < 768

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
    if (s >= 80) return '#e24b4a'
    if (s >= 60) return '#ef9f27'
    if (s >= 40) return '#97c459'
    return '#378add'
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
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#080a0d', overflow: 'hidden', fontFamily: 'Courier New' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0d1117', borderBottom: '1px solid #1e2530', padding: '8px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#97c459' : '#e24b4a' }} />
            <span style={{ fontSize: 13, fontWeight: 'bold', color: '#e0e6ed', letterSpacing: 2 }}>SIGINT OPS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 3, background: '#1a0808', color: getScoreColor(score), border: `1px solid ${getScoreColor(score)}55`, fontWeight: 'bold', letterSpacing: 1 }}>
              {getAlertLabel(score)}
            </span>
            <span style={{ fontSize: 18, fontWeight: 'bold', color: getScoreColor(score) }}>{score}</span>
            <ThemeToggle onTheme={setDarkMode} />
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {mobileTab === 'globe' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ height: '50%', flexShrink: 0 }}>
                <MobileMap incidents={incidents} aircraft={aircraft} flyTo={flyTo} />
              </div>
              <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid #1e2530' }}>
                <IntelFeed items={feedItems} incidents={incidents} onFlyTo={(loc) => setFlyTo(loc)} compact={true} />
              </div>
            </div>
          )}

          {mobileTab === 'feed' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <AlertSystem feedItems={feedItems} />
      <CountryProfile feedItems={feedItems} incidents={incidents} onFlyTo={setFlyTo} />
      <WatchList feedItems={feedItems} incidents={incidents} />
              <IntelFeed items={feedItems} incidents={incidents} onFlyTo={handleFlyTo} />
            </div>
          )}

          {mobileTab === 'brief' && (
            <div style={{ height: '100%', overflowY: 'auto', padding: 10 }}>
              <TimelinePanel score={score} />
      <BriefPanel brief={brief} briefUpdated={briefUpdated} score={score} />
            </div>
          )}

          {mobileTab === 'cinema' && (
            <CinemaPanel />
          )}

        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#0d1117', borderTop: '1px solid #1e2530', flexShrink: 0 }}>
          {[
            { id: 'globe',  icon: '🌍', label: 'Globe' },
            { id: 'feed',   icon: '📡', label: 'Feed' },
            { id: 'brief',  icon: '📋', label: 'Brief' },
            { id: 'cinema', icon: '📺', label: 'Cinema' },
          ].map(tab => (
            <div
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '10px 0', cursor: 'pointer',
                borderTop: mobileTab === tab.id ? `2px solid ${getScoreColor(score)}` : '2px solid transparent',
                background: mobileTab === tab.id ? '#0a1020' : 'transparent',
              }}
            >
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              <span style={{ fontSize: 9, letterSpacing: 1, color: mobileTab === tab.id ? getScoreColor(score) : '#3a4a58', marginTop: 2 }}>
                {tab.label}
              </span>
            </div>
          ))}
        </div>

      </div>
    )
  }

  return (
    <div className="ops-root">
      <Header score={score} activeInc={activeInc} sourcesOnline={sourcesOnline} connected={connected} lastUpdate={lastUpdate} />
      <TimelinePanel score={score} />
      <BriefPanel brief={brief} briefUpdated={briefUpdated} score={score} />
      <AlertSystem feedItems={feedItems} />
      <CountryProfile feedItems={feedItems} incidents={incidents} onFlyTo={setFlyTo} />
      <WatchList feedItems={feedItems} incidents={incidents} />
      <div className="ops-body">
        <CinemaPanel />
        <GlobeMap incidents={incidents} aircraft={aircraft} flyTo={flyTo} />
        <IntelFeed items={feedItems} incidents={incidents} onFlyTo={setFlyTo} onSave={(item) => { const saved = JSON.parse(localStorage.getItem('sigint-watchlist') || '[]'); localStorage.setItem('sigint-watchlist', JSON.stringify([{...item, id: Date.now(), savedAt: new Date().toISOString()}, ...saved].slice(0,50))) }} />
      </div>
      <BottomBar score={score} activeInc={activeInc} sourcesOnline={sourcesOnline} feedItems={feedItems} brief={brief} />
    </div>
  )
}
