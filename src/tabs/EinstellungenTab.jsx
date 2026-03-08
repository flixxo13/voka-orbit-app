import { useState, useEffect } from 'react'
import { speichereEinstellungen, aktualisiereLernrichtung, DEFAULT_EINSTELLUNGEN } from '../einstellungen'
import { verarbeiteRichtungswechsel } from '../vokabeln'
import { aktiviereNotifications } from '../firebase'

const ZEITEN_OPTIONEN = [6,7,8,9,10,12,14,16,18,20,21,22]

const RICHTUNGEN = [
  {
    wert: 'smart',
    label: '🧠 Smart',
    beschreibung: 'Schwächere Richtung bekommt mehr Karten — automatisch',
    empfohlen: true,
  },
  {
    wert: 'beide',
    label: '↔️ Beide gleich',
    beschreibung: 'EN→DE und DE→EN gleichwertig, Session-Abstand-Regel aktiv',
  },
  {
    wert: 'en_de',
    label: '🇬🇧 → 🇩🇪 Nur EN→DE',
    beschreibung: 'Immer Englisch auf Vorderseite',
  },
  {
    wert: 'de_en',
    label: '🇩🇪 → 🇬🇧 Nur DE→EN',
    beschreibung: 'Immer Deutsch auf Vorderseite',
  },
  {
    wert: 'abwechselnd',
    label: '🎲 Abwechselnd',
    beschreibung: 'Richtung wird zufällig gewürfelt — ein gemeinsamer Fortschritt',
  },
]

const VOKABEL_MODI = [
  { wert: 'schwerste',      label: '🔥 Schwerste zuerst',       beschreibung: 'Niedrigste Stabilität' },
  { wert: 'ueberfaelligste',label: '⏰ Am längsten überfällig',  beschreibung: 'Wartet am längsten' },
  { wert: 'zufaellig',      label: '🎲 Zufällig',                beschreibung: 'Zufällige fällige Vokabel' },
]

// Auswahl-Karte (Radio-ähnlich)
function AuswahlKarte({ aktiv, onClick, children }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '0.85rem 1rem',
        borderRadius: 14,
        border: `2px solid ${aktiv ? '#7c3aed' : '#e2e8f0'}`,
        background: aktiv ? '#faf5ff' : 'white',
        cursor: 'pointer',
        marginBottom: 8,
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </div>
  )
}

