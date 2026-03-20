// ============================================================
// VokaOrbit — App.jsx  v2.0
// Shell: ThemeProvider + EinstellungenProvider + Layout.
// Neu: Orbit-Header mit Theme-Toggle, Space-Background,
//      animierte Bottom-Nav, Framer Motion Tab-Transitions.
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { ThemeProvider, useTheme }           from './hooks/useTheme'
import { EinstellungenProvider, useEinstellungen } from './hooks/useEinstellungen'

import Onboarding       from './components/Onboarding'
import LernenTab        from './tabs/LernenTab'
import NeuTab           from './tabs/NeuTab'
import EntdeckenTab     from './tabs/EntdeckenTab'
import EinstellungenTab from './tabs/EinstellungenTab'
import StarField        from './components/StarField'

// ── Tab-Definitionen ──────────────────────────────────────────
const TABS = [
  { id: 'lernen',        label: 'Lernen',    icon: '🧠' },
  { id: 'neu',           label: 'Neu',       icon: '➕' },
  { id: 'entdecken',     label: 'Entdecken', icon: '📚' },
  { id: 'einstellungen', label: 'Einst.',    icon: '⚙️' },
]

// ── Tab-Richtung für Slide-Animation bestimmen ────────────────
const TAB_REIHENFOLGE = ['lernen', 'neu', 'entdecken', 'einstellungen']

function getTabRichtung(vonTab, zuTab) {
  const von = TAB_REIHENFOLGE.indexOf(vonTab)
  const zu  = TAB_REIHENFOLGE.indexOf(zuTab)
  return zu > von ? 1 : -1
}

// ── Root: Provider wrappen ────────────────────────────────────
export default function App() {
  const [aktuellerTab,    setAktuellerTab]    = useState('lernen')
  const [deepLinkVokabel, setDeepLinkVokabel] = useState(null)

  return (
    <ThemeProvider>
      <EinstellungenProvider onDeepLink={setDeepLinkVokabel}>
        <AppInhalt
          aktuellerTab={aktuellerTab}
          setAktuellerTab={setAktuellerTab}
          deepLinkVokabel={deepLinkVokabel}
        />
      </EinstellungenProvider>
    </ThemeProvider>
  )
}

