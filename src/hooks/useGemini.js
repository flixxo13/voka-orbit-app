// ============================================================
// VokaOrbit — src/hooks/useGemini.js
// Kapselt alle KI-Hint-Logik (Gemini via OpenRouter).
// Extrahiert aus LernenTab.jsx für saubere Trennung.
// ============================================================

import { useState, useRef } from 'react'

export function useGemini(nutzerprofil) {
  const [geminiDaten,    setGeminiDaten]    = useState(null)
  const [geminiLaed,     setGeminiLaed]     = useState(false)
  const [geminiGesperrt, setGeminiGesperrt] = useState(false)  // Score-Cap durch Buchstaben-Hint
  const [geminiError,    setGeminiError]    = useState(null)
  const prefetchRef = useRef(null)

  /**
   * Hints von der API laden (Beispielsatz + Eselsbrücke).
   * Debounced: wird ignoriert wenn bereits geladen oder im Gange.
   */
  async function ladeHints(karte, richtung) {
    if (geminiDaten || geminiLaed) return
    setGeminiLaed(true)
    setGeminiError(null)
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vokabelId:   karte.id,
          wort:        karte.wort,
          uebersetzung: karte.uebersetzung,
          richtung,
          niveau:      nutzerprofil?.niveau   ?? 'B1',
          lernziel:    nutzerprofil?.lernziel ?? 'alltag',
        }),
      })
      const daten = await res.json()
      if (res.ok) {
        setGeminiDaten(daten)
      } else {
        setGeminiError(`${res.status}: ${daten.error ?? 'Unbekannter Fehler'}`)
      }
    } catch (err) {
      setGeminiError(`Netzwerkfehler: ${err.message}`)
    }
    setGeminiLaed(false)
  }

  /**
   * Buchstaben-Hint aktivieren → Score-Cap setzen.
   */
  function aktiviereBuchstabenHint() {
    setGeminiGesperrt(true)
  }

  /**
   * Alle Hint-States zurücksetzen (für nächste Karte).
   */
  function resetHints() {
    setGeminiDaten(null)
    setGeminiLaed(false)
    setGeminiGesperrt(false)
    setGeminiError(null)
    prefetchRef.current = null
  }

  return {
    // State
    geminiDaten,
    geminiLaed,
    geminiGesperrt,
    geminiError,

    // Actions
    ladeHints,
    aktiviereBuchstabenHint,
    resetHints,
  }
}
