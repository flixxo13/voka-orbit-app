// ============================================================
// VokaOrbit — components/Onboarding.jsx  v2.0
// Erster Eindruck — immer im Space-Modus (Dark).
// Framer Motion: Step-Slide-Transitions, Stagger-Animationen,
// Rocket Float, StarField, Spring-Buttons.
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { onboardingAbschliessen } from '../einstellungen'
import StarField from './StarField'
import { tokens } from '../design/tokens'

const SCHRITTE = ['willkommen', 'listen', 'richtung', 'profil']

const NIVEAU_OPTIONEN = [
  { wert: 'A1', label: 'A1 – Anfänger',            farbe: '#22c55e' },
  { wert: 'A2', label: 'A2 – Grundkenntnisse',     farbe: '#3b82f6' },
  { wert: 'B1', label: 'B1 – Mittelstufe',         farbe: '#f59e0b' },
  { wert: 'B2', label: 'B2 – Oberstufe',           farbe: '#f97316' },
  { wert: 'C1', label: 'C1/C2 – Fortgeschritten',  farbe: '#ec4899' },
]

const LERNZIEL_OPTIONEN = [
  { wert: 'reisen',   label: '🌍 Reisen & Urlaub' },
  { wert: 'business', label: '💼 Business & Karriere' },
  { wert: 'studium',  label: '🎓 Studium & Schule' },
  { wert: 'alltag',   label: '🎭 Kultur & Alltag' },
]

const RICHTUNGEN = [
  { wert: 'smart',       label: '🧠 Smart',           beschreibung: 'Schwächere Richtung bekommt automatisch mehr Karten', empfohlen: true },
  { wert: 'beide',       label: '↔️ Beide gleich',    beschreibung: 'EN→DE und DE→EN gleichwertig' },
  { wert: 'en_de',       label: '🇬🇧 → 🇩🇪 EN→DE',   beschreibung: 'Englisch immer auf Vorderseite' },
  { wert: 'de_en',       label: '🇩🇪 → 🇬🇧 DE→EN',   beschreibung: 'Deutsch immer auf Vorderseite' },
  { wert: 'abwechselnd', label: '🎲 Abwechselnd',      beschreibung: 'Richtung wird zufällig gewürfelt' },
]

const FEATURES = [
  { icon: '🧠', text: 'FSRS-Algorithmus — besser als Anki' },
  { icon: '↔️', text: 'Lernt in beide Richtungen — adaptiv' },
  { icon: '📚', text: 'Kuratierte Listen + eigene Karten' },
  { icon: '💡', text: 'KI-Eselsbrücken & Beispielsätze' },
]

// ── Schritt-Indikator (Pill-Style) ────────────────────────────
function SchrittIndikator({ aktuell }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28, justifyContent: 'center' }}>
      {SCHRITTE.map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width:      i === aktuell ? 28 : 8,
            background: i <= aktuell
              ? 'linear-gradient(90deg, #A78BFA, #06B6D4)'
              : 'rgba(255,255,255,0.15)',
            opacity: i < aktuell ? 0.6 : 1,
          }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          style={{ height: 8, borderRadius: 4 }}
        />
      ))}
    </div>
  )
}

// ── Auswahl-Item (Listen, Richtungen, Profile) ─────────────────
function AuswahlItem({ aktiv, onClick, children, akzent = '#A78BFA', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        display:      'flex',
        alignItems:   'center',
        borderRadius:  14,
        border:       `1.5px solid ${aktiv ? akzent : 'rgba(255,255,255,0.1)'}`,
        padding:      '0.85rem 1rem',
        cursor:       'pointer',
        background:   aktiv ? `${akzent}18` : 'rgba(255,255,255,0.05)',
        transition:   'border-color 0.15s ease, background 0.15s ease',
        gap:           10,
        marginBottom:  8,
      }}
    >
      {children}
    </motion.div>
  )
}

