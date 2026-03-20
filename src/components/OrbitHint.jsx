// ============================================================
// VokaOrbit — src/components/OrbitHint.jsx
// Die schwebende Satellite/Quick-Hint Komponente.
//
// Features:
// - Zufällige vertikale Position innerhalb der Karte
// - Konstantes sanftes Schweben (Float-Loop)
// - Abkling-Balken: 8 Sekunden Gradient-Progress
// - Framer Motion: Orbit-Enter/Exit Easing
// - Draggable: Nutzer kann Hint wegziehen
// - Light: "QUICK HINT" / Dark: "SATELLITE SIGNAL"
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'

const HINT_DURATION = 8000  // 8 Sekunden Abklingzeit

// Zufällige Position: oben/mitte/unteres Drittel der Karte
const POSITIONEN = [
  { top: '8%',  label: 'oben' },
  { top: '28%', label: 'mitte-oben' },
  { top: '48%', label: 'mitte' },
]

export default function OrbitHint({ text, sichtbar, onAbgelaufen, onSchliessen }) {
  const { isDark, colors, tokens } = useTheme()
  const [fortschritt, setFortschritt] = useState(100)
  const [position]   = useState(() => POSITIONEN[Math.floor(Math.random() * POSITIONEN.length)])
  const timerRef     = useRef(null)
  const startRef     = useRef(null)
  const controls     = useAnimation()

  // Float-Loop starten wenn sichtbar
  useEffect(() => {
    if (!sichtbar) return
    controls.start({
      y: [0, -7, 0, -4, 0],
      transition: {
        duration:   4,
        ease:       'easeInOut',
        repeat:     Infinity,
        repeatType: 'loop',
      }
    })
  }, [sichtbar, controls])

  // Abkling-Timer
  useEffect(() => {
    if (!sichtbar) {
      setFortschritt(100)
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    startRef.current = Date.now()
    timerRef.current = setInterval(() => {
      const verstrichenMs = Date.now() - startRef.current
      const rest = Math.max(0, 100 - (verstrichenMs / HINT_DURATION) * 100)
      setFortschritt(rest)
      if (rest <= 0) {
        clearInterval(timerRef.current)
        if (onAbgelaufen) onAbgelaufen()
      }
    }, 50)

    return () => clearInterval(timerRef.current)
  }, [sichtbar])

  const label = isDark ? 'SATELLITE SIGNAL' : 'QUICK HINT'

  return (
    <AnimatePresence>
      {sichtbar && (
        <motion.div
          drag
          dragConstraints={{ left: -60, right: 60, top: -30, bottom: 30 }}
          dragElastic={0.15}
          animate={controls}
          initial={{ opacity: 0, y: -24, scale: 0.92 }}
          exit={{
            opacity: 0,
            y: -20,
            scale: 0.9,
            transition: { duration: 0.35, ease: [0.4, 0, 1, 1] }
          }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          style={{
            position:    'absolute',
            left:         '4%',
            right:        '4%',
            top:          position.top,
            zIndex:       30,
            cursor:       'grab',
          }}
          transition={{
            opacity:  { duration: 0.35, ease: [0.23, 1, 0.32, 1] },
            y:        { duration: 0.45, ease: [0.23, 1, 0.32, 1] },
            scale:    { duration: 0.35, ease: [0.23, 1, 0.32, 1] },
          }}
        >
          <div style={{
            background:         isDark
              ? 'rgba(26, 26, 53, 0.92)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter:     'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius:       tokens.radius.cardLg,
            border:             `1px solid ${isDark
              ? 'rgba(167, 139, 250, 0.25)'
              : 'rgba(255, 255, 255, 0.8)'}`,
            boxShadow:          isDark
              ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.15)'
              : '0 8px 32px rgba(0,0,0,0.12)',
            overflow:           'hidden',
            userSelect:         'none',
          }}>

            {/* ── Inhalt ── */}
            <div style={{
              display:  'flex',
              alignItems: 'center',
              gap:      12,
              padding:  '12px 14px 10px',
            }}>
              {/* Icon */}
              <div style={{
                width:        38,
                height:       38,
                borderRadius: tokens.radius.md,
                background:   isDark
                  ? 'rgba(6, 182, 212, 0.15)'
                  : 'rgba(59, 130, 246, 0.08)',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                flexShrink:   0,
                border:       `1px solid ${isDark
                  ? 'rgba(6,182,212,0.2)'
                  : 'rgba(59,130,246,0.15)'}`,
              }}>
                <span style={{ fontSize: '1.1rem' }}>💡</span>
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize:      '0.68rem',
                  fontWeight:    700,
                  color:         colors.cyan,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom:  3,
                }}>
                  {label}
                </div>
                <div style={{
                  fontSize:   '0.9rem',
                  fontWeight: 500,
                  color:      isDark ? '#CBD5E1' : '#1E293B',
                  lineHeight: 1.4,
                }}>
                  {text}
                </div>
              </div>

              {/* Schließen */}
              <button
                onClick={(e) => { e.stopPropagation(); onSchliessen?.() }}
                style={{
                  background:    'none',
                  border:        'none',
                  cursor:        'pointer',
                  padding:       4,
                  color:         isDark ? '#64748B' : '#94A3B8',
                  fontSize:      '1rem',
                  lineHeight:    1,
                  flexShrink:    0,
                  fontFamily:    'inherit',
                }}
              >
                ×
              </button>
            </div>

            {/* ── Abkling-Balken ── */}
            <div style={{
              height:     3,
              background: isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.06)',
              margin:     '0 14px 10px',
              borderRadius: 2,
              overflow:   'hidden',
            }}>
              <div style={{
                height:     '100%',
                width:      `${fortschritt}%`,
                background: isDark
                  ? 'linear-gradient(90deg, #06B6D4, #A78BFA)'
                  : 'linear-gradient(90deg, #7C3AED, #60A5FA)',
                borderRadius: 2,
                transition: 'width 0.05s linear',
                boxShadow:  isDark
                  ? '0 0 6px rgba(6,182,212,0.5)'
                  : 'none',
              }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
