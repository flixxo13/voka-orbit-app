import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

export type CelestialMode = 'epic' | 'ambient' | 'active' | 'focus';

export const CelestialEffects = ({
  mode = 'ambient',
  testMode = false,
}: {
  mode?: CelestialMode;
  testMode?: boolean;
}) => {

  /* ────────────────────────────────────────────────
     STERNE
     ~22% sind "Twinkler" — kurzes Aufleuchten, dann
     lange Ruhe (times: 40% still → peak → 35% still)
     Der Rest: kaum merkliches sanftes Atmen.
  ──────────────────────────────────────────────── */
  const starCount = mode === 'focus' ? 12 : 30;

  const stars = useMemo(() =>
    Array.from({ length: starCount }).map((_, i) => {
      const depth = Math.random();
      const isTwinkler = i < Math.floor(starCount * 0.22);
      return {
        x: Math.random() * 96 + 2,
        y: Math.random() * 96 + 2,
        size: mode === 'focus'
          ? depth * 1.8 + 0.4
          : depth * 3.0 + 0.6,
        baseOpacity: mode === 'focus'
          ? 0.06 + depth * 0.14
          : 0.30 + depth * 0.52,
        peakOpacity: mode === 'focus'
          ? 0.14 + depth * 0.22
          : 0.72 + depth * 0.28,
        // Twinkler: langer Zyklus damit Ruhezeit dominant
        cycleDuration: isTwinkler
          ? 14 + Math.random() * 10   // 14–24s
          : 8  + Math.random() * 8,   //  8–16s, sanftes Atmen
        delay: Math.random() * 18,
        twinkler: isTwinkler,
      };
    }),
  [starCount, mode]);

  const starsRef = useRef(stars);
  useEffect(() => { starsRef.current = stars; }, [stars]);

  const [gas,     setGas]     = useState<any>(null);
  const [solar,   setSolar]   = useState<any>(null);
  const [flicker, setFlicker] = useState<any>(null);

  const sleep = (min: number, max: number) => {
    const f = testMode ? 0.12 : 1;
    return new Promise((r) =>
      setTimeout(r, (Math.random() * (max - min) + min) * f)
    );
  };

  /* ── Event Loop (Komet & Sternschnuppe deaktiviert) ── */
  useEffect(() => {
    if (mode === 'focus') return;
    let running = true;

    const loop = async () => {
      await sleep(800, 2000);

      while (running) {

        // Gas Giant — ambient + epic
        if (mode !== 'active' && Math.random() > 0.78) {
          setGas({ id: Date.now(), y: Math.random() * 70 + 5 });
        }
        await sleep(
          mode === 'epic' ? 3000 : 8000,
          mode === 'epic' ? 6000 : 18000
        );

        // Sonnenexplosion — nur Sterne im sicheren Innenbereich
        if (mode !== 'active' && Math.random() > (mode === 'epic' ? 0.80 : 0.76)) {

          // Safe zone: 15–82% X, 12–76% Y → Explosion liegt immer im Bild
          const safePool = starsRef.current.filter(
            (s) => s.x >= 15 && s.x <= 82 && s.y >= 12 && s.y <= 76
          );
          const pool = safePool.length > 0 ? safePool : starsRef.current;
          const star = pool[Math.floor(Math.random() * pool.length)];
          const x = Math.max(15, Math.min(82, star.x));
          const y = Math.max(12, Math.min(76, star.y));

          // Flicker: 1.8s — langsam & dramatisch, man soll es richtig sehen
          setFlicker({ id: Date.now(), x, y });
          await sleep(1800, 1800);

          const dur = [10, 14, 18][Math.floor(Math.random() * 3)];
          setSolar({
            id: Date.now(),
            x, y,
            duration: dur,
            scale: 3.5 + Math.random() * 2.0,
          });
          setFlicker(null);
        }

        await sleep(
          mode === 'epic' ? 4000 : 12000,
          mode === 'epic' ? 8000 : 28000
        );
      }
    };

    loop();
    return () => { running = false; };
  }, [mode, testMode]);

  /* ─────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">

      {/* ✨ STERNE */}
      {stars.map((s, i) => (
        <motion.div
          key={`star-${mode}-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            width:  s.size,
            height: s.size,
            left: `${s.x}%`,
            top:  `${s.y}%`,
            boxShadow: (mode !== 'focus' && s.twinkler)
              ? `0 0 ${s.size * 2.5}px ${s.size * 0.8}px rgba(255,255,255,0.4)`
              : 'none',
          }}
          animate={
            mode === 'focus'
              ? {
                  opacity: [s.baseOpacity, s.baseOpacity * 1.5, s.baseOpacity],
                }
              : s.twinkler
                ? {
                    // 40% still → schnell hell → 35% still (natürlich!)
                    opacity: [
                      s.baseOpacity,
                      s.baseOpacity,
                      s.peakOpacity,
                      s.baseOpacity * 1.05,
                      s.baseOpacity,
                    ],
                    scale: [1, 1, 1.55, 1.1, 1],
                  }
                : {
                    // Alle anderen: kaum merkliches Atmen
                    opacity: [s.baseOpacity * 0.82, s.baseOpacity, s.baseOpacity * 0.82],
                    scale:   [1, 1.05, 1],
                  }
          }
          transition={{
            duration: s.cycleDuration,
            delay:    s.delay,
            repeat:   Infinity,
            // Twinkler: 40% Ruhe → Aufleuchten bei 52% → zurück bei 65% → 35% Ruhe
            times: s.twinkler && mode !== 'focus'
              ? [0, 0.40, 0.52, 0.65, 1.0]
              : [0, 0.5, 1],
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* ⭐ Pre-Explosion Flicker — langsam & dramatisch */}
      <AnimatePresence>
        {flicker && (
          <motion.div
            key={flicker.id}
            className="absolute rounded-full"
            style={{
              left: `${flicker.x}%`,
              top:  `${flicker.y}%`,
              width: 4, height: 4,
              transform: 'translate(-50%,-50%)',
            }}
            animate={{
              scale: [1, 1.8, 1.1, 4.5, 2, 9, 3.5, 16],
              backgroundColor: [
                '#fff', '#fff', '#06B6D4', '#fff',
                '#A78BFA', '#fff', '#06B6D4', '#fff',
              ],
              boxShadow: [
                '0 0 3px 1px rgba(255,255,255,0.55)',
                '0 0 7px 3px rgba(255,255,255,0.75)',
                '0 0 4px 2px rgba(6,182,212,0.55)',
                '0 0 18px 7px rgba(255,255,255,0.9),0 0 36px 16px rgba(6,182,212,0.4)',
                '0 0 9px 4px rgba(167,139,250,0.65)',
                '0 0 30px 12px rgba(255,255,255,1),0 0 60px 26px rgba(124,58,237,0.55)',
                '0 0 16px 6px rgba(6,182,212,0.75)',
                '0 0 50px 20px rgba(255,255,255,1),0 0 100px 42px rgba(6,182,212,0.65)',
              ],
            }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* 🪐 GAS GIANT */}
      <AnimatePresence>
        {gas && (
          <motion.div
            key={gas.id}
            initial={{ x: -600, opacity: 0 }}
            animate={{
              x: window.innerWidth + 600,
              opacity: [0, 0.18, 0.18, 0],
            }}
            transition={{ duration: 90, ease: 'linear' }}
            onAnimationComplete={() => setGas(null)}
            className="absolute w-[500px] h-[500px] rounded-full border border-violet-500/10"
            style={{ top: `${gas.y}%` }}
          />
        )}
      </AnimatePresence>

      {/* 🌞 SONNENEXPLOSION */}
      <AnimatePresence>
        {solar && (
          <>
            {/* Kern — weichere Keyframes, mehr Zwischenschritte */}
            <motion.div
              key={solar.id}
              initial={{ scale: 0.01, opacity: 0 }}
              animate={{
                scale: [
                  0.01, 0.05, 0.18, 0.55,
                  1.0,  solar.scale,
                  solar.scale * 1.08, solar.scale * 0.72,
                  solar.scale * 0.30, 0.04,
                ],
                opacity: [
                  0,    0.55, 1,    1,
                  0.95, 0.88,
                  0.68, 0.42,
                  0.16, 0,
                ],
                filter: [
                  'blur(0px)',  'blur(1px)',  'blur(3px)',  'blur(6px)',
                  'blur(9px)',  'blur(13px)',
                  'blur(17px)', 'blur(21px)',
                  'blur(24px)', 'blur(28px)',
                ],
              }}
              transition={{
                duration: solar.duration,
                times: [0, 0.04, 0.10, 0.22, 0.35, 0.50, 0.65, 0.78, 0.90, 1],
                ease: 'easeOut',
              }}
              onAnimationComplete={() => setSolar(null)}
              className="absolute rounded-full"
              style={{
                top:  `${solar.y}%`,
                left: `${solar.x}%`,
                width: 200, height: 200,
                transform: 'translate(-50%,-50%)',
                background:
                  'radial-gradient(circle, #ffffff 0%, #fcd34d 10%, #06B6D4 24%, #7C3AED 50%, rgba(124,58,237,0.18) 72%, transparent 88%)',
              }}
            />

            {/* 8 Solar Flares */}
            {Array.from({ length: 8 }, (_, i) => (
              <motion.div
                key={`${solar.id}-flare-${i}`}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{
                  scaleY:  [0, 0.25, 1, 0.55, 0],
                  opacity: [0, 0.55, 0.9, 0.45, 0],
                }}
                transition={{
                  duration: solar.duration * 0.40,
                  delay: 0.15 + i * 0.05,
                  times: [0, 0.15, 0.35, 0.65, 1],
                  ease: 'easeOut',
                }}
                className="absolute rounded-full"
                style={{
                  top:  `${solar.y}%`,
                  left: `${solar.x}%`,
                  width: 2,
                  height: 70 + i * 14,
                  transformOrigin: 'center top',
                  transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-50%)`,
                  background: 'linear-gradient(to bottom, #fcd34d, #06B6D4, transparent)',
                }}
              />
            ))}

            {/* 4 Schockwellen */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={`${solar.id}-wave-${i}`}
                initial={{ scale: 0.05, opacity: 0 }}
                animate={{
                  scale:   [0.05, 0.4, 1.5, 3.5 + i * 2.0],
                  opacity: [0,    0.7, 0.35, 0],
                }}
                transition={{
                  duration: solar.duration * (0.30 + i * 0.18),
                  delay: i * 0.5,
                  times: [0, 0.12, 0.45, 1],
                  ease: 'easeOut',
                }}
                className="absolute rounded-full"
                style={{
                  width: 220, height: 220,
                  top:  `${solar.y}%`,
                  left: `${solar.x}%`,
                  transform: 'translate(-50%,-50%)',
                  border: `${i < 2 ? 1.5 : 1}px solid ${
                    i % 2 === 0
                      ? 'rgba(6,182,212,0.6)'
                      : 'rgba(124,58,237,0.5)'
                  }`,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