export default function EinstellungenTab({
  einstellungen,
  setEinstellungen,
  notifAktiv,
  handleNotifAktivieren,
  statistik,     // { gesamt, faellig, gelernt }
}) {
  const [einst, setEinst] = useState(einstellungen ?? DEFAULT_EINSTELLUNGEN)
  const [gespeichert, setGespeichert] = useState(false)
  const [richtungLaed, setRichtungLaed] = useState(false)
  const [fehler, setFehler] = useState(null)

  // Wenn einstellungen von außen aktualisiert werden
  useEffect(() => {
    if (einstellungen) setEinst(einstellungen)
  }, [einstellungen])

  function toggleZeit(wert) {
    const aktuell = einst.notifZeiten ?? [8, 12, 18]
    if (aktuell.includes(wert)) {
      if (aktuell.length <= 1) return
      setEinst({ ...einst, notifZeiten: aktuell.filter(z => z !== wert) })
    } else {
      setEinst({ ...einst, notifZeiten: [...aktuell, wert].sort((a, b) => a - b) })
    }
  }

  async function handleRichtungWechseln(neueRichtung) {
    if (neueRichtung === einst.lernrichtung) return
    setRichtungLaed(true)
    setFehler(null)
    try {
      // 1. Profile für neue Richtung anlegen
      await verarbeiteRichtungswechsel(
        einst.lernrichtung,
        neueRichtung,
        einst.aktiveListen ?? ['en_a1']
      )
      // 2. Einstellung speichern
      const aktualisiert = await aktualisiereLernrichtung(einst, neueRichtung)
      setEinst(aktualisiert)
      setEinstellungen(aktualisiert)
    } catch (err) {
      setFehler('Fehler beim Wechseln der Richtung — bitte nochmal versuchen')
      console.error(err)
    }
    setRichtungLaed(false)
  }

  async function handleSpeichern() {
    try {
      await speichereEinstellungen(einst)
      setEinstellungen(einst)
      setGespeichert(true)
      setTimeout(() => setGespeichert(false), 2500)
    } catch {
      setFehler('Fehler beim Speichern')
    }
  }

  return (
    <div style={styles.container}>

      {/* ── Lernrichtung ── */}
      <div style={styles.sektion}>
        <h3 style={styles.sektionTitel}>🧭 Lernrichtung</h3>

        {richtungLaed && (
          <div style={styles.ladeHinweis}>
            ⏳ Profile werden vorbereitet...
          </div>
        )}

        {RICHTUNGEN.map(r => (
          <AuswahlKarte
            key={r.wert}
            aktiv={einst.lernrichtung === r.wert}
            onClick={() => !richtungLaed && handleRichtungWechseln(r.wert)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontWeight: 700, fontSize: '0.9rem',
                    color: einst.lernrichtung === r.wert ? '#7c3aed' : '#1e293b'
                  }}>
                    {r.label}
                  </span>
                  {r.empfohlen && (
                    <span style={styles.empfohlenBadge}>Empfohlen</span>
                  )}
                </div>
                <p style={styles.auswahlBeschreibung}>{r.beschreibung}</p>
              </div>
              <div style={{
                ...styles.radioKreis,
                borderColor: einst.lernrichtung === r.wert ? '#7c3aed' : '#cbd5e1',
                background: einst.lernrichtung === r.wert ? '#7c3aed' : 'white',
              }}>
                {einst.lernrichtung === r.wert && (
                  <div style={styles.radioKern} />
                )}
              </div>
            </div>
          </AuswahlKarte>
        ))}
      </div>

      {/* ── Notifications ── */}
      <div style={styles.sektion}>
        <h3 style={styles.sektionTitel}>🔔 Benachrichtigungen</h3>

        {!notifAktiv ? (
          <button onClick={handleNotifAktivieren} style={styles.primaryBtn}>
            🔔 Notifications aktivieren
          </button>
        ) : (
          <div style={styles.aktivBox}>✅ Notifications sind aktiv</div>
        )}

        {/* Erinnerungszeiten */}
        <p style={{ ...styles.label, marginTop: 16, marginBottom: 8 }}>Erinnerungszeiten</p>
        <div style={styles.zeitenGrid}>
          {ZEITEN_OPTIONEN.map(z => {
            const aktiv = (einst.notifZeiten ?? []).includes(z)
            return (
              <button
                key={z}
                onClick={() => toggleZeit(z)}
                style={{
                  ...styles.zeitBtn,
                  borderColor: aktiv ? '#7c3aed' : '#e2e8f0',
                  background: aktiv ? '#7c3aed' : 'white',
                  color: aktiv ? 'white' : '#475569',
                  fontWeight: aktiv ? 700 : 500,
                }}
              >
                {z}:00
              </button>
            )
          })}
        </div>

        {/* Benachrichtigungs-Modus */}
        <p style={{ ...styles.label, marginTop: 16, marginBottom: 8 }}>
          Welche Vokabel in der Meldung?
        </p>
        {VOKABEL_MODI.map(m => (
          <AuswahlKarte
            key={m.wert}
            aktiv={einst.vokabelModus === m.wert}
            onClick={() => setEinst({ ...einst, vokabelModus: m.wert })}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{
                  fontWeight: 700, fontSize: '0.88rem',
                  color: einst.vokabelModus === m.wert ? '#7c3aed' : '#1e293b'
                }}>
                  {m.label}
                </span>
                <p style={styles.auswahlBeschreibung}>{m.beschreibung}</p>
              </div>
              <div style={{
                ...styles.radioKreis,
                borderColor: einst.vokabelModus === m.wert ? '#7c3aed' : '#cbd5e1',
                background: einst.vokabelModus === m.wert ? '#7c3aed' : 'white',
              }}>
                {einst.vokabelModus === m.wert && <div style={styles.radioKern} />}
              </div>
            </div>
          </AuswahlKarte>
        ))}
      </div>

      {/* ── Statistik ── */}
      <div style={styles.sektion}>
        <h3 style={styles.sektionTitel}>📊 Statistik</h3>
        <div style={styles.statistikGrid}>
          <div style={styles.statistikKarte}>
            <span style={styles.statistikZahl}>{statistik?.gesamt ?? 0}</span>
            <span style={styles.statistikLabel}>Gesamt</span>
          </div>
          <div style={styles.statistikKarte}>
            <span style={{ ...styles.statistikZahl, color: '#f97316' }}>
              {statistik?.faellig ?? 0}
            </span>
            <span style={styles.statistikLabel}>Fällig</span>
          </div>
          <div style={styles.statistikKarte}>
            <span style={{ ...styles.statistikZahl, color: '#22c55e' }}>
              {statistik?.gelernt ?? 0}
            </span>
            <span style={styles.statistikLabel}>Gelernt</span>
          </div>
        </div>
      </div>

      {/* ── Fehler ── */}
      {fehler && (
        <div style={styles.fehlerBox}>{fehler}</div>
      )}

      {/* ── Speichern ── */}
      <button onClick={handleSpeichern} style={{ ...styles.primaryBtn, marginBottom: 8 }}>
        💾 Einstellungen speichern
      </button>

      {gespeichert && (
        <p style={styles.gespeichertText}>✅ Gespeichert!</p>
      )}

      <div style={{ height: 32 }} />

    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────
