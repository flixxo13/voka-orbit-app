import { useState, useEffect } from 'react'
import { ladeEinstellungen } from './einstellungen'
import { aktiviereNotifications } from './firebase'
import { ladeAlleKarten } from './vokabeln'
import { sindFaellig } from './fsrs'

import Onboarding from './components/Onboarding'
import LernenTab from './tabs/LernenTab'
import NeuTab from './tabs/NeuTab'
import EntdeckenTab from './tabs/EntdeckenTab'
import EinstellungenTab from './tabs/EinstellungenTab'

const TABS = [
  { id: 'lernen',       label: 'Lernen',     icon: '🧠' },
  { id: 'neu',          label: 'Neu',        icon: '➕' },
  { id: 'entdecken',    label: 'Entdecken',  icon: '📚' },
  { id: 'einstellungen',label: 'Einst.',     icon: '⚙️' },
]

export default function App() {
  const [einstellungen, setEinstellungen] = useState(null)
  const [aktuellerTab, setAktuellerTab] = useState('lernen')
  const [notifAktiv, setNotifAktiv] = useState(false)
  const [statistik, setStatistik] = useState({ gesamt: 0, faellig: 0, gelernt: 0 })
  const [faelligAnzahl, setFaelligAnzahl] = useState(0)
  const [laden, setLaden] = useState(true)

  const [deepLinkVokabel, setDeepLinkVokabel] = useState(null)

  // App initialisieren
  useEffect(() => {
    async function init() {
      const einst = await ladeEinstellungen()
      setEinstellungen(einst)
      setNotifAktiv(Notification.permission === 'granted')

      // Deep Link aus Notification: ?vokabel=en_a1_042&richtung=en_de
      const params = new URLSearchParams(window.location.search)
      const vokabelId = params.get('vokabel')
      const richtung  = params.get('richtung')
      if (vokabelId) {
        setDeepLinkVokabel({ id: vokabelId, richtung: richtung ?? 'en_de' })
        setAktuellerTab('lernen')
        // URL aufräumen ohne Reload
        window.history.replaceState({}, '', window.location.pathname)
      }

      setLaden(false)
    }
    init()
  }, [])

  // Statistik laden wenn Einstellungen bereit
  useEffect(() => {
    if (!einstellungen?.onboardingAbgeschlossen) return
    ladeStatistik()
  }, [einstellungen?.aktiveListen, einstellungen?.lernrichtung])

  async function ladeStatistik() {
    try {
      const { alleKarten, lernkarten } = await ladeAlleKarten(
        einstellungen.aktiveListen ?? ['en_a1'],
        einstellungen.lernrichtung ?? 'smart'
      )
      const faellig = sindFaellig(lernkarten, einstellungen.lernrichtung ?? 'smart')
      const gelernt = alleKarten.filter(k =>
        k.profil_en_de?.wiederholungen > 0 ||
        k.profil_de_en?.wiederholungen > 0 ||
        k.profil_abwechselnd?.wiederholungen > 0
      ).length

      setStatistik({
        gesamt: alleKarten.length,
        faellig: faellig.length,
        gelernt,
      })
      setFaelligAnzahl(faellig.length)
    } catch (err) {
      console.error('Statistik-Fehler:', err)
    }
  }

  async function handleNotifAktivieren() {
    const token = await aktiviereNotifications()
    if (token) setNotifAktiv(true)
  }

  function handleEinstellungenAktualisieren(neu) {
    setEinstellungen(neu)
  }

  // Onboarding abschließen
  function handleOnboardingAbschluss(ersteEinst) {
    setEinstellungen(prev => ({
      ...prev,
      ...ersteEinst,
      onboardingAbgeschlossen: true,
    }))
  }

  // Ladescreen
  if (laden) {
    return (
      <div style={styles.ladeScreen}>
        <div style={styles.ladeInhalt}>
          <div style={styles.ladeLogo}>🚀</div>
          <p style={styles.ladeName}>VokaOrbit</p>
          <div style={styles.ladeSpinner} />
        </div>
        <style>{spinnerCSS}</style>
      </div>
    )
  }

  // Onboarding
  if (!einstellungen?.onboardingAbgeschlossen) {
    return (
      <>
        <Onboarding onAbschluss={handleOnboardingAbschluss} />
        <style>{spinnerCSS}</style>
      </>
    )
  }

  // Hauptapp
  return (
    <div style={styles.app}>
      <style>{spinnerCSS}</style>

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerInhalt}>
          <div>
            <h1 style={styles.headerTitel}>🚀 VokaOrbit</h1>
            <p style={styles.headerUntertitel}>
              {faelligAnzahl > 0
                ? `${faelligAnzahl} ${faelligAnzahl === 1 ? 'Karte' : 'Karten'} fällig`
                : 'Alles auf dem neuesten Stand ✓'}
            </p>
          </div>
          {faelligAnzahl > 0 && (
            <div style={styles.faelligBadge}>
              {faelligAnzahl}
            </div>
          )}
        </div>
      </header>

      {/* ── Tab-Inhalt ── */}
      <main style={styles.main}>
        {aktuellerTab === 'lernen' && (
          <LernenTab
              deepLinkVokabel={deepLinkVokabel}
            einstellungen={einstellungen}
            onSessionEnde={ladeStatistik}
          />
        )}
        {aktuellerTab === 'neu' && (
          <NeuTab />
        )}
        {aktuellerTab === 'entdecken' && (
          <EntdeckenTab
            einstellungen={einstellungen}
            setEinstellungen={handleEinstellungenAktualisieren}
          />
        )}
        {aktuellerTab === 'einstellungen' && (
          <EinstellungenTab
            einstellungen={einstellungen}
            setEinstellungen={handleEinstellungenAktualisieren}
            notifAktiv={notifAktiv}
            handleNotifAktivieren={handleNotifAktivieren}
            statistik={statistik}
          />
        )}
      </main>

      {/* ── Bottom Navigation ── */}
      <nav style={styles.nav}>
        {TABS.map(tab => {
          const aktiv = aktuellerTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                setAktuellerTab(tab.id)
                if (tab.id === 'lernen') ladeStatistik()
              }}
              style={{
                ...styles.navBtn,
                color: aktiv ? '#7c3aed' : '#94a3b8',
              }}
            >
              <span style={{
                ...styles.navIcon,
                filter: aktiv ? 'none' : 'grayscale(1) opacity(0.5)',
                transform: aktiv ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.15s ease',
              }}>
                {tab.icon}
              </span>
              <span style={{
                ...styles.navLabel,
                fontWeight: aktiv ? 700 : 500,
                color: aktiv ? '#7c3aed' : '#94a3b8',
              }}>
                {tab.label}
              </span>
              {/* Aktiv-Linie */}
              {aktiv && <div style={styles.navAktivLinie} />}
              {/* Fällig-Punkt beim Lernen-Tab */}
              {tab.id === 'lernen' && faelligAnzahl > 0 && !aktiv && (
                <div style={styles.navPunkt} />
              )}
            </button>
          )
        })}
      </nav>

    </div>
  )
}

