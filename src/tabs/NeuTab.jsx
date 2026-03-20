// ============================================================
// VokaOrbit — tabs/NeuTab.jsx  v2.0
// Eigene Listen verwalten.
// Migriert auf useTheme() — vollständiger Dark Mode Support.
// ============================================================

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEinstellungen } from '../hooks/useEinstellungen'
import { useTheme } from '../hooks/useTheme'
import {
  ladeEigeneListen, listeErstellen, listeLoeschen,
  ladeVokabelnFuerListe, vokabelZuListeHinzufuegen,
  vokabelAusListeLoeschen, migriereLegacyVokabeln
} from '../core/listen'
import { speichereEinstellungen } from '../einstellungen'

// ── Glassmorphism Input ────────────────────────────────────────
function OrbitInput({ value, onChange, onKeyDown, placeholder, id, autoFocus, isDark, colors, tokens }) {
  const [fokus, setFokus] = useState(false)
  return (
    <input
      id={id}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onFocus={() => setFokus(true)}
      onBlur={() => setFokus(false)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      autoCapitalize="none"
      autoCorrect="off"
      style={{
        padding:      '0.78rem 1rem',
        borderRadius: tokens.radius.lg,
        border:       `2px solid ${fokus ? colors.primary : colors.border}`,
        fontSize:     '1rem',
        outline:      'none',
        width:        '100%',
        boxSizing:    'border-box',
        fontFamily:   'inherit',
        color:        colors.textDark,
        background:   isDark
          ? 'rgba(255,255,255,0.06)'
          : colors.surfaceAlt,
        transition:   'border-color 0.15s ease',
        boxShadow:    fokus ? `0 0 0 4px ${colors.primary}20` : 'none',
      }}
    />
  )
}

// ── Bestätigungs-Dialog (Bottom Sheet) ────────────────────────
function KonfirmDialog({ titel, hinweis, onBestaetigen, onAbbrechen, isDark, colors, tokens }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onAbbrechen}
      style={{
        position: 'fixed', inset: 0,
        background: colors.overlay,
        display: 'flex', alignItems: 'flex-end',
        zIndex: tokens.z.modal,
        backdropFilter: 'blur(6px)',
      }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width:        '100%',
          background:   isDark ? '#1A1A35' : '#FFFFFF',
          borderRadius: '24px 24px 0 0',
          padding:      '1.75rem 1.5rem 2.5rem',
          boxShadow:    isDark
            ? '0 -8px 40px rgba(0,0,0,0.6)'
            : '0 -4px 40px rgba(0,0,0,0.15)',
          border: isDark ? '1px solid rgba(167,139,250,0.15)' : 'none',
          borderBottom: 'none',
        }}
      >
        <div style={{
          width: 40, height: 4,
          background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
          borderRadius: 2, margin: '0 auto 24px',
        }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 800, color: colors.textDark, margin: '0 0 8px', textAlign: 'center' }}>
          {titel}
        </p>
        <p style={{ fontSize: '0.85rem', color: colors.textMuted, textAlign: 'center', margin: '0 0 24px', lineHeight: 1.5 }}>
          {hinweis}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onAbbrechen}
            style={{
              flex: 1, padding: '0.9rem',
              background: isDark ? 'rgba(255,255,255,0.08)' : colors.borderLight,
              color: colors.textMid, border: 'none',
              borderRadius: tokens.radius.xl,
              fontSize: '0.95rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Abbrechen
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onBestaetigen}
            style={{
              flex: 1, padding: '0.9rem',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white', border: 'none',
              borderRadius: tokens.radius.xl,
              fontSize: '0.95rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(239,68,68,0.35)',
            }}
          >
            Löschen
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Status Toast ───────────────────────────────────────────────
function StatusToast({ status, colors, tokens }) {
  if (!status) return null
  const istOk = status.typ === 'ok'
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,   scale: 1 }}
      exit={{    opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      style={{
        background:   istOk ? colors.successBg  : colors.dangerBg,
        color:        istOk ? colors.success     : colors.danger,
        border:       `1px solid ${istOk ? colors.successLight : colors.dangerLight}`,
        borderRadius: tokens.radius.lg,
        padding:      '0.65rem 1rem',
        fontSize:     '0.88rem',
        fontWeight:    600,
        marginBottom:  12,
        textAlign:    'center',
      }}
    >
      {status.text}
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════
export default function NeuTab() {
  const { einstellungen, setEinstellungen } = useEinstellungen()
  const { isDark, colors, tokens }          = useTheme()

  const [ansicht,      setAnsicht]      = useState('listen')
  const [listen,       setListen]       = useState([])
  const [aktiveListe,  setAktiveListe]  = useState(null)
  const [vokabeln,     setVokabeln]     = useState([])
  const [laden,        setLaden]        = useState(true)
  const [vokLaden,     setVokLaden]     = useState(false)
  const [neuerTitel,   setNeuerTitel]   = useState('')
  const [titelSpeichern, setTitelSpeichern] = useState(false)
  const [vorderseite,  setVorderseite]  = useState('')
  const [rueckseite,   setRueckseite]   = useState('')
  const [vokSpeichern, setVokSpeichern] = useState(false)
  const [loescheListeId,   setLoescheListeId]   = useState(null)
  const [loescheVokabelId, setLoescheVokabelId] = useState(null)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    async function init() {
      await migriereLegacyVokabeln()
      await ladeListen()
    }
    init()
  }, [])

  async function ladeListen() {
    setLaden(true)
    const l = await ladeEigeneListen()
    setListen(l)
    setLaden(false)
  }

  async function oeffneListe(liste) {
    setAktiveListe(liste)
    setAnsicht('detail')
    setVokLaden(true)
    const v = await ladeVokabelnFuerListe(liste.id)
    setVokabeln(v)
    setVokLaden(false)
  }

  async function handleListeErstellen() {
    if (!neuerTitel.trim()) return
    setTitelSpeichern(true)
    try {
      await listeErstellen(neuerTitel)
      setNeuerTitel('')
      setAnsicht('listen')
      zeigStatus('ok', '✅ Liste erstellt!')
      await ladeListen()
    } catch {
      zeigStatus('fehler', '❌ Fehler beim Erstellen')
    }
    setTitelSpeichern(false)
  }

  async function handleListeLoeschen(id) {
    setLoescheListeId(null)
    setListen(l => l.filter(x => x.id !== id))
    if (einstellungen && setEinstellungen) {
      const listenId = `eigen_list_${id}`
      const aktiv    = einstellungen.aktiveListen ?? []
      if (aktiv.includes(listenId)) {
        const neu = { ...einstellungen, aktiveListen: aktiv.filter(l => l !== listenId) }
        setEinstellungen(neu)
      }
    }
    try { await listeLoeschen(id) } catch { await ladeListen() }
  }

  async function handleVokabelHinzufuegen() {
    if (!vorderseite.trim() || !rueckseite.trim()) {
      zeigStatus('fehler', 'Beide Felder ausfüllen!')
      return
    }
    setVokSpeichern(true)
    try {
      await vokabelZuListeHinzufuegen(aktiveListe.id, vorderseite, rueckseite)
      setVorderseite('')
      setRueckseite('')
      zeigStatus('ok', '✅ Vokabel gespeichert!')
      const v = await ladeVokabelnFuerListe(aktiveListe.id)
      setVokabeln(v)
      setListen(l => l.map(x => x.id === aktiveListe.id ? { ...x, vokabelAnzahl: v.length } : x))
      setAktiveListe(a => ({ ...a, vokabelAnzahl: v.length }))
    } catch {
      zeigStatus('fehler', '❌ Fehler beim Speichern')
    }
    setVokSpeichern(false)
  }

  async function handleVokabelLoeschen(vokabelId) {
    setLoescheVokabelId(null)
    setVokabeln(v => v.filter(x => x.id !== vokabelId))
    try {
      await vokabelAusListeLoeschen(vokabelId, aktiveListe.id)
      setAktiveListe(a => ({ ...a, vokabelAnzahl: Math.max(0, (a.vokabelAnzahl ?? 1) - 1) }))
      setListen(l => l.map(x => x.id === aktiveListe.id
        ? { ...x, vokabelAnzahl: Math.max(0, (x.vokabelAnzahl ?? 1) - 1) } : x))
    } catch {
      const v = await ladeVokabelnFuerListe(aktiveListe.id)
      setVokabeln(v)
    }
  }

  function zeigStatus(typ, text) {
    setStatus({ typ, text })
    setTimeout(() => setStatus(null), 2500)
  }

  async function toggleListeAktiv(listenId) {
    if (!einstellungen || !setEinstellungen) return
    const aktiv    = einstellungen.aktiveListen ?? []
    const neuAktiv = aktiv.includes(listenId)
      ? aktiv.filter(l => l !== listenId)
      : [...aktiv, listenId]
    const neuEinst = { ...einstellungen, aktiveListen: neuAktiv }
    setEinstellungen(neuEinst)
    await speichereEinstellungen(neuEinst)
  }

  // Gemeinsame Karten-Styles
  const karteStyle = {
    background:   isDark ? 'rgba(26,26,53,0.85)' : '#FFFFFF',
    backdropFilter: isDark ? 'blur(16px)' : 'none',
    WebkitBackdropFilter: isDark ? 'blur(16px)' : 'none',
    borderRadius: tokens.radius.cardLg,
    padding:      '1.5rem',
    boxShadow:    isDark
      ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(167,139,250,0.1)'
      : '0 4px 20px rgba(0,0,0,0.08)',
    marginBottom:  20,
    border:       isDark ? '1px solid rgba(167,139,250,0.12)' : 'none',
  }

  // ── Ansicht: Neue Liste ──────────────────────────────────────
  if (ansicht === 'neu') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        style={{ padding: '1.25rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setAnsicht('listen')}
            style={{
              background: 'none', border: 'none',
              color: colors.primary, fontSize: '0.9rem',
              fontWeight: 700, cursor: 'pointer',
              padding: '4px 0', fontFamily: 'inherit',
            }}
          >
            ← Zurück
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={karteStyle}
        >
          <h2 style={{ fontSize: tokens.font.size.xl, fontWeight: 800, color: colors.textDark, margin: '0 0 16px' }}>
            📝 Neue Liste
          </h2>
          <label style={{
            fontSize: tokens.font.size.sm, fontWeight: 700,
            color: colors.textLight, textTransform: 'uppercase',
            letterSpacing: tokens.font.tracking.caps,
            display: 'block', marginBottom: 8,
          }}>
            Name der Liste
          </label>
          <OrbitInput
            value={neuerTitel}
            onChange={e => setNeuerTitel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleListeErstellen()}
            placeholder="z.B. Spanisch Urlaub"
            autoFocus
            isDark={isDark} colors={colors} tokens={tokens}
          />

          <AnimatePresence>
            {status && <StatusToast status={status} colors={colors} tokens={tokens} />}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleListeErstellen}
            disabled={titelSpeichern || !neuerTitel.trim()}
            style={{
              marginTop:    16,
              padding:      '0.9rem',
              width:        '100%',
              background:   (titelSpeichern || !neuerTitel.trim())
                ? colors.border
                : 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              color:        (titelSpeichern || !neuerTitel.trim())
                ? colors.textMuted : '#fff',
              border:       'none',
              borderRadius: tokens.radius.xl,
              fontSize:     tokens.font.size.lg,
              fontWeight:   700,
              cursor:       (titelSpeichern || !neuerTitel.trim()) ? 'not-allowed' : 'pointer',
              fontFamily:   'inherit',
              boxShadow:    (titelSpeichern || !neuerTitel.trim())
                ? 'none' : '0 4px 16px rgba(124,58,237,0.35)',
              transition:   'all 0.2s ease',
            }}
          >
            {titelSpeichern ? 'Wird erstellt...' : '✅ Liste erstellen'}
          </motion.button>
        </motion.div>
      </motion.div>
    )
  }

  // ── Ansicht: Listen-Detail ────────────────────────────────────
  if (ansicht === 'detail' && aktiveListe) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        style={{ padding: '1.25rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => { setAnsicht('listen'); setAktiveListe(null) }}
            style={{
              background: 'none', border: 'none',
              color: colors.primary, fontSize: '0.9rem',
              fontWeight: 700, cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit',
            }}
          >
            ← Zurück
          </motion.button>
          <span style={{ fontSize: tokens.font.size.lg, fontWeight: 800, color: colors.textDark }}>
            {aktiveListe.titel}
          </span>
        </div>

        {/* Vokabel hinzufügen */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={karteStyle}
        >
          <h3 style={{ fontSize: tokens.font.size.lg, fontWeight: 800, color: colors.textDark, margin: '0 0 14px' }}>
            ➕ Vokabel hinzufügen
          </h3>

          <label style={{
            fontSize: tokens.font.size.sm, fontWeight: 700,
            color: colors.textLight, textTransform: 'uppercase',
            letterSpacing: tokens.font.tracking.caps, display: 'block', marginBottom: 6,
          }}>
            Vorderseite
          </label>
          <OrbitInput
            value={vorderseite}
            onChange={e => setVorderseite(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('rs-input')?.focus()}
            placeholder="z.B. apple"
            isDark={isDark} colors={colors} tokens={tokens}
          />

          <label style={{
            fontSize: tokens.font.size.sm, fontWeight: 700,
            color: colors.textLight, textTransform: 'uppercase',
            letterSpacing: tokens.font.tracking.caps,
            display: 'block', marginTop: 14, marginBottom: 6,
          }}>
            Rückseite
          </label>
          <OrbitInput
            id="rs-input"
            value={rueckseite}
            onChange={e => setRueckseite(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleVokabelHinzufuegen()}
            placeholder="z.B. Apfel"
            isDark={isDark} colors={colors} tokens={tokens}
          />

          <AnimatePresence>
            {status && <div style={{ marginTop: 10 }}><StatusToast status={status} colors={colors} tokens={tokens} /></div>}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleVokabelHinzufuegen}
            disabled={vokSpeichern}
            style={{
              marginTop:    14, padding: '0.9rem', width: '100%',
              background:   vokSpeichern ? colors.border : 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              color:        vokSpeichern ? colors.textMuted : '#fff',
              border:       'none', borderRadius: tokens.radius.xl,
              fontSize:     tokens.font.size.lg, fontWeight: 700,
              cursor:       vokSpeichern ? 'not-allowed' : 'pointer',
              fontFamily:   'inherit',
              boxShadow:    vokSpeichern ? 'none' : '0 4px 16px rgba(124,58,237,0.35)',
              opacity:      vokSpeichern ? 0.7 : 1,
              transition:   'all 0.2s ease',
            }}
          >
            {vokSpeichern ? 'Wird gespeichert...' : '+ Vokabel hinzufügen'}
          </motion.button>
        </motion.div>

        {/* Vokabel-Liste */}
        <div style={{ marginBottom: 10 }}>
          <span style={{
            fontSize: '0.82rem', fontWeight: 700, color: colors.textMuted,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {aktiveListe.vokabelAnzahl ?? vokabeln.length} Vokabeln
          </span>
        </div>

        {vokLaden ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                border: `3px solid ${colors.border}`,
                borderTop: `3px solid ${colors.primary}`,
              }}
            />
          </div>
        ) : vokabeln.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '2.5rem 1rem' }}
          >
            <p style={{ fontSize: '2.5rem', margin: '0 0 12px' }}>📭</p>
            <p style={{ color: colors.textMuted, fontSize: '0.9rem', lineHeight: 1.6 }}>
              Noch keine Vokabeln.<br />Füge oben die erste hinzu!
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {vokabeln.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  background:   isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                  borderRadius: tokens.radius.xl,
                  padding:      '0.85rem 1rem',
                  boxShadow:    isDark ? 'none' : colors.shadowSm,
                  gap:           8,
                  border:       `1px solid ${colors.border}`,
                }}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{
                    fontWeight: 700, color: colors.textDark, fontSize: '0.95rem',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '42%',
                  }}>
                    {v.vorderseite}
                  </span>
                  <span style={{ color: colors.border, fontSize: '0.85rem', flexShrink: 0 }}>→</span>
                  <span style={{
                    color: colors.textMid, fontSize: '0.9rem',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '42%',
                  }}>
                    {v.rueckseite}
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setLoescheVokabelId(v.id)}
                  style={{
                    background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: '1.1rem',
                    padding: '4px 6px', borderRadius: tokens.radius.sm,
                    flexShrink: 0, opacity: 0.45,
                    transition: 'opacity 0.15s',
                  }}
                >
                  🗑️
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}

        <div style={{ height: 32 }} />

        {/* Vokabel löschen Dialog */}
        <AnimatePresence>
          {loescheVokabelId && (
            <KonfirmDialog
              titel="Vokabel löschen?"
              hinweis="Der Lernfortschritt geht ebenfalls verloren."
              onBestaetigen={() => handleVokabelLoeschen(loescheVokabelId)}
              onAbbrechen={() => setLoescheVokabelId(null)}
              isDark={isDark} colors={colors} tokens={tokens}
            />
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  // ── Ansicht: Listen-Übersicht ─────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '1.25rem' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: tokens.font.size.xl, fontWeight: 800, color: colors.textDark, margin: 0 }}>
          📝 Meine Listen
        </h2>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setAnsicht('neu')}
          style={{
            padding:      '0.5rem 1rem',
            background:   'linear-gradient(135deg, #7C3AED, #4F46E5)',
            color:         'white',
            border:        'none',
            borderRadius:  tokens.radius.md,
            fontSize:      '0.88rem',
            fontWeight:    700,
            cursor:        'pointer',
            fontFamily:    'inherit',
            boxShadow:    '0 2px 8px rgba(124,58,237,0.35)',
          }}
        >
          + Neu
        </motion.button>
      </div>

      <AnimatePresence>
        {status && <StatusToast status={status} colors={colors} tokens={tokens} />}
      </AnimatePresence>

      {/* Laden */}
      {laden ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: `3px solid ${colors.border}`,
              borderTop: `3px solid ${colors.primary}`,
            }}
          />
        </div>
      ) : listen.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: '3rem 1rem' }}
        >
          <p style={{ fontSize: '2.5rem', margin: '0 0 12px' }}>📂</p>
          <p style={{ color: colors.textMuted, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 20 }}>
            Noch keine eigenen Listen.<br />Erstelle deine erste Liste!
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setAnsicht('neu')}
            style={{
              padding:      '0.9rem 2rem',
              background:   'linear-gradient(135deg, #7C3AED, #4F46E5)',
              color:         '#fff', border: 'none',
              borderRadius:  tokens.radius.xl,
              fontSize:      tokens.font.size.lg, fontWeight: 700,
              cursor:        'pointer', fontFamily: 'inherit',
              boxShadow:    '0 4px 16px rgba(124,58,237,0.35)',
            }}
          >
            + Erste Liste erstellen
          </motion.button>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {listen.map((liste, i) => {
            const listenId = `eigen_list_${liste.id}`
            const istAktiv = (einstellungen?.aktiveListen ?? []).includes(listenId)
            return (
              <motion.div
                key={liste.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  background:   isDark ? 'rgba(26,26,53,0.85)' : '#FFFFFF',
                  borderRadius: tokens.radius.card,
                  boxShadow:    isDark
                    ? '0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(167,139,250,0.08)'
                    : colors.shadowSm,
                  overflow:     'hidden',
                  border:       isDark ? '1px solid rgba(167,139,250,0.1)' : 'none',
                }}
              >
                {/* Oben: Titel + Öffnen */}
                <motion.div
                  whileTap={{ scale: 0.99 }}
                  onClick={() => oeffneListe(liste)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '1rem 1.1rem', cursor: 'pointer',
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: colors.textDark }}>
                      {liste.titel}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: colors.textMuted }}>
                      {liste.vokabelAnzahl ?? 0} Vokabeln
                    </span>
                  </div>
                  <span style={{ fontSize: '1.2rem', color: colors.border }}>›</span>
                </motion.div>

                {/* Unten: Toggle + Löschen */}
                <div style={{
                  display:       'flex',
                  alignItems:    'center',
                  justifyContent:'space-between',
                  padding:       '0.65rem 1.1rem',
                  borderTop:     `1px solid ${colors.border}`,
                  background:    isDark ? 'rgba(255,255,255,0.02)' : '#FAFBFC',
                }}>
                  <div
                    onClick={() => toggleListeAktiv(listenId)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  >
                    <div style={{
                      width: 36, height: 20, borderRadius: 10,
                      background: istAktiv
                        ? 'linear-gradient(135deg, #7C3AED, #4F46E5)'
                        : colors.border,
                      position: 'relative', flexShrink: 0,
                      transition: 'background 0.25s ease',
                      boxShadow: istAktiv ? '0 2px 8px rgba(124,58,237,0.35)' : 'none',
                    }}>
                      <motion.div
                        animate={{ x: istAktiv ? 17 : 2 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          position: 'absolute', top: 2,
                          width: 16, height: 16, borderRadius: '50%',
                          background: 'white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                      />
                    </div>
                    <span style={{
                      fontSize: '0.78rem', fontWeight: 600,
                      color: istAktiv ? colors.primary : colors.textMuted,
                    }}>
                      {istAktiv ? '✓ Aktiv' : 'Inaktiv'}
                    </span>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setLoescheListeId(liste.id)}
                    style={{
                      background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: '1rem',
                      opacity: 0.4, padding: '4px',
                    }}
                  >
                    🗑️
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <div style={{ height: 32 }} />

      {/* Liste löschen Dialog */}
      <AnimatePresence>
        {loescheListeId && (
          <KonfirmDialog
            titel="Liste löschen?"
            hinweis="Alle Vokabeln und der Lernfortschritt gehen verloren."
            onBestaetigen={() => handleListeLoeschen(loescheListeId)}
            onAbbrechen={() => setLoescheListeId(null)}
            isDark={isDark} colors={colors} tokens={tokens}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
