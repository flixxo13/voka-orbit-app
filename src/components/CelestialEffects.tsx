import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export type CelestialMode = 'epic' | 'ambient' | 'active' | 'focus';

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
        ? depth * 1.8 + 0.4
        : depth * 3.0 + 0.6;

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
        // Diamant-Strahl proportional zur Sterngröße (Perspektive/Tiefe):
        // Ferner Stern (depth≈0, size≈0.6px) → rayHalf ≈ 2.5px → winziger Diamant
        // Naher Stern  (depth≈1, size≈3.6px) → rayHalf ≈ 7.5px → sichtbarer Diamant
        rayHalf: size * 1.4 + 1.5,
        tier,
      };
    }),
  [starCount, mode]);

  // Diamant: ein zufälliger Stern zur Zeit, mit Pausen dazwischen
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

    </div>
  );
};