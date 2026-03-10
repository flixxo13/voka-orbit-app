import { useState, useEffect, useCallback } from 'react'
import { ladeAlleKarten, speichereFortschritt } from '../vokabeln'
import { ladeSessionKarten, berechneNaechsteWiederholung } from '../fsrs'

// Flaggen pro Sprache
const FLAGGE = { en: '🇬🇧', de: '🇩🇪' }

function RichtungsBadge({ richtung }) {
  const [von, nach] = richtung === 'en_de'
    ? [FLAGGE.en, FLAGGE.de]
    : [FLAGGE.de, FLAGGE.en]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'rgba(255,255,255,0.12)', borderRadius: 20,
      padding: '4px 12px', fontSize: '0.9rem',
      backdropFilter: 'blur(8px)'
    }}>
      <span>{von}</span>
      <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>→</span>
      <span>{nach}</span>
    </div>
  )
}

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
        fontFamily: 'inherit', lineHeight: 1.3,
        boxShadow: gedrueckt ? 'none' : `0 2px 8px ${farbe}33`
      }}
    >
      {label}
    </button>
  )
}

// ── localStorage Hilfsfunktionen ──────────────────────────
// Key wechselt täglich → automatischer Reset um Mitternacht
function heuteDatumKey() {
  return 'vokaorbit_neu_' + new Date().toISOString().slice(0, 10)
}
function ladeHeuteNeu() {
  try {
    const gespeichert = localStorage.getItem(heuteDatumKey())
    return gespeichert ? JSON.parse(gespeichert) : {}
  } catch { return {} }
}
function speichereHeuteNeu(ids) {
  try {
    localStorage.setItem(heuteDatumKey(), JSON.stringify(ids))
    // Alte Tages-Keys löschen
    Object.keys(localStorage)
      .filter(k => k.startsWith('vokaorbit_neu_') && k !== heuteDatumKey())
      .forEach(k => localStorage.removeItem(k))
  } catch {}
}

