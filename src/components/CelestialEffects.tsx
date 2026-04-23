import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

/* ─────────────────────────────
   MODE SYSTEM
   epic    → LaunchScreen: alles aktiv
   ambient → Dashboard/Stats: Sterne + gelegentlich Shooting Star
   active  → QuizScreen: Sterne + Shooting Stars + seltener Komet
   focus   → LearnScreen: nur Sterne, opacity-only (kein scale, kein GPU-Stress)
──────────────────────────── */
export type CelestialMode = 'epic' | 'ambient' | 'active' | 'focus';

export const CelestialEffects = ({ mode = 'ambient' }: { mode?: CelestialMode }) => {

  /* ── Sterne ── */
  const starCount = mode === 'focus' ? 12 : mode === 'epic' ? 26 : 20;

  const stars = useMemo(() => {
    return Array.from({ length: starCount }).map(() => {
      const depth = Math.random();
      return {
        x: Math.random() * 100,
        y: Math.random() * 130 - 10,
        size: depth * 2 + 0.5,
        opacity: mode === 'focus' ? 0.08 + depth * 0.18 : 0.2 + depth * 0.5,
        duration: mode === 'focus' ? 6 + depth * 6 : 4 + depth * 5,
        delay: Math.random() * 5,
      };
    });
  }, [starCount, mode]);

  /* ── State ── */
  const [comet, setComet] = useState<any>(null);
  const [shootingStar, setShootingStar] = useState<any>(null);
  const [gas, setGas] = useState<any>(null);
  const [solar, setSolar] = useState<any>(null);

  /* ── Helpers ── */
  const randomY = () => Math.random() * 120 - 10;
  const randomX = () => Math.random() * 100;

  const createFlightPath = () => {
    const fromLeft = Math.random() > 0.5;
    const startY = randomY();
    const endY = startY + (Math.random() * 50 + 30);
    return {
      start: { x: fromLeft ? "-20%" : "120%", y: `${startY}%` },
      end:   { x: fromLeft ? "120%" : "-20%", y: `${endY}%` },
      rotate: fromLeft ? 20 + Math.random() * 15 : 160 - Math.random() * 15,
    };
  };

  const sleep = (min: number, max: number) =>
    new Promise((r) => setTimeout(r, Math.random() * (max - min) + min));

  /* ── Event-Loop ── */
  useEffect(() => {
    // Focus-Modus: keine Events, nur statische Sterne
    if (mode === 'focus') return;

    let running = true;

    const loop = async () => {
      await sleep(2000, 4000);

      while (running) {
        // Shooting Star
        const ssThreshold = mode === 'epic' ? 0.65 : mode === 'active' ? 0.55 : 0.5;
        const ssMinWait   = mode === 'epic' ? 1500 : mode === 'active' ? 2000 : 3500;
        const ssMaxWait   = mode === 'epic' ? 4000 : mode === 'active' ? 5000 : 9000;

        if (Math.random() > ssThreshold) {
          setShootingStar({ id: Date.now(), ...createFlightPath() });
        }
        await sleep(ssMinWait, ssMaxWait);

        // Komet — epic + active
        if ((mode === 'epic' || mode === 'active') && Math.random() > (mode === 'epic' ? 0.8 : 0.88)) {
          setComet({ id: Date.now(), ...createFlightPath() });
        }
        await sleep(3000, 6000);

        // Gas Giant + Solar Explosion — nur epic
        if (mode === 'epic') {
          if (Math.random() > 0.9) {
            setGas({ id: Date.now(), y: randomY() });
          }
          await sleep(4000, 8000);

          if (Math.random() > 0.92) {
            setSolar({
              id: Date.now(),
              x: randomX(),
              y: randomY(),
              duration: Math.random() > 0.5 ? 5 : 8,
              scale: 2.5 + Math.random() * 1.5,
            });
          }
        }
      }
    };

    loop();
    return () => { running = false; };
  }, [mode]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">

      {/* ✨ STERNE */}
      {stars.map((s, i) => (
        <motion.div
          key={`star-${mode}-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            width: s.size,
            height: s.size,
            left: `${s.x}%`,
            top: `${s.y}%`,
            opacity: s.opacity,
          }}
          animate={
            // focus: nur opacity (kein scale → weniger GPU)
            mode === 'focus'
              ? { opacity: [s.opacity * 0.3, s.opacity, s.opacity * 0.3] }
              : { opacity: [s.opacity * 0.5, s.opacity, s.opacity * 0.5], scale: [1, 1.2, 1] }
          }
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity }}
        />
      ))}

      {/* ☄️ KOMET */}
      <AnimatePresence>
        {comet && (
          <motion.div
            key={comet.id}
            initial={{ x: comet.start.x, y: comet.start.y, scale: 0.4, opacity: 0, filter: "blur(10px)" }}
            animate={{
              x: comet.end.x, y: comet.end.y,
              scale: [0.4, 2.2, 0.6],
              opacity: [0, 1, 1, 0],
              filter: ["blur(10px)", "blur(0px)", "blur(3px)"],
            }}
            transition={{ duration: 7, ease: "linear" }}
            className="absolute flex items-center"
            style={{ rotate: `${comet.rotate}deg` }}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-[0_0_40px_white,0_0_80px_#06B6D4]" />
            <div className="absolute w-10 h-10 rounded-full bg-cyan-400/30 blur-[10px]" />
            <div className="h-[4px] w-[320px] bg-gradient-to-r from-white via-cyan-400 via-violet-500 to-transparent blur-[2px]" />
            <div className="absolute h-[8px] w-[280px] bg-gradient-to-r from-white/40 to-transparent blur-[6px]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💫 SHOOTING STAR */}
      <AnimatePresence>
        {shootingStar && (
          <motion.div
            key={shootingStar.id}
            initial={{ x: shootingStar.start.x, y: shootingStar.start.y, opacity: 0, width: 0 }}
            animate={{ x: shootingStar.end.x, y: shootingStar.end.y, opacity: [0, 1, 0], width: [0, 220, 0] }}
            transition={{ duration: 1.2 }}
            className="absolute h-[2px] rounded-full"
            style={{
              transform: `rotate(${shootingStar.rotate}deg)`,
              background: "linear-gradient(90deg, white, rgba(255,255,255,0.3), transparent)",
            }}
          />
        )}
      </AnimatePresence>

      {/* 🪐 GAS GIANT (epic only) */}
      <AnimatePresence>
        {gas && (
          <motion.div
            key={gas.id}
            initial={{ x: "-120%", opacity: 0 }}
            animate={{ x: "120%", opacity: [0, 0.2, 0.2, 0] }}
            transition={{ duration: 100, ease: "linear" }}
            className="absolute w-[500px] h-[500px] rounded-full border border-violet-500/10"
            style={{ top: `${gas.y}%` }}
          />
        )}
      </AnimatePresence>

      {/* 🌞 SOLAR EXPLOSION (epic only) */}
      <AnimatePresence>
        {solar && (
          <>
            <motion.div
              key={solar.id}
              initial={{ scale: 0.05, opacity: 0, filter: "blur(50px)" }}
              animate={{
                scale: [0.05, 0.8, solar.scale],
                opacity: [0, 0.9, 0],
                filter: ["blur(50px)", "blur(4px)", "blur(12px)"],
              }}
              transition={{ duration: solar.duration, ease: "easeOut" }}
              className="absolute rounded-full"
              style={{
                top: `${solar.y}%`, left: `${solar.x}%`,
                width: 200, height: 200,
                transform: "translate(-50%, -50%)",
                background: "radial-gradient(circle, white 0%, #06B6D4 30%, #7C3AED 60%, transparent 80%)",
              }}
            />
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`${solar.id}-wave-${i}`}
                initial={{ scale: 0.2, opacity: 0.5 }}
                animate={{ scale: 2.5 + i * 1.2, opacity: [0.5, 0] }}
                transition={{ duration: solar.duration + i, delay: i * 0.3, ease: "easeOut" }}
                className="absolute rounded-full border border-cyan-400/20"
                style={{
                  width: 220, height: 220,
                  top: `${solar.y}%`, left: `${solar.x}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};