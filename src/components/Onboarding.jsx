import { useState, useEffect } from 'react'
import { onboardingAbschliessen } from '../einstellungen'

const SCHRITTE = ['willkommen', 'listen', 'richtung', 'profil']

function SchrittIndikator({ aktuell }) {
  return (
    <div style={styles.indikator}>
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          style={{
            ...styles.indikatorPunkt,
            background: i <= aktuell
              ? 'linear-gradient(135deg, #a78bfa, #60a5fa)'
              : 'rgba(255,255,255,0.2)',
            width: i === aktuell ? 24 : 8,
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </div>
  )
}

const NIVEAU_OPTIONEN = [
  { wert: 'A1', label: 'A1 – Anfänger',        farbe: '#22c55e' },
  { wert: 'A2', label: 'A2 – Grundkenntnisse', farbe: '#3b82f6' },
  { wert: 'B1', label: 'B1 – Mittelstufe',     farbe: '#f59e0b' },
  { wert: 'B2', label: 'B2 – Oberstufe',       farbe: '#f97316' },
  { wert: 'C1', label: 'C1/C2 – Fortgeschritten', farbe: '#ec4899' },
]

const LERNZIEL_OPTIONEN = [
  { wert: 'reisen',   label: '🌍 Reisen & Urlaub' },
  { wert: 'business', label: '💼 Business & Karriere' },
  { wert: 'studium',  label: '🎓 Studium & Schule' },
  { wert: 'alltag',   label: '🎭 Kultur & Alltag' },
]

export default function Onboarding({ onAbschluss }) {
  const [schritt, setSchritt]         = useState(0)
  const [aktiveListen, setAktiveListen] = useState(['en_a1'])
  const [lernrichtung, setLernrichtung] = useState('smart')
  const [niveau, setNiveau]           = useState('B1')
  const [lernziel, setLernziel]       = useState('alltag')
  const [listen, setListen]           = useState([])
  const [laed, setLaed]               = useState(false)

  useEffect(() => {
    fetch('/listen/index.json')
      .then(r => r.json())
      .then(setListen)
      .catch(() => setListen([]))
  }, [])

  function weiter() {
    setSchritt(s => Math.min(s + 1, SCHRITTE.length - 1))
  }

  function zurueck() {
    setSchritt(s => Math.max(s - 1, 0))
  }

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
      notifAktiv: true,
      vokabelModus: 'schwerste',
      nutzerprofil: { niveau, lernziel },
    })
    onAbschluss({ aktiveListen, lernrichtung, nutzerprofil: { niveau, lernziel } })
  }

  const NIVEAU_FARBE = {
    A1: '#22c55e', A2: '#3b82f6',
    B1: '#f59e0b', B2: '#f97316', C1: '#ec4899'
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      <div style={styles.karte}>
        <SchrittIndikator aktuell={schritt} />

        {/* ── Schritt 0: Willkommen ── */}
        {schritt === 0 && (
          <div style={styles.schrittInhalt}>
            <div style={styles.logo}>🚀</div>
            <h1 style={styles.hauptTitel}>VokaOrbit</h1>
            <p style={styles.hauptUntertitel}>
              Lerne Vokabeln mit dem smartesten<br />Wiederholungsalgorithmus
            </p>
            <div style={styles.featureList}>
              {[
                { icon: '🧠', text: 'FSRS-Algorithmus — besser als Anki' },
                { icon: '↔️', text: 'Lernt in beide Richtungen — adaptiv' },
                { icon: '📚', text: 'Kuratierte Listen + eigene Karten' },
                { icon: '💡', text: 'KI-Eselsbrücken & Beispielsätze' },
              ].map((f, i) => (
                <div key={i} style={styles.featureItem}>
                  <span style={styles.featureIcon}>{f.icon}</span>
                  <span style={styles.featureText}>{f.text}</span>
                </div>
              ))}
            </div>
            <button onClick={weiter} style={styles.primaryBtn}>Los geht's →</button>
          </div>
        )}

        {/* ── Schritt 1: Listen ── */}
        {schritt === 1 && (
          <div style={styles.schrittInhalt}>
            <h2 style={styles.schrittTitel}>Was möchtest du lernen?</h2>
            <p style={styles.schrittUntertitel}>
              Wähle eine oder mehrere Listen. Jederzeit änderbar.
            </p>
            <div style={styles.listenWrapper}>
              {listen.map(l => {
                const aktiv = aktiveListen.includes(l.id)
                return (
                  <div
                    key={l.id}
                    onClick={() => toggleListe(l.id)}
                    style={{
                      ...styles.listenItem,
                      borderColor: aktiv ? '#a78bfa' : 'rgba(255,255,255,0.12)',
                      background: aktiv ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={styles.listenItemLinks}>
                      <span style={styles.listenFlagge}>{l.flagge}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            ...styles.niveauBadge,
                            background: NIVEAU_FARBE[l.niveau] + '33',
                            color: NIVEAU_FARBE[l.niveau],
                          }}>
                            {l.niveau}
                          </span>
                          <span style={styles.listenBeschreibung}>{l.beschreibung}</span>
                        </div>
                        <span style={styles.listenAnzahl}>{l.anzahl} Vokabeln</span>
                      </div>
                    </div>
                    <div style={{
                      ...styles.checkKreis,
                      background: aktiv ? '#a78bfa' : 'transparent',
                      borderColor: aktiv ? '#a78bfa' : 'rgba(255,255,255,0.25)',
                    }}>
                      {aktiv && <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 800 }}>✓</span>}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={styles.navButtons}>
              <button onClick={zurueck} style={styles.zurueckBtn}>← Zurück</button>
              <button onClick={weiter} style={styles.primaryBtn}>Weiter →</button>
            </div>
          </div>
        )}

        {/* ── Schritt 2: Lernrichtung ── */}
        {schritt === 2 && (
          <div style={styles.schrittInhalt}>
            <h2 style={styles.schrittTitel}>Wie möchtest du lernen?</h2>
            <p style={styles.schrittUntertitel}>
              Jederzeit in den Einstellungen änderbar.
            </p>
            <div style={styles.richtungenWrapper}>
              {[
                { wert: 'smart',       label: '🧠 Smart',                   beschreibung: 'Schwächere Richtung bekommt automatisch mehr Karten', empfohlen: true },
                { wert: 'beide',       label: '↔️ Beide gleich',            beschreibung: 'EN→DE und DE→EN gleichwertig' },
                { wert: 'en_de',       label: '🇬🇧 → 🇩🇪 Nur EN→DE',       beschreibung: 'Englisch immer auf Vorderseite' },
                { wert: 'de_en',       label: '🇩🇪 → 🇬🇧 Nur DE→EN',       beschreibung: 'Deutsch immer auf Vorderseite' },
                { wert: 'abwechselnd', label: '🎲 Abwechselnd',             beschreibung: 'Richtung wird zufällig gewürfelt' },
              ].map(r => (
                <div
                  key={r.wert}
                  onClick={() => setLernrichtung(r.wert)}
                  style={{
                    ...styles.richtungItem,
                    borderColor: lernrichtung === r.wert ? '#a78bfa' : 'rgba(255,255,255,0.12)',
                    background: lernrichtung === r.wert ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: lernrichtung === r.wert ? '#c4b5fd' : 'rgba(255,255,255,0.85)' }}>
                        {r.label}
                      </span>
                      {r.empfohlen && <span style={styles.empfohlenBadge}>Empfohlen</span>}
                    </div>
                    <p style={styles.richtungBeschreibung}>{r.beschreibung}</p>
                  </div>
                  <div style={{
                    ...styles.checkKreis,
                    background: lernrichtung === r.wert ? '#a78bfa' : 'transparent',
                    borderColor: lernrichtung === r.wert ? '#a78bfa' : 'rgba(255,255,255,0.25)',
                  }}>
                    {lernrichtung === r.wert && <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 800 }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.navButtons}>
              <button onClick={zurueck} style={styles.zurueckBtn}>← Zurück</button>
              <button onClick={weiter} style={styles.primaryBtn}>Weiter →</button>
            </div>
          </div>
        )}

        {/* ── Schritt 3: Nutzerprofil ── */}
        {schritt === 3 && (
          <div style={styles.schrittInhalt}>
            <h2 style={styles.schrittTitel}>🎯 Dein Lernprofil</h2>
            <p style={styles.schrittUntertitel}>
              Gemini nutzt das für passende Eselsbrücken und Beispielsätze.
            </p>

            {/* Niveau */}
            <p style={styles.profilLabel}>Mein Englisch-Niveau</p>
            <div style={styles.profilGruppe}>
              {NIVEAU_OPTIONEN.map(n => (
                <div
                  key={n.wert}
                  onClick={() => setNiveau(n.wert)}
                  style={{
                    ...styles.profilOption,
                    borderColor: niveau === n.wert ? n.farbe : 'rgba(255,255,255,0.12)',
                    background: niveau === n.wert ? n.farbe + '22' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: niveau === n.wert ? n.farbe : 'rgba(255,255,255,0.75)' }}>
                    {n.label}
                  </span>
                  <div style={{
                    ...styles.radioKreis,
                    borderColor: niveau === n.wert ? n.farbe : 'rgba(255,255,255,0.25)',
                    background: niveau === n.wert ? n.farbe : 'transparent',
                  }}>
                    {niveau === n.wert && <div style={styles.radioKern} />}
                  </div>
                </div>
              ))}
            </div>

            {/* Lernziel */}
            <p style={{ ...styles.profilLabel, marginTop: 16 }}>Mein Lernziel</p>
            <div style={styles.profilGruppe}>
              {LERNZIEL_OPTIONEN.map(z => (
                <div
                  key={z.wert}
                  onClick={() => setLernziel(z.wert)}
                  style={{
                    ...styles.profilOption,
                    borderColor: lernziel === z.wert ? '#a78bfa' : 'rgba(255,255,255,0.12)',
                    background: lernziel === z.wert ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: lernziel === z.wert ? '#c4b5fd' : 'rgba(255,255,255,0.75)' }}>
                    {z.label}
                  </span>
                  <div style={{
                    ...styles.radioKreis,
                    borderColor: lernziel === z.wert ? '#a78bfa' : 'rgba(255,255,255,0.25)',
                    background: lernziel === z.wert ? '#a78bfa' : 'transparent',
                  }}>
                    {lernziel === z.wert && <div style={styles.radioKern} />}
                  </div>
                </div>
              ))}
            </div>

            {/* Gemini Info */}
            <div style={styles.geminiHinweis}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                ✓ Beispielsätze auf deinem Niveau &nbsp;·&nbsp; ✓ Passende Eselsbrücken
              </span>
            </div>

            <div style={styles.navButtons}>
              <button onClick={zurueck} style={styles.zurueckBtn}>← Zurück</button>
              <button
                onClick={handleStart}
                disabled={laed}
                style={{ ...styles.startBtn, opacity: laed ? 0.75 : 1 }}
              >
                {laed ? '⏳ Wird gestartet...' : '🚀 Loslegen!'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────
const styles = {
  wrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #0f0c29, #302b63, #24243e)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1.5rem',
    position: 'relative', overflow: 'hidden',
  },
  orb1: {
    position: 'absolute', width: 300, height: 300, borderRadius: '50%',
    top: -80, right: -80,
    background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute', width: 250, height: 250, borderRadius: '50%',
    bottom: -60, left: -60,
    background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  karte: {
    width: '100%', maxWidth: 440,
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    borderRadius: 28, padding: '2rem 1.75rem',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
    position: 'relative', zIndex: 1,
  },
  indikator: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28, justifyContent: 'center' },
  indikatorPunkt: { height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.2)' },
  schrittInhalt: { display: 'flex', flexDirection: 'column' },

  logo: { fontSize: '3.5rem', textAlign: 'center', marginBottom: 12, filter: 'drop-shadow(0 4px 12px rgba(167,139,250,0.5))' },
  hauptTitel: { fontSize: '2.2rem', fontWeight: 900, color: 'white', textAlign: 'center', margin: '0 0 8px', letterSpacing: '-0.03em' },
  hauptUntertitel: { fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.5 },
  featureList: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 },
  featureItem: { display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '0.65rem 1rem' },
  featureIcon: { fontSize: '1.2rem', flexShrink: 0 },
  featureText: { fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 },

  schrittTitel: { fontSize: '1.35rem', fontWeight: 800, color: 'white', margin: '0 0 6px', letterSpacing: '-0.02em' },
  schrittUntertitel: { fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 18px', lineHeight: 1.5 },

  listenWrapper: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 },
  listenItem: { display: 'flex', alignItems: 'center', borderRadius: 14, border: '1.5px solid', padding: '0.85rem 1rem', cursor: 'pointer', transition: 'all 0.15s' },
  listenItemLinks: { display: 'flex', alignItems: 'center', gap: 10, flex: 1 },
  listenFlagge: { fontSize: '1.3rem', flexShrink: 0 },
  niveauBadge: { fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6, letterSpacing: '0.04em' },
  listenBeschreibung: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600 },
  listenAnzahl: { display: 'block', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 1 },

  checkKreis: { width: 24, height: 24, borderRadius: '50%', border: '2px solid', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' },

  richtungenWrapper: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 },
  richtungItem: { display: 'flex', alignItems: 'center', borderRadius: 14, border: '1.5px solid', padding: '0.85rem 1rem', cursor: 'pointer', transition: 'all 0.15s', gap: 10 },
  richtungBeschreibung: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', lineHeight: 1.4 },
  empfohlenBadge: { fontSize: '0.65rem', fontWeight: 700, background: 'rgba(167,139,250,0.25)', color: '#c4b5fd', padding: '1px 6px', borderRadius: 6 },

  // Nutzerprofil
  profilLabel: { fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' },
  profilGruppe: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 },
  profilOption: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, border: '1.5px solid', padding: '0.7rem 1rem', cursor: 'pointer', transition: 'all 0.15s' },
  radioKreis: { width: 18, height: 18, borderRadius: '50%', border: '2px solid', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' },
  radioKern: { width: 7, height: 7, borderRadius: '50%', background: 'white' },
  geminiHinweis: { marginTop: 12, marginBottom: 20, padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 10, textAlign: 'center' },

  navButtons: { display: 'flex', gap: 10 },
  zurueckBtn: { flex: 1, padding: '0.85rem', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  primaryBtn: { flex: 1, padding: '0.9rem', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: 14, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' },
  startBtn: { flex: 2, padding: '0.9rem', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: 'white', border: 'none', borderRadius: 14, fontSize: '1rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(167,139,250,0.45)', letterSpacing: '-0.01em' },
}
