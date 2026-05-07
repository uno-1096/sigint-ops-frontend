import { useState } from 'react'

const API = 'https://ops.unocloud.us'

export default function SatellitePanel({ incident, onClose }) {
  const [loading, setLoading]   = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [error, setError]       = useState(null)

  const fetchSatellite = async () => {
    if (!incident?.lat || !incident?.lon) { setError('No coordinates available'); return }
    setLoading(true); setError(null)
    try {
      setImageUrl(`${API}/api/satellite?lat=${incident.lat}&lon=${incident.lon}`)
    } catch { setError('Failed to fetch satellite imagery') }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 90, right: 20, width: 340,
      background: 'var(--bg-panel)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      border: '1px solid var(--glass-border)',
      borderRadius: 10, zIndex: 999,
      boxShadow: 'var(--shadow-panel)',
      animation: 'slideInRight 0.25s var(--ease-snap)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Satellite Imagery
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-dim)' }}>Sentinel-2 · Copernicus</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.3)',
            color: 'var(--critical)', borderRadius: 5, padding: '2px 10px',
            cursor: 'pointer', fontSize: 11, fontWeight: 600,
            transition: 'background var(--t-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,45,85,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,45,85,0.1)'}
        >✕</button>
      </div>

      <div style={{ padding: '10px 14px' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.4 }}>
          {incident?.title?.slice(0, 70)}{incident?.title?.length > 70 ? '…' : ''}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', marginBottom: 12 }}>
          ⊕ {incident?.lat?.toFixed(3)}, {incident?.lon?.toFixed(3)}
        </div>

        {!imageUrl && !loading && (
          <button onClick={fetchSatellite} style={{
            width: '100%', padding: '8px', borderRadius: 6,
            background: 'rgba(10,132,255,0.1)',
            border: '1px solid rgba(10,132,255,0.35)',
            color: 'var(--blue)',
            fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600,
            cursor: 'pointer', letterSpacing: 1.5,
            transition: 'background var(--t-fast), border-color var(--t-fast)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(10,132,255,0.18)'; e.currentTarget.style.borderColor = 'var(--blue)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(10,132,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(10,132,255,0.35)' }}
          >
            🛰 FETCH IMAGERY
          </button>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--blue)' }}>
            Fetching Sentinel-2 imagery…
          </div>
        )}

        {error && (
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--critical)', padding: '6px 0' }}>{error}</div>
        )}

        {imageUrl && (
          <>
            <img src={imageUrl} alt="Satellite" style={{ width: '100%', borderRadius: 6, border: '1px solid var(--border)', display: 'block' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-dim)', marginTop: 5, textAlign: 'right' }}>
              Sentinel-2 · Jan–Apr 2026 · Max cloud 20%
            </div>
            <button
              onClick={() => { setImageUrl(null); fetchSatellite() }}
              style={{
                marginTop: 8, width: '100%', padding: '5px',
                background: 'transparent', border: '1px solid var(--border)',
                borderRadius: 5, color: 'var(--text-dim)',
                fontFamily: 'var(--font-sans)', fontSize: 9, cursor: 'pointer',
                transition: 'border-color var(--t-fast), color var(--t-fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hi)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)' }}
            >
              ↺ Refresh
            </button>
          </>
        )}
      </div>
    </div>
  )
}
