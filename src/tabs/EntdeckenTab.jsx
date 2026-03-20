// ============================================================
// VokaOrbit — tabs/EntdeckenTab.jsx  v2.0
// Vokabellisten entdecken & aktivieren.
// Migriert auf useTheme() — vollständiger Dark Mode Support.
// ============================================================

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEinstellungen } from '../hooks/useEinstellungen'
import { useTheme } from '../hooks/useTheme'
import { toggleListe } from '../einstellungen'
import { ladeEigeneListen } from '../core/listen'

const NIVEAU_FARBEN = {
  A1: { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0', darkBg: 'rgba(22,163,74,0.15)', darkText: '#4ade80' },
  A2: { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe', darkBg: 'rgba(37,99,235,0.15)', darkText: '#60a5fa' },
  B1: { bg: '#fef9c3', text: '#ca8a04', border: '#fef08a', darkBg: 'rgba(202,138,4,0.15)',  darkText: '#fbbf24' },
  B2: { bg: '#ffedd5', text: '#ea580c', border: '#fed7aa', darkBg: 'rgba(234,88,12,0.15)',  darkText: '#fb923c' },
  C1: { bg: '#fce7f3', text: '#db2777', border: '#fbcfe8', darkBg: 'rgba(219,39,119,0.15)', darkText: '#f472b6' },
}

function NiveauBadge({ niveau, isDark }) {
  const f = NIVEAU_FARBEN[niveau]
  if (!f) return null
  return (
    <span style={{
      background:   isDark ? f.darkBg  : f.bg,
      color:        isDark ? f.darkText : f.text,
      border:       `1px solid ${isDark ? 'transparent' : f.border}`,
      borderRadius: 6,
      padding:      '2px 10px',
      fontSize:     '0.72rem',
      fontWeight:    800,
      letterSpacing: '0.04em',
    }}>
      {niveau}
    </span>
  )
}

// ── Vorschau Modal (Bottom Sheet) ─────────────────────────────
function VorschauModal({ liste, aktiv, onSchliessen, onToggle, isDark, colors, tokens }) {
  const [vokabeln, setVokabeln] = useState([])
  const [laden,    setLaden]    = useState(true)

  useEffect(() => {
    async function lade() {
      try {
        const res   = await fetch(`/listen/${liste.id}.json`)
        const daten = await res.json()
        setVokabeln(daten.slice(0, 12))
      } catch { setVokabeln([]) }
      setLaden(false)
    }
    lade()
  }, [liste.id])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onSchliessen}
      style={{
        position:       'fixed',
        inset:           0,
        background:     colors.overlay,
        display:        'flex',
        alignItems:     'flex-end',
        zIndex:          tokens.z.modal,
        backdropFilter: 'blur(6px)',
      }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width:        '100%',
          background:   isDark ? '#1A1A35' : '#FFFFFF',
          borderRadius: '24px 24px 0 0',
          padding:      '1.5rem 1.5rem 2rem',
          boxShadow:    isDark
            ? '0 -8px 40px rgba(0,0,0,0.6)'
            : '0 -4px 40px rgba(0,0,0,0.15)',
          maxHeight:    '82vh',
          overflowY:   'auto',
          border:       isDark ? '1px solid rgba(167,139,250,0.15)' : 'none',
          borderBottom: 'none',
        }}
      >
        {/* Drag Handle */}
        <div style={{
          width: 40, height: 4,
          background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
          borderRadius: 2,
          margin: '0 auto 20px',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '1.4rem' }}>{liste.flagge}</span>
              <NiveauBadge niveau={liste.niveau} isDark={isDark} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: colors.textDark, margin: '0 0 2px' }}>
              {liste.beschreibung}
            </h3>
            <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: 0, fontWeight: 500 }}>
              {liste.anzahl} Vokabeln
            </p>
          </div>
          <button onClick={onSchliessen} style={{
            background:   isDark ? 'rgba(255,255,255,0.08)' : colors.borderLight,
            border:       'none',
            borderRadius: '50%',
            width: 32, height: 32,
            cursor:       'pointer',
            fontSize:     '0.85rem',
            color:        colors.textLight,
            fontWeight:   700,
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            flexShrink:   0,
          }}>✕</button>
        </div>

        {/* Vorschau Liste */}
        <div style={{
          background:   isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceAlt,
          borderRadius: tokens.radius.xl,
          padding:      '0.5rem',
          marginBottom: 16,
          maxHeight:    '38vh',
          overflowY:    'auto',
          border:       `1px solid ${colors.border}`,
        }}>
          {laden ? (
            <p style={{ color: colors.textMuted, padding: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
              Lädt...
            </p>
          ) : (
            vokabeln.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:         8,
                  padding:    '0.55rem 0.75rem',
                  borderRadius: tokens.radius.md,
                }}
              >
                <span style={{ fontWeight: 700, color: colors.textDark, fontSize: '0.9rem', flex: 1 }}>{v.wort}</span>
                <span style={{ color: colors.border, fontSize: '0.8rem', flexShrink: 0 }}>→</span>
                <span style={{ color: colors.textMid, fontSize: '0.9rem', flex: 1 }}>{v.uebersetzung}</span>
              </motion.div>
            ))
          )}
          {!laden && vokabeln.length > 0 && (
            <p style={{ textAlign: 'center', color: colors.textMuted, fontSize: '0.78rem', padding: '0.5rem', margin: 0 }}>
              + {liste.anzahl - vokabeln.length} weitere Vokabeln...
            </p>
          )}
        </div>

        {/* Toggle Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onToggle}
          style={{
            width:        '100%',
            padding:      '0.95rem',
            background:   aktiv
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            color:        '#fff',
            border:       'none',
            borderRadius: tokens.radius.xl,
            fontSize:     '1rem',
            fontWeight:   700,
            cursor:       'pointer',
            fontFamily:   'inherit',
            boxShadow:    aktiv
              ? '0 4px 16px rgba(239,68,68,0.35)'
              : '0 4px 16px rgba(124,58,237,0.35)',
          }}
        >
          {aktiv ? '✕ Liste deaktivieren' : '✓ Liste aktivieren'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════
export default function EntdeckenTab() {
  const { einstellungen, setEinstellungen } = useEinstellungen()
  const { isDark, colors, tokens }          = useTheme()

  const [index,        setIndex]        = useState(null)
  const [listen,       setListen]       = useState([])
  const [eigeneListen, setEigeneListen] = useState([])
  const [laden,        setLaden]        = useState(true)
  const [toggleAnim,   setToggleAnim]   = useState(null)

  const aktiveListen = einstellungen?.aktiveListen ?? ['en_a1']

  useEffect(() => {
    async function ladeAlles() {
      try {
        const [res, eigene] = await Promise.all([
          fetch('/listen/index.json').then(r => r.json()),
          ladeEigeneListen()
        ])
        setListen(res)
        setEigeneListen(eigene)
      } catch { setListen([]) }
      setLaden(false)
    }
    ladeAlles()
  }, [])

  async function handleToggle(listenId) {
    setToggleAnim(listenId)
    const aktualisiert = await toggleListe(einstellungen, listenId)
    setEinstellungen(aktualisiert)
    setTimeout(() => setToggleAnim(null), 400)
    setIndex(null)
  }

  function toggleEigeneListe(listenId) {
    const aktiv = aktiveListen.includes(listenId)
    const neu   = aktiv
      ? aktiveListen.filter(l => l !== listenId)
      : [...aktiveListen, listenId]
    setEinstellungen({ ...einstellungen, aktiveListen: neu })
  }

  if (laden) {
    return (
      <div style={{ padding: '1.25rem', display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            border: `3px solid ${colors.border}`,
            borderTop: `3px solid ${colors.primary}`,
          }}
        />
      </div>
    )
  }

  const nachSprache = {}
  listen.forEach(l => {
    if (!nachSprache[l.sprache]) nachSprache[l.sprache] = []
    nachSprache[l.sprache].push(l)
  })

  const ausgewaehlteListe = index !== null ? listen[index] : null

  return (
    <div style={{ padding: '1.25rem' }}>

      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{
          fontSize:      '1.3rem',
          fontWeight:     800,
          color:          colors.textDark,
          margin:        '0 0 4px',
          letterSpacing: tokens.font.tracking.tight,
        }}>
          📚 Vokabellisten
        </h2>
        <p style={{ fontSize: '0.85rem', color: colors.textMuted, margin: 0 }}>
          Wähle welche Listen du lernen möchtest
        </p>
      </div>

      {/* Sprach-Gruppen */}
      {Object.entries(nachSprache).map(([sprache, sprachListen], gi) => (
        <motion.div
          key={sprache}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: gi * 0.08, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          style={{ marginBottom: 24 }}
        >
          {/* Sprach-Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: '1.3rem' }}>{sprachListen[0].flagge}</span>
            <span style={{
              fontSize:   '0.95rem',
              fontWeight:  700,
              color:       colors.textDark,
              flex:        1,
            }}>
              {sprache}
            </span>
            <span style={{
              fontSize:   '0.72rem',
              color:       colors.primary,
              fontWeight:  700,
              background:  isDark ? 'rgba(124,58,237,0.15)' : '#f5f3ff',
              padding:    '2px 8px',
              borderRadius: tokens.radius.sm,
            }}>
              {sprachListen.filter(l => aktiveListen.includes(l.id)).length} aktiv
            </span>
          </div>

          {/* Listen-Karten */}
          {sprachListen.map((liste, li) => {
            const istAktiv  = aktiveListen.includes(liste.id)
            const globalIdx = listen.indexOf(liste)
            const animiert  = toggleAnim === liste.id

            return (
              <motion.div
                key={liste.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0, scale: animiert ? 0.97 : 1 }}
                transition={{ delay: gi * 0.08 + li * 0.04, duration: 0.3 }}
                onClick={() => setIndex(globalIdx)}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  background:   isDark
                    ? (istAktiv ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)')
                    : (istAktiv ? '#FAF5FF' : '#FFFFFF'),
                  borderRadius: tokens.radius.card,
                  padding:      '1rem 1.1rem',
                  marginBottom:  8,
                  border:       `2px solid ${istAktiv ? colors.primary : colors.border}`,
                  boxShadow:    isDark ? 'none' : colors.shadowSm,
                  cursor:       'pointer',
                  gap:           12,
                  transition:   'all 0.2s ease',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <NiveauBadge niveau={liste.niveau} isDark={isDark} />
                    {istAktiv && (
                      <span style={{
                        fontSize:   '0.68rem',
                        fontWeight:  700,
                        color:       colors.primary,
                        background:  isDark ? 'rgba(124,58,237,0.2)' : colors.primaryLight,
                        padding:    '1px 8px',
                        borderRadius: tokens.radius.xs,
                      }}>
                        ✓ Aktiv
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize:      '0.9rem',
                    fontWeight:     600,
                    color:          colors.textDark,
                    margin:        '0 0 2px',
                    whiteSpace:    'nowrap',
                    overflow:      'hidden',
                    textOverflow:  'ellipsis',
                  }}>
                    {liste.beschreibung}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: 0, fontWeight: 500 }}>
                    {liste.anzahl} Vokabeln
                  </p>
                </div>

                {/* Toggle Switch */}
                <div
                  onClick={e => { e.stopPropagation(); handleToggle(liste.id) }}
                  style={{
                    width:        44,
                    height:       24,
                    borderRadius: 12,
                    background:   istAktiv
                      ? 'linear-gradient(135deg, #7C3AED, #4F46E5)'
                      : colors.border,
                    cursor:       'pointer',
                    position:     'relative',
                    flexShrink:   0,
                    transition:   'background 0.25s ease',
                    boxShadow:    istAktiv ? '0 2px 8px rgba(124,58,237,0.35)' : 'none',
                  }}
                >
                  <motion.div
                    animate={{ x: istAktiv ? 20 : 2 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    style={{
                      position:     'absolute',
                      top:           2,
                      width:         20,
                      height:        20,
                      borderRadius: '50%',
                      background:   'white',
                      boxShadow:    '0 1px 4px rgba(0,0,0,0.25)',
                    }}
                  />
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      ))}

      {/* Eigene Listen */}
      {eigeneListen.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          style={{ marginBottom: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: '1.3rem' }}>✏️</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: colors.textDark, flex: 1 }}>
              Meine Listen
            </span>
            <span style={{
              fontSize: '0.72rem', color: colors.primary, fontWeight: 700,
              background: isDark ? 'rgba(124,58,237,0.15)' : '#f5f3ff',
              padding: '2px 8px', borderRadius: tokens.radius.sm,
            }}>
              {eigeneListen.filter(l => aktiveListen.includes(l.listenId)).length} aktiv
            </span>
          </div>

          {eigeneListen.map((liste, i) => {
            const istAktiv = aktiveListen.includes(liste.listenId)
            return (
              <motion.div
                key={liste.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  background:   isDark
                    ? (istAktiv ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)')
                    : (istAktiv ? '#FAF5FF' : '#FFFFFF'),
                  borderRadius: tokens.radius.card,
                  padding:      '1rem 1.1rem',
                  marginBottom:  8,
                  border:       `2px solid ${istAktiv ? colors.primary : colors.border}`,
                  boxShadow:    isDark ? 'none' : colors.shadowSm,
                  gap:           12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700,
                      color: isDark ? '#60a5fa' : '#2563eb',
                      background: isDark ? 'rgba(37,99,235,0.15)' : '#dbeafe',
                      padding: '1px 8px', borderRadius: tokens.radius.xs,
                    }}>
                      Eigene
                    </span>
                    {istAktiv && (
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 700, color: colors.primary,
                        background: isDark ? 'rgba(124,58,237,0.2)' : colors.primaryLight,
                        padding: '1px 8px', borderRadius: tokens.radius.xs,
                      }}>✓ Aktiv</span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.textDark, margin: '0 0 2px' }}>
                    {liste.titel}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: 0 }}>
                    {liste.vokabelAnzahl ?? 0} Vokabeln
                  </p>
                </div>

                <div
                  onClick={() => toggleEigeneListe(liste.listenId)}
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: istAktiv ? 'linear-gradient(135deg, #7C3AED, #4F46E5)' : colors.border,
                    cursor: 'pointer', position: 'relative', flexShrink: 0,
                    transition: 'background 0.25s ease',
                    boxShadow: istAktiv ? '0 2px 8px rgba(124,58,237,0.35)' : 'none',
                  }}
                >
                  <motion.div
                    animate={{ x: istAktiv ? 20 : 2 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute', top: 2,
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    }}
                  />
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Info Box */}
      <div style={{
        background:   isDark ? 'rgba(255,255,255,0.04)' : colors.surfaceAlt,
        borderRadius: tokens.radius.lg,
        padding:      '0.85rem 1rem',
        border:       `1px solid ${colors.border}`,
      }}>
        <p style={{ fontSize: '0.82rem', color: colors.textMuted, margin: 0, textAlign: 'center' }}>
          💡 Tippe auf eine offizielle Liste für eine Vorschau
        </p>
      </div>

      <div style={{ height: 32 }} />

      {/* Vorschau Modal */}
      <AnimatePresence>
        {ausgewaehlteListe && (
          <VorschauModal
            liste={ausgewaehlteListe}
            aktiv={aktiveListen.includes(ausgewaehlteListe.id)}
            onSchliessen={() => setIndex(null)}
            onToggle={() => handleToggle(ausgewaehlteListe.id)}
            isDark={isDark}
            colors={colors}
            tokens={tokens}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
