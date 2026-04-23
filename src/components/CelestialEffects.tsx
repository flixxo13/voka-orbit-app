import { useMemo } from "react";
import { motion } from "motion/react";

export type CelestialMode = 'epic' | 'ambient' | 'active' | 'focus';

/**
 * CelestialEffects — 3 Sterne-Verhaltensebenen:
 *
 *  rest    (60%) → quasi-statisch, kaum merklich
 *  breath  (25%) → spürbares Auf- und Abatmen
 *  sparkle (15%) → unregelmäßiger Glow-Ring-Puls, dann Pause
 *
 * Alle Event-Animationen (Gas Giant, Solar, Komet, Sternschnuppe)
 * sind deaktiviert — nur Sterne aktiv.
 */
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
      const depth = Math.random();

      const tier: 'sparkle' | 'breath' | 'rest' =
        mode === 'focus'                       ? 'rest'
        : i < Math.floor(starCount * 0.15)    ? 'sparkle'  // ~4–5 Sterne
        : i < Math.floor(starCount * 0.40)    ? 'breath'   // ~7–8 Sterne
        : 'rest';                                           // ~18 Sterne

      const size = mode === 'focus'
        ? depth * 1.8 + 0.4
        : depth * 3.0 + 0.6;

      return {
        x: Math.random() * 96 + 2,
        y: Math.random() * 96 + 2,
        size,

        baseOpacity:
          mode === 'focus'     ? 0.06 + depth * 0.14
          : tier === 'sparkle' ? 0.30 + depth * 0.30   // dezent im Ruhezustand
          : tier === 'breath'  ? 0.28 + depth * 0.48
          :                      0.22 + depth * 0.52,

        // Sparkler: kurzer Glow-Puls (1.5–2.5s) + lange Pause danach
        cycleDuration:
          tier === 'sparkle' ? 1.5 + Math.random() * 1.0   // 1.5–2.5s
          : tier === 'breath' ? 4   + Math.random() * 4    // 4–8s
          :                     8   + Math.random() * 8,   // 8–16s

        // Delay damit Sterne versetzt starten
        delay: Math.random() * 7,

        // Sparkler: unregelmäßige Pause zwischen Glows (gibt Natürlichkeit)
        repeatDelay: tier === 'sparkle' ? 4 + Math.random() * 11 : 0, // 4–15s

        // Glow-Stärke: proportional zur Sterngröße
        glowR: size * 3.5 + 3,   // z.B. 5–14px äußerer Radius
        glowS: size * 1.0 + 0.5, // z.B. 1–4px spread

        tier,
      };
    }),
  [starCount, mode]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">

      {stars.map((s, i) => {

        /* ── REST: quasi-statisch ── */
        if (s.tier === 'rest') {
          return (
            <motion.div
              key={`star-${mode}-${i}`}
              className="absolute rounded-full bg-white"
              style={{
                width:  s.size,
                height: s.size,
                left: `${s.x}%`,
                top:  `${s.y}%`,
              }}
              animate={{
                opacity: [s.baseOpacity * 0.82, s.baseOpacity, s.baseOpacity * 0.82],
              }}
              transition={{
                duration: s.cycleDuration,
                delay:    s.delay,
                repeat:   Infinity,
                ease:     'easeInOut',
              }}
            />
          );
        }

        /* ── BREATH: spürbares Atmen ── */
        if (s.tier === 'breath') {
          return (
            <motion.div
              key={`star-${mode}-${i}`}
              className="absolute rounded-full bg-white"
              style={{
                width:  s.size,
                height: s.size,
                left: `${s.x}%`,
                top:  `${s.y}%`,
              }}
              animate={{
                opacity: [
                  s.baseOpacity * 0.45,
                  s.baseOpacity * 1.55,
                  s.baseOpacity * 0.45,
                ],
                scale: [0.88, 1.22, 0.88],
              }}
              transition={{
                duration: s.cycleDuration,
                delay:    s.delay,
                repeat:   Infinity,
                ease:     'easeInOut',
              }}
            />
          );
        }

        /* ── SPARKLE: Glow-Ring-Puls, unregelmäßig ── */
        // boxShadow-Werte: konsistente 2-Layer-Struktur (Framer Motion interpoliert korrekt)
        const glowOff = `0 0 0px 0px rgba(255,255,255,0.00), 0 0 0px 0px rgba(255,255,255,0.00)`;
        const glowOn  = `0 0 ${s.glowR}px ${s.glowS}px rgba(255,255,255,0.80), 0 0 ${s.glowR * 2.2}px ${s.glowS * 1.5}px rgba(255,255,255,0.28)`;

        return (
          <motion.div
            key={`star-${mode}-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              width:  s.size,
              height: s.size,
              left: `${s.x}%`,
              top:  `${s.y}%`,
            }}
            animate={{
              opacity:   [s.baseOpacity, 1.0, s.baseOpacity],
              scale:     [1.0, 1.45, 1.0],
              boxShadow: [glowOff, glowOn, glowOff],
            }}
            transition={{
              duration:    s.cycleDuration,
              delay:       s.delay,
              repeat:      Infinity,
              repeatDelay: s.repeatDelay,  // unregelmäßige Pause = natürliches Funkeln
              ease:        'easeInOut',
            }}
          />
        );
      })}

    </div>
  );
};
