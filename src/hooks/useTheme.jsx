// ============================================================
// VokaOrbit — src/hooks/useTheme.jsx
// Globaler Theme-Context: Light (Orbit Day) / Dark (Space Night)
// - Liest System-Präferenz (prefers-color-scheme)
// - Speichert Wahl in localStorage
// - Stellt colors, isDark, toggleTheme überall bereit
// ============================================================

import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { lightColors, darkColors, tokens } from '../design/tokens'

const ThemeContext = createContext(null)

// ── Provider ──────────────────────────────────────────────────
export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    // 1. Gespeicherte Präferenz
    try {
      const saved = localStorage.getItem('vokaorbit_theme')
      if (saved === 'dark') return true
      if (saved === 'light') return false
    } catch {}
    // 2. System-Präferenz als Fallback
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })

  // System-Präferenz live beobachten (nur wenn keine manuelle Wahl)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const handler = (e) => {
      try {
        const saved = localStorage.getItem('vokaorbit_theme')
        if (!saved) setIsDark(e.matches) // nur wenn Nutzer nicht manuell gewählt hat
      } catch {}
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Theme auf <html> setzen (für CSS falls nötig)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    document.body.style.background = isDark ? darkColors.bg : lightColors.bg
  }, [isDark])

  function toggleTheme() {
    setIsDark(prev => {
      const next = !prev
      try { localStorage.setItem('vokaorbit_theme', next ? 'dark' : 'light') } catch {}
      return next
    })
  }

  function setTheme(dark) {
    setIsDark(dark)
    try { localStorage.setItem('vokaorbit_theme', dark ? 'dark' : 'light') } catch {}
  }

  // colors ist IMMER aktuell — kein stales Reference-Problem
  const colors = useMemo(() => isDark ? darkColors : lightColors, [isDark])

  const value = {
    isDark,
    colors,
    tokens,       // theme-unabhängige Tokens
    toggleTheme,
    setTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme muss innerhalb von ThemeProvider verwendet werden')
  return ctx
}