// ── Haupt-UI ──────────────────────────────────────────────────
function AppInhalt({ aktuellerTab, setAktuellerTab, deepLinkVokabel }) {
  const { isDark, colors, tokens, toggleTheme } = useTheme()
  const {
    einstellungen,
    laden,
    faelligAnzahl,
    handleOnboardingAbschluss,
    ladeStatistik,
  } = useEinstellungen()

  const [vorherigerTab, setVorherigerTab] = useState('lernen')

  function handleTabWechsel(tabId) {
    if (tabId === aktuellerTab) return
    setVorherigerTab(aktuellerTab)
    setAktuellerTab(tabId)
    if (tabId === 'lernen') ladeStatistik()
  }

  // ── Ladescreen ─────────────────────────────────────────────
  if (laden) {
    return (
      <div style={{
        minHeight:      '100vh',
        background:     isDark
          ? 'linear-gradient(160deg, #080818 0%, #0D0D1F 100%)'
          : 'linear-gradient(160deg, #C7D9FF 0%, #E8D5FF 100%)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontFamily:     tokens.font.family,
      }}>
        {isDark && <StarField visible />}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: '3.5rem' }}
          >
            🚀
          </motion.div>
          <p style={{
            color:       isDark ? '#fff' : '#1E293B',
            fontWeight:  tokens.font.weight.extrabold,
            fontSize:    '1.5rem',
            margin:       0,
            letterSpacing: tokens.font.tracking.tight,
          }}>
            VokaOrbit
          </p>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
            style={{
              width:        28, height: 28,
              borderRadius: '50%',
              border:       `3px solid ${isDark ? 'rgba(167,139,250,0.2)' : 'rgba(124,58,237,0.2)'}`,
              borderTop:    `3px solid ${isDark ? '#A78BFA' : '#7C3AED'}`,
              marginTop:    4,
            }}
          />
        </motion.div>
      </div>
    )
  }

  // ── Onboarding ─────────────────────────────────────────────
  if (!einstellungen?.onboardingAbgeschlossen) {
    return <Onboarding onAbschluss={handleOnboardingAbschluss} />
  }

  const richtung = getTabRichtung(vorherigerTab, aktuellerTab)

  // ── Hauptapp ────────────────────────────────────────────────
  return (
    <div style={{
      maxWidth:      480,
      margin:        '0 auto',
      minHeight:     '100vh',
      background:    isDark
        ? 'linear-gradient(160deg, #080818 0%, #0D0D1F 100%)'
        : 'linear-gradient(160deg, #C7D9FF 0%, #E8D5FF 100%)',
      display:       'flex',
      flexDirection: 'column',
      fontFamily:    tokens.font.family,
      position:      'relative',
      overflow:      'hidden',
    }}>

      {/* Sterne nur im Dark Mode */}
      <StarField visible={isDark} />

      {/* ── Header ── */}
      <header style={{
        padding:    '0.9rem 1.25rem 0.8rem',
        flexShrink:  0,
        position:   'relative',
        zIndex:      tokens.z.widget,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          {/* Logo + Status */}
          <div>
            <h1 style={{
              margin:        0,
              fontSize:      tokens.font.size.xxl,
              fontWeight:    tokens.font.weight.extrabold,
              color:         isDark ? '#FFFFFF' : '#1E293B',
              letterSpacing: tokens.font.tracking.tight,
              display:       'flex',
              alignItems:    'center',
              gap:            8,
            }}>
              <motion.span
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ display: 'inline-block' }}
              >
                🚀
              </motion.span>
              VokaOrbit
            </h1>
            <p style={{
              margin:      '2px 0 0',
              fontSize:    tokens.font.size.base,
              color:       isDark ? 'rgba(255,255,255,0.5)' : 'rgba(30,41,59,0.55)',
              fontWeight:  tokens.font.weight.medium,
            }}>
              {faelligAnzahl > 0
                ? `${faelligAnzahl} ${faelligAnzahl === 1 ? 'Karte' : 'Karten'} fällig`
                : 'Alles auf dem neuesten Stand ✓'}
            </p>
          </div>

          {/* Rechts: Badge + Theme Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {faelligAnzahl > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{
                  background:     '#FBBF24',
                  color:          '#1E293B',
                  borderRadius:   '50%',
                  width:           30, height: 30,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       '0.82rem',
                  fontWeight:     tokens.font.weight.extrabold,
                  boxShadow:      '0 2px 10px rgba(251,191,36,0.45)',
                }}
              >
                {faelligAnzahl}
              </motion.div>
            )}

            {/* Theme Toggle */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={toggleTheme}
              style={{
                width:        38, height: 38,
                borderRadius: tokens.radius.md,
                background:   isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.08)',
                border:       `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                cursor:       'pointer',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                fontSize:     '1.1rem',
                flexShrink:   0,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={isDark ? 'sun' : 'moon'}
                  initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0,   scale: 1 }}
                  exit={{    opacity: 0, rotate:  30, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'block', lineHeight: 1 }}
                >
                  {isDark ? '☀️' : '🌙'}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── Tab-Inhalt mit Slide-Animation ── */}
      <main style={{
        flex:          1,
        overflowY:     'auto',
        overflowX:     'hidden',
        paddingBottom:  90,
        position:      'relative',
      }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={aktuellerTab}
            initial={{
              opacity: 0,
              x:       richtung * 40,
            }}
            animate={{
              opacity: 1,
              x:       0,
            }}
            exit={{
              opacity: 0,
              x:       richtung * -30,
            }}
            transition={{
              duration: 0.28,
              ease:    [0.23, 1, 0.32, 1],
            }}
            style={{ width: '100%' }}
          >
            {aktuellerTab === 'lernen' && (
              <LernenTab
                deepLinkVokabel={deepLinkVokabel}
                onSessionEnde={ladeStatistik}
              />
            )}
            {aktuellerTab === 'neu'           && <NeuTab />}
            {aktuellerTab === 'entdecken'     && <EntdeckenTab />}
            {aktuellerTab === 'einstellungen' && <EinstellungenTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Bottom Navigation ── */}
      <nav style={{
        position:   'fixed',
        bottom:      0,
        left:       '50%',
        transform:  'translateX(-50%)',
        width:      '100%',
        maxWidth:    480,
        background: isDark
          ? 'rgba(13, 13, 31, 0.92)'
          : 'rgba(255, 255, 255, 0.92)',
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop:  `1px solid ${isDark
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(0,0,0,0.08)'}`,
        display:    'flex',
        boxShadow:  isDark
          ? '0 -4px 24px rgba(0,0,0,0.5)'
          : '0 -4px 20px rgba(0,0,0,0.08)',
        zIndex:     tokens.z.nav,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {TABS.map(tab => {
          const aktiv = aktuellerTab === tab.id
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTabWechsel(tab.id)}
              style={{
                flex:           1,
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                padding:        '10px 4px 12px',
                background:     'none',
                border:         'none',
                cursor:         'pointer',
                position:       'relative',
                gap:             3,
                fontFamily:     'inherit',
              }}
            >
              {/* Aktiv-Indicator oben */}
              <AnimatePresence>
                {aktiv && (
                  <motion.div
                    layoutId="navIndicator"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{   opacity: 0, scaleX: 0 }}
                    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                    style={{
                      position:     'absolute',
                      top:           0,
                      left:         '20%',
                      right:        '20%',
                      height:        3,
                      borderRadius: '0 0 3px 3px',
                      background:   isDark
                        ? 'linear-gradient(90deg, #7C3AED, #06B6D4)'
                        : 'linear-gradient(90deg, #7C3AED, #4F46E5)',
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Icon */}
              <motion.span
                animate={{
                  scale:  aktiv ? 1.18 : 1,
                  filter: aktiv ? 'none' : 'grayscale(1) opacity(0.45)',
                }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                style={{ fontSize: '1.25rem', display: 'block' }}
              >
                {tab.icon}
              </motion.span>

              {/* Label */}
              <motion.span
                animate={{
                  color:      aktiv
                    ? (isDark ? '#A78BFA' : '#7C3AED')
                    : (isDark ? 'rgba(255,255,255,0.35)' : '#94A3B8'),
                  fontWeight: aktiv ? 700 : 500,
                }}
                transition={{ duration: 0.15 }}
                style={{ fontSize: '0.62rem', display: 'block', letterSpacing: '0.01em' }}
              >
                {tab.label}
              </motion.span>

              {/* Fällig-Punkt auf Lernen Tab */}
              {tab.id === 'lernen' && faelligAnzahl > 0 && !aktiv && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position:     'absolute',
                    top:           8,
                    right:        '20%',
                    width:         7,
                    height:        7,
                    borderRadius: '50%',
                    background:   '#F97316',
                    boxShadow:    `0 0 0 2px ${isDark ? 'rgba(13,13,31,0.92)' : 'rgba(255,255,255,0.92)'}`,
                  }}
                />
              )}
            </motion.button>
          )
        })}
      </nav>
    </div>
  )
}
