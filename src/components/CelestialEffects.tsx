import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

export type CelestialMode = 'epic' | 'ambient' | 'active' | 'focus';

// ─── Sternschnuppe ───────────────────────────────────────────────────────────
// Basiert auf Bildanalyse: Kern weiß+Cyan-Glow, Schweif 45–50° diagonal,
// ca. 15× so lang wie Kern breit, Linear-Gradient cyan-weiß → transparent.
// Seltenes Event: nur im ambient-Modus, alle 25–50 Sekunden einmal.

type ShootingStarState = {
  startX: number; // % vom linken Rand
  startY: number; // % vom oberen Rand
  key: number;
};

function ShootingStar({ s }: { s: ShootingStarState }) {
  // Schweif-Länge & Kern-Größe (natürliche Proportionen aus dem Bild)
  const tailLength = 220; // px — entspricht ~15× Kernbreite
  const coreSize   = 6;   // px — leuchtender Kern
  const angle      = 47;  // Grad — Winkel wie im Referenzbild (oben-rechts → unten-links)

  // Gesamtdauer: 0.3s Fade-in, 1.4s Zug, 0.4s Fade-out
  const duration = 2.1;

  return (
    <motion.div
      key={s.key}
      style={{
        position: 'absolute',
        left: `${s.startX}%`,
        top:  `${s.startY}%`,
        // Rotation so dass Schweif von oben-rechts nach unten-links zieht
        transform: `rotate(${angle}deg)`,
        transformOrigin: 'left center',
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
      initial={{ opacity: 0, x: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        // bewegt sich entlang der Schweifachse
        x: [0, tailLength * 0.5, tailLength * 1.1, tailLength * 1.4],
      }}
      exit={{ opacity: 0 }}
      transition={{
        duration,
        times: [0, 0.18, 0.75, 1],
        ease: 'easeIn',
      }}
    >
      {/* Schweif — Linear-Gradient: transparent links → cyan-weiß rechts (Kern-Ende) */}
      <div style={{
        width:  tailLength,
        height: 2,
        background: 'linear-gradient(90deg, transparent 0%, rgba(6,210,230,0.10) 35%, rgba(6,210,230,0.55) 70%, rgba(200,245,255,0.90) 92%, rgba(255,255,255,0.98) 100%)',
        borderRadius: 2,
        // Weiche Kante nach oben/unten (Schweif ist nicht hart-geschnitten)
        boxShadow: '0 0 4px 1px rgba(6,210,230,0.18)',
        flexShrink: 0,
      }} />

      {/* Kern — weißer Punkt mit Cyan-Glow */}
      <div style={{
        width:  coreSize,
        height: coreSize,
        borderRadius: '50%',
        background: '#FFFFFF',
        flexShrink: 0,
        boxShadow: [
          `0 0 ${coreSize * 1.2}px ${coreSize * 0.5}px rgba(255,255,255,0.95)`,
          `0 0 ${coreSize * 3.0}px ${coreSize * 1.2}px rgba(6,210,230,0.80)`,
          `0 0 ${coreSize * 6.0}px ${coreSize * 2.0}px rgba(6,210,230,0.30)`,
        ].join(', '),
      }} />
    </motion.div>
  );
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export const CelestialEffects = ({
  mode = 'ambient',
  testMode: _testMode = false,
}: {
  mode?: CelestialMode;
  testMode?: boolean;
}) => {
  const starCount = mode === 'focus' ? 12 : 30;

  const stars = useMemo(() =>
    Array.from({ length: starCount }).map((_, i) => {
      const depth = Math.random(); // 0 = weit weg/klein, 1 = nah/groß

      const tier: 'sparkle' | 'breath' | 'rest' =
        mode === 'focus'                       ? 'rest'
        : i < Math.floor(starCount * 0.15)    ? 'sparkle'
        : i < Math.floor(starCount * 0.40)    ? 'breath'
        : 'rest';

      const size = mode === 'focus'
        ? depth * 0.7 + 0.4   // focus: 0.4 – 1.1 px  (sehr fern, ruhig)
        : depth * 1.0 + 0.4;  // ambient+: 0.4 – 1.4 px (nadelfein, tief)

      return {
        x: Math.random() * 96 + 2,
        y: Math.random() * 96 + 2,
        size,
        depth,
        baseOpacity:
          mode === 'focus'     ? 0.06 + depth * 0.14
          : tier === 'sparkle' ? 0.30 + depth * 0.30
          : tier === 'breath'  ? 0.28 + depth * 0.48
          :                      0.22 + depth * 0.52,
        cycleDuration:
          tier === 'sparkle' ? 1.5 + Math.random() * 1.0
          : tier === 'breath' ? 4   + Math.random() * 4
          :                     8   + Math.random() * 8,
        delay: Math.random() * 7,
        repeatDelay: tier === 'sparkle' ? 4 + Math.random() * 11 : 0,
        glowR: size * 3.5 + 3,
        glowS: size * 1.0 + 0.5,
        rayHalf: size * 1.4 + 1.5,
        tier,
      };
    }),
  [starCount, mode]);

  // ── Diamant-Sparkle ──────────────────────────────────────────────────────
  const [diamondIdx, setDiamondIdx] = useState<number | null>(null);

  useEffect(() => {
    if (mode === 'focus') return;
    let running = true;

    const cycle = async () => {
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
      while (running) {
        const idx = Math.floor(Math.random() * starCount);
        setDiamondIdx(idx);
        await new Promise(r => setTimeout(r, 2200 + Math.random() * 1000));
        if (!running) break;
        setDiamondIdx(null);
        await new Promise(r => setTimeout(r, 9000 + Math.random() * 14000));
      }
    };

    cycle();
    return () => { running = false; };
  }, [mode, starCount]);

  // ── Sternschnuppe ────────────────────────────────────────────────────────
  // Nur im ambient-Modus, alle 25–50 Sekunden einmal.
  const [shootingStar, setShootingStar] = useState<ShootingStarState | null>(null);
  const shootingStarKey = useRef(0);

  useEffect(() => {
    if (mode !== 'ambient') return;
    let running = true;

    const cycle = async () => {
      // Erste Erscheinung: 8–18s nach Laden (nicht sofort)
      await new Promise(r => setTimeout(r, 8000 + Math.random() * 10000));
      while (running) {
        // Startpunkt: oberes Drittel des Screens, von rechts kommend
        // Startpunkt leicht außerhalb des rechten Rands, um von dort reinzuziehen
        const startX = 55 + Math.random() * 35; // 55–90% von links
        const startY = 5  + Math.random() * 28; // 5–33% von oben
        shootingStarKey.current += 1;
        setShootingStar({ startX, startY, key: shootingStarKey.current });

        // Sternschnuppe sichtbar für ~2.1s (Animation-Dauer)
        await new Promise(r => setTimeout(r, 2200));
        if (!running) break;
        setShootingStar(null);

        // Pause bis zur nächsten: 25–50 Sekunden
        await new Promise(r => setTimeout(r, 25000 + Math.random() * 25000));
      }
    };

    cycle();
    return () => { running = false; };
  }, [mode]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">

      {stars.map((s, i) => {
        if (s.tier === 'rest') return (
          <motion.div
            key={`star-${mode}-${i}`}
            className="absolute rounded-full bg-white"
            style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%` }}
            animate={{ opacity: [s.baseOpacity * 0.82, s.baseOpacity, s.baseOpacity * 0.82] }}
            transition={{ duration: s.cycleDuration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        );

        if (s.tier === 'breath') return (
          <motion.div
            key={`star-${mode}-${i}`}
            className="absolute rounded-full bg-white"
            style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%` }}
            animate={{
              opacity: [s.baseOpacity * 0.45, s.baseOpacity * 1.55, s.baseOpacity * 0.45],
              scale:   [0.88, 1.22, 0.88],
            }}
            transition={{ duration: s.cycleDuration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        );

        // Sparkle: Glow-Ring
        const off = `0 0 0px 0px rgba(255,255,255,0), 0 0 0px 0px rgba(255,255,255,0)`;
        const on  = `0 0 ${s.glowR}px ${s.glowS}px rgba(255,255,255,0.80), 0 0 ${s.glowR * 2.2}px ${s.glowS * 1.5}px rgba(255,255,255,0.28)`;
        return (
          <motion.div
            key={`star-${mode}-${i}`}
            className="absolute rounded-full bg-white"
            style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%` }}
            animate={{ opacity: [s.baseOpacity, 1.0, s.baseOpacity], scale: [1, 1.45, 1], boxShadow: [off, on, off] }}
            transition={{ duration: s.cycleDuration, delay: s.delay, repeat: Infinity, repeatDelay: s.repeatDelay, ease: 'easeInOut' }}
          />
        );
      })}

      {/* ✦ Diamant-Sparkle: ein Stern zur Zeit, tiefenproportional */}
      <AnimatePresence>
        {diamondIdx !== null && (() => {
          const s = stars[diamondIdx];
          if (!s) return null;
          const r = s.rayHalf;
          const trans = { duration: 2.2, times: [0, 0.25, 0.75, 1], ease: 'easeInOut' as const };
          const rayStyle = { borderRadius: 99, position: 'absolute' as const, left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%,-50%)' };
          return (
            <>
              <motion.div key={`dh-${diamondIdx}`} style={{ ...rayStyle, height: 1, width: r * 2, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.85),transparent)' }}
                initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: [0,1,1,0], opacity: [0,0.85,0.85,0] }} exit={{ scaleX: 0, opacity: 0 }} transition={trans} />
              <motion.div key={`dv-${diamondIdx}`} style={{ ...rayStyle, width: 1, height: r * 2, background: 'linear-gradient(180deg,transparent,rgba(255,255,255,0.85),transparent)' }}
                initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: [0,1,1,0], opacity: [0,0.85,0.85,0] }} exit={{ scaleY: 0, opacity: 0 }} transition={trans} />
            </>
          );
        })()}
      </AnimatePresence>

      {/* ☄ Sternschnuppe: ambient-Modus, selten, natürlich */}
      <AnimatePresence>
        {shootingStar && (
          <ShootingStar key={shootingStar.key} s={shootingStar} />
        )}
      </AnimatePresence>

    </div>
  );
};