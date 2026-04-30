import { useState } from 'react'

const API = 'https://ops.unocloud.us'

export default function SatellitePanel({ incident, onClose }) {
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [error, setError] = useState(null)

  const fetchSatellite = async () => {
    if (!incident?.lat || !incident?.lon) {
      setError('No coordinates available for this incident')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const imgUrl = `${API}/api/satellite?lat=${incident.lat}&lon=${incident.lon}`
      setImageUrl(imgUrl)
    } catch (e) {
      setError('Failed to fetch satellite imagery')
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 80, right: 20, width: 340,
      background: '#0d1117', border: '1px solid #1e2530',
      borderRadius: 4, zIndex: 999, fontFamily: 'Courier New'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #1a2030' }}>
        <span style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 1.5, fontWeight: 'bold' }}>SATELLITE IMAGERY</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 7, color: '#2a3545' }}>Sentinel-2 · Copernicus</span>
          <span onClick={onClose} style={{ fontSize: 12, color: '#e24b4a', cursor: 'pointer' }}>✕</span>
        </div>
      </div>

      <div style={{ padding: '8px 12px' }}>
        <div style={{ fontSize: 8, color: '#8a9aaa', marginBottom: 6 }}>
          {incident?.title?.slice(0, 60)}...
        </div>
        <div style={{ fontSize: 8, color: '#2a3545', marginBottom: 8 }}>
          📍 {incident?.lat?.toFixed(3)}, {incident?.lon?.toFixed(3)}
        </div>

        {!imageUrl && !loading && (
          <button onClick={fetchSatellite} style={{
            width: '100%', padding: '6px', background: '#0a1825',
            border: '1px solid #1e3a55', borderRadius: 3,
            color: '#378add', fontSize: 9, cursor: 'pointer',
            letterSpacing: 1, fontFamily: 'Courier New'
          }}>
            🛰 FETCH SATELLITE IMAGERY
          </button>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 20, fontSize: 9, color: '#378add' }}>
            Fetching Sentinel-2 imagery...
          </div>
        )}

        {error && (
          <div style={{ fontSize: 8, color: '#e24b4a', padding: '6px 0' }}>{error}</div>
        )}

        {imageUrl && (
          <div>
            <img src={imageUrl} alt="Satellite" style={{
              width: '100%', borderRadius: 3, border: '1px solid #1e2530'
            }} />
            <div style={{ fontSize: 7, color: '#2a3545', marginTop: 4, textAlign: 'right' }}>
              Sentinel-2 · Jan-Apr 2026 · Max cloud 20%
            </div>
            <button onClick={() => { setImageUrl(null); fetchSatellite() }} style={{
              marginTop: 4, width: '100%', padding: '4px',
              background: 'transparent', border: '1px solid #1e2530',
              borderRadius: 3, color: '#2a3545', fontSize: 8,
              cursor: 'pointer', fontFamily: 'Courier New'
            }}>
              🔄 REFRESH
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
