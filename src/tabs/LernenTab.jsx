// ============================================================
// VokaOrbit — tabs/LernenTab.jsx  v2.0
// Komplett neu: Orbit Design System, Dark/Light Mode,
// Framer Motion Animationen, OrbitHint, Rocket-FAB,
// Forbidden Zone, Streak/Session Widgets.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { useEinstellungen } from '../hooks/useEinstellungen'
import { useTheme } from '../hooks/useTheme'
import { useGemini } from '../hooks/useGemini'
import { ladeAlleKarten, speichereFortschritt } from '../core/storage'
import { ladeSessionKarten } from '../core/session'
import { berechneNaechsteWiederholung as fsrsBewerten } from '../core/fsrs'
import OrbitHint from '../components/OrbitHint'
import StarField from '../components/StarField'

const FLAGGE = { en: '🇬🇧', de: '🇩🇪' }

// ── Buchstaben-Hint ────────────────────────────────────────────
function zeigeHinweis(wort) {
  const l = wort.length
  const zeige = new Set([0])
  if (l >= 5) zeige.add(Math.floor(l * 0.6))
  if (l >= 8) { zeige.add(Math.floor(l * 0.4)); zeige.add(l - 2) }
  return wort.split('').map((c, i) =>
    c === ' ' ? '\u00a0' : (zeige.has(i) ? c : '_')
  ).join('')
}

// ── localStorage ──────────────────────────────────────────────
function heuteDatumKey() { return 'vokaorbit_neu_' + new Date().toISOString().slice(0, 10) }
function ladeHeuteNeu() {
  try { const g = localStorage.getItem(heuteDatumKey()); return g ? JSON.parse(g) : {} } catch { return {} }
}
function speichereHeuteNeu(ids) {
  try {
    localStorage.setItem(heuteDatumKey(), JSON.stringify(ids))
    Object.keys(localStorage)
      .filter(k => k.startsWith('vokaorbit_neu_') && k !== heuteDatumKey())
      .forEach(k => localStorage.removeItem(k))
  } catch {}
}

// ── Streak Widget ─────────────────────────────────────────────
function StreakWidget({ streak, colors, tokens }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      style={{
        background:   colors.surface,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: tokens.radius.cardLg,
        padding:      '10px 16px',
        display:      'flex',
        alignItems:   'center',
        gap:          10,
        boxShadow:    colors.shadowMd,
        border:       `1px solid ${colors.border}`,
        minWidth:     120,
      }}
    >
      {/* Sparkle Icon */}
      <div style={{
        width:          36, height: 36,
        borderRadius:   tokens.radius.md,
        background:     colors.streak,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '1.1rem',
        flexShrink:     0,
      }}>
        ✦
      </div>
      <div>
        <div style={{
          fontSize:      tokens.font.size.xs,
          fontWeight:    tokens.font.weight.bold,
          color:         colors.textMuted,
          letterSpacing: tokens.font.tracking.caps,
          textTransform: 'uppercase',
          lineHeight:    1,
          marginBottom:  2,
        }}>STREAK</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{
            fontSize:   tokens.font.size.widget,
            fontWeight: tokens.font.weight.black,
            color:      colors.textDark,
            lineHeight: 1,
          }}>{streak}</span>
          <span style={{
            fontSize:   tokens.font.size.md,
            fontWeight: tokens.font.weight.bold,
            color:      colors.textMid,
          }}>Days</span>
        </div>
      </div>
    </motion.div>
  )
}

// ── Session Widget ─────────────────────────────────────────────
function SessionWidget({ aktuell, gesamt, colors, tokens }) {
  const prozent = gesamt > 0 ? Math.round((aktuell / gesamt) * 100) : 0
  const radius  = 16
  const umfang  = 2 * Math.PI * radius
  const offset  = umfang - (prozent / 100) * umfang

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.18, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      style={{
        background:   colors.surface,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: tokens.radius.cardLg,
        padding:      '10px 16px',
        display:      'flex',
        alignItems:   'center',
        gap:          10,
        boxShadow:    colors.shadowMd,
        border:       `1px solid ${colors.border}`,
        minWidth:     130,
      }}
    >
      {/* Arc Progress */}
      <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
        <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx="22" cy="22" r={radius}
            fill="none"
            stroke={colors.border}
            strokeWidth="2.5"
          />
          {/* Progress */}
          <motion.circle cx="22" cy="22" r={radius}
            fill="none"
            stroke={colors.gradientProgress.includes('gradient') ? '#7C3AED' : colors.primary}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={umfang}
            initial={{ strokeDashoffset: umfang }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          />
        </svg>
        <div style={{
          position:   'absolute',
          inset:       0,
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize:   '0.62rem',
          fontWeight: 800,
          color:      colors.textDark,
        }}>
          {prozent}%
        </div>
      </div>

      <div>
        <div style={{
          fontSize:      tokens.font.size.xs,
          fontWeight:    tokens.font.weight.bold,
          color:         colors.textMuted,
          letterSpacing: tokens.font.tracking.caps,
          textTransform: 'uppercase',
          lineHeight:    1,
          marginBottom:  2,
        }}>SESSION</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          <span style={{
            fontSize:   tokens.font.size.widget,
            fontWeight: tokens.font.weight.black,
            color:      colors.textDark,
            lineHeight: 1,
          }}>{aktuell}</span>
          <span style={{
            fontSize:   tokens.font.size.md,
            color:      colors.textMuted,
          }}>/ {gesamt}</span>
          <span style={{
            fontSize:   tokens.font.size.md,
            fontWeight: tokens.font.weight.bold,
            color:      colors.textMid,
          }}>Words</span>
        </div>
      </div>
    </motion.div>
  )
}

