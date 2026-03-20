// ============================================================
// VokaOrbit — tabs/EinstellungenTab.jsx  v2.0
// Einstellungen: Lernrichtung, Neue Karten, Notifications, Profil.
// Migriert auf useTheme() — vollständiger Dark Mode Support.
// ============================================================

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEinstellungen } from '../hooks/useEinstellungen'
import { useTheme } from '../hooks/useTheme'
import { speichereEinstellungen, aktualisiereLernrichtung, DEFAULT_EINSTELLUNGEN } from '../einstellungen'
import { verarbeiteRichtungswechsel } from '../core/storage'
import { aktiviereNotifications } from '../firebase'

const ZEITEN_OPTIONEN = [6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 21, 22]

const RICHTUNGEN = [
  { wert: 'smart',       label: '🧠 Smart',            beschreibung: 'Schwächere Richtung bekommt mehr Karten — automatisch', empfohlen: true },
  { wert: 'beide',       label: '↔️ Beide gleich',     beschreibung: 'EN→DE und DE→EN gleichwertig, Session-Abstand-Regel aktiv' },
  { wert: 'en_de',       label: '🇬🇧 → 🇩🇪 Nur EN→DE', beschreibung: 'Immer Englisch auf Vorderseite' },
  { wert: 'de_en',       label: '🇩🇪 → 🇬🇧 Nur DE→EN', beschreibung: 'Immer Deutsch auf Vorderseite' },
  { wert: 'abwechselnd', label: '🎲 Abwechselnd',       beschreibung: 'Richtung wird zufällig gewürfelt — ein gemeinsamer Fortschritt' },
]

const VOKABEL_MODI = [
  { wert: 'schwerste',       label: '🔥 Schwerste zuerst',       beschreibung: 'Niedrigste Stabilität' },
  { wert: 'ueberfaelligste', label: '⏰ Am längsten überfällig',  beschreibung: 'Wartet am längsten' },
  { wert: 'zufaellig',       label: '🎲 Zufällig',               beschreibung: 'Zufällige fällige Vokabel' },
]

const NOTIF_TYPEN = [
  { key: 'wiederholungen', icon: '🔄', label: 'Fällige Wiederholungen', beschreibung: 'Erinnerung wenn Vokabeln zur Wiederholung fällig sind', defaultAktiv: true,  defaultZeiten: [8, 12, 18] },
  { key: 'neueKarten',     icon: '✨', label: 'Neue Karten verfügbar',   beschreibung: 'Erinnerung wenn du heute noch neue Karten lernen kannst',  defaultAktiv: true,  defaultZeiten: [8] },
  { key: 'streak',         icon: '🔥', label: 'Streak-Erinnerung',       beschreibung: 'Erinnerung wenn du heute noch nicht gelernt hast',          defaultAktiv: true,  defaultZeiten: [20] },
  { key: 'rueckblick',     icon: '🌙', label: 'Tagesrückblick',          beschreibung: 'Zusammenfassung: was gelernt, was morgen fällig',            defaultAktiv: false, defaultZeiten: [21] },
]

// ── Auswahl-Karte ──────────────────────────────────────────────
function AuswahlKarte({ aktiv, onClick, children, isDark, colors, tokens }) {
  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{
        padding:      '0.85rem 1rem',
        borderRadius: tokens.radius.xl,
        border:       `2px solid ${aktiv ? colors.primary : colors.border}`,
        background:   isDark
          ? (aktiv ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)')
          : (aktiv ? colors.primaryBg : colors.surface),
        cursor:       'pointer',
        marginBottom: tokens.spacing.sm,
        transition:   'all 0.2s ease',
      }}
    >
      {children}
    </motion.div>
  )
}

// ── Sektion-Karte ──────────────────────────────────────────────
function SektionKarte({ children, isDark, colors, tokens }) {
  return (
    <div style={{
      background:           isDark ? 'rgba(26,26,53,0.85)' : colors.surface,
      backdropFilter:       isDark ? 'blur(16px)' : 'none',
      WebkitBackdropFilter: isDark ? 'blur(16px)' : 'none',
      borderRadius:         tokens.radius.cardLg,
      padding:              '1.25rem',
      marginBottom:         tokens.spacing.lg,
      boxShadow:            isDark
        ? '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(167,139,250,0.08)'
        : colors.shadowSm,
      border:               isDark ? '1px solid rgba(167,139,250,0.10)' : 'none',
    }}>
      {children}
    </div>
  )
}

