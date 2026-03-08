import { useState, useEffect, useCallback } from 'react'
import { ladeAlleKarten, speichereFortschritt } from '../vokabeln'
import { sindFaellig, berechneNaechsteWiederholung } from '../fsrs'

// Flaggen pro Sprache
const FLAGGE = { en: '🇬🇧', de: '🇩🇪' }

// Richtungspfeil anzeigen
function RichtungsBadge({ richtung }) {
  const [von, nach] = richtung === 'en_de'
    ? [FLAGGE.en, FLAGGE.de]
    : [FLAGGE.de, FLAGGE.en]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'rgba(255,255,255,0.12)', borderRadius: 20,
      padding: '4px 12px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(8px)'
    }}>
      <span>{von}</span>
      <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>→</span>
      <span>{nach}</span>
    </div>
  )
}

// Bewertungsbutton
function BewertungsBtn({ wert, label, farbe, onClick }) {
  const [gedrueckt, setGedrueckt] = useState(false)
  return (
    <button
      onClick={() => { setGedrueckt(true); setTimeout(() => onClick(wert), 120) }}
      style={{
        flex: 1, padding: '0.9rem 0.4rem',
        background: gedrueckt ? farbe : 'white',
        color: gedrueckt ? 'white' : farbe,
        border: `2px solid ${farbe}`,
        borderRadius: 14, fontSize: '0.82rem',
        fontWeight: 700, cursor: 'pointer',
        transition: 'all 0.12s ease',
        transform: gedrueckt ? 'scale(0.95)' : 'scale(1)',
        fontFamily: 'inherit',
        lineHeight: 1.3,
        boxShadow: gedrueckt ? 'none' : `0 2px 8px ${farbe}33`
      }}
    >
      {label}
    </button>
  )
}