// ─────────────────────────────────────────────────────────
export default function LernenTab({ einstellungen, onSessionEnde, deepLinkVokabel }) {
  const [laden, setLaden] = useState(true)
  const [sessionKarten, setSessionKarten] = useState([])
  const [index, setIndex] = useState(0)
  const [aufgedeckt, setAufgedeckt] = useState(false)
  const [sessionInfo, setSessionInfo] = useState({ wiederholungAnzahl: 0, neuAnzahl: 0 })
  const [aktuelleRichtung, setAktuelleRichtung] = useState(null)
  const [animiere, setAnimiere] = useState(false)

  const lernrichtung = einstellungen?.lernrichtung ?? 'smart'
  const aktiveListen = einstellungen?.aktiveListen ?? ['en_a1']

  const ladeSession = useCallback(async () => {
    setLaden(true)
    try {
      const heuteNeu = ladeHeuteNeu()
      const { alleKarten } = await ladeAlleKarten(aktiveListen, lernrichtung)
      const { session, wiederholungAnzahl, neuAnzahl } = ladeSessionKarten(
        alleKarten,
        einstellungen ?? {},
        heuteNeu
      )
      // Deep Link: Vokabel aus Notification nach vorne schieben
      let finalSession = session
      if (deepLinkVokabel) {
        const idx = session.findIndex(k => k.id === deepLinkVokabel.id)
        if (idx > 0) {
          const karte = session[idx]
          finalSession = [karte, ...session.filter((_, i) => i !== idx)]
        }
      }
      setSessionKarten(finalSession)
      setSessionInfo({ wiederholungAnzahl, neuAnzahl })
      setIndex(0)
      setAufgedeckt(false)
      if (finalSession.length > 0) {
        setAktuelleRichtung(waehleSofortigeRichtung(finalSession[0], lernrichtung))
      }
    } catch (err) {
      console.error('Fehler beim Laden:', err)
    }
    setLaden(false)
  }, [aktiveListen, lernrichtung, einstellungen])

  useEffect(() => { ladeSession() }, [ladeSession])

  function waehleSofortigeRichtung(karte, richtung) {
    if (richtung === 'abwechselnd') return Math.random() < 0.5 ? 'en_de' : 'de_en'
    return karte.richtung
  }

  async function bewerteKarte(bewertung) {
    const karte = sessionKarten[index]
    if (!karte) return

    const richtung = aktuelleRichtung ?? karte.richtung
    const altesProfil = karte.aktivProfil ?? {}
    const neuesProfil = berechneNaechsteWiederholung(altesProfil, bewertung)

    // Neue Karte → in localStorage als heute gesehen speichern
    if (!karte.aktivProfil) {
      const heuteNeu = ladeHeuteNeu()
      heuteNeu[karte.id] = true
      speichereHeuteNeu(heuteNeu)
    }

    const fsrsRichtung = richtung === 'abwechselnd' ? 'abwechselnd' : richtung
    await speichereFortschritt(karte.id, fsrsRichtung, neuesProfil, {
      wort: karte.wort,
      uebersetzung: karte.uebersetzung,
    })

    setAnimiere(true)
    setTimeout(() => {
      const naechsterIndex = index + 1
      setIndex(naechsterIndex)
      setAufgedeckt(false)
      setAnimiere(false)
      if (naechsterIndex < sessionKarten.length) {
        setAktuelleRichtung(waehleSofortigeRichtung(sessionKarten[naechsterIndex], lernrichtung))
      }
    }, 200)
  }

  // ── Ladescreen ───────────────────────────────────────────
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
  const gesamt = sessionKarten.length
  const fortschritt = gesamt > 0 ? Math.round((index / gesamt) * 100) : 100
  const istNeu = !aktuelleKarte?.aktivProfil

  // ── Keine Listen aktiv ───────────────────────────────────
  if (!aktuelleKarte && (einstellungen?.aktiveListen ?? []).length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.fertigWrapper}>
          <div style={styles.fertigEmoji}>📂</div>
          <h2 style={styles.fertigTitel}>Keine Liste aktiv</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.6 }}>
            Aktiviere mindestens eine Liste im Entdecken-Tab um loszulegen.
          </p>
        </div>
      </div>
    )
  }

  // ── Fertig-Screen ────────────────────────────────────────
  if (!aktuelleKarte) {
    const heuteNeu = ladeHeuteNeu()
    const heuteNeuAnzahl = Object.keys(heuteNeu).length
    const maxNeu = einstellungen?.neueKartenProTag ?? 10
    const nochMoeglich = Math.max(0, maxNeu - heuteNeuAnzahl)

    return (
      <div style={styles.container}>
        <div style={styles.fertigWrapper}>
          <div style={styles.fertigEmoji}>
            {sessionInfo.wiederholungAnzahl === 0 && sessionInfo.neuAnzahl === 0 ? '😴' : '🎉'}
          </div>
          <h2 style={styles.fertigTitel}>
            {sessionInfo.wiederholungAnzahl === 0 && sessionInfo.neuAnzahl === 0
              ? 'Nichts fällig'
              : 'Alles erledigt!'}
          </h2>

          {/* Session Statistik */}
          {(sessionInfo.wiederholungAnzahl > 0 || sessionInfo.neuAnzahl > 0) && (
            <div style={styles.fertigStats}>
              {sessionInfo.wiederholungAnzahl > 0 && (
                <div style={styles.fertigStatItem}>
                  <span style={styles.fertigStatZahl}>{sessionInfo.wiederholungAnzahl}</span>
                  <span style={styles.fertigStatLabel}>Wiederholt</span>
                </div>
              )}
              {sessionInfo.neuAnzahl > 0 && (
                <div style={styles.fertigStatItem}>
                  <span style={{ ...styles.fertigStatZahl, color: '#22c55e' }}>
                    {sessionInfo.neuAnzahl}
                  </span>
                  <span style={styles.fertigStatLabel}>Neu gelernt</span>
                </div>
              )}
            </div>
          )}

          {/* Neue Karten heute Info */}
          <div style={styles.heuteBox}>
            <p style={styles.heuteZeile}>
              <span>Neue Karten heute</span>
              <span style={{ fontWeight: 800, color: '#7c3aed' }}>
                {heuteNeuAnzahl} / {maxNeu}
              </span>
            </p>
            <div style={styles.heutebar}>
              <div style={{
                ...styles.heuebarFill,
                width: maxNeu > 0 ? `${Math.min(100, (heuteNeuAnzahl / maxNeu) * 100)}%` : '0%'
              }} />
            </div>
            {nochMoeglich > 0 ? (
              <p style={styles.heuteHinweis}>
                Noch {nochMoeglich} neue {nochMoeglich === 1 ? 'Karte' : 'Karten'} heute möglich
              </p>
            ) : (
              <p style={styles.heuteHinweis}>
                Tageslimit erreicht — morgen gibt es neue Karten 🌙
              </p>
            )}
          </div>

          <button
            onClick={() => { if (onSessionEnde) onSessionEnde(); ladeSession() }}
            style={styles.wiederBtn}
          >
            ↻ Aktualisieren
          </button>
        </div>
      </div>
    )
  }

  const richtung = aktuelleRichtung ?? aktuelleKarte.richtung
  const vorderseite = richtung === 'en_de' ? aktuelleKarte.wort : aktuelleKarte.uebersetzung
  const rueckseite  = richtung === 'en_de' ? aktuelleKarte.uebersetzung : aktuelleKarte.wort

  // ── Lernansicht ──────────────────────────────────────────
  return (
    <div style={styles.container}>

      {/* Progress */}
      <div style={styles.progressHeader}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${fortschritt}%` }} />
        </div>
        <span style={styles.progressText}>{index} / {gesamt}</span>
      </div>

      {/* Session-Chips */}
      <div style={styles.sessionChips}>
        {sessionInfo.wiederholungAnzahl > 0 && (
          <span style={styles.chipWdh}>🔄 {sessionInfo.wiederholungAnzahl} Wdh.</span>
        )}
        {sessionInfo.neuAnzahl > 0 && (
          <span style={styles.chipNeu}>✨ {sessionInfo.neuAnzahl} Neu</span>
        )}
        {istNeu && <span style={styles.chipNeuAktiv}>Neue Karte</span>}
      </div>

      {/* Richtungs-Badge */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <RichtungsBadge richtung={richtung} />
      </div>

      {/* Karte */}
      <div style={{
        ...styles.karte,
        opacity: animiere ? 0 : 1,
        transform: animiere ? 'translateY(12px) scale(0.97)' : 'translateY(0) scale(1)',
        transition: 'all 0.2s ease'
      }}>
        <div style={styles.karteVorderseite}>
          <p style={styles.karteHinweis}>Was bedeutet...</p>
          <h2 style={styles.karteWort}>{vorderseite}</h2>
        </div>
        {aufgedeckt && (
          <div style={styles.karteRueckseite}>
            <div style={styles.karteTrennlinie} />
            <p style={styles.karteUebersetzung}>{rueckseite}</p>
          </div>
        )}
        {!aufgedeckt && (
          <button onClick={() => setAufgedeckt(true)} style={styles.aufdeckenBtn}>
            Antwort zeigen
          </button>
        )}
      </div>

      {/* Bewertung */}
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
      {aufgedeckt && (
        <p style={styles.fsrsHinweis}>
          Intervall: {aktuelleKarte.aktivProfil?.intervall ?? 0} Tag(e)
        </p>
      )}
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────
const styles = {
  container: {
    padding: '1.25rem', minHeight: 'calc(100vh - 140px)',
    display: 'flex', flexDirection: 'column',
  },
  sessionChips: { display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  chipWdh: {
    fontSize: '0.75rem', fontWeight: 700,
    background: '#ede9fe', color: '#7c3aed',
    padding: '3px 10px', borderRadius: 20,
  },
  chipNeu: {
    fontSize: '0.75rem', fontWeight: 700,
    background: '#dcfce7', color: '#16a34a',
    padding: '3px 10px', borderRadius: 20,
  },
  chipNeuAktiv: {
    fontSize: '0.75rem', fontWeight: 700,
    background: '#22c55e', color: 'white',
    padding: '3px 10px', borderRadius: 20,
    marginLeft: 'auto',
  },
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
  progressHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  progressBar: {
    flex: 1, height: 6, background: 'rgba(0,0,0,0.06)',
    borderRadius: 3, overflow: 'hidden'
  },
  progressFill: {
    height: '100%', background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
    borderRadius: 3, transition: 'width 0.4s ease'
  },
  progressText: { fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600 },
  karte: {
    background: 'white', borderRadius: 20, padding: '2rem 1.75rem',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minHeight: 220,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', marginBottom: 20,
  },
  karteVorderseite: { textAlign: 'center', width: '100%' },
  karteHinweis: {
    color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 10px',
    textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600
  },
  karteWort: {
    fontSize: '2.2rem', color: '#1e293b', margin: 0,
    fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, wordBreak: 'break-word'
  },
  karteRueckseite: { width: '100%', textAlign: 'center', marginTop: 16 },
  karteTrennlinie: {
    height: 1, background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)',
    margin: '12px 0'
  },
  karteUebersetzung: {
    fontSize: '1.5rem', color: '#475569', margin: 0, fontWeight: 600
  },
  aufdeckenBtn: {
    marginTop: 24, padding: '0.75rem 2rem',
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    color: 'white', border: 'none', borderRadius: 12,
    fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(124,58,237,0.35)', fontFamily: 'inherit',
  },
  bewertungWrapper: { marginTop: 4 },
  bewertungHinweis: {
    textAlign: 'center', color: '#64748b',
    fontSize: '0.82rem', margin: '0 0 10px', fontWeight: 500
  },
  bewertungGrid: { display: 'flex', gap: 8 },
  fsrsHinweis: { textAlign: 'center', color: '#94a3b8', fontSize: '0.72rem', marginTop: 14 },
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
  fertigStats: { display: 'flex', gap: 24, margin: '16px 0 20px' },
  fertigStatItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  fertigStatZahl: { fontSize: '2rem', fontWeight: 800, color: '#a78bfa', lineHeight: 1 },
  fertigStatLabel: {
    fontSize: '0.72rem', color: '#94a3b8',
    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em'
  },
  // Heute-Box
  heuteBox: {
    background: 'white', borderRadius: 16, padding: '1rem 1.25rem',
    width: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    marginBottom: 20,
  },
  heuteZeile: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: '0.88rem', color: '#475569', margin: '0 0 8px', fontWeight: 600,
  },
  heutebar: {
    height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 8
  },
  heuebarFill: {
    height: '100%', background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
    borderRadius: 4, transition: 'width 0.6s ease'
  },
  heuteHinweis: { fontSize: '0.78rem', color: '#94a3b8', margin: 0 },
  wiederBtn: {
    padding: '0.8rem 2rem', background: 'transparent',
    border: '2px solid rgba(167,139,250,0.4)', color: '#a78bfa',
    borderRadius: 12, fontSize: '0.95rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit'
  }
}
