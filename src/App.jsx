// ============================================================
// VokaOrbit — App.jsx
// Dünne Shell: Layout + Navigation + Tab-Routing.
// Kein Daten-State mehr — alles in EinstellungenProvider.
// ============================================================

import { useState } from 'react'
import { EinstellungenProvider, useEinstellungen } from './hooks/useEinstellungen'
import { spinnerCSS } from './design/globalStyles'
import { tokens } from './design/tokens'

import Onboarding       from './components/Onboarding'
import LernenTab        from './tabs/LernenTab'
import NeuTab           from './tabs/NeuTab'
import EntdeckenTab     from './tabs/EntdeckenTab'
import EinstellungenTab from './tabs/EinstellungenTab'

const TABS = [
  { id: 'lernen',        label: 'Lernen',   icon: '🧠' },
  { id: 'neu',           label: 'Neu',      icon: '➕' },
  { id: 'entdecken',     label: 'Entdecken',icon: '📚' },
  { id: 'einstellungen', label: 'Einst.',   icon: '⚙️' },
]

// ── App-Wurzel: Provider wrappen ──────────────────────────────
export default function App() {
  const [aktuellerTab,   setAktuellerTab]   = useState('lernen')
  const [deepLinkVokabel, setDeepLinkVokabel] = useState(null)

  return (
    <EinstellungenProvider onDeepLink={setDeepLinkVokabel}>
      <AppInhalt
        aktuellerTab={aktuellerTab}
        setAktuellerTab={setAktuellerTab}
        deepLinkVokabel={deepLinkVokabel}
      />
    </EinstellungenProvider>
  )
}

// ── Haupt-UI (hat Zugriff auf Context) ───────────────────────
function AppInhalt({ aktuellerTab, setAktuellerTab, deepLinkVokabel }) {
  const {
    einstellungen,
    laden,
    faelligAnzahl,
    handleOnboardingAbschluss,
    ladeStatistik,
  } = useEinstellungen()

  // ── Ladescreen ────────────────────────────────────────────
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

  // ── Onboarding ────────────────────────────────────────────
  if (!einstellungen?.onboardingAbgeschlossen) {
    return (
      <>
        <Onboarding onAbschluss={handleOnboardingAbschluss} />
        <style>{spinnerCSS}</style>
      </>
    )
  }

  // ── Hauptapp ──────────────────────────────────────────────
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
            <div style={styles.faelligBadge}>{faelligAnzahl}</div>
          )}
        </div>
      </header>

      {/* ── Tab-Inhalt ── */}
      <main style={styles.main}>
        {aktuellerTab === 'lernen' && (
          <LernenTab
            deepLinkVokabel={deepLinkVokabel}
            onSessionEnde={ladeStatistik}
          />
        )}
        {aktuellerTab === 'neu'           && <NeuTab />}
        {aktuellerTab === 'entdecken'     && <EntdeckenTab />}
        {aktuellerTab === 'einstellungen' && <EinstellungenTab />}
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
              style={{ ...styles.navBtn, color: aktiv ? tokens.colors.primary : tokens.colors.textMuted }}
            >
              <span style={{
                ...styles.navIcon,
                filter:    aktiv ? 'none' : 'grayscale(1) opacity(0.5)',
                transform: aktiv ? 'scale(1.15)' : 'scale(1)',
                transition: tokens.transition.default,
              }}>
                {tab.icon}
              </span>
              <span style={{
                ...styles.navLabel,
                fontWeight: aktiv ? 700 : 500,
                color: aktiv ? tokens.colors.primary : tokens.colors.textMuted,
              }}>
                {tab.label}
              </span>
              {aktiv && <div style={styles.navAktivLinie} />}
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

// ── Styles ────────────────────────────────────────────────────
const styles = {
  ladeScreen: {
    minHeight: '100vh',
    background: tokens.colors.gradientSpace,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  ladeInhalt: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 12,
  },
  ladeLogo: { fontSize: '3rem' },
  ladeName: {
    color: 'white', fontWeight: tokens.font.weight.extrabold,
    fontSize: '1.5rem', margin: 0, letterSpacing: tokens.font.tracking.tight,
  },
  ladeSpinner: {
    width: 32, height: 32, borderRadius: '50%',
    border: `3px solid rgba(167,139,250,0.2)`,
    borderTop: `3px solid ${tokens.colors.primaryViolet}`,
    animation: 'spin 0.8s linear infinite',
    marginTop: 8,
  },
  app: {
    maxWidth: 480, margin: '0 auto',
    minHeight: '100vh',
    background: tokens.colors.bg,
    display: 'flex', flexDirection: 'column',
    fontFamily: tokens.font.family,
    position: 'relative',
  },
  header: {
    background: tokens.colors.gradient,
    padding: '1rem 1.25rem 0.9rem',
    flexShrink: 0,
  },
  headerInhalt: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitel: {
    margin: 0, fontSize: tokens.font.size.xxl, fontWeight: tokens.font.weight.extrabold,
    color: 'white', letterSpacing: tokens.font.tracking.tight,
  },
  headerUntertitel: {
    margin: '2px 0 0', fontSize: tokens.font.size.base,
    color: 'rgba(255,255,255,0.65)', fontWeight: tokens.font.weight.medium,
  },
  faelligBadge: {
    background: tokens.colors.badge, color: tokens.colors.textDark,
    borderRadius: '50%', width: 30, height: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.85rem', fontWeight: tokens.font.weight.extrabold,
    boxShadow: tokens.shadow.badge,
  },
  main: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: 80,
  },
  nav: {
    position: 'fixed', bottom: 0, left: '50%',
    transform: 'translateX(-50%)',
    width: '100%', maxWidth: 480,
    background: tokens.colors.surface,
    borderTop: `1px solid ${tokens.colors.border}`,
    display: 'flex',
    boxShadow: tokens.shadow.nav,
    zIndex: tokens.z.nav,
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
  navLabel: { fontSize: '0.65rem', display: 'block', letterSpacing: '0.01em' },
  navAktivLinie: {
    position: 'absolute', bottom: 0, left: '20%', right: '20%',
    height: 3, borderRadius: '3px 3px 0 0',
    background: tokens.colors.gradient,
  },
  navPunkt: {
    position: 'absolute', top: 8, right: '24%',
    width: 7, height: 7, borderRadius: '50%',
    background: tokens.colors.streak,
    boxShadow: `0 0 0 2px ${tokens.colors.surface}`,
  },
}