const styles = {
  container: { padding: '1.25rem' },

  sektion: {
    background: 'white',
    borderRadius: 20,
    padding: '1.25rem',
    marginBottom: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },

  sektionTitel: {
    fontSize: '0.95rem', fontWeight: 800, color: '#1e293b',
    margin: '0 0 14px', letterSpacing: '-0.01em'
  },

  label: {
    fontSize: '0.75rem', fontWeight: 700, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    display: 'block', margin: 0
  },

  auswahlBeschreibung: {
    fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0', lineHeight: 1.4
  },

  empfohlenBadge: {
    fontSize: '0.65rem', fontWeight: 700,
    background: '#ede9fe', color: '#7c3aed',
    padding: '1px 6px', borderRadius: 6,
    letterSpacing: '0.02em'
  },

  radioKreis: {
    width: 20, height: 20, borderRadius: '50%',
    border: '2px solid', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s'
  },
  radioKern: {
    width: 8, height: 8, borderRadius: '50%', background: 'white'
  },

  ladeHinweis: {
    background: '#faf5ff', border: '1px solid #ede9fe',
    borderRadius: 10, padding: '0.65rem 1rem',
    fontSize: '0.82rem', color: '#7c3aed',
    fontWeight: 600, marginBottom: 12,
    textAlign: 'center'
  },

  aktivBox: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: 12, padding: '0.65rem 1rem',
    fontSize: '0.88rem', color: '#16a34a',
    fontWeight: 600, textAlign: 'center'
  },

  zeitenGrid: {
    display: 'flex', flexWrap: 'wrap', gap: 8
  },
  zeitBtn: {
    padding: '0.4rem 0.8rem',
    borderRadius: 20, border: '2px solid',
    fontSize: '0.82rem', cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all 0.12s',
  },

  statistikGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10
  },
  statistikKarte: {
    background: '#f8fafc', borderRadius: 14,
    padding: '1rem 0.5rem',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 4
  },
  statistikZahl: {
    fontSize: '1.8rem', fontWeight: 800,
    color: '#7c3aed', letterSpacing: '-0.03em', lineHeight: 1
  },
  statistikLabel: {
    fontSize: '0.72rem', color: '#94a3b8',
    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em'
  },

  primaryBtn: {
    width: '100%', padding: '0.9rem',
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    color: 'white', border: 'none', borderRadius: 14,
    fontSize: '1rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
    letterSpacing: '-0.01em',
  },

  gespeichertText: {
    textAlign: 'center', color: '#16a34a',
    fontWeight: 700, fontSize: '0.9rem', margin: '8px 0 0'
  },

  fehlerBox: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 12, padding: '0.75rem 1rem',
    fontSize: '0.85rem', color: '#dc2626',
    fontWeight: 600, marginBottom: 12,
    textAlign: 'center'
  },
}