export default function LernenTab({ einstellungen }) {
  const [laden, setLaden] = useState(true)
  const [sessionKarten, setSessionKarten] = useState([])    // alle fälligen Karten dieser Session
  const [index, setIndex] = useState(0)                     // aktuelle Position
  const [aufgedeckt, setAufgedeckt] = useState(false)
  const [sessionGesamt, setSessionGesamt] = useState(0)     // für Progress-Bar
  const [aktuelleRichtung, setAktuelleRichtung] = useState(null) // für "abwechselnd"
  const [animiere, setAnimiere] = useState(false)

  const lernrichtung = einstellungen?.lernrichtung ?? 'smart'
  const aktiveListen = einstellungen?.aktiveListen ?? ['en_a1']

  // Karten laden
  const ladeSession = useCallback(async () => {
    setLaden(true)
    try {
      const { lernkarten } = await ladeAlleKarten(aktiveListen, lernrichtung)
      const faellig = sindFaellig(lernkarten, lernrichtung)

      // Mischen
      const gemischt = [...faellig].sort(() => Math.random() - 0.5)

      setSessionKarten(gemischt)
      setSessionGesamt(gemischt.length)
      setIndex(0)
      setAufgedeckt(false)

      // Erste Richtung setzen (für abwechselnd)
      if (gemischt.length > 0) {
        setAktuelleRichtung(waehleSofortigeRichtung(gemischt[0], lernrichtung))
      }
    } catch (err) {
      console.error('Fehler beim Laden:', err)
    }
    setLaden(false)
  }, [aktiveListen, lernrichtung])

  useEffect(() => { ladeSession() }, [ladeSession])

  // Für "abwechselnd": Richtung pro Karte würfeln
  function waehleSofortigeRichtung(karte, richtung) {
    if (richtung === 'abwechselnd') {
      return Math.random() < 0.5 ? 'en_de' : 'de_en'
    }
    return karte.richtung
  }

  async function bewerteKarte(bewertung) {
    const karte = sessionKarten[index]
    if (!karte) return

    const richtung = aktuelleRichtung ?? karte.richtung
    const altesProfil = karte.aktivProfil ?? {}
    const neuesProfil = berechneNaechsteWiederholung(altesProfil, bewertung)

    // Fortschritt speichern
    const fsrsRichtung = richtung === 'abwechselnd' ? 'abwechselnd' : richtung
    await speichereFortschritt(karte.id, fsrsRichtung, neuesProfil)

    // Zur nächsten Karte
    setAnimiere(true)
    setTimeout(() => {
      const naechsterIndex = index + 1
      setIndex(naechsterIndex)
      setAufgedeckt(false)
      setAnimiere(false)

      if (naechsterIndex < sessionKarten.length) {
        setAktuelleRichtung(
          waehleSofortigeRichtung(sessionKarten[naechsterIndex], lernrichtung)
        )
      }
    }, 200)
  }

  // Ladescreen
  if (laden) {
    return (
      <div style={styles.container}>
        <div style={styles.ladeWrapper}>
          <div style={styles.spinner} />
          <p style={{ color: '#94a3b8', marginTop: 16, fontSize: '0.9rem' }}>
            Karten werden geladen...
          </p>
        </div>
      </div>
    )
  }

  const aktuelleKarte = sessionKarten[index]
  const fortschritt = sessionGesamt > 0
    ? Math.round((index / sessionGesamt) * 100)
    : 100

  // Alles gelernt
  if (!aktuelleKarte) {
    return (
      <div style={styles.container}>
        <div style={styles.fertigWrapper}>
          <div style={styles.fertigEmoji}>🎉</div>
          <h2 style={styles.fertigTitel}>Alles gelernt!</h2>
          <p style={styles.fertigText}>
            Du hast heute <strong style={{ color: '#a78bfa' }}>{sessionGesamt}</strong> {sessionGesamt === 1 ? 'Karte' : 'Karten'} wiederholt.
          </p>
          <p style={styles.fertigText}>Komm morgen wieder — neue Karten warten!</p>
          <button onClick={ladeSession} style={styles.wiederBtn}>
            ↻ Nochmal prüfen
          </button>
        </div>
      </div>
    )
  }

  const richtung = aktuelleRichtung ?? aktuelleKarte.richtung
  const vorderseite = richtung === 'en_de'
    ? aktuelleKarte.wort
    : aktuelleKarte.uebersetzung
  const rueckseite = richtung === 'en_de'
    ? aktuelleKarte.uebersetzung
    : aktuelleKarte.wort

  return (
    <div style={styles.container}>

      {/* Progress Bar + Zähler */}
      <div style={styles.progressHeader}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${fortschritt}%` }} />
        </div>
        <span style={styles.progressText}>
          {index} / {sessionGesamt}
        </span>
      </div>

      {/* Richtungs-Badge */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <RichtungsBadge richtung={richtung} />
      </div>

      {/* Karteikarte */}
      <div
        style={{
          ...styles.karte,
          opacity: animiere ? 0 : 1,
          transform: animiere ? 'translateY(12px) scale(0.97)' : 'translateY(0) scale(1)',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Vorderseite */}
        <div style={styles.karteVorderseite}>
          <p style={styles.karteHinweis}>Was bedeutet...</p>
          <h2 style={styles.karteWort}>{vorderseite}</h2>
        </div>

        {/* Trennlinie + Rückseite */}
        {aufgedeckt && (
          <div style={styles.karteRueckseite}>
            <div style={styles.karteTrennlinie} />
            <p style={styles.karteUebersetzung}>{rueckseite}</p>
          </div>
        )}

        {/* Antwort zeigen Button */}
        {!aufgedeckt && (
          <button
            onClick={() => setAufgedeckt(true)}
            style={styles.aufdeckenBtn}
          >
            Antwort zeigen
          </button>
        )}
      </div>

      {/* Bewertungsbuttons */}
      {aufgedeckt && (
        <div style={styles.bewertungWrapper}>
          <p style={styles.bewertungHinweis}>Wie gut wusstest du es?</p>
          <div style={styles.bewertungGrid}>
            <BewertungsBtn wert={1} label={"😵\nNochmal"} farbe="#ef4444" onClick={bewerteKarte} />
            <BewertungsBtn wert={2} label={"😕\nSchwer"}  farbe="#f97316" onClick={bewerteKarte} />
            <BewertungsBtn wert={3} label={"🙂\nGut"}    farbe="#22c55e" onClick={bewerteKarte} />
            <BewertungsBtn wert={4} label={"😄\nLeicht"} farbe="#3b82f6" onClick={bewerteKarte} />
          </div>
        </div>
      )}

      {/* Nächste Fälligkeit Vorschau (nach Bewertung 3) */}
      {aufgedeckt && (
        <p style={styles.fsrsHinweis}>
          Intervall aktuell: {aktuelleKarte.aktivProfil?.intervall ?? 0} Tag(e)
        </p>
      )}

    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────
const styles = {
  container: {
    padding: '1.25rem',
    minHeight: 'calc(100vh - 140px)',
    display: 'flex',
    flexDirection: 'column',
  },

  // Laden
  ladeWrapper: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center'
  },
  spinner: {
    width: 40, height: 40, borderRadius: '50%',
    border: '3px solid rgba(167,139,250,0.2)',
    borderTop: '3px solid #a78bfa',
    animation: 'spin 0.8s linear infinite'
  },

  // Progress
  progressHeader: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20
  },
  progressBar: {
    flex: 1, height: 6, background: 'rgba(255,255,255,0.08)',
    borderRadius: 3, overflow: 'hidden'
  },
  progressFill: {
    height: '100%', background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
    borderRadius: 3, transition: 'width 0.4s ease'
  },
  progressText: {
    fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600
  },

  // Karte
  karte: {
    background: 'white',
    borderRadius: 20,
    padding: '2rem 1.75rem',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
    minHeight: 220,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  karteVorderseite: {
    textAlign: 'center', width: '100%'
  },
  karteHinweis: {
    color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 10px',
    textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600
  },
  karteWort: {
    fontSize: '2.2rem', color: '#1e293b', margin: 0,
    fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2,
    wordBreak: 'break-word'
  },
  karteRueckseite: {
    width: '100%', textAlign: 'center', marginTop: 16
  },
  karteTrennlinie: {
    height: 1, background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)',
    margin: '12px 0'
  },
  karteUebersetzung: {
    fontSize: '1.5rem', color: '#475569', margin: 0,
    fontWeight: 600, letterSpacing: '-0.01em'
  },

  // Aufdecken Button
  aufdeckenBtn: {
    marginTop: 24, padding: '0.75rem 2rem',
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    color: 'white', border: 'none', borderRadius: 12,
    fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
    fontFamily: 'inherit',
    transition: 'transform 0.1s ease',
  },

  // Bewertung
  bewertungWrapper: { marginTop: 4 },
  bewertungHinweis: {
    textAlign: 'center', color: '#64748b',
    fontSize: '0.82rem', margin: '0 0 10px', fontWeight: 500
  },
  bewertungGrid: {
    display: 'flex', gap: 8
  },

  // FSRS Hinweis
  fsrsHinweis: {
    textAlign: 'center', color: '#94a3b8',
    fontSize: '0.72rem', marginTop: 14
  },

  // Fertig Screen
  fertigWrapper: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', padding: '2rem'
  },
  fertigEmoji: { fontSize: '4rem', marginBottom: 16 },
  fertigTitel: {
    fontSize: '1.8rem', fontWeight: 800, color: '#1e293b',
    margin: '0 0 12px', letterSpacing: '-0.02em'
  },
  fertigText: { color: '#64748b', fontSize: '0.95rem', margin: '4px 0' },
  wiederBtn: {
    marginTop: 28, padding: '0.8rem 2rem',
    background: 'transparent',
    border: '2px solid rgba(167,139,250,0.4)',
    color: '#a78bfa', borderRadius: 12,
    fontSize: '0.95rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit'
  }
}
