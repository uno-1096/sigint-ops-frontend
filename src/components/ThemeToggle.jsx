import { useState, useEffect } from 'react'

export default function ThemeToggle({ onTheme }) {
  const [dark, setDark] = useState(true)

  const toggle = () => {
    const next = !dark
    setDark(next)
    onTheme(next)
    localStorage.setItem('sigint-theme', next ? 'dark' : 'light')
  }

  useEffect(() => {
    const saved = localStorage.getItem('sigint-theme')
    if (saved === 'light') {
      setDark(false)
      onTheme(false)
    }
  }, [])

  return (
    <div onClick={toggle} style={{
      cursor: 'pointer', fontSize: 9, padding: '2px 8px',
      borderRadius: 3, border: '1px solid #1e2530',
      color: dark ? '#3a4a58' : '#ef9f27',
      background: dark ? 'transparent' : '#1a1208',
      letterSpacing: 1, fontFamily: 'Courier New'
    }}>
      {dark ? '☀ LIGHT' : '☾ DARK'}
    </div>
  )
}
