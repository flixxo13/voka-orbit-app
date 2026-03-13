// ============================================================
// VokaOrbit — src/hooks/useEinstellungen.js
// Globaler Einstellungs-Context. Eliminiert Prop-Drilling komplett.
//
// Verwendung in jedem Tab:
//   const { einstellungen, setEinstellungen } = useEinstellungen()
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ladeEinstellungen, speichereEinstellungen } from '../einstellungen'
import { aktiviereNotifications } from '../firebase'
import { ladeAlleKarten } from '../core/storage'
import { sindFaellig } from '../core/fsrs'

const EinstellungenContext = createContext(null)


// ── Provider ──────────────────────────────────────────────────
export function EinstellungenProvider({ children, onDeepLink }) {
  const [einstellungen, setEinstellungenState] = useState(null)
  const [notifAktiv,    setNotifAktiv]          = useState(false)
  const [statistik,     setStatistik]            = useState({ gesamt: 0, faellig: 0, gelernt: 0 })
  const [faelligAnzahl, setFaelligAnzahl]        = useState(0)
  const [laden,         setLaden]                = useState(true)

  // ── Initialisierung ────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const einst = await ladeEinstellungen()
      setEinstellungenState(einst)
      setNotifAktiv(Notification.permission === 'granted')

      // Deep Link aus Push-Notification: ?vokabel=en_a1_042&richtung=en_de
      const params    = new URLSearchParams(window.location.search)
      const vokabelId = params.get('vokabel')
      const richtung  = params.get('richtung')
      if (vokabelId && onDeepLink) {
        onDeepLink({ id: vokabelId, richtung: richtung ?? 'en_de' })
        window.history.replaceState({}, '', window.location.pathname)
      }

      setLaden(false)
    }
    init()
  }, [])

  // ── Statistik laden ────────────────────────────────────────
  const ladeStatistik = useCallback(async (einst) => {
    const aktuelleEinst = einst ?? einstellungen
    if (!aktuelleEinst?.onboardingAbgeschlossen) return
    try {
      const { alleKarten, lernkarten } = await ladeAlleKarten(
        aktuelleEinst.aktiveListen ?? ['en_a1'],
        aktuelleEinst.lernrichtung ?? 'smart'
      )
      const faellig = sindFaellig(lernkarten, aktuelleEinst.lernrichtung ?? 'smart')
      const gelernt = alleKarten.filter(k =>
        k.profil_en_de?.wiederholungen > 0 ||
        k.profil_de_en?.wiederholungen > 0 ||
        k.profil_abwechselnd?.wiederholungen > 0
      ).length

      setStatistik({ gesamt: alleKarten.length, faellig: faellig.length, gelernt })
      setFaelligAnzahl(faellig.length)
    } catch (err) {
      console.error('Statistik-Fehler:', err)
    }
  }, [einstellungen])

  // Statistik neu laden wenn Listen oder Richtung sich ändern
  useEffect(() => {
    if (einstellungen?.onboardingAbgeschlossen) {
      ladeStatistik(einstellungen)
    }
  }, [einstellungen?.aktiveListen, einstellungen?.lernrichtung])

  // ── Einstellungen aktualisieren (State + Firestore) ────────
  async function setEinstellungen(neu) {
    setEinstellungenState(neu)
    try {
      await speichereEinstellungen(neu)
    } catch (err) {
      console.error('Fehler beim Speichern der Einstellungen:', err)
    }
  }

  // ── Nur State (ohne Firestore-Schreiben) ───────────────────
  // Für optimistische Updates (z.B. Toggle-Switches)
  function setEinstellungenLokal(neu) {
    setEinstellungenState(neu)
  }

  // ── Notifications ──────────────────────────────────────────
  async function handleNotifAktivieren() {
    const token = await aktiviereNotifications()
    if (token) setNotifAktiv(true)
  }

  // ── Onboarding ─────────────────────────────────────────────
  function handleOnboardingAbschluss(ersteEinst) {
    setEinstellungenState(prev => ({
      ...prev,
      ...ersteEinst,
      onboardingAbgeschlossen: true,
    }))
  }

  const value = {
    // State
    einstellungen,
    laden,
    notifAktiv,
    statistik,
    faelligAnzahl,

    // Actions
    setEinstellungen,        // State + Firestore
    setEinstellungenLokal,   // Nur State (optimistisch)
    handleNotifAktivieren,
    handleOnboardingAbschluss,
    ladeStatistik: () => ladeStatistik(einstellungen),
  }

  return (
    <EinstellungenContext.Provider value={value}>
      {children}
    </EinstellungenContext.Provider>
  )
}


// ── Hook ──────────────────────────────────────────────────────
export function useEinstellungen() {
  const ctx = useContext(EinstellungenContext)
  if (!ctx) throw new Error('useEinstellungen muss innerhalb von EinstellungenProvider verwendet werden')
  return ctx
}