// ── Bewertungs-Button ──────────────────────────────────────────
function BewertungsBtn({ wert, emoji, label, farbe, onClick, gesperrt, colors, tokens }) {
  const controls = useAnimation()

  async function handleClick() {
    if (gesperrt) return
    await controls.start({
      scale: [1, 0.88, 1.06, 1],
      transition: { duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }
    })
    onClick(wert)
  }

  return (
    <motion.button
      animate={controls}
      whileTap={gesperrt ? {} : { scale: 0.92 }}
      onClick={handleClick}
      style={{
        flex:         1,
        padding:      '0.75rem 0.3rem',
        background:   gesperrt ? colors.surfaceAlt : colors.surface,
        color:        gesperrt ? colors.textMuted : farbe,
        border:       `2px solid ${gesperrt ? colors.border : farbe}`,
        borderRadius: tokens.radius.xl,
        fontSize:     '0.78rem',
        fontWeight:   tokens.font.weight.bold,
        cursor:       gesperrt ? 'not-allowed' : 'pointer',
        fontFamily:   'inherit',
        lineHeight:   1.35,
        boxShadow:    gesperrt ? 'none' : `0 2px 10px ${farbe}28`,
        opacity:      gesperrt ? 0.45 : 1,
        display:      'flex',
        flexDirection:'column',
        alignItems:   'center',
        gap:          2,
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
      <span>{label}</span>
    </motion.button>
  )
}

// ── Rocket FAB ────────────────────────────────────────────────
function RocketFAB({ onClick, aktiv, thrustersAktiv, colors, tokens, isDark }) {
  const controls = useAnimation()

  useEffect(() => {
    controls.start({
      y: [0, -5, 0, -3, 0],
      transition: {
        duration:   3.5,
        ease:       'easeInOut',
        repeat:     Infinity,
        repeatType: 'loop',
      }
    })
  }, [controls])

  const thrusterFarben = ['#7C3AED', '#06B6D4', '#A78BFA']

  return (
    <div style={{
      position:   'absolute',
      bottom:     24,
      left:       20,
      display:    'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap:        4,
      zIndex:     40,
    }}>
      <motion.button
        animate={controls}
        whileTap={{ scale: 0.9, rotate: -5 }}
        onClick={onClick}
        style={{
          width:        64,
          height:       64,
          borderRadius: tokens.radius.cardLg,
          background:   isDark
            ? 'linear-gradient(135deg, #7C3AED, #4F46E5)'
            : colors.surface,
          border:       isDark
            ? 'none'
            : `1.5px solid ${colors.border}`,
          boxShadow:    isDark
            ? '0 8px 24px rgba(124,58,237,0.45)'
            : '0 4px 20px rgba(0,0,0,0.12)',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          fontSize:     '1.8rem',
          flexShrink:   0,
        }}
      >
        🚀
      </motion.button>

      {/* Thruster Bars wenn aktiv */}
      <AnimatePresence>
        {thrustersAktiv && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            style={{
              display:   'flex',
              gap:        3,
              transformOrigin: 'top',
            }}
          >
            {thrusterFarben.map((farbe, i) => (
              <motion.div
                key={i}
                animate={{
                  height: ['8px', '14px', '6px', '12px', '8px'],
                  opacity: [0.7, 1, 0.6, 0.9, 0.7],
                }}
                transition={{
                  duration:   0.6,
                  repeat:     Infinity,
                  delay:      i * 0.1,
                  ease:       'easeInOut',
                }}
                style={{
                  width:        4,
                  height:       10,
                  borderRadius: 2,
                  background:   farbe,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{
        fontSize:      '0.58rem',
        fontWeight:    700,
        color:         isDark ? 'rgba(255,255,255,0.4)' : colors.textMuted,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        LAUNCH HINT
      </div>
    </div>
  )
}

// ── Forbidden Zone Screen ──────────────────────────────────────
function ForbiddenZone({ wort, onHintZuenden, aktiveOrbits, colors, tokens }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position:     'absolute',
        inset:         0,
        borderRadius: tokens.radius.card3x,
        background:   'linear-gradient(160deg, #4C1D95 0%, #1E1B4B 60%, #0F0A2E 100%)',
        display:      'flex',
        flexDirection:'column',
        alignItems:   'center',
        justifyContent: 'center',
        padding:      '2rem 1.5rem',
        zIndex:        20,
        overflow:     'hidden',
      }}
    >
      {/* Hintergrund Glow */}
      <div style={{
        position:     'absolute',
        top:          '20%',
        left:         '50%',
        transform:    'translateX(-50%)',
        width:        200,
        height:       200,
        borderRadius: '50%',
        background:   'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
        pointerEvents:'none',
      }} />

      <div style={{
        fontSize:      '0.7rem',
        fontWeight:    700,
        color:         'rgba(167,139,250,0.7)',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        marginBottom:  16,
      }}>
        Forbidden Zone
      </div>

      <motion.h2
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        style={{
          fontSize:      'clamp(2.5rem, 12vw, 3.5rem)',
          fontWeight:    900,
          color:         '#FFFFFF',
          margin:        0,
          letterSpacing: '-0.03em',
          textAlign:     'center',
        }}
      >
        {wort}
      </motion.h2>

      {/* Lila Unterstrich */}
      <div style={{
        width:        80,
        height:       2,
        background:   'rgba(167,139,250,0.6)',
        borderRadius: 1,
        margin:       '12px 0 20px',
      }} />

      <p style={{
        fontSize:    '0.88rem',
        color:       'rgba(255,255,255,0.45)',
        fontStyle:   'italic',
        textAlign:   'center',
        margin:      '0 0 32px',
        lineHeight:  1.6,
        maxWidth:    260,
      }}>
        "Hints will orbit around this area but never touch it."
      </p>

      {/* Hint zünden Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onHintZuenden}
        style={{
          background:    'linear-gradient(135deg, #7C3AED, #A78BFA)',
          color:         '#FFFFFF',
          border:        'none',
          borderRadius:  tokens.radius.pill,
          padding:       '1rem 2rem',
          fontSize:      '1rem',
          fontWeight:    800,
          cursor:        'pointer',
          fontFamily:    'inherit',
          boxShadow:     '0 6px 24px rgba(124,58,237,0.5)',
          letterSpacing: '-0.01em',
          width:         '100%',
          maxWidth:      300,
        }}
      >
        🛸 &nbsp;🚀 Hint zünden
      </motion.button>

      {/* Aktive Orbits Counter */}
      <div style={{
        marginTop:     20,
        fontSize:      '0.72rem',
        fontWeight:    700,
        color:         'rgba(255,255,255,0.3)',
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
      }}>
        {aktiveOrbits} Aktive Orbits
      </div>
    </motion.div>
  )
}

// ── Akkordeon Item ─────────────────────────────────────────────
function AkkordeonItem({ icon, label, children, farbe, colors, tokens }) {
  const [offen, setOffen] = useState(false)
  return (
    <div style={{ marginBottom: 8 }}>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setOffen(v => !v)}
        style={{
          width:         '100%',
          display:       'flex',
          alignItems:    'center',
          gap:            10,
          padding:       '0.85rem 1rem',
          background:    offen
            ? (farbe ? `${farbe}18` : colors.primaryBg)
            : colors.surfaceAlt,
          border:        `1.5px solid ${offen ? (farbe ?? colors.primary) : colors.border}`,
          borderRadius:  tokens.radius.xl,
          cursor:        'pointer',
          fontFamily:    'inherit',
          transition:    'all 0.2s ease',
        }}
      >
        <span style={{
          fontSize: '1rem',
          color:    offen ? (farbe ?? colors.primary) : colors.textMuted,
        }}>{icon}</span>
        <span style={{
          flex:          1,
          fontSize:      tokens.font.size.base,
          fontWeight:    700,
          color:         offen ? (farbe ?? colors.primary) : colors.textMid,
          letterSpacing: tokens.font.tracking.caps,
          textTransform: 'uppercase',
          textAlign:     'left',
        }}>{label}</span>
        <motion.span
          animate={{ rotate: offen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            fontSize: '0.8rem',
            color:    offen ? (farbe ?? colors.primary) : colors.textMuted,
          }}
        >
          ▼
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {offen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding:      '0.9rem 1rem',
              background:   colors.surfaceAlt,
              borderRadius: `0 0 ${tokens.radius.xl}px ${tokens.radius.xl}px`,
              border:       `1.5px solid ${colors.border}`,
              borderTop:    'none',
              fontSize:     tokens.font.size.md,
              color:        colors.textMid,
              lineHeight:   1.6,
            }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// Hauptkomponente
// ══════════════════════════════════════════════════════════════
export default function LernenTab({ deepLinkVokabel, onSessionEnde }) {
  const { einstellungen } = useEinstellungen()
  const { isDark, colors, tokens } = useTheme()

  const lernrichtung  = einstellungen?.lernrichtung  ?? 'smart'
  const aktiveListen  = einstellungen?.aktiveListen  ?? ['en_a1']
  const nutzerprofil  = einstellungen?.nutzerprofil  ?? { niveau: 'B1', lernziel: 'alltag' }

  // Session
  const [laden,         setLaden]         = useState(true)
  const [sessionKarten, setSessionKarten] = useState([])
  const [index,         setIndex]         = useState(0)
  const [aufgedeckt,    setAufgedeckt]    = useState(false)
  const [sessionInfo,   setSessionInfo]   = useState({ wiederholungAnzahl: 0, neuAnzahl: 0 })
  const [aktuelleRichtung, setAktuelleRichtung] = useState(null)
  const [karteAnimiert, setKarteAnimiert] = useState(false)

  // Orbit-Hint State
  const [hintSichtbar,   setHintSichtbar]   = useState(false)
  const [hintText,       setHintText]       = useState('')
  const [forbiddenZone,  setForbiddenZone]  = useState(false)
  const [thrustersAktiv, setThrustersAktiv] = useState(false)
  const [aktiveOrbits]                      = useState(3)

  // Post-reveal
  const [satzUebersetzungZeigen, setSatzUebersetzungZeigen] = useState(false)

  // Fake Streak (Sprint 4 kommt später — hier Platzhalter)
  const streak = einstellungen?.streak ?? 0

  const { geminiDaten, geminiLaed, geminiGesperrt, geminiError, ladeHints, aktiviereBuchstabenHint, resetHints } = useGemini(nutzerprofil)
  const aktiveListenKey = JSON.stringify(einstellungen?.aktiveListen ?? ['en_a1'])

  // ── Session laden ────────────────────────────────────────────
  const ladeSession = useCallback(async () => {
    setLaden(true)
    try {
      const heuteNeu   = ladeHeuteNeu()
      const aktListen  = JSON.parse(aktiveListenKey)
      const { alleKarten } = await ladeAlleKarten(aktListen, lernrichtung)
      const { session, wiederholungAnzahl, neuAnzahl } = ladeSessionKarten(alleKarten, einstellungen ?? {}, heuteNeu)

      let finalSession = session
      if (deepLinkVokabel) {
        const idx = session.findIndex(k => k.id === deepLinkVokabel.id)
        if (idx > 0) {
          const k = session[idx]
          finalSession = [k, ...session.filter((_, i) => i !== idx)]
        }
      }

      setSessionKarten(finalSession)
      setSessionInfo({ wiederholungAnzahl, neuAnzahl })
      setIndex(0)
      setAufgedeckt(false)
      resetHints()
      setHintSichtbar(false)
      setForbiddenZone(false)

      if (finalSession.length > 0) {
        setAktuelleRichtung(waehleSofortigeRichtung(finalSession[0], lernrichtung))
      }
    } catch (err) {
      console.error('Fehler beim Laden der Session:', err)
    }
    setLaden(false)
  }, [aktiveListenKey, lernrichtung]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { ladeSession() }, [ladeSession])

  function waehleSofortigeRichtung(karte, richtung) {
    if (richtung === 'abwechselnd') return Math.random() < 0.5 ? 'en_de' : 'de_en'
    return karte.richtung
  }

  // ── Aufdecken ─────────────────────────────────────────────────
  function handleAufdecken() {
    setAufgedeckt(true)
    setHintSichtbar(false)
    const karte = sessionKarten[index]
    if (karte) ladeHints(karte, aktuelleRichtung ?? karte.richtung)
  }

  // ── Rocket / Hint zünden ──────────────────────────────────────
  function handleRocketClick() {
    if (aufgedeckt) return  // Nach Aufdecken kein Hint mehr

    if (geminiGesperrt) {
      // Bereits Buchstaben-Hint genutzt → Forbidden Zone
      setForbiddenZone(true)
      return
    }

    // Buchstaben-Hint als Orbit-Hint anzeigen
    const karte = sessionKarten[index]
    if (!karte) return
    const richtung    = aktuelleRichtung ?? karte.richtung
    const rueckseite  = richtung === 'en_de' ? karte.uebersetzung : karte.wort
    const hinweisText = `Orbit-Check: Startet mit '${rueckseite[0].toUpperCase()}'... (${zeigeHinweis(rueckseite)})`

    aktiviereBuchstabenHint()
    setHintText(hinweisText)
    setHintSichtbar(true)
    setThrustersAktiv(true)
    setTimeout(() => setThrustersAktiv(false), 2000)
  }

  function handleHintZuenden() {
    setForbiddenZone(false)
    // Zeige Gemini-Hint wenn verfügbar
    if (geminiDaten?.eselsBruecke) {
      setHintText(`Drift-Info: ${geminiDaten.eselsBruecke}`)
    } else {
      setHintText('Navigation: Denk an verwandte Wörter...')
    }
    setHintSichtbar(true)
  }

  // ── Bewerten ──────────────────────────────────────────────────
  async function bewerteKarte(bewertung) {
    const karte = sessionKarten[index]
    if (!karte) return

    const finalBewertung = geminiGesperrt ? Math.min(bewertung, 2) : bewertung
    const richtung       = aktuelleRichtung ?? karte.richtung
    const neuesProfil    = fsrsBewerten(karte.aktivProfil ?? {}, finalBewertung)

    if (!karte.aktivProfil) {
      const heuteNeu = ladeHeuteNeu()
      heuteNeu[karte.id] = true
      speichereHeuteNeu(heuteNeu)
    }

    await speichereFortschritt(
      karte.id,
      richtung === 'abwechselnd' ? 'abwechselnd' : richtung,
      neuesProfil,
      { wort: karte.wort, uebersetzung: karte.uebersetzung }
    )

    // Shake bei "Nochmal"
    if (bewertung === 1) {
      // Animation wird im karteAnimiert-Flag gesetzt
    }

    setKarteAnimiert(true)
    setTimeout(() => {
      const naechsterIndex = index + 1
      setIndex(naechsterIndex)
      setAufgedeckt(false)
      setHintSichtbar(false)
      setForbiddenZone(false)
      resetHints()
      setSatzUebersetzungZeigen(false)
      setKarteAnimiert(false)
      if (naechsterIndex < sessionKarten.length) {
        setAktuelleRichtung(waehleSofortigeRichtung(sessionKarten[naechsterIndex], lernrichtung))
      }
    }, 220)
  }

  // ── Ladescreen ────────────────────────────────────────────────
  if (laden) {
    return (
      <div style={{
        minHeight:      'calc(100vh - 140px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexDirection:  'column',
        gap:            16,
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{
            width:        36, height: 36,
            borderRadius: '50%',
            border:       `3px solid ${colors.border}`,
            borderTop:    `3px solid ${colors.primary}`,
          }}
        />
        <p style={{ color: colors.textMuted, fontSize: tokens.font.size.md, margin: 0 }}>
          Karten werden geladen...
        </p>
      </div>
    )
  }

  const aktuelleKarte = sessionKarten[index]
  const gesamt        = sessionKarten.length
  const istNeu        = !aktuelleKarte?.aktivProfil

  // Keine Listen aktiv
  if (!aktuelleKarte && (einstellungen?.aktiveListen ?? []).length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📂</div>
          <h2 style={{ color: colors.textDark, margin: '0 0 8px', fontSize: tokens.font.size.h1 }}>Keine Liste aktiv</h2>
          <p style={{ color: colors.textMuted, fontSize: tokens.font.size.md }}>Aktiviere mindestens eine Liste im Entdecken-Tab.</p>
        </div>
      </div>
    )
  }

  // Fertig Screen
  if (!aktuelleKarte) {
    const heuteNeu    = ladeHeuteNeu()
    const heuteNeuAnz = Object.keys(heuteNeu).length
    const maxNeu      = einstellungen?.neueKartenProTag ?? 10
    const nochMoeglich = Math.max(0, maxNeu - heuteNeuAnz)
    const leer        = sessionInfo.wiederholungAnzahl === 0 && sessionInfo.neuAnzahl === 0

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
      >
        <div style={{ textAlign: 'center', width: '100%', maxWidth: 340 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
            style={{ fontSize: '4rem', marginBottom: 16 }}
          >
            {leer ? '😴' : '🎉'}
          </motion.div>
          <h2 style={{
            fontSize:   tokens.font.size.h1,
            fontWeight: tokens.font.weight.extrabold,
            color:      colors.textDark,
            margin:     '0 0 12px',
          }}>
            {leer ? 'Nichts fällig' : 'Alles erledigt!'}
          </h2>

          {!leer && (
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', margin: '16px 0 24px' }}>
              {sessionInfo.wiederholungAnzahl > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: colors.primary, lineHeight: 1 }}>
                    {sessionInfo.wiederholungAnzahl}
                  </span>
                  <span style={{ fontSize: tokens.font.size.xs, color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Wiederholt
                  </span>
                </div>
              )}
              {sessionInfo.neuAnzahl > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: colors.success, lineHeight: 1 }}>
                    {sessionInfo.neuAnzahl}
                  </span>
                  <span style={{ fontSize: tokens.font.size.xs, color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Neu
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tages-Progress */}
          <div style={{
            background:   colors.surface,
            borderRadius: tokens.radius.cardLg,
            padding:      '1rem 1.25rem',
            boxShadow:    colors.shadowSm,
            marginBottom: 20,
            border:       `1px solid ${colors.border}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: tokens.font.size.md, color: colors.textMid, marginBottom: 8, fontWeight: 600 }}>
              <span>Heute neue Karten</span>
              <span style={{ color: colors.primary }}>{heuteNeuAnz} / {maxNeu}</span>
            </div>
            <div style={{ height: 8, background: colors.borderLight, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (heuteNeuAnz / maxNeu) * 100)}%` }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  height:     '100%',
                  background: colors.gradientProgress,
                  borderRadius: 4,
                }}
              />
            </div>
            <p style={{ fontSize: tokens.font.size.base, color: colors.textMuted, margin: 0 }}>
              {nochMoeglich > 0
                ? `Noch ${nochMoeglich} neue Karten möglich`
                : 'Tageslimit erreicht — morgen gibt es neue Karten 🌙'}
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { onSessionEnde?.(); ladeSession() }}
            style={{
              padding:      '0.9rem 2rem',
              background:   colors.gradient,
              color:        '#fff',
              border:       'none',
              borderRadius: tokens.radius.xl,
              fontSize:     tokens.font.size.lg,
              fontWeight:   tokens.font.weight.bold,
              cursor:       'pointer',
              fontFamily:   'inherit',
              boxShadow:    colors.shadowPrimary,
              width:        '100%',
            }}
          >
            ↻ Aktualisieren
          </motion.button>
        </div>
      </motion.div>
    )
  }

  const richtung   = aktuelleRichtung ?? aktuelleKarte.richtung
  const vorderseite = richtung === 'en_de' ? aktuelleKarte.wort : aktuelleKarte.uebersetzung
  const rueckseite  = richtung === 'en_de' ? aktuelleKarte.uebersetzung : aktuelleKarte.wort
  const [vonFlag, nachFlag] = richtung === 'en_de' ? [FLAGGE.en, FLAGGE.de] : [FLAGGE.de, FLAGGE.en]

  // ── Lernansicht ──────────────────────────────────────────────
  return (
    <div style={{
      padding:       '1rem 1.25rem 1.5rem',
      minHeight:     'calc(100vh - 140px)',
      display:       'flex',
      flexDirection: 'column',
      gap:            12,
      position:      'relative',
    }}>
      <StarField visible={isDark} />

      {/* ── Widgets Zeile ── */}
      <div style={{
        display:        'flex',
        gap:             10,
        justifyContent: 'space-between',
        marginBottom:    4,
      }}>
        <StreakWidget streak={streak} colors={colors} tokens={tokens} />
        <SessionWidget aktuell={index} gesamt={gesamt} colors={colors} tokens={tokens} />
      </div>

      {/* ── Progress Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          flex:        1,
          height:       5,
          background:  colors.borderLight,
          borderRadius: 3,
          overflow:    'hidden',
        }}>
          <motion.div
            animate={{ width: `${gesamt > 0 ? Math.round((index / gesamt) * 100) : 100}%` }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            style={{
              height:     '100%',
              background: colors.gradientProgress,
              borderRadius: 3,
            }}
          />
        </div>
        <span style={{
          fontSize:   tokens.font.size.sm,
          color:      colors.textMuted,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>
          {index} / {gesamt}
        </span>
      </div>

      {/* ── Chips ── */}
      {(sessionInfo.wiederholungAnzahl > 0 || sessionInfo.neuAnzahl > 0 || istNeu || geminiGesperrt) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {sessionInfo.wiederholungAnzahl > 0 && (
            <span style={{ fontSize: tokens.font.size.sm, fontWeight: 700, background: colors.primaryLight, color: colors.primary, padding: '3px 10px', borderRadius: 20 }}>
              🔄 {sessionInfo.wiederholungAnzahl} Wdh.
            </span>
          )}
          {sessionInfo.neuAnzahl > 0 && (
            <span style={{ fontSize: tokens.font.size.sm, fontWeight: 700, background: colors.successBg, color: colors.success, padding: '3px 10px', borderRadius: 20 }}>
              ✨ {sessionInfo.neuAnzahl} Neu
            </span>
          )}
          {istNeu && (
            <span style={{ fontSize: tokens.font.size.sm, fontWeight: 700, background: colors.success, color: '#fff', padding: '3px 10px', borderRadius: 20, marginLeft: 'auto' }}>
              Neue Karte
            </span>
          )}
          {geminiGesperrt && (
            <span style={{ fontSize: tokens.font.size.sm, fontWeight: 700, background: colors.warningBg, color: colors.warning, padding: '3px 10px', borderRadius: 20 }}>
              ⚡ Max. Schwer
            </span>
          )}
        </div>
      )}

      {/* ── Richtungs-Badge ── */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          display:        'inline-flex',
          alignItems:     'center',
          gap:             6,
          background:     isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          borderRadius:   20,
          padding:        '4px 14px',
          fontSize:       '0.9rem',
          backdropFilter: 'blur(8px)',
        }}>
          <span>{vonFlag}</span>
          <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>→</span>
          <span>{nachFlag}</span>
        </div>
      </div>

      {/* ══ Haupt-Karte ══ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{
            opacity:   karteAnimiert ? 0 : 1,
            y:         karteAnimiert ? -16 : 0,
            scale:     karteAnimiert ? 0.96 : 1,
          }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          style={{
            background:           isDark ? 'rgba(22, 22, 50, 0.88)' : '#FFFFFF',
            backdropFilter:       isDark ? 'blur(24px)' : 'none',
            WebkitBackdropFilter: isDark ? 'blur(24px)' : 'none',
            borderRadius:         tokens.radius.card3x,
            border:               isDark
              ? '1px solid rgba(167, 139, 250, 0.20)'
              : 'none',
            boxShadow:            isDark
              ? '0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(167,139,250,0.12)'
              : '0 20px 60px rgba(0,0,0,0.10)',
            padding:              '2rem 1.75rem 1.75rem',
            display:              'flex',
            flexDirection:        'column',
            alignItems:           'center',
            position:             'relative',
            overflow:             'hidden',
            minHeight:            320,
          }}
        >
          {/* Hintergrund Glow im Dark Mode */}
          {isDark && (
            <div style={{
              position:     'absolute',
              top:          '-30%',
              right:        '-20%',
              width:         200,
              height:        200,
              borderRadius: '50%',
              background:   'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
              pointerEvents:'none',
            }} />
          )}

          {/* Orbit Hint schwebt INNERHALB der Karte */}
          <OrbitHint
            text={hintText}
            sichtbar={hintSichtbar && !aufgedeckt}
            onAbgelaufen={() => setHintSichtbar(false)}
            onSchliessen={() => setHintSichtbar(false)}
          />

          {/* Forbidden Zone Overlay */}
          <AnimatePresence>
            {forbiddenZone && (
              <ForbiddenZone
                wort={vorderseite}
                onHintZuenden={handleHintZuenden}
                aktiveOrbits={aktiveOrbits}
                colors={colors}
                tokens={tokens}
              />
            )}
          </AnimatePresence>

          {/* Vorderseite */}
          {!aufgedeckt && (
            <>
              {/* KI Icon oben */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  width:          56, height: 56,
                  borderRadius:   tokens.radius.card,
                  background:     isDark
                    ? 'rgba(6, 182, 212, 0.12)'
                    : 'rgba(59, 130, 246, 0.08)',
                  border:         `1px solid ${isDark ? 'rgba(6,182,212,0.2)' : 'rgba(59,130,246,0.15)'}`,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       '1.6rem',
                  marginBottom:   20,
                }}
              >
                ✦
              </motion.div>

              <p style={{
                fontSize:      tokens.font.size.sm,
                fontWeight:    tokens.font.weight.bold,
                color:         colors.textMuted,
                letterSpacing: tokens.font.tracking.caps,
                textTransform: 'uppercase',
                margin:        '0 0 10px',
              }}>
                Target Word
              </p>

              <motion.h2
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  fontSize:      `clamp(2rem, 10vw, 3rem)`,
                  fontWeight:    900,
                  color:         colors.textDark,
                  margin:        0,
                  letterSpacing: '-0.03em',
                  textAlign:     'center',
                  lineHeight:    1.1,
                  wordBreak:     'break-word',
                }}
              >
                {vorderseite}
              </motion.h2>

              {/* TAP TO REVEAL */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleAufdecken}
                style={{
                  marginTop:     28,
                  padding:       '0.75rem 2rem',
                  background:    isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.05)',
                  border:        `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  borderRadius:  tokens.radius.pill,
                  color:         colors.textMid,
                  fontSize:      tokens.font.size.base,
                  fontWeight:    700,
                  cursor:        'pointer',
                  fontFamily:    'inherit',
                  letterSpacing: tokens.font.tracking.caps,
                  textTransform: 'uppercase',
                  display:       'flex',
                  alignItems:    'center',
                  gap:            8,
                }}
              >
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>›</span>
                Tap to Reveal
              </motion.button>
            </>
          )}

          {/* Rückseite — nach Aufdecken */}
          {aufgedeckt && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              style={{ width: '100%', textAlign: 'center' }}
            >
              {/* Translation Label */}
              <div style={{
                display:       'flex',
                alignItems:    'center',
                gap:            6,
                marginBottom:  12,
                justifyContent:'flex-start',
              }}>
                <span style={{ fontSize: '1rem', color: colors.cyan }}>🔤</span>
                <span style={{
                  fontSize:      tokens.font.size.sm,
                  fontWeight:    700,
                  color:         colors.cyan,
                  letterSpacing: tokens.font.tracking.caps,
                  textTransform: 'uppercase',
                }}>Translation</span>
              </div>

              {/* Trennlinie */}
              <div style={{
                height:     1,
                background: `linear-gradient(90deg, transparent, ${colors.border}, transparent)`,
                marginBottom: 16,
              }} />

              {/* Übersetzung */}
              <motion.h2
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  fontSize:      `clamp(2rem, 10vw, 3rem)`,
                  fontWeight:    900,
                  color:         colors.textDark,
                  margin:        '0 0 20px',
                  letterSpacing: '-0.03em',
                  wordBreak:     'break-word',
                }}
              >
                {rueckseite}
              </motion.h2>

              {/* Gemini Laden */}
              {geminiLaed && !geminiDaten && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: 14, height: 14, borderRadius: '50%',
                      border: `2px solid ${colors.border}`,
                      borderTop: `2px solid ${colors.primary}`,
                    }}
                  />
                  <span style={{ fontSize: tokens.font.size.base, color: colors.textMuted }}>KI generiert...</span>
                </div>
              )}

              {/* Gemini Error */}
              {geminiError && (
                <div style={{
                  background:   colors.dangerBg,
                  border:       `1px solid ${colors.dangerLight}`,
                  borderRadius: tokens.radius.md,
                  padding:      '0.6rem 0.8rem',
                  marginBottom: 10,
                }}>
                  <span style={{ fontSize: tokens.font.size.sm, color: colors.danger, fontWeight: 700 }}>
                    ⚠️ {geminiError}
                  </span>
                </div>
              )}

              {/* Beispielsatz + Eselsbrücke Akkordeons */}
              {geminiDaten && (
                <div style={{ textAlign: 'left' }}>
                  <AkkordeonItem
                    icon="📖"
                    label="Beispielsatz"
                    farbe={colors.info}
                    colors={colors}
                    tokens={tokens}
                  >
                    <p style={{ margin: '0 0 8px', fontStyle: 'italic', color: colors.textMid }}>
                      "{geminiDaten.beispielSatz}"
                    </p>
                    {!satzUebersetzungZeigen ? (
                      <button
                        onClick={() => setSatzUebersetzungZeigen(true)}
                        style={{ background: 'none', border: 'none', color: colors.primary, fontSize: tokens.font.size.sm, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                      >
                        ▼ Auf Deutsch
                      </button>
                    ) : (
                      <p style={{ margin: 0, color: colors.textLight, fontStyle: 'italic', fontSize: tokens.font.size.md }}>
                        „{geminiDaten.beispielSatzUebersetzung}"
                      </p>
                    )}
                  </AkkordeonItem>

                  <AkkordeonItem
                    icon="🧠"
                    label="Eselsbrücke"
                    farbe={colors.primary}
                    colors={colors}
                    tokens={tokens}
                  >
                    <p style={{ margin: 0, fontStyle: 'italic', color: colors.textMid, lineHeight: 1.6 }}>
                      {geminiDaten.eselsBruecke}
                    </p>
                  </AkkordeonItem>
                </div>
              )}
            </motion.div>
          )}

          {/* Rocket FAB */}
          <RocketFAB
            onClick={handleRocketClick}
            aktiv={hintSichtbar}
            thrustersAktiv={thrustersAktiv}
            colors={colors}
            tokens={tokens}
            isDark={isDark}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Bewertung ── */}
      <AnimatePresence>
        {aufgedeckt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            <p style={{
              textAlign:  'center',
              color:      colors.textMuted,
              fontSize:   tokens.font.size.base,
              margin:     '0 0 10px',
              fontWeight: 500,
            }}>
              {geminiGesperrt ? '⚡ Hint genutzt — max. Schwer' : 'Wie gut wusstest du es?'}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <BewertungsBtn wert={1} emoji="😵" label="Nochmal" farbe={colors.danger}   onClick={bewerteKarte} colors={colors} tokens={tokens} />
              <BewertungsBtn wert={2} emoji="😕" label="Schwer"  farbe={colors.warning}  onClick={bewerteKarte} colors={colors} tokens={tokens} />
              <BewertungsBtn wert={3} emoji="🙂" label="Gut"     farbe={colors.success}  onClick={bewerteKarte} gesperrt={geminiGesperrt} colors={colors} tokens={tokens} />
              <BewertungsBtn wert={4} emoji="😄" label="Leicht"  farbe={colors.info}     onClick={bewerteKarte} gesperrt={geminiGesperrt} colors={colors} tokens={tokens} />
            </div>

            <p style={{
              textAlign:  'center',
              color:      colors.textMuted,
              fontSize:   tokens.font.size.xs,
              marginTop:  12,
            }}>
              Intervall: {aktuelleKarte.aktivProfil?.intervall ?? 0} Tag(e)
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
