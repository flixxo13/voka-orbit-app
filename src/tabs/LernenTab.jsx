import { useState, useEffect, useCallback, useRef } from 'react'
import { ladeAlleKarten, speichereFortschritt } from '../vokabeln'
import { ladeSessionKarten, berechneNaechsteWiederholung } from '../fsrs'

const FLAGGE = { en: '🇬🇧', de: '🇩🇪' }

// ── Buchstaben-Hinweis ────────────────────────────────────
function zeigeHinweis(wort) {
  const l = wort.length
  const zeige = new Set([0])
  if (l >= 5) zeige.add(Math.floor(l * 0.6))
  if (l >= 8) { zeige.add(Math.floor(l * 0.4)); zeige.add(l - 2) }
  return wort.split('').map((c, i) =>
    c === ' ' ? '\u00a0' : (zeige.has(i) ? c : '_')
  ).join('')
}

function RichtungsBadge({ richtung }) {
  const [von, nach] = richtung === 'en_de' ? [FLAGGE.en, FLAGGE.de] : [FLAGGE.de, FLAGGE.en]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '4px 12px', fontSize: '0.9rem', backdropFilter: 'blur(8px)' }}>
      <span>{von}</span>
      <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>→</span>
      <span>{nach}</span>
    </div>
  )
}

