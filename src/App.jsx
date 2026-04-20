import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import GlobeMap from './components/OpsMap'
import IntelFeed from './components/IntelFeed'
import CinemaPanel from './components/CinemaPanel'
import Header from './components/Header'
import BottomBar from './components/BottomBar'
import './App.css'

const API = 'https://ops.unocloud.us'

export default function App() {
  const [incidents, setIncidents]   = useState([])
  const [feedItems, setFeedItems]   = useState([])
  const [score, setScore]           = useState(0)
  const [activeInc, setActiveInc]   = useState(0)
  const [sourcesOnline, setSourcesOnline] = useState(0)
  const [connected, setConnected]   = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    // Initial REST fetch
    fetch(`${API}/api/score`)
      .then(r => r.json())
      .then(d => {
        setScore(d.score)
        setActiveInc(d.active_incidents)
        setSourcesOnline(d.sources_online)
      }).catch(console.error)

    fetch(`${API}/api/feed`)
      .then(r => r.json())
      .then(setFeedItems)
      .catch(console.error)

    fetch(`${API}/api/incidents`)
      .then(r => r.json())
      .then(setIncidents)
      .catch(console.error)

    fetch(`${API}/api/earthquakes`)
      .then(r => r.json())
      .then(d => setIncidents(prev => [...prev, ...d]))
      .catch(console.error)

    // WebSocket for live updates
    const socket = io(API, { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('state_update', (data) => {
      if (data.feed_items)       setFeedItems(data.feed_items)
      if (data.escalation_score !== undefined) setScore(data.escalation_score)
      if (data.active_incidents !== undefined) setActiveInc(data.active_incidents)
      if (data.incidents)  setIncidents([...data.incidents, ...(data.earthquakes || [])])
      setLastUpdate(new Date())
    })

    return () => socket.disconnect()
  }, [])

  return (
    <div className="ops-root">
      <Header
        score={score}
        activeInc={activeInc}
        sourcesOnline={sourcesOnline}
        connected={connected}
        lastUpdate={lastUpdate}
      />
      <div className="ops-body">
        <CinemaPanel />
        <GlobeMap incidents={incidents} />
        <IntelFeed items={feedItems} />
      </div>
      <BottomBar score={score} activeInc={activeInc} sourcesOnline={sourcesOnline} />
    </div>
  )
}