// ─── CSS für Spinner-Animation ──────────────────────────────
const spinnerCSS = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  * { -webkit-tap-highlight-color: transparent; }
  input:focus {
    border-color: #7c3aed !important;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
  }
  button:active { transform: scale(0.97); }
`

// ─── Styles ────────────────────────────────────────────────
const styles = {
  // Ladescreen
  ladeScreen: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #0f0c29, #302b63)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  ladeInhalt: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 12,
  },
  ladeLogo: { fontSize: '3rem' },
  ladeName: {
    color: 'white', fontWeight: 800,
    fontSize: '1.5rem', margin: 0, letterSpacing: '-0.02em',
  },
  ladeSpinner: {
    width: 32, height: 32, borderRadius: '50%',
    border: '3px solid rgba(167,139,250,0.2)',
    borderTop: '3px solid #a78bfa',
    animation: 'spin 0.8s linear infinite',
    marginTop: 8,
  },

  // App-Container
  app: {
    maxWidth: 480, margin: '0 auto',
    minHeight: '100vh',
    background: '#f1f5f9',
    display: 'flex', flexDirection: 'column',
    fontFamily: "'system-ui', '-apple-system', sans-serif",
    position: 'relative',
  },

  // Header
  header: {
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    padding: '1rem 1.25rem 0.9rem',
    flexShrink: 0,
  },
  headerInhalt: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitel: {
    margin: 0, fontSize: '1.25rem', fontWeight: 800,
    color: 'white', letterSpacing: '-0.02em',
  },
  headerUntertitel: {
    margin: '2px 0 0', fontSize: '0.78rem',
    color: 'rgba(255,255,255,0.65)', fontWeight: 500,
  },
  faelligBadge: {
    background: '#fbbf24', color: '#1e293b',
    borderRadius: '50%', width: 30, height: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.85rem', fontWeight: 800,
    boxShadow: '0 2px 8px rgba(251,191,36,0.4)',
  },

  // Main
  main: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: 80, // Platz für Bottom Nav
  },

  // Bottom Navigation
  nav: {
    position: 'fixed', bottom: 0, left: '50%',
    transform: 'translateX(-50%)',
    width: '100%', maxWidth: 480,
    background: 'white',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
    zIndex: 100,
  },
  navBtn: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '10px 4px 12px',
    background: 'none', border: 'none',
    cursor: 'pointer', position: 'relative',
    gap: 3,
  },
  navIcon: { fontSize: '1.3rem', display: 'block' },
  navLabel: {
    fontSize: '0.65rem', display: 'block',
    letterSpacing: '0.01em',
  },
  navAktivLinie: {
    position: 'absolute', bottom: 0, left: '20%', right: '20%',
    height: 3, borderRadius: '3px 3px 0 0',
    background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
  },
  navPunkt: {
    position: 'absolute', top: 8, right: '24%',
    width: 7, height: 7, borderRadius: '50%',
    background: '#f97316',
    boxShadow: '0 0 0 2px white',
  },
}