// ── Schritt Wrapper mit Slide-Animation ───────────────────────
function SchrittWrapper({ children, richtung }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: richtung * 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{    opacity: 0, x: richtung * -30 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════
export default function Onboarding({ onAbschluss }) {
  const [schritt,      setSchritt]      = useState(0)
  const [aktiveListen, setAktiveListen] = useState(['en_a1'])
  const [lernrichtung, setLernrichtung] = useState('smart')
  const [niveau,       setNiveau]       = useState('B1')
  const [lernziel,     setLernziel]     = useState('alltag')
  const [listen,       setListen]       = useState([])
  const [laed,         setLaed]         = useState(false)
  const vorherigerSchritt = useRef(0)

  const NIVEAU_FARBE = { A1: '#22c55e', A2: '#3b82f6', B1: '#f59e0b', B2: '#f97316', C1: '#ec4899' }

  useEffect(() => {
    fetch('/listen/index.json')
      .then(r => r.json())
      .then(setListen)
      .catch(() => setListen([]))
  }, [])

  function weiter() {
    vorherigerSchritt.current = schritt
    setSchritt(s => Math.min(s + 1, SCHRITTE.length - 1))
  }

  function zurueck() {
    vorherigerSchritt.current = schritt
    setSchritt(s => Math.max(s - 1, 0))
  }

  const richtung = schritt > vorherigerSchritt.current ? 1 : -1

  function toggleListe(id) {
    if (aktiveListen.includes(id)) {
      if (aktiveListen.length <= 1) return
      setAktiveListen(aktiveListen.filter(l => l !== id))
    } else {
      setAktiveListen([...aktiveListen, id])
    }
  }

  async function handleStart() {
    setLaed(true)
    await onboardingAbschliessen({
      aktiveListen,
      lernrichtung,
      notifAktiv:   true,
      vokabelModus: 'schwerste',
      nutzerprofil: { niveau, lernziel },
    })
    onAbschluss({ aktiveListen, lernrichtung, nutzerprofil: { niveau, lernziel } })
  }

  return (
    <div style={{
      minHeight:   '100vh',
      background:  'linear-gradient(160deg, #080818 0%, #0D0D1F 60%, #1A0A35 100%)',
      display:     'flex',
      alignItems:  'center',
      justifyContent: 'center',
      padding:     '1.5rem',
      position:    'relative',
      overflow:    'hidden',
      fontFamily:  tokens.font.family,
    }}>

      {/* Sterne */}
      <StarField visible />

      {/* Hintergrund Glows */}
      <div style={{
        position: 'absolute', width: 350, height: 350, borderRadius: '50%',
        top: -100, right: -100, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(124,58,237,0.20) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', width: 280, height: 280, borderRadius: '50%',
        bottom: -80, left: -80, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
      }} />

      {/* Haupt-Karte */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1,   y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        style={{
          width:              '100%',
          maxWidth:            440,
          background:         'rgba(22, 22, 50, 0.80)',
          backdropFilter:     'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius:        28,
          padding:            '2rem 1.75rem',
          border:             '1px solid rgba(167,139,250,0.18)',
          boxShadow:          '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.08)',
          position:           'relative',
          zIndex:              1,
          maxHeight:          '90vh',
          overflowY:          'auto',
        }}
      >
        <SchrittIndikator aktuell={schritt} />

        <AnimatePresence mode="wait" initial={false}>

          {/* ── Schritt 0: Willkommen ── */}
          {schritt === 0 && (
            <SchrittWrapper key="willkommen" richtung={richtung}>
              {/* Rocket */}
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, 2, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  fontSize:   '3.5rem',
                  textAlign:  'center',
                  marginBottom: 12,
                  filter:     'drop-shadow(0 6px 16px rgba(167,139,250,0.5))',
                  display:    'block',
                }}
              >
                🚀
              </motion.div>

              <h1 style={{
                fontSize:      '2.2rem',
                fontWeight:     900,
                color:         'white',
                textAlign:     'center',
                margin:        '0 0 8px',
                letterSpacing: '-0.03em',
              }}>
                VokaOrbit
              </h1>
              <p style={{
                fontSize:   '0.95rem',
                color:      'rgba(255,255,255,0.55)',
                textAlign:  'center',
                margin:     '0 0 28px',
                lineHeight:  1.55,
              }}>
                Lerne Vokabeln mit dem smartesten<br />Wiederholungsalgorithmus
              </p>

              {/* Feature List mit Stagger */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
                {FEATURES.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                    style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:           12,
                      background:   'rgba(255,255,255,0.06)',
                      borderRadius:  12,
                      padding:      '0.65rem 1rem',
                      border:       '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{f.icon}</span>
                    <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>
                      {f.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.35 }}
                whileTap={{ scale: 0.96 }}
                onClick={weiter}
                style={btnPrimary}
              >
                Los geht's →
              </motion.button>
            </SchrittWrapper>
          )}

          {/* ── Schritt 1: Listen ── */}
          {schritt === 1 && (
            <SchrittWrapper key="listen" richtung={richtung}>
              <h2 style={schrittTitel}>Was möchtest du lernen?</h2>
              <p style={schrittSub}>Wähle eine oder mehrere Listen. Jederzeit änderbar.</p>

              <div style={{ marginBottom: 24 }}>
                {listen.map((l, i) => {
                  const aktiv = aktiveListen.includes(l.id)
                  return (
                    <AuswahlItem
                      key={l.id}
                      aktiv={aktiv}
                      onClick={() => toggleListe(l.id)}
                      akzent="#A78BFA"
                      delay={i * 0.05}
                    >
                      <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{l.flagge}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{
                            fontSize:   '0.7rem',
                            fontWeight:  800,
                            padding:    '2px 8px',
                            borderRadius: 6,
                            background: `${NIVEAU_FARBE[l.niveau]}33`,
                            color:       NIVEAU_FARBE[l.niveau],
                            letterSpacing: '0.04em',
                          }}>
                            {l.niveau}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.78)', fontWeight: 600 }}>
                            {l.beschreibung}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.30)' }}>
                          {l.anzahl} Vokabeln
                        </span>
                      </div>
                      {/* Check */}
                      <motion.div
                        animate={{
                          background: aktiv ? '#A78BFA' : 'transparent',
                          borderColor: aktiv ? '#A78BFA' : 'rgba(255,255,255,0.2)',
                          scale: aktiv ? [1, 1.2, 1] : 1,
                        }}
                        transition={{ duration: 0.2 }}
                        style={{
                          width: 24, height: 24, borderRadius: '50%',
                          border: '2px solid', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {aktiv && <span style={{ color: 'white', fontSize: '0.72rem', fontWeight: 800 }}>✓</span>}
                      </motion.div>
                    </AuswahlItem>
                  )
                })}
              </div>

              <div style={navRow}>
                <button onClick={zurueck} style={btnZurueck}>← Zurück</button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={weiter} style={btnPrimary}>
                  Weiter →
                </motion.button>
              </div>
            </SchrittWrapper>
          )}

          {/* ── Schritt 2: Lernrichtung ── */}
          {schritt === 2 && (
            <SchrittWrapper key="richtung" richtung={richtung}>
              <h2 style={schrittTitel}>Wie möchtest du lernen?</h2>
              <p style={schrittSub}>Jederzeit in den Einstellungen änderbar.</p>

              <div style={{ marginBottom: 24 }}>
                {RICHTUNGEN.map((r, i) => {
                  const aktiv = lernrichtung === r.wert
                  return (
                    <AuswahlItem
                      key={r.wert}
                      aktiv={aktiv}
                      onClick={() => setLernrichtung(r.wert)}
                      akzent="#A78BFA"
                      delay={i * 0.04}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontWeight: 700, fontSize: '0.9rem',
                            color: aktiv ? '#C4B5FD' : 'rgba(255,255,255,0.82)',
                          }}>
                            {r.label}
                          </span>
                          {r.empfohlen && (
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 700,
                              background: 'rgba(167,139,250,0.22)',
                              color: '#C4B5FD',
                              padding: '1px 6px', borderRadius: 6,
                            }}>
                              Empfohlen
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', margin: '2px 0 0', lineHeight: 1.4 }}>
                          {r.beschreibung}
                        </p>
                      </div>
                      <motion.div
                        animate={{
                          background:  aktiv ? '#A78BFA' : 'transparent',
                          borderColor: aktiv ? '#A78BFA' : 'rgba(255,255,255,0.2)',
                        }}
                        style={{
                          width: 22, height: 22, borderRadius: '50%',
                          border: '2px solid', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {aktiv && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                      </motion.div>
                    </AuswahlItem>
                  )
                })}
              </div>

              <div style={navRow}>
                <button onClick={zurueck} style={btnZurueck}>← Zurück</button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={weiter} style={btnPrimary}>
                  Weiter →
                </motion.button>
              </div>
            </SchrittWrapper>
          )}

          {/* ── Schritt 3: Nutzerprofil ── */}
          {schritt === 3 && (
            <SchrittWrapper key="profil" richtung={richtung}>
              <h2 style={schrittTitel}>🎯 Dein Lernprofil</h2>
              <p style={schrittSub}>
                Gemini nutzt das für passende Eselsbrücken und Beispielsätze.
              </p>

              {/* Niveau */}
              <p style={profilLabel}>Mein Englisch-Niveau</p>
              {NIVEAU_OPTIONEN.map((n, i) => {
                const aktiv = niveau === n.wert
                return (
                  <AuswahlItem
                    key={n.wert}
                    aktiv={aktiv}
                    onClick={() => setNiveau(n.wert)}
                    akzent={n.farbe}
                    delay={i * 0.04}
                  >
                    <span style={{
                      flex: 1, fontSize: '0.88rem', fontWeight: 700,
                      color: aktiv ? n.farbe : 'rgba(255,255,255,0.72)',
                    }}>
                      {n.label}
                    </span>
                    <motion.div
                      animate={{
                        background:  aktiv ? n.farbe : 'transparent',
                        borderColor: aktiv ? n.farbe : 'rgba(255,255,255,0.2)',
                      }}
                      style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: '2px solid', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {aktiv && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />}
                    </motion.div>
                  </AuswahlItem>
                )
              })}

              {/* Lernziel */}
              <p style={{ ...profilLabel, marginTop: 16 }}>Mein Lernziel</p>
              {LERNZIEL_OPTIONEN.map((z, i) => {
                const aktiv = lernziel === z.wert
                return (
                  <AuswahlItem
                    key={z.wert}
                    aktiv={aktiv}
                    onClick={() => setLernziel(z.wert)}
                    akzent="#A78BFA"
                    delay={0.2 + i * 0.04}
                  >
                    <span style={{
                      flex: 1, fontSize: '0.88rem', fontWeight: 700,
                      color: aktiv ? '#C4B5FD' : 'rgba(255,255,255,0.72)',
                    }}>
                      {z.label}
                    </span>
                    <motion.div
                      animate={{
                        background:  aktiv ? '#A78BFA' : 'transparent',
                        borderColor: aktiv ? '#A78BFA' : 'rgba(255,255,255,0.2)',
                      }}
                      style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: '2px solid', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {aktiv && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />}
                    </motion.div>
                  </AuswahlItem>
                )
              })}

              {/* KI Hinweis */}
              <div style={{
                marginTop:    12, marginBottom: 24,
                padding:      '0.55rem 0.75rem',
                background:   'rgba(6,182,212,0.08)',
                border:       '1px solid rgba(6,182,212,0.15)',
                borderRadius:  10, textAlign: 'center',
              }}>
                <span style={{ fontSize: '0.78rem', color: 'rgba(6,182,212,0.75)' }}>
                  ✦ Beispielsätze auf deinem Niveau &nbsp;·&nbsp; ✦ Passende Eselsbrücken
                </span>
              </div>

              <div style={navRow}>
                <button onClick={zurueck} style={btnZurueck}>← Zurück</button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  animate={laed ? {} : {
                    boxShadow: ['0 4px 20px rgba(167,139,250,0.4)', '0 6px 28px rgba(167,139,250,0.65)', '0 4px 20px rgba(167,139,250,0.4)'],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  onClick={handleStart}
                  disabled={laed}
                  style={{
                    flex:         2,
                    padding:      '0.9rem',
                    background:   laed
                      ? 'rgba(167,139,250,0.3)'
                      : 'linear-gradient(135deg, #A78BFA, #60A5FA)',
                    color:        'white',
                    border:       'none',
                    borderRadius:  14,
                    fontSize:     '1rem',
                    fontWeight:    800,
                    cursor:        laed ? 'not-allowed' : 'pointer',
                    fontFamily:   'inherit',
                    letterSpacing: '-0.01em',
                    opacity:       laed ? 0.75 : 1,
                    transition:   'all 0.2s ease',
                  }}
                >
                  {laed ? '⏳ Wird gestartet...' : '🚀 Loslegen!'}
                </motion.button>
              </div>
            </SchrittWrapper>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ── Shared Styles ─────────────────────────────────────────────
const schrittTitel = {
  fontSize:      '1.35rem',
  fontWeight:     800,
  color:         'white',
  margin:        '0 0 6px',
  letterSpacing: '-0.02em',
}

const schrittSub = {
  fontSize:   '0.82rem',
  color:      'rgba(255,255,255,0.45)',
  margin:     '0 0 18px',
  lineHeight:  1.5,
}

const profilLabel = {
  fontSize:      '0.72rem',
  fontWeight:     700,
  color:         'rgba(255,255,255,0.38)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin:        '0 0 8px',
}

const navRow = {
  display: 'flex',
  gap:      10,
}

const btnZurueck = {
  flex:         1,
  padding:      '0.85rem',
  background:   'rgba(255,255,255,0.07)',
  color:        'rgba(255,255,255,0.65)',
  border:       '1px solid rgba(255,255,255,0.10)',
  borderRadius:  14,
  fontSize:     '0.95rem',
  fontWeight:    700,
  cursor:       'pointer',
  fontFamily:   'inherit',
}

const btnPrimary = {
  flex:         1,
  padding:      '0.9rem',
  background:   'linear-gradient(135deg, #7C3AED, #4F46E5)',
  color:        'white',
  border:       'none',
  borderRadius:  14,
  fontSize:     '0.95rem',
  fontWeight:    700,
  cursor:       'pointer',
  fontFamily:   'inherit',
  boxShadow:    '0 4px 16px rgba(124,58,237,0.4)',
}
