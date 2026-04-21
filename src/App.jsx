import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import GlobeMap from './components/OpsMap'
import IntelFeed from './components/IntelFeed'
import CinemaPanel from './components/CinemaPanel'
import Header from './components/Header'
import BottomBar from './components/BottomBar'
import BriefPanel from './components/BriefPanel'
import AlertSystem from './components/AlertSystem'
import './App.css'

const API = 'https://ops.unocloud.us'

const isMobile = () => window.innerWidth < 768

export default function App() {
  const [incidents, setIncidents]     = useState([])
  const [feedItems, setFeedItems]     = useState([])
  const [aircraft, setAircraft]       = useState([])
  const [score, setScore]             = useState(0)
  const [activeInc, setActiveInc]     = useState(0)
  const [sourcesOnline, setSourcesOnline] = useState(0)
  const [connected, setConnected]     = useState(false)
  const [lastUpdate, setLastUpdate]   = useState(null)
  const [flyTo, setFlyTo]             = useState(null)
  const [brief, setBrief]             = useState(null)
  const [briefUpdated, setBriefUpdated] = useState(null)
  const [mobile, setMobile]           = useState(isMobile())
  const [mobileTab, setMobileTab]     = useState('globe')
  const socketRef = useRef(null)

  useEffect(() => {
    const onResize = () => setMobile(isMobile())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    fetch(`${API}/api/score`)
      .then(r => r.json())
      .then(d => { setScore(d.score); setActiveInc(d.active_incidents); setSourcesOnline(d.sources_online) })
      .catch(console.error)
    fetch(`${API}/api/feed`).then(r => r.json()).then(setFeedItems).catch(console.error)
    fetch(`${API}/api/incidents`).then(r => r.json()).then(setIncidents).catch(console.error)
    fetch(`${API}/api/earthquakes`).then(r => r.json()).then(d => setIncidents(prev => [...prev, ...d])).catch(console.error)
    fetch(`${API}/api/aircraft`).then(r => r.json()).then(setAircraft).catch(console.error)
    fetch(`${API}/api/brief`).then(r => r.json()).then(d => { setBrief(d.brief); setBriefUpdated(d.updated) }).catch(console.error)

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
      if (data.brief) { setBrief(data.brief); setBriefUpdated(data.brief_updated) }
      setLastUpdate(new Date())
    })
    return () => socket.disconnect()
  }, [])

  const getScoreColor = (s) => s >= 80 ? '#e24b4a' : s >= 60 ? '#ef9f27' : s >= 40 ? '#97c459' : '#378add'
  const getAlertLabel = (s) => s >= 80 ? 'CRITICAL' : s >= 60 ? 'ELEVATED' : s >= 40 ? 'MODERATE' : 'LOW'

  if (mobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#080a0d', overflow: 'hidden' }}>
        
        {/* Mobile Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#0d1117', borderBottom: '1px solid #1e2530',
          padding: '8px 14px', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#97c459' : '#e24b4a' }} />
            <span style={{ fontSize: 13, fontWeight: 'bold', color: '#e0e6ed', letterSpacing: 2, fontFamily: 'Courier New' }}>SIGINT OPS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 3,
              background: '#1a0808', color: getScoreColor(score),
              border: `1px solid ${getScoreColor(score)}55`,
              fontFamily: 'Courier New', fontWeight: 'bold', letterSpacing: 1
            }}>{getAlertLabel(score)}</span>
            <span style={{ fontSize: 18, fontWeight: 'bold', color: getScoreColor(score), fontFamily: 'Courier New' }}>{score}</span>
          </div>
        </div>

        {/* Mobile Content */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {mobileTab === 'globe' && (
            <GlobeMap incidents={incidents} aircraft={aircraft} flyTo={flyTo} />
          )}
          {mobileTab === 'feed' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <AlertSystem feedItems={feedItems} />
              <IntelFeed items={feedItems} incidents={incidents} onFlyTo={(loc) => { setFlyTo(loc); setMobileTab('globe') }} />
            </div>
          )}
          {mobileTab === 'brief' && (
            <div style={{ height: '100%', overflowY: 'auto', padding: 10 }}>
              <BriefPanel brief={brief} briefUpdated={briefUpdated} score={score} />
            </div>
          )}
          {mobileTab === 'cinema' && (
            <CinemaPanel />
          )}
        </div>

        {/* Mobile Bottom Tab Bar */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          background: '#0d1117', borderTop: '1px solid #1e2530',
          flexShrink: 0
        }}>
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
              <span style={{
                fontSize: 9, fontFamily: 'Courier New', letterSpacing: 1,
                color: mobileTab === tab.id ? getScoreColor(score) : '#3a4a58',
                marginTop: 2
              }}>{tab.label}</span>
            </div>
          ))}
        </div>

      </div>
    )
  }

  // Desktop layout
  return (
    <div className="ops-root">
      <Header score={score} activeInc={activeInc} sourcesOnline={sourcesOnline} connected={connected} lastUpdate={lastUpdate} />
      <BriefPanel brief={brief} briefUpdated={briefUpdated} score={score} />
      <AlertSystem feedItems={feedItems} />
      <div className="ops-body">
        <CinemaPanel />
        <GlobeMap incidents={incidents} aircraft={aircraft} flyTo={flyTo} />
        <IntelFeed items={feedItems} incidents={incidents} onFlyTo={setFlyTo} />
      </div>
      <BottomBar score={score} activeInc={activeInc} sourcesOnline={sourcesOnline} />
    </div>
  )
}
