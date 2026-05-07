import { useState, useEffect } from 'react'

export default function ThemeToggle({ onTheme }) {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('sigint-theme')
    if (saved === 'light') { setDark(false); onTheme(false) }
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    onTheme(next)
    localStorage.setItem('sigint-theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 600,
        letterSpacing: 1, textTransform: 'uppercase',
        padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
        color: dark ? 'var(--text-secondary)' : 'var(--amber)',
        background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,159,10,0.1)',
        border: dark ? '1px solid var(--border)' : '1px solid rgba(255,159,10,0.35)',
        transition: 'all var(--t-mid) var(--ease-smooth)',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hi)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = dark ? 'var(--border)' : 'rgba(255,159,10,0.35)'}
    >
      {dark ? '☀' : '☾'} {dark ? 'Light' : 'Dark'}
    </button>
  )
}
