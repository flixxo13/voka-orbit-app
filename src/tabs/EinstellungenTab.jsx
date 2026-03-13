// ============================================================
// VokaOrbit — tabs/EinstellungenTab.jsx
// Einstellungen-Tab: Lernrichtung, Neue Karten, Notifications, Profil.
// Nutzt useEinstellungen() statt Props → kein Prop-Drilling.
// BUG FIX: handleRichtungWechseln ist jetzt definiert.
// ============================================================

import { useState, useEffect } from 'react'
import { useEinstellungen } from '../hooks/useEinstellungen'
import { speichereEinstellungen, aktualisiereLernrichtung, DEFAULT_EINSTELLUNGEN } from '../einstellungen'
import { verarbeiteRichtungswechsel } from '../core/storage'
import { aktiviereNotifications } from '../firebase'
import { tokens, composite } from '../design/tokens'

// ── Konstanten ───────────────────────────────────────────────
const ZEITEN_OPTIONEN = [6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 21, 22]

const RICHTUNGEN = [
  { wert: 'smart',       label: '🧠 Smart',          beschreibung: 'Schwächere Richtung bekommt mehr Karten — automatisch', empfohlen: true },
  { wert: 'beide',       label: '↔️ Beide gleich',   beschreibung: 'EN→DE und DE→EN gleichwertig, Session-Abstand-Regel aktiv' },
  { wert: 'en_de',       label: '🇬🇧 → 🇩🇪 Nur EN→DE', beschreibung: 'Immer Englisch auf Vorderseite' },
  { wert: 'de_en',       label: '🇩🇪 → 🇬🇧 Nur DE→EN', beschreibung: 'Immer Deutsch auf Vorderseite' },
  { wert: 'abwechselnd', label: '🎲 Abwechselnd',     beschreibung: 'Richtung wird zufällig gewürfelt — ein gemeinsamer Fortschritt' },
]

const VOKABEL_MODI = [
  { wert: 'schwerste',       label: '🔥 Schwerste zuerst',      beschreibung: 'Niedrigste Stabilität' },
  { wert: 'ueberfaelligste', label: '⏰ Am längsten überfällig', beschreibung: 'Wartet am längsten' },
  { wert: 'zufaellig',       label: '🎲 Zufällig',               beschreibung: 'Zufällige fällige Vokabel' },
]

const NOTIF_TYPEN = [
  { key: 'wiederholungen', icon: '🔄', label: 'Fällige Wiederholungen', beschreibung: 'Erinnerung wenn Vokabeln zur Wiederholung fällig sind', defaultAktiv: true,  defaultZeiten: [8, 12, 18] },
  { key: 'neueKarten',     icon: '✨', label: 'Neue Karten verfügbar',   beschreibung: 'Erinnerung wenn du heute noch neue Karten lernen kannst',  defaultAktiv: true,  defaultZeiten: [8] },
  { key: 'streak',         icon: '🔥', label: 'Streak-Erinnerung',       beschreibung: 'Erinnerung wenn du heute noch nicht gelernt hast',          defaultAktiv: true,  defaultZeiten: [20] },
  { key: 'rueckblick',     icon: '🌙', label: 'Tagesrückblick',          beschreibung: 'Zusammenfassung: was gelernt, was morgen fällig',            defaultAktiv: false, defaultZeiten: [21] },
]

// ── Auswahl-Karte ─────────────────────────────────────────────
function AuswahlKarte({ aktiv, onClick, children }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '0.85rem 1rem',
        borderRadius: tokens.radius.xl,
        border: `2px solid ${aktiv ? tokens.colors.primary : tokens.colors.border}`,
        background: aktiv ? tokens.colors.primaryBg : tokens.colors.surface,
        cursor: 'pointer',
        marginBottom: tokens.spacing.sm,
        transition: tokens.transition.default,
      }}
    >
      {children}
    </div>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────
