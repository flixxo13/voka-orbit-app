import { useMemo } from "react";
import { motion } from "motion/react";

export type CelestialMode = 'epic' | 'ambient' | 'active' | 'focus';

/**
 * CelestialEffects — Hintergrund-Sterne mit 3 Verhaltensebenen:
 *
 *  rest    (60%) → quasi-statisch, kaum merklich
 *  breath  (25%) → sanftes Atmen, spürbar dezent
 *  sparkle (15%) → kurzer 4-Punkt-Diamant-Lichtblitz, dann lange Ruhe
 *
 * Gas Giant / Komet / Sternschnuppe / Sonnenexplosion: deaktiviert.
 * testMode: API-kompatibel gehalten, aktuell unused.
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

      /* Tier-Zuweisung */
      const tier: 'sparkle' | 'breath' | 'rest' =
        mode === 'focus'                          ? 'rest'
        : i < Math.floor(starCount * 0.15)       ? 'sparkle'  // ~4–5 Sterne
        : i < Math.floor(starCount * 0.40)       ? 'breath'   // ~7–8 Sterne
        : 'rest';                                              // ~18 Sterne

      return {
        x: Math.random() * 96 + 2,
        y: Math.random() * 96 + 2,
        size: mode === 'focus'
          ? depth * 1.8 + 0.4
          : depth * 3.0 + 0.6,

        baseOpacity:
          mode === 'focus' ? 0.05 + depth * 0.12
          : tier === 'sparkle' ? 0.28 + depth * 0.28  // im Ruhezustand eher dezent
          : tier === 'breath'  ? 0.28 + depth * 0.48
          : 0.22 + depth * 0.52,

        // Sparkler: kurzer aktiver Zyklus (= der Blitz selbst) + repeatDelay für Ruhepause
        cycleDuration:
          tier === 'sparkle' ? 2.5 + Math.random() * 1.5  //  2.5–4s  (Blitz-Dauer)
          : tier === 'breath' ? 5   + Math.random() * 5   //  5–10s   (Atem-Zyklus)
          :                     8   + Math.random() * 8,  //  8–16s   (Rest-Zyklus)

        // Maximaler Delay 8s — damit alles innerhalb von Sekunden sichtbar ist
        delay: Math.random() * 8,

        // Sparkler: Pause ZWISCHEN den Blitzen (repeatDelay)
        repeatDelay: tier === 'sparkle' ? 6 + Math.random() * 10 : 0, // 6–16s Pause

        /* Diamant-Strahl-Länge (halbe Länge — wird in beide Richtungen gespiegelt) */
        rayHalf: 10 + depth * 14,  // 10–24 px

        tier,
      };
    }),
  [starCount, mode]);

  /* ─────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">

      {stars.map((s, i) => {

        /* ══════════════════════════════════════
           REST — quasi-statisch
        ══════════════════════════════════════ */
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
                opacity: mode === 'focus'
                  ? [s.baseOpacity * 0.65, s.baseOpacity, s.baseOpacity * 0.65]
                  : [s.baseOpacity * 0.85, s.baseOpacity, s.baseOpacity * 0.85],
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

        /* ══════════════════════════════════════
           BREATH — sanftes Atmen
        ══════════════════════════════════════ */
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
                  s.baseOpacity * 0.60,
                  s.baseOpacity,
                  s.baseOpacity * 1.40,   // heller, aber kein voller Blitz
                  s.baseOpacity,
                  s.baseOpacity * 0.60,
                ],
                scale: [1, 1, 1.15, 1, 1],
              }}
              transition={{
                duration: s.cycleDuration,
                delay:    s.delay,
                repeat:   Infinity,
                times:    [0, 0.28, 0.50, 0.72, 1],
                ease:     'easeInOut',
              }}
            />
          );
        }

        /* ══════════════════════════════════════
           SPARKLE — 4-Punkt-Diamant-Lichtblitz
           38% Ruhe → schneller Peak → 50% Ruhe
        ══════════════════════════════════════ */
        // Sparkler: times über den kurzen Blitz-Zyklus verteilt
        // 0→30%: einblenden, 30→60%: peak halten, 60→100%: ausblenden
        const T = [0, 0.0, 0.30, 0.60, 0.85, 1.0];
        const transBase = {
          duration:    s.cycleDuration,
          delay:       s.delay,
          repeat:      Infinity,
          repeatDelay: s.repeatDelay,  // echte Ruhepause zwischen Blitzen
          times:       T,
          ease:        'easeInOut' as const,
        };

        return (
          <div
            key={`star-${mode}-${i}`}
            className="absolute"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
          >
            {/* Kern-Punkt */}
            <motion.div
              className="absolute rounded-full bg-white"
              style={{
                width:  s.size,
                height: s.size,
                transform: 'translate(-50%,-50%)',
              }}
              animate={{
                opacity: [s.baseOpacity, s.baseOpacity, 1.0,  1.0,  s.baseOpacity, s.baseOpacity],
                scale:   [1,             1,             1.85, 1.60, 1,             1            ],
              }}
              transition={transBase}
            />

            {/* Horizontaler Strahl */}
            <motion.div
              className="absolute"
              style={{
                height:       1.5,
                width:        s.rayHalf * 2,
                background:   'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.88) 50%, transparent 100%)',
                borderRadius: 99,
                transform:    'translate(-50%,-50%)',
                transformOrigin: 'center',
              }}
              animate={{
                scaleX:  [0, 0, 1,    1,    0, 0],
                opacity: [0, 0, 0.90, 0.90, 0, 0],
              }}
              transition={transBase}
            />

            {/* Vertikaler Strahl */}
            <motion.div
              className="absolute"
              style={{
                width:        1.5,
                height:       s.rayHalf * 2,
                background:   'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.88) 50%, transparent 100%)',
                borderRadius: 99,
                transform:    'translate(-50%,-50%)',
                transformOrigin: 'center',
              }}
              animate={{
                scaleY:  [0, 0, 1,    1,    0, 0],
                opacity: [0, 0, 0.90, 0.90, 0, 0],
              }}
              transition={transBase}
            />
          </div>
        );
      })}

    </div>
  );
};
