import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type EffectsConfig = {
  stars?: boolean;
  nebula?: boolean;
  comet?: boolean;
  shootingStars?: boolean;
  gasGiant?: boolean;
  pulse?: boolean;
};

export const CelestialEffects = ({
  config = {
    stars: true,
    nebula: true,
    comet: true,
    shootingStars: true,
    gasGiant: true,
    pulse: true
  }
}: { config?: EffectsConfig }) => {

  /* ─────────────────────────────
     🌌 PRECOMPUTED STARFIELD
  ───────────────────────────── */
  const stars = useMemo(() => {
    return Array.from({ length: 28 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 120, // wichtig für S23 (unteres Drittel!)
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 3
    }));
  }, []);

  /* ─────────────────────────────
     ☄️ STATES
  ───────────────────────────── */
  const [comet, setComet] = useState<any>(null);
  const [shootingStar, setShootingStar] = useState<any>(null);
  const [gas, setGas] = useState<any>(null);
  const [pulseKey, setPulseKey] = useState(0);

  /* ─────────────────────────────
     🔁 LOOP SYSTEM (clean)
  ───────────────────────────── */
  useEffect(() => {
    let running = true;

    const loop = async () => {
      while (running) {

        // Shooting Star
        if (config.shootingStars && Math.random() > 0.6) {
          setShootingStar({
            id: Date.now(),
            x: Math.random() * 80,
            y: Math.random() * 100
          });
        }

        // Comet
        if (config.comet && Math.random() > 0.85) {
          const fromLeft = Math.random() > 0.5;

          setComet({
            id: Date.now(),
            start: {
              x: fromLeft ? "-20%" : "120%",
              y: `${Math.random() * 60 + 10}%`
            },
            end: {
              x: fromLeft ? "120%" : "-20%",
              y: `${Math.random() * 80 + 20}%`
            },
            rotate: fromLeft ? 25 : 155
          });
        }

        // Gas Giant (sehr selten)
        if (config.gasGiant && Math.random() > 0.95) {
          setGas({
            id: Date.now(),
            y: Math.random() * 60 + 10
          });
        }

        await new Promise(r => setTimeout(r, 2500));
      }
    };

    loop();

    const pulse = setInterval(() => {
      if (config.pulse) setPulseKey(p => p + 1);
    }, 40000);

    return () => {
      running = false;
      clearInterval(pulse);
    };
  }, [config]);

  /* ─────────────────────────────
     🎯 UI
  ───────────────────────────── */
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">

      {/* ✨ STARS */}
      {config.stars && stars.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: s.size,
            height: s.size,
            left: `${s.x}%`,
            top: `${s.y}%`
          }}
          animate={{
            opacity: [0.2, 0.9, 0.2],
            scale: [1, 1.4, 1]
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity
          }}
        />
      ))}

      {/* 🌌 NEBULA (Diagonal Drift!) */}
      {config.nebula && (
        <motion.div
          className="absolute w-[160%] h-[80%] -left-1/3 top-1/4 rounded-full blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, #7C3AED 0%, transparent 70%)"
          }}
          animate={{
            x: ["-10%", "10%", "-10%"],
            y: ["0%", "10%", "0%"],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 25, repeat: Infinity }}
        />
      )}

      {/* 🪐 GAS GIANT */}
      <AnimatePresence>
        {gas && (
          <motion.div
            key={gas.id}
            initial={{ x: "-120%", opacity: 0 }}
            animate={{
              x: "120%",
              opacity: [0, 0.2, 0.2, 0]
            }}
            transition={{ duration: 90, ease: "linear" }}
            className="absolute w-[500px] h-[500px] rounded-full border border-violet-500/10"
            style={{
              top: `${gas.y}%`,
              boxShadow:
                "inset 0 0 80px rgba(124,58,237,0.1)"
            }}
          />
        )}
      </AnimatePresence>

      {/* ☄️ COMET */}
      <AnimatePresence>
        {comet && (
          <motion.div
            key={comet.id}
            initial={{
              x: comet.start.x,
              y: comet.start.y,
              scale: 0.2,
              opacity: 0
            }}
            animate={{
              x: comet.end.x,
              y: comet.end.y,
              scale: [0.2, 1.6, 0.3],
              opacity: [0, 1, 1, 0]
            }}
            transition={{ duration: 4, ease: "linear" }}
            className="absolute flex items-center"
            style={{ rotate: `${comet.rotate}deg` }}
          >
            <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_25px_white]" />
            <div className="w-[250px] h-[2px] bg-gradient-to-r from-white via-violet-500 to-transparent blur-[1px]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💫 SHOOTING STAR */}
      <AnimatePresence>
        {shootingStar && (
          <motion.div
            key={shootingStar.id}
            initial={{
              x: `${shootingStar.x}%`,
              y: `${shootingStar.y}%`,
              opacity: 0,
              width: 0
            }}
            animate={{
              x: `${shootingStar.x + 30}%`,
              y: `${shootingStar.y + 20}%`,
              opacity: [0, 1, 0],
              width: [0, 180, 0]
            }}
            transition={{ duration: 0.7 }}
            className="absolute h-[1px] bg-white shadow-[0_0_8px_white]"
          />
        )}
      </AnimatePresence>

      {/* 💓 ORBIT PULSE */}
      <AnimatePresence>
        {config.pulse && (
          <motion.div
            key={pulseKey}
            initial={{ scale: 0.2, opacity: 0.4 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 6 }}
            className="absolute top-1/2 left-1/2 w-[200px] h-[200px] -translate-x-1/2 -translate-y-1/2 border border-cyan-400/20 rounded-full"
          />
        )}
      </AnimatePresence>

    </div>
  );
};