export default function EinstellungenTab() {
  // Context statt Props
  const {
    einstellungen,
    setEinstellungen: setGlobalEinstellungen,
    notifAktiv,
    handleNotifAktivieren,
    statistik,
  } = useEinstellungen()

  const [einst, setEinst]           = useState(einstellungen ?? DEFAULT_EINSTELLUNGEN)
  const [gespeichert, setGespeichert] = useState(false)
  const [richtungLaed, setRichtungLaed] = useState(false)
  const [fehler, setFehler]         = useState(null)

  // Wenn globale Einstellungen von außen aktualisiert werden
  useEffect(() => {
    if (einstellungen) setEinst(einstellungen)
  }, [einstellungen])

  // ── BUG FIX: handleRichtungWechseln ──────────────────────
  // War vorher undefined → App-Crash beim Klick auf Lernrichtung
  async function handleRichtungWechseln(neueRichtung) {
    if (richtungLaed) return
    if (neueRichtung === einst.lernrichtung) return  // keine Änderung

    setRichtungLaed(true)
    setFehler(null)
    try {
      // 1. Einstellungen aktualisieren (State + Firestore)
      const aktualisiert = await aktualisiereLernrichtung(einst, neueRichtung)

      // 2. FSRS-Profile für neue Richtung vorbereiten
      await verarbeiteRichtungswechsel(
        einst.lernrichtung,
        neueRichtung,
        einst.aktiveListen ?? ['en_a1']
      )

      // 3. Lokalen State + globalen Context aktualisieren
      setEinst(aktualisiert)
      setGlobalEinstellungen(aktualisiert)
    } catch (err) {
      setFehler('Fehler beim Richtungswechsel. Bitte erneut versuchen.')
      console.error('handleRichtungWechseln:', err)
    } finally {
      setRichtungLaed(false)
    }
  }

  // ── Notification-Helpers ──────────────────────────────────
  function toggleZeitFuerTyp(typ, z) {
    const typen    = einst.notifTypen ?? {}
    const typEinst = typen[typ] ?? {}
    const aktuell  = typEinst.zeiten ?? []
    let neueZeiten
    if (aktuell.includes(z)) {
      if (aktuell.length <= 1) return
      neueZeiten = aktuell.filter(t => t !== z)
    } else {
      neueZeiten = [...aktuell, z].sort((a, b) => a - b)
    }
    setEinst({ ...einst, notifTypen: { ...typen, [typ]: { ...typEinst, zeiten: neueZeiten } } })
  }

  function toggleTypAktiv(typ) {
    const typen    = einst.notifTypen ?? {}
    const typEinst = typen[typ] ?? {}
    setEinst({ ...einst, notifTypen: { ...typen, [typ]: { ...typEinst, aktiv: !(typEinst.aktiv ?? true) } } })
  }

  // ── Speichern ─────────────────────────────────────────────
  async function handleSpeichern() {
    try {
      await speichereEinstellungen(einst)
      setGlobalEinstellungen(einst)
      setGespeichert(true)
      setTimeout(() => setGespeichert(false), 2500)
    } catch {
      setFehler('Fehler beim Speichern')
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={styles.container}>

      {/* ── Lernrichtung ── */}
      <div style={styles.sektion}>
        <h3 style={styles.sektionTitel}>🧭 Lernrichtung</h3>

        {richtungLaed && (
          <div style={styles.ladeHinweis}>⏳ Profile werden vorbereitet...</div>
        )}

        {RICHTUNGEN.map(r => (
          <AuswahlKarte
            key={r.wert}
            aktiv={einst.lernrichtung === r.wert}
            onClick={() => handleRichtungWechseln(r.wert)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontWeight: tokens.font.weight.bold,
                    fontSize: '0.9rem',
                    color: einst.lernrichtung === r.wert ? tokens.colors.primary : tokens.colors.textDark,
                  }}>
                    {r.label}
                  </span>
                  {r.empfohlen && <span style={styles.empfohlenBadge}>Empfohlen</span>}
                </div>
                <p style={styles.auswahlBeschreibung}>{r.beschreibung}</p>
              </div>
              <div style={{
                ...composite.radioKreis,
                borderColor: einst.lernrichtung === r.wert ? tokens.colors.primary : '#cbd5e1',
                background:  einst.lernrichtung === r.wert ? tokens.colors.primary : tokens.colors.surface,
              }}>
                {einst.lernrichtung === r.wert && <div style={composite.radioKern} />}
              </div>
            </div>
          </AuswahlKarte>
        ))}
      </div>

      {/* ── Neue Karten ── */}
      <div style={styles.sektion}>
        <h3 style={styles.sektionTitel}>✨ Neue Karten</h3>

        <p style={{ ...styles.label, marginBottom: 8 }}>Neue Karten pro Tag</p>
        <div style={styles.sliderWrapper}>
          <input
            type="range" min={1} max={50}
            value={einst.neueKartenProTag ?? 10}
            onChange={e => setEinst({ ...einst, neueKartenProTag: Number(e.target.value) })}
            style={styles.slider}
          />
          <span style={styles.sliderWert}>{einst.neueKartenProTag ?? 10}</span>
        </div>
        <div style={styles.sliderLabels}>
          <span>1</span><span>10</span><span>25</span><span>50</span>
        </div>

        <p style={{ ...styles.label, marginTop: 16, marginBottom: 8 }}>Reihenfolge</p>
        {[
          { wert: 'getrennt', label: '📋 Getrennt', beschreibung: 'Erst alle Wiederholungen, dann neue Karten' },
          { wert: 'gemischt', label: '🔀 Gemischt', beschreibung: 'Neue und alte Karten abwechselnd (wie Duolingo)' },
        ].map(m => (
          <AuswahlKarte
            key={m.wert}
            aktiv={einst.neueKartenModus === m.wert}
            onClick={() => setEinst({ ...einst, neueKartenModus: m.wert })}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: tokens.font.weight.bold, fontSize: '0.88rem', color: einst.neueKartenModus === m.wert ? tokens.colors.primary : tokens.colors.textDark }}>{m.label}</span>
                <p style={styles.auswahlBeschreibung}>{m.beschreibung}</p>
              </div>
              <div style={{ ...composite.radioKreis, borderColor: einst.neueKartenModus === m.wert ? tokens.colors.primary : '#cbd5e1', background: einst.neueKartenModus === m.wert ? tokens.colors.primary : tokens.colors.surface }}>
                {einst.neueKartenModus === m.wert && <div style={composite.radioKern} />}
              </div>
            </div>
          </AuswahlKarte>
        ))}
      </div>

      {/* ── Notifications ── */}
      <div style={styles.sektion}>
        <h3 style={styles.sektionTitel}>🔔 Benachrichtigungen</h3>

        {!notifAktiv ? (
          <button onClick={handleNotifAktivieren} style={composite.primaryBtn}>
            🔔 Notifications aktivieren
          </button>
        ) : (
          <div style={styles.aktivBox}>✅ Notifications sind aktiv</div>
        )}

        <p style={{ ...styles.label, marginTop: 16, marginBottom: 10 }}>
          Welche Erinnerungen möchtest du?
        </p>

        {NOTIF_TYPEN.map(typ => {
          const typEinst = (einst.notifTypen ?? {})[typ.key] ?? { aktiv: typ.defaultAktiv, zeiten: typ.defaultZeiten }
          const istAktiv = typEinst.aktiv ?? typ.defaultAktiv
          return (
            <div key={typ.key} style={{
              border: `2px solid ${istAktiv ? tokens.colors.primary : tokens.colors.border}`,
              borderRadius: tokens.radius.xl,
              padding: '0.9rem 1rem',
              marginBottom: 10,
              background: istAktiv ? tokens.colors.primaryBg : tokens.colors.surfaceAlt,
              transition: tokens.transition.default,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: tokens.font.weight.bold, fontSize: '0.92rem', color: istAktiv ? tokens.colors.primary : tokens.colors.textLight }}>
                    {typ.icon} {typ.label}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: tokens.colors.textMuted, marginTop: 2 }}>
                    {typ.beschreibung}
                  </div>
                </div>
                {/* Toggle */}
                <div onClick={() => toggleTypAktiv(typ.key)} style={{ width: 42, height: 24, borderRadius: 12, background: istAktiv ? tokens.colors.primary : '#cbd5e1', cursor: 'pointer', position: 'relative', transition: tokens.transition.slow, flexShrink: 0, marginLeft: 12 }}>
                  <div style={{ position: 'absolute', top: 3, left: istAktiv ? 20 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
              {istAktiv && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: '0.78rem', color: tokens.colors.primary, fontWeight: tokens.font.weight.semibold, marginBottom: 6 }}>Uhrzeiten:</div>
                  <div style={styles.zeitenGrid}>
                    {ZEITEN_OPTIONEN.map(z => {
                      const zeitAktiv = (typEinst.zeiten ?? []).includes(z)
                      return (
                        <button key={z} onClick={() => toggleZeitFuerTyp(typ.key, z)} style={{ ...styles.zeitBtn, borderColor: zeitAktiv ? tokens.colors.primary : tokens.colors.border, background: zeitAktiv ? tokens.colors.primary : tokens.colors.surface, color: zeitAktiv ? 'white' : tokens.colors.textMid, fontWeight: zeitAktiv ? 700 : 400 }}>
                          {z}:00
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: tokens.colors.textMuted, marginTop: 4 }}>
                    Gewählt: {(typEinst.zeiten ?? []).map(z => `${z}:00`).join(', ')}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <p style={{ ...styles.label, marginTop: 12, marginBottom: 8 }}>Welche Vokabel in der Meldung?</p>
        {VOKABEL_MODI.map(m => (
          <AuswahlKarte key={m.wert} aktiv={einst.vokabelModus === m.wert} onClick={() => setEinst({ ...einst, vokabelModus: m.wert })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: tokens.font.weight.bold, fontSize: '0.88rem', color: einst.vokabelModus === m.wert ? tokens.colors.primary : tokens.colors.textDark }}>{m.label}</span>
                <p style={styles.auswahlBeschreibung}>{m.beschreibung}</p>
              </div>
              <div style={{ ...composite.radioKreis, borderColor: einst.vokabelModus === m.wert ? tokens.colors.primary : '#cbd5e1', background: einst.vokabelModus === m.wert ? tokens.colors.primary : tokens.colors.surface }}>
                {einst.vokabelModus === m.wert && <div style={composite.radioKern} />}
              </div>
            </div>
          </AuswahlKarte>
        ))}
      </div>

      {/* ── KI-Lernprofil ── */}
      <div style={styles.sektion}>
        <h3 style={styles.sektionTitel}>💡 KI-Lernprofil</h3>
        <p style={{ fontSize: '0.78rem', color: tokens.colors.textMuted, margin: '0 0 14px', lineHeight: 1.5 }}>
          Gemini nutzt das für passende Eselsbrücken und Beispielsätze.
        </p>

        <p style={{ ...styles.label, marginBottom: 8 }}>Englisch-Niveau</p>
        {[
          { wert: 'A1', label: 'A1 – Anfänger',           farbe: '#22c55e' },
          { wert: 'A2', label: 'A2 – Grundkenntnisse',    farbe: '#3b82f6' },
          { wert: 'B1', label: 'B1 – Mittelstufe',        farbe: '#f59e0b' },
          { wert: 'B2', label: 'B2 – Oberstufe',          farbe: '#f97316' },
          { wert: 'C1', label: 'C1/C2 – Fortgeschritten', farbe: '#ec4899' },
        ].map(n => {
          const aktiv = (einst.nutzerprofil?.niveau ?? 'B1') === n.wert
          return (
            <AuswahlKarte key={n.wert} aktiv={aktiv} onClick={() => setEinst({ ...einst, nutzerprofil: { ...(einst.nutzerprofil ?? {}), niveau: n.wert } })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: tokens.font.weight.bold, fontSize: '0.88rem', color: aktiv ? n.farbe : tokens.colors.textDark }}>{n.label}</span>
                <div style={{ ...composite.radioKreis, borderColor: aktiv ? n.farbe : '#cbd5e1', background: aktiv ? n.farbe : tokens.colors.surface }}>
                  {aktiv && <div style={composite.radioKern} />}
                </div>
              </div>
            </AuswahlKarte>
          )
        })}

        <p style={{ ...styles.label, marginTop: 14, marginBottom: 8 }}>Lernziel</p>
        {[
          { wert: 'reisen',   label: '🌍 Reisen & Urlaub' },
          { wert: 'business', label: '💼 Business & Karriere' },
          { wert: 'studium',  label: '🎓 Studium & Schule' },
          { wert: 'alltag',   label: '🎭 Kultur & Alltag' },
        ].map(z => {
          const aktiv = (einst.nutzerprofil?.lernziel ?? 'alltag') === z.wert
          return (
            <AuswahlKarte key={z.wert} aktiv={aktiv} onClick={() => setEinst({ ...einst, nutzerprofil: { ...(einst.nutzerprofil ?? {}), lernziel: z.wert } })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: tokens.font.weight.bold, fontSize: '0.88rem', color: aktiv ? tokens.colors.primary : tokens.colors.textDark }}>{z.label}</span>
                <div style={{ ...composite.radioKreis, borderColor: aktiv ? tokens.colors.primary : '#cbd5e1', background: aktiv ? tokens.colors.primary : tokens.colors.surface }}>
                  {aktiv && <div style={composite.radioKern} />}
                </div>
              </div>
            </AuswahlKarte>
          )
        })}
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
            <span style={{ ...styles.statistikZahl, color: tokens.colors.streak }}>{statistik?.faellig ?? 0}</span>
            <span style={styles.statistikLabel}>Fällig</span>
          </div>
          <div style={styles.statistikKarte}>
            <span style={{ ...styles.statistikZahl, color: tokens.colors.success }}>{statistik?.gelernt ?? 0}</span>
            <span style={styles.statistikLabel}>Gelernt</span>
          </div>
        </div>
      </div>

      {/* ── Fehler / Speichern ── */}
      {fehler && <div style={styles.fehlerBox}>{fehler}</div>}

      <button onClick={handleSpeichern} style={{ ...composite.primaryBtn, marginBottom: 8 }}>
        💾 Einstellungen speichern
      </button>

      {gespeichert && <p style={styles.gespeichertText}>✅ Gespeichert!</p>}

      <div style={{ height: 32 }} />
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────
const styles = {
  container: { padding: '1.25rem' },
  sektion: {
    background: tokens.colors.surface,
    borderRadius: tokens.radius.cardLg,
    padding: '1.25rem',
    marginBottom: tokens.spacing.lg,
    boxShadow: tokens.shadow.sm,
  },
  sektionTitel: {
    fontSize: '0.95rem', fontWeight: tokens.font.weight.extrabold,
    color: tokens.colors.textDark, margin: '0 0 14px',
    letterSpacing: tokens.font.tracking.tight,
  },
  label: {
    ...composite.label,
  },
  auswahlBeschreibung: {
    fontSize: '0.78rem', color: tokens.colors.textMuted,
    margin: '2px 0 0', lineHeight: 1.4,
  },
  empfohlenBadge: {
    fontSize: '0.65rem', fontWeight: tokens.font.weight.bold,
    background: tokens.colors.primaryLight, color: tokens.colors.primary,
    padding: '1px 6px', borderRadius: tokens.radius.xs,
    letterSpacing: '0.02em',
  },
  ladeHinweis: {
    background: tokens.colors.primaryBg, border: `1px solid ${tokens.colors.primaryLight}`,
    borderRadius: tokens.radius.md, padding: '0.65rem 1rem',
    fontSize: '0.82rem', color: tokens.colors.primary,
    fontWeight: tokens.font.weight.semibold, marginBottom: 12, textAlign: 'center',
  },
  aktivBox: {
    background: tokens.colors.successBg, border: `1px solid ${tokens.colors.successLight}`,
    borderRadius: tokens.radius.lg, padding: '0.65rem 1rem',
    fontSize: '0.88rem', color: tokens.colors.success,
    fontWeight: tokens.font.weight.semibold, textAlign: 'center',
  },
  zeitenGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  zeitBtn: {
    padding: '0.4rem 0.8rem', borderRadius: tokens.radius.pill,
    border: '2px solid', fontSize: '0.82rem',
    cursor: 'pointer', fontFamily: 'inherit',
    transition: tokens.transition.fast,
  },
  statistikGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 },
  statistikKarte: {
    background: tokens.colors.surfaceAlt, borderRadius: tokens.radius.xl,
    padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 4,
  },
  statistikZahl: {
    fontSize: '1.8rem', fontWeight: tokens.font.weight.extrabold,
    color: tokens.colors.primary, letterSpacing: '-0.03em', lineHeight: 1,
  },
  statistikLabel: {
    fontSize: '0.72rem', color: tokens.colors.textMuted,
    fontWeight: tokens.font.weight.bold,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  fehlerBox: {
    background: tokens.colors.dangerBg, border: `1px solid ${tokens.colors.dangerLight}`,
    borderRadius: tokens.radius.lg, padding: '0.75rem 1rem',
    fontSize: '0.85rem', color: tokens.colors.danger,
    fontWeight: tokens.font.weight.semibold, marginBottom: 12, textAlign: 'center',
  },
  gespeichertText: {
    textAlign: 'center', color: tokens.colors.success,
    fontWeight: tokens.font.weight.bold, fontSize: '0.9rem', margin: '8px 0 0',
  },
  sliderWrapper: { display: 'flex', alignItems: 'center', gap: 12 },
  slider: { flex: 1, accentColor: tokens.colors.primary, cursor: 'pointer' },
  sliderWert: {
    minWidth: 28, fontWeight: tokens.font.weight.extrabold,
    fontSize: '1.1rem', color: tokens.colors.primary, textAlign: 'center',
  },
  sliderLabels: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '0.7rem', color: '#cbd5e1', marginTop: 4, padding: '0 2px',
  },
}