// ── Radio Kreis ────────────────────────────────────────────────
function RadioKreis({ aktiv, farbe, colors }) {
  return (
    <div style={{
      width: 20, height: 20, borderRadius: '50%',
      border: `2px solid ${aktiv ? (farbe ?? colors.primary) : colors.border}`,
      background: aktiv ? (farbe ?? colors.primary) : 'transparent',
      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s ease',
    }}>
      {aktiv && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
    </div>
  )
}

// ── Toggle Switch ──────────────────────────────────────────────
function ToggleSwitch({ aktiv, onClick, colors }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 42, height: 24, borderRadius: 12,
        background: aktiv
          ? 'linear-gradient(135deg, #7C3AED, #4F46E5)'
          : colors.border,
        cursor: 'pointer', position: 'relative',
        transition: 'background 0.25s ease', flexShrink: 0,
        boxShadow: aktiv ? '0 2px 8px rgba(124,58,237,0.35)' : 'none',
      }}
    >
      <motion.div
        animate={{ x: aktiv ? 20 : 3 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        style={{
          position: 'absolute', top: 3,
          width: 18, height: 18, borderRadius: '50%',
          background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
export default function EinstellungenTab() {
  const { einstellungen, setEinstellungen: setGlobalEinstellungen, notifAktiv, handleNotifAktivieren, statistik } = useEinstellungen()
  const { isDark, colors, tokens } = useTheme()

  const [einst,           setEinst]           = useState(einstellungen ?? DEFAULT_EINSTELLUNGEN)
  const [gespeichert,     setGespeichert]     = useState(false)
  const [richtungLaed,    setRichtungLaed]    = useState(false)
  const [fehler,          setFehler]          = useState(null)

  useEffect(() => {
    if (einstellungen) setEinst(einstellungen)
  }, [einstellungen])

  async function handleRichtungWechseln(neueRichtung) {
    if (richtungLaed || neueRichtung === einst.lernrichtung) return
    setRichtungLaed(true)
    setFehler(null)
    try {
      const aktualisiert = await aktualisiereLernrichtung(einst, neueRichtung)
      await verarbeiteRichtungswechsel(einst.lernrichtung, neueRichtung, einst.aktiveListen ?? ['en_a1'])
      setEinst(aktualisiert)
      setGlobalEinstellungen(aktualisiert)
    } catch (err) {
      setFehler('Fehler beim Richtungswechsel. Bitte erneut versuchen.')
      console.error(err)
    } finally {
      setRichtungLaed(false)
    }
  }

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

  const labelStyle = {
    fontSize:      tokens.font.size.sm,
    fontWeight:    700,
    color:         colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: tokens.font.tracking.caps,
    display:       'block',
    margin:        0,
  }

  const sektionTitelStyle = {
    fontSize:      '0.95rem',
    fontWeight:    800,
    color:         colors.textDark,
    margin:        '0 0 14px',
    letterSpacing: tokens.font.tracking.tight,
  }

  return (
    <div style={{ padding: '1.25rem' }}>

      {/* ── Lernrichtung ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      >
        <SektionKarte isDark={isDark} colors={colors} tokens={tokens}>
          <h3 style={sektionTitelStyle}>🧭 Lernrichtung</h3>

          <AnimatePresence>
            {richtungLaed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background:   isDark ? 'rgba(124,58,237,0.15)' : colors.primaryBg,
                  border:       `1px solid ${colors.primaryLight}`,
                  borderRadius: tokens.radius.md,
                  padding:      '0.65rem 1rem',
                  fontSize:     '0.82rem',
                  color:        colors.primary,
                  fontWeight:   600,
                  marginBottom: 12,
                  textAlign:    'center',
                }}
              >
                ⏳ Profile werden vorbereitet...
              </motion.div>
            )}
          </AnimatePresence>

          {RICHTUNGEN.map(r => (
            <AuswahlKarte
              key={r.wert}
              aktiv={einst.lernrichtung === r.wert}
              onClick={() => handleRichtungWechseln(r.wert)}
              isDark={isDark} colors={colors} tokens={tokens}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontWeight: 700, fontSize: '0.9rem',
                      color: einst.lernrichtung === r.wert ? colors.primary : colors.textDark,
                    }}>
                      {r.label}
                    </span>
                    {r.empfohlen && (
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 700,
                        background: isDark ? 'rgba(124,58,237,0.2)' : colors.primaryLight,
                        color: colors.primary,
                        padding: '1px 6px', borderRadius: tokens.radius.xs,
                      }}>
                        Empfohlen
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: colors.textMuted, margin: '2px 0 0', lineHeight: 1.4 }}>
                    {r.beschreibung}
                  </p>
                </div>
                <RadioKreis aktiv={einst.lernrichtung === r.wert} colors={colors} />
              </div>
            </AuswahlKarte>
          ))}
        </SektionKarte>
      </motion.div>

      {/* ── Neue Karten ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      >
        <SektionKarte isDark={isDark} colors={colors} tokens={tokens}>
          <h3 style={sektionTitelStyle}>✨ Neue Karten</h3>

          <p style={{ ...labelStyle, marginBottom: 8 }}>Neue Karten pro Tag</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <input
              type="range" min={1} max={50}
              value={einst.neueKartenProTag ?? 10}
              onChange={e => setEinst({ ...einst, neueKartenProTag: Number(e.target.value) })}
              style={{ flex: 1, accentColor: colors.primary, cursor: 'pointer' }}
            />
            <span style={{
              minWidth: 28, fontWeight: 800,
              fontSize: '1.1rem', color: colors.primary, textAlign: 'center',
            }}>
              {einst.neueKartenProTag ?? 10}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: colors.border, padding: '0 2px', marginBottom: 16 }}>
            <span>1</span><span>10</span><span>25</span><span>50</span>
          </div>

          <p style={{ ...labelStyle, marginBottom: 8 }}>Reihenfolge</p>
          {[
            { wert: 'getrennt', label: '📋 Getrennt', beschreibung: 'Erst alle Wiederholungen, dann neue Karten' },
            { wert: 'gemischt', label: '🔀 Gemischt', beschreibung: 'Neue und alte Karten abwechselnd' },
          ].map(m => (
            <AuswahlKarte key={m.wert} aktiv={einst.neueKartenModus === m.wert}
              onClick={() => setEinst({ ...einst, neueKartenModus: m.wert })}
              isDark={isDark} colors={colors} tokens={tokens}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: einst.neueKartenModus === m.wert ? colors.primary : colors.textDark }}>
                    {m.label}
                  </span>
                  <p style={{ fontSize: '0.78rem', color: colors.textMuted, margin: '2px 0 0' }}>{m.beschreibung}</p>
                </div>
                <RadioKreis aktiv={einst.neueKartenModus === m.wert} colors={colors} />
              </div>
            </AuswahlKarte>
          ))}
        </SektionKarte>
      </motion.div>

      {/* ── Notifications ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      >
        <SektionKarte isDark={isDark} colors={colors} tokens={tokens}>
          <h3 style={sektionTitelStyle}>🔔 Benachrichtigungen</h3>

          {!notifAktiv ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleNotifAktivieren}
              style={{
                padding:      '0.9rem', width: '100%',
                background:   'linear-gradient(135deg, #7C3AED, #4F46E5)',
                color:         '#fff', border: 'none',
                borderRadius:  tokens.radius.xl,
                fontSize:      tokens.font.size.lg, fontWeight: 700,
                cursor:       'pointer', fontFamily: 'inherit',
                boxShadow:    '0 4px 16px rgba(124,58,237,0.35)',
              }}
            >
              🔔 Notifications aktivieren
            </motion.button>
          ) : (
            <div style={{
              background:   isDark ? 'rgba(34,197,94,0.12)' : colors.successBg,
              border:       `1px solid ${colors.successLight}`,
              borderRadius: tokens.radius.lg,
              padding:      '0.65rem 1rem',
              fontSize:     '0.88rem',
              color:        colors.success,
              fontWeight:   600,
              textAlign:    'center',
            }}>
              ✅ Notifications sind aktiv
            </div>
          )}

          <p style={{ ...labelStyle, marginTop: 16, marginBottom: 10 }}>Welche Erinnerungen?</p>

          {NOTIF_TYPEN.map(typ => {
            const typEinst = (einst.notifTypen ?? {})[typ.key] ?? { aktiv: typ.defaultAktiv, zeiten: typ.defaultZeiten }
            const istAktiv = typEinst.aktiv ?? typ.defaultAktiv
            return (
              <div key={typ.key} style={{
                border:       `2px solid ${istAktiv ? colors.primary : colors.border}`,
                borderRadius: tokens.radius.xl,
                padding:      '0.9rem 1rem',
                marginBottom:  10,
                background:   isDark
                  ? (istAktiv ? 'rgba(124,58,237,0.10)' : 'rgba(255,255,255,0.03)')
                  : (istAktiv ? colors.primaryBg : colors.surfaceAlt),
                transition:   'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: istAktiv ? colors.primary : colors.textLight }}>
                      {typ.icon} {typ.label}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: colors.textMuted, marginTop: 2 }}>
                      {typ.beschreibung}
                    </div>
                  </div>
                  <ToggleSwitch aktiv={istAktiv} onClick={() => toggleTypAktiv(typ.key)} colors={colors} />
                </div>

                <AnimatePresence>
                  {istAktiv && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: '0.78rem', color: colors.primary, fontWeight: 600, marginBottom: 6 }}>
                          Uhrzeiten:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {ZEITEN_OPTIONEN.map(z => {
                            const zeitAktiv = (typEinst.zeiten ?? []).includes(z)
                            return (
                              <motion.button
                                key={z}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => toggleZeitFuerTyp(typ.key, z)}
                                style={{
                                  padding:      '0.4rem 0.8rem',
                                  borderRadius: tokens.radius.pill,
                                  border:       `2px solid ${zeitAktiv ? colors.primary : colors.border}`,
                                  background:   zeitAktiv
                                    ? colors.primary
                                    : (isDark ? 'rgba(255,255,255,0.05)' : colors.surface),
                                  color:        zeitAktiv ? 'white' : colors.textMid,
                                  fontWeight:   zeitAktiv ? 700 : 400,
                                  fontSize:     '0.82rem',
                                  cursor:       'pointer',
                                  fontFamily:   'inherit',
                                  transition:   'all 0.15s ease',
                                }}
                              >
                                {z}:00
                              </motion.button>
                            )
                          })}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: colors.textMuted, marginTop: 6 }}>
                          Gewählt: {(typEinst.zeiten ?? []).map(z => `${z}:00`).join(', ')}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}

          <p style={{ ...labelStyle, marginTop: 12, marginBottom: 8 }}>Welche Vokabel in der Meldung?</p>
          {VOKABEL_MODI.map(m => (
            <AuswahlKarte key={m.wert} aktiv={einst.vokabelModus === m.wert}
              onClick={() => setEinst({ ...einst, vokabelModus: m.wert })}
              isDark={isDark} colors={colors} tokens={tokens}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: einst.vokabelModus === m.wert ? colors.primary : colors.textDark }}>
                    {m.label}
                  </span>
                  <p style={{ fontSize: '0.78rem', color: colors.textMuted, margin: '2px 0 0' }}>{m.beschreibung}</p>
                </div>
                <RadioKreis aktiv={einst.vokabelModus === m.wert} colors={colors} />
              </div>
            </AuswahlKarte>
          ))}
        </SektionKarte>
      </motion.div>

      {/* ── KI-Lernprofil ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      >
        <SektionKarte isDark={isDark} colors={colors} tokens={tokens}>
          <h3 style={sektionTitelStyle}>💡 KI-Lernprofil</h3>
          <p style={{ fontSize: '0.78rem', color: colors.textMuted, margin: '0 0 14px', lineHeight: 1.5 }}>
            Gemini nutzt das für passende Eselsbrücken und Beispielsätze.
          </p>

          <p style={{ ...labelStyle, marginBottom: 8 }}>Englisch-Niveau</p>
          {[
            { wert: 'A1', label: 'A1 – Anfänger',           farbe: '#22c55e' },
            { wert: 'A2', label: 'A2 – Grundkenntnisse',    farbe: '#3b82f6' },
            { wert: 'B1', label: 'B1 – Mittelstufe',        farbe: '#f59e0b' },
            { wert: 'B2', label: 'B2 – Oberstufe',          farbe: '#f97316' },
            { wert: 'C1', label: 'C1/C2 – Fortgeschritten', farbe: '#ec4899' },
          ].map(n => {
            const aktiv = (einst.nutzerprofil?.niveau ?? 'B1') === n.wert
            return (
              <AuswahlKarte key={n.wert} aktiv={aktiv}
                onClick={() => setEinst({ ...einst, nutzerprofil: { ...(einst.nutzerprofil ?? {}), niveau: n.wert } })}
                isDark={isDark} colors={colors} tokens={tokens}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: aktiv ? n.farbe : colors.textDark }}>
                    {n.label}
                  </span>
                  <RadioKreis aktiv={aktiv} farbe={n.farbe} colors={colors} />
                </div>
              </AuswahlKarte>
            )
          })}

          <p style={{ ...labelStyle, marginTop: 14, marginBottom: 8 }}>Lernziel</p>
          {[
            { wert: 'reisen',   label: '🌍 Reisen & Urlaub' },
            { wert: 'business', label: '💼 Business & Karriere' },
            { wert: 'studium',  label: '🎓 Studium & Schule' },
            { wert: 'alltag',   label: '🎭 Kultur & Alltag' },
          ].map(z => {
            const aktiv = (einst.nutzerprofil?.lernziel ?? 'alltag') === z.wert
            return (
              <AuswahlKarte key={z.wert} aktiv={aktiv}
                onClick={() => setEinst({ ...einst, nutzerprofil: { ...(einst.nutzerprofil ?? {}), lernziel: z.wert } })}
                isDark={isDark} colors={colors} tokens={tokens}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: aktiv ? colors.primary : colors.textDark }}>
                    {z.label}
                  </span>
                  <RadioKreis aktiv={aktiv} colors={colors} />
                </div>
              </AuswahlKarte>
            )
          })}
        </SektionKarte>
      </motion.div>

      {/* ── Statistik ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      >
        <SektionKarte isDark={isDark} colors={colors} tokens={tokens}>
          <h3 style={sektionTitelStyle}>📊 Statistik</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { zahl: statistik?.gesamt ?? 0,  label: 'Gesamt',  farbe: colors.primary },
              { zahl: statistik?.faellig ?? 0, label: 'Fällig',  farbe: colors.streak  },
              { zahl: statistik?.gelernt ?? 0, label: 'Gelernt', farbe: colors.success },
            ].map(({ zahl, label, farbe }) => (
              <motion.div
                key={label}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  background:   isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceAlt,
                  borderRadius: tokens.radius.xl,
                  padding:      '1rem 0.5rem',
                  display:      'flex',
                  flexDirection:'column',
                  alignItems:   'center',
                  gap:           4,
                  border:       `1px solid ${colors.border}`,
                }}
              >
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: farbe, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {zahl}
                </span>
                <span style={{ fontSize: '0.68rem', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {label}
                </span>
              </motion.div>
            ))}
          </div>
        </SektionKarte>
      </motion.div>

      {/* ── Fehler ── */}
      <AnimatePresence>
        {fehler && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background:   colors.dangerBg,
              border:       `1px solid ${colors.dangerLight}`,
              borderRadius: tokens.radius.lg,
              padding:      '0.75rem 1rem',
              fontSize:     '0.85rem',
              color:        colors.danger,
              fontWeight:   600,
              marginBottom:  12,
              textAlign:    'center',
            }}
          >
            {fehler}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Speichern ── */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSpeichern}
        style={{
          padding:      '0.9rem', width: '100%',
          background:   'linear-gradient(135deg, #7C3AED, #4F46E5)',
          color:         '#fff', border: 'none',
          borderRadius:  tokens.radius.xl,
          fontSize:      tokens.font.size.lg, fontWeight: 700,
          cursor:       'pointer', fontFamily: 'inherit',
          boxShadow:    '0 4px 16px rgba(124,58,237,0.35)',
          marginBottom:  8,
        }}
      >
        💾 Einstellungen speichern
      </motion.button>

      <AnimatePresence>
        {gespeichert && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', color: colors.success, fontWeight: 700, fontSize: '0.9rem', margin: '8px 0 0' }}
          >
            ✅ Gespeichert!
          </motion.p>
        )}
      </AnimatePresence>

      <div style={{ height: 32 }} />
    </div>
  )
}