function BewertungsBtn({ wert, label, farbe, onClick, gesperrt }) {
  const [gedrueckt, setGedrueckt] = useState(false)
  return (
    <button
      onClick={() => { if (gesperrt) return; setGedrueckt(true); setTimeout(() => onClick(wert), 120) }}
      style={{
        flex: 1, padding: '0.9rem 0.4rem',
        background: gesperrt ? '#f1f5f9' : gedrueckt ? farbe : 'white',
        color: gesperrt ? '#cbd5e1' : gedrueckt ? 'white' : farbe,
        border: `2px solid ${gesperrt ? '#e2e8f0' : farbe}`,
        borderRadius: 14, fontSize: '0.82rem',
        fontWeight: 700, cursor: gesperrt ? 'not-allowed' : 'pointer',
        transition: 'all 0.12s ease',
        transform: gedrueckt ? 'scale(0.95)' : 'scale(1)',
        fontFamily: 'inherit', lineHeight: 1.3,
        boxShadow: gesperrt || gedrueckt ? 'none' : `0 2px 8px ${farbe}33`,
        opacity: gesperrt ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  )
}

// ── localStorage ──────────────────────────────────────────
function heuteDatumKey() { return 'vokaorbit_neu_' + new Date().toISOString().slice(0, 10) }
function ladeHeuteNeu() {
  try { const g = localStorage.getItem(heuteDatumKey()); return g ? JSON.parse(g) : {} } catch { return {} }
}
function speichereHeuteNeu(ids) {
  try {
    localStorage.setItem(heuteDatumKey(), JSON.stringify(ids))
    Object.keys(localStorage).filter(k => k.startsWith('vokaorbit_neu_') && k !== heuteDatumKey()).forEach(k => localStorage.removeItem(k))
  } catch {}
}

// ─────────────────────────────────────────────────────────
export default function LernenTab({ einstellungen, onSessionEnde, deepLinkVokabel }) {
  const [laden, setLaden]               = useState(true)
  const [sessionKarten, setSessionKarten] = useState([])
  const [index, setIndex]               = useState(0)
  const [aufgedeckt, setAufgedeckt]     = useState(false)
  const [sessionInfo, setSessionInfo]   = useState({ wiederholungAnzahl: 0, neuAnzahl: 0 })
  const [aktuelleRichtung, setAktuelleRichtung] = useState(null)
  const [animiere, setAnimiere]         = useState(false)

  // Hint-States
  const [buchstabenHintGezeigt, setBuchstabenHintGezeigt] = useState(false)
  const [eselsBrueckeZeigen, setEselsBrueckeZeigen]       = useState(false)
  const [satzUebersetzungZeigen, setSatzUebersetzungZeigen] = useState(false)
  const [geminiDaten, setGeminiDaten]   = useState(null)   // { beispielSatz, beispielSatzUebersetzung, eselsBruecke }
  const [geminiLaed, setGeminiLaed]     = useState(false)
  const [geminiGesperrt, setGeminiGesperrt] = useState(false) // Score-Cap durch Hint
  const [geminiError, setGeminiError]           = useState(null)
  const prefetchRef = useRef(null)

  const lernrichtung = einstellungen?.lernrichtung ?? 'smart'
  const aktiveListen = einstellungen?.aktiveListen ?? ['en_a1']
  const nutzerprofil = einstellungen?.nutzerprofil ?? { niveau: 'B1', lernziel: 'alltag' }

  // ── Session laden ─────────────────────────────────────
  const ladeSession = useCallback(async () => {
    setLaden(true)
    try {
      const heuteNeu = ladeHeuteNeu()
      const { alleKarten } = await ladeAlleKarten(aktiveListen, lernrichtung)
      const { session, wiederholungAnzahl, neuAnzahl } = ladeSessionKarten(alleKarten, einstellungen ?? {}, heuteNeu)
      let finalSession = session
      if (deepLinkVokabel) {
        const idx = session.findIndex(k => k.id === deepLinkVokabel.id)
        if (idx > 0) { const k = session[idx]; finalSession = [k, ...session.filter((_, i) => i !== idx)] }
      }
      setSessionKarten(finalSession)
      setSessionInfo({ wiederholungAnzahl, neuAnzahl })
      setIndex(0)
      setAufgedeckt(false)
      resetHints()
      if (finalSession.length > 0) setAktuelleRichtung(waehleSofortigeRichtung(finalSession[0], lernrichtung))
    } catch (err) { console.error('Fehler beim Laden:', err) }
    setLaden(false)
  }, [aktiveListen, lernrichtung, einstellungen])

  useEffect(() => { ladeSession() }, [ladeSession])

  function resetHints() {
    setBuchstabenHintGezeigt(false)
    setEselsBrueckeZeigen(false)
    setSatzUebersetzungZeigen(false)
    setGeminiDaten(null)
    setGeminiLaed(false)
    setGeminiGesperrt(false)
    setGeminiError(null)
    prefetchRef.current = null
  }

  function waehleSofortigeRichtung(karte, richtung) {
    if (richtung === 'abwechselnd') return Math.random() < 0.5 ? 'en_de' : 'de_en'
    return karte.richtung
  }

  // ── Gemini aufrufen ───────────────────────────────────
  async function ladeGeminiHints(karte, richtung) {
    if (geminiDaten || geminiLaed) return
    setGeminiLaed(true)
    setGeminiError(null)
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vokabelId: karte.id,
          wort: karte.wort,
          uebersetzung: karte.uebersetzung,
          richtung,
          niveau: nutzerprofil.niveau,
          lernziel: nutzerprofil.lernziel,
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

  // ── Aufdecken → Gemini prefetch starten ──────────────
  function handleAufdecken() {
    setAufgedeckt(true)
    const karte = sessionKarten[index]
    if (karte) ladeGeminiHints(karte, aktuelleRichtung ?? karte.richtung)
  }

  // ── Buchstaben-Hint ───────────────────────────────────
  function handleBuchstabenHint() {
    setBuchstabenHintGezeigt(true)
    setGeminiGesperrt(true) // Score-Cap
  }

  // ── Bewerten ──────────────────────────────────────────
  async function bewerteKarte(bewertung) {
    const karte = sessionKarten[index]
    if (!karte) return

    // Score-Cap: wenn Hint vor Aufdecken → max Schwer (2)
    const finalBewertung = geminiGesperrt ? Math.min(bewertung, 2) : bewertung

    const richtung = aktuelleRichtung ?? karte.richtung
    const altesProfil = karte.aktivProfil ?? {}
    const neuesProfil = berechneNaechsteWiederholung(altesProfil, finalBewertung)

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
      resetHints()
      setAnimiere(false)
      if (naechsterIndex < sessionKarten.length) {
        setAktuelleRichtung(waehleSofortigeRichtung(sessionKarten[naechsterIndex], lernrichtung))
      }
    }, 200)
  }

  // ── Ladescreen ────────────────────────────────────────
  if (laden) {
    return (
      <div style={styles.container}>
        <div style={styles.ladeWrapper}>
          <div style={styles.spinner} />
          <p style={{ color: '#94a3b8', marginTop: 16, fontSize: '0.9rem' }}>Karten werden geladen...</p>
        </div>
      </div>
    )
  }

  const aktuelleKarte = sessionKarten[index]
  const gesamt = sessionKarten.length
  const fortschritt = gesamt > 0 ? Math.round((index / gesamt) * 100) : 100
  const istNeu = !aktuelleKarte?.aktivProfil

  // Keine Listen aktiv
  if (!aktuelleKarte && (einstellungen?.aktiveListen ?? []).length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.fertigWrapper}>
          <div style={styles.fertigEmoji}>📂</div>
          <h2 style={styles.fertigTitel}>Keine Liste aktiv</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.6 }}>
            Aktiviere mindestens eine Liste im Entdecken-Tab.
          </p>
        </div>
      </div>
    )
  }

  // Fertig-Screen
  if (!aktuelleKarte) {
    const heuteNeu = ladeHeuteNeu()
    const heuteNeuAnzahl = Object.keys(heuteNeu).length
    const maxNeu = einstellungen?.neueKartenProTag ?? 10
    const nochMoeglich = Math.max(0, maxNeu - heuteNeuAnzahl)
    return (
      <div style={styles.container}>
        <div style={styles.fertigWrapper}>
          <div style={styles.fertigEmoji}>{sessionInfo.wiederholungAnzahl === 0 && sessionInfo.neuAnzahl === 0 ? '😴' : '🎉'}</div>
          <h2 style={styles.fertigTitel}>{sessionInfo.wiederholungAnzahl === 0 && sessionInfo.neuAnzahl === 0 ? 'Nichts fällig' : 'Alles erledigt!'}</h2>
          {(sessionInfo.wiederholungAnzahl > 0 || sessionInfo.neuAnzahl > 0) && (
            <div style={styles.fertigStats}>
              {sessionInfo.wiederholungAnzahl > 0 && <div style={styles.fertigStatItem}><span style={styles.fertigStatZahl}>{sessionInfo.wiederholungAnzahl}</span><span style={styles.fertigStatLabel}>Wiederholt</span></div>}
              {sessionInfo.neuAnzahl > 0 && <div style={styles.fertigStatItem}><span style={{ ...styles.fertigStatZahl, color: '#22c55e' }}>{sessionInfo.neuAnzahl}</span><span style={styles.fertigStatLabel}>Neu</span></div>}
            </div>
          )}
          <div style={styles.heuteBox}>
            <div style={styles.heuteZeile}>
              <span>Heute neue Karten</span>
              <span style={{ color: '#7c3aed' }}>{heuteNeuAnzahl} / {maxNeu}</span>
            </div>
            <div style={styles.heutebar}><div style={{ ...styles.heuebarFill, width: `${Math.min(100, (heuteNeuAnzahl / maxNeu) * 100)}%` }} /></div>
            {nochMoeglich > 0 ? <p style={styles.heuteHinweis}>Noch {nochMoeglich} neue Karten möglich</p> : <p style={styles.heuteHinweis}>Tageslimit erreicht — morgen gibt es neue Karten 🌙</p>}
          </div>
          <button onClick={() => { if (onSessionEnde) onSessionEnde(); ladeSession() }} style={styles.wiederBtn}>↻ Aktualisieren</button>
        </div>
      </div>
    )
  }

  const richtung = aktuelleRichtung ?? aktuelleKarte.richtung
  const vorderseite = richtung === 'en_de' ? aktuelleKarte.wort : aktuelleKarte.uebersetzung
  const rueckseite  = richtung === 'en_de' ? aktuelleKarte.uebersetzung : aktuelleKarte.wort

  // ── Lernansicht ───────────────────────────────────────
  return (
    <div style={styles.container}>

      {/* Progress */}
      <div style={styles.progressHeader}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${fortschritt}%` }} />
        </div>
        <span style={styles.progressText}>{index} / {gesamt}</span>
      </div>

      {/* Chips */}
      <div style={styles.sessionChips}>
        {sessionInfo.wiederholungAnzahl > 0 && <span style={styles.chipWdh}>🔄 {sessionInfo.wiederholungAnzahl} Wdh.</span>}
        {sessionInfo.neuAnzahl > 0 && <span style={styles.chipNeu}>✨ {sessionInfo.neuAnzahl} Neu</span>}
        {istNeu && <span style={styles.chipNeuAktiv}>Neue Karte</span>}
        {geminiGesperrt && <span style={styles.chipCap}>⚡ Max. Schwer</span>}
      </div>

      {/* Richtungs-Badge */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <RichtungsBadge richtung={richtung} />
      </div>

      {/* Karte */}
      <div style={{ ...styles.karte, opacity: animiere ? 0 : 1, transform: animiere ? 'translateY(12px) scale(0.97)' : 'translateY(0) scale(1)', transition: 'all 0.2s ease' }}>

        {/* Vorderseite */}
        <div style={styles.karteVorderseite}>
          <p style={styles.karteHinweis}>Was bedeutet...</p>
          <h2 style={styles.karteWort}>{vorderseite}</h2>
        </div>

        {/* Buchstaben-Hint (vor Aufdecken) */}
        {!aufgedeckt && (
          <div style={{ width: '100%', marginTop: 16 }}>
            {!buchstabenHintGezeigt ? (
              <button onClick={handleBuchstabenHint} style={styles.hintBtn}>
                🔍 Kleiner Tipp
              </button>
            ) : (
              <div style={styles.buchstabenHintBox}>
                <span style={styles.buchstabenHintLabel}>Buchstaben-Tipp</span>
                <span style={styles.buchstabenHintWort}>{zeigeHinweis(rueckseite)}</span>
              </div>
            )}
          </div>
        )}

        {/* Aufdecken-Button */}
        {!aufgedeckt && (
          <button onClick={handleAufdecken} style={styles.aufdeckenBtn}>
            Antwort zeigen
          </button>
        )}

        {/* Rückseite */}
        {aufgedeckt && (
          <div style={styles.karteRueckseite}>
            <div style={styles.karteTrennlinie} />
            <p style={styles.karteUebersetzung}>{rueckseite}</p>

            {/* Beispielsatz */}
            {(geminiLaed || geminiDaten) && (
              <div style={styles.beispielSatzBox}>
                {geminiLaed && !geminiDaten ? (
                  <div style={styles.geminiLade}>
                    <div style={styles.geminiSpinner} />
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>KI generiert...</span>
                  </div>
                ) : geminiDaten ? (
                  <>
                    <p style={styles.beispielSatz}>"{geminiDaten.beispielSatz}"</p>
                    {!satzUebersetzungZeigen ? (
                      <button onClick={() => setSatzUebersetzungZeigen(true)} style={styles.uebersetzungBtn}>
                        ▼ Auf Deutsch
                      </button>
                    ) : (
                      <p style={styles.beispielSatzUebersetzung}>„{geminiDaten.beispielSatzUebersetzung}"</p>
                    )}
                  </>
                ) : null}
              </div>
            )}

            {/* Gemini Error (Debug) */}
            {geminiError && (
              <div style={{ width: '100%', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.6rem 0.8rem', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>⚠️ KI-Fehler: {geminiError}</span>
              </div>
            )}

            {/* Eselsbrücke */}
            {geminiDaten && (
              <div style={styles.eselsBrueckeWrapper}>
                {!eselsBrueckeZeigen ? (
                  <button onClick={() => setEselsBrueckeZeigen(true)} style={styles.eselBtn}>
                    💡 Eselsbrücke
                  </button>
                ) : (
                  <div style={styles.eselsBrueckeBox}>
                    <span style={styles.eselsBrueckeLabel}>💡 Eselsbrücke</span>
                    <p style={styles.eselsBrueckeText}>{geminiDaten.eselsBruecke}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bewertung */}
      {aufgedeckt && (
        <div style={styles.bewertungWrapper}>
          <p style={styles.bewertungHinweis}>
            {geminiGesperrt ? '⚡ Hint genutzt — max. Schwer' : 'Wie gut wusstest du es?'}
          </p>
          <div style={styles.bewertungGrid}>
            <BewertungsBtn wert={1} label={"😵\nNochmal"} farbe="#ef4444" onClick={bewerteKarte} />
            <BewertungsBtn wert={2} label={"😕\nSchwer"}  farbe="#f97316" onClick={bewerteKarte} />
            <BewertungsBtn wert={3} label={"🙂\nGut"}    farbe="#22c55e" onClick={bewerteKarte} gesperrt={geminiGesperrt} />
            <BewertungsBtn wert={4} label={"😄\nLeicht"} farbe="#3b82f6" onClick={bewerteKarte} gesperrt={geminiGesperrt} />
          </div>
        </div>
      )}
      {aufgedeckt && (
        <p style={styles.fsrsHinweis}>Intervall: {aktuelleKarte.aktivProfil?.intervall ?? 0} Tag(e)</p>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────
const styles = {
  container: { padding: '1.25rem', minHeight: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' },
  sessionChips: { display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  chipWdh:     { fontSize: '0.75rem', fontWeight: 700, background: '#ede9fe', color: '#7c3aed', padding: '3px 10px', borderRadius: 20 },
  chipNeu:     { fontSize: '0.75rem', fontWeight: 700, background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: 20 },
  chipNeuAktiv:{ fontSize: '0.75rem', fontWeight: 700, background: '#22c55e', color: 'white', padding: '3px 10px', borderRadius: 20, marginLeft: 'auto' },
  chipCap:     { fontSize: '0.75rem', fontWeight: 700, background: '#fef3c7', color: '#d97706', padding: '3px 10px', borderRadius: 20 },
  ladeWrapper: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  spinner:     { width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(167,139,250,0.2)', borderTop: '3px solid #a78bfa', animation: 'spin 0.8s linear infinite' },
  progressHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  progressBar:    { flex: 1, height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: '100%', background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', borderRadius: 3, transition: 'width 0.4s ease' },
  progressText:   { fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600 },

  karte: { background: 'white', borderRadius: 20, padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  karteVorderseite: { textAlign: 'center', width: '100%' },
  karteHinweis: { color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 },
  karteWort:    { fontSize: '2.2rem', color: '#1e293b', margin: 0, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, wordBreak: 'break-word' },

  // Buchstaben-Hint
  hintBtn: { width: '100%', padding: '0.55rem', background: 'transparent', border: '1.5px dashed #cbd5e1', borderRadius: 10, fontSize: '0.82rem', color: '#94a3b8', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.01em' },
  buchstabenHintBox: { width: '100%', background: '#f8fafc', borderRadius: 10, padding: '0.6rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, border: '1.5px solid #e2e8f0' },
  buchstabenHintLabel: { fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' },
  buchstabenHintWort:  { fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed', letterSpacing: '0.12em', fontFamily: 'monospace' },

  aufdeckenBtn: { marginTop: 20, padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.35)', fontFamily: 'inherit' },

  // Rückseite
  karteRueckseite:   { width: '100%', textAlign: 'center', marginTop: 4 },
  karteTrennlinie:   { height: 1, background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)', margin: '12px 0' },
  karteUebersetzung: { fontSize: '1.5rem', color: '#475569', margin: '0 0 16px', fontWeight: 600 },

  // Beispielsatz
  beispielSatzBox: { width: '100%', background: '#f8fafc', borderRadius: 12, padding: '0.9rem 1rem', marginBottom: 10, border: '1px solid #e2e8f0', minHeight: 44 },
  geminiLade: { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' },
  geminiSpinner: { width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(124,58,237,0.2)', borderTop: '2px solid #7c3aed', animation: 'spin 0.7s linear infinite' },
  beispielSatz: { fontSize: '0.88rem', color: '#334155', margin: '0 0 8px', fontStyle: 'italic', lineHeight: 1.5 },
  uebersetzungBtn: { background: 'none', border: 'none', color: '#7c3aed', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', padding: '2px 0', fontFamily: 'inherit' },
  beispielSatzUebersetzung: { fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.4, fontStyle: 'italic' },

  // Eselsbrücke
  eselsBrueckeWrapper: { width: '100%' },
  eselBtn: { width: '100%', padding: '0.6rem', background: '#faf5ff', border: '1.5px solid #ede9fe', borderRadius: 10, fontSize: '0.85rem', color: '#7c3aed', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 },
  eselsBrueckeBox: { background: 'linear-gradient(135deg, #faf5ff, #ede9fe)', borderRadius: 12, padding: '0.85rem 1rem', border: '1.5px solid #ddd6fe' },
  eselsBrueckeLabel: { display: 'block', fontSize: '0.68rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 },
  eselsBrueckeText:  { fontSize: '0.88rem', color: '#4c1d95', margin: 0, lineHeight: 1.5, fontStyle: 'italic' },

  // Bewertung
  bewertungWrapper: { marginTop: 4 },
  bewertungHinweis: { textAlign: 'center', color: '#64748b', fontSize: '0.82rem', margin: '0 0 10px', fontWeight: 500 },
  bewertungGrid:    { display: 'flex', gap: 8 },
  fsrsHinweis:      { textAlign: 'center', color: '#94a3b8', fontSize: '0.72rem', marginTop: 14 },

  // Fertig
  fertigWrapper: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' },
  fertigEmoji:   { fontSize: '4rem', marginBottom: 16 },
  fertigTitel:   { fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', margin: '0 0 12px', letterSpacing: '-0.02em' },
  fertigStats:   { display: 'flex', gap: 24, margin: '16px 0 20px' },
  fertigStatItem:{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  fertigStatZahl:{ fontSize: '2rem', fontWeight: 800, color: '#a78bfa', lineHeight: 1 },
  fertigStatLabel:{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' },
  heuteBox:      { background: 'white', borderRadius: 16, padding: '1rem 1.25rem', width: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 },
  heuteZeile:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', color: '#475569', margin: '0 0 8px', fontWeight: 600 },
  heutebar:      { height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  heuebarFill:   { height: '100%', background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', borderRadius: 4, transition: 'width 0.6s ease' },
  heuteHinweis:  { fontSize: '0.78rem', color: '#94a3b8', margin: 0 },
  wiederBtn:     { padding: '0.8rem 2rem', background: 'transparent', border: '2px solid rgba(167,139,250,0.4)', color: '#a78bfa', borderRadius: 12, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
}
