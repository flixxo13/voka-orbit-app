import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

/* ─────────────────────────────
   ⚙️ CONFIG
──────────────────────────── */
type EffectsConfig = {
  stars?: boolean;
  nebula?: boolean;
  comet?: boolean;
  shootingStars?: boolean;
  gasGiant?: boolean;
  pulse?: boolean;
  solarExplosion?: boolean;
};

export const CelestialEffects = ({
  config = {
    stars: true,
    nebula: true,
    comet: true,
    shootingStars: true,
    gasGiant: true,
    pulse: true,
    solarExplosion: true,
  },
}: {
  config?: EffectsConfig;
}) => {

  /* ─────────────────────────────
     🌌 STARS (bleiben konstant)
  ───────────────────────────── */
  const stars = useMemo(() => {
    return Array.from({ length: 28 }).map(() => {
      const depth = Math.random();

      return {
        x: Math.random() * 100,
        y: Math.random() * 130 - 10,
        size: depth * 2 + 0.5,
        opacity: 0.2 + depth * 0.6,
        duration: 3 + depth * 4,
        delay: Math.random() * 5,
      };
    });
  }, []);

  /* ─────────────────────────────
     STATE
  ───────────────────────────── */
  const [comet, setComet] = useState<any>(null);
  const [shootingStar, setShootingStar] = useState<any>(null);
  const [gas, setGas] = useState<any>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [solar, setSolar] = useState<any>(null);

  /* ─────────────────────────────
     🎯 RANDOM POSITION HELPERS
  ───────────────────────────── */
  const randomY = () => Math.random() * 120 - 10;
  const randomX = () => Math.random() * 100;

  const createFlightPath = () => {
    const fromLeft = Math.random() > 0.5;
    const startY = randomY();
    const endY = startY + (Math.random() * 40 + 30);

    return {
      start: {
        x: fromLeft ? "-20%" : "120%",
        y: `${startY}%`,
      },
      end: {
        x: fromLeft ? "120%" : "-20%",
        y: `${endY}%`,
      },
      rotate: fromLeft ? 20 + Math.random() * 15 : 160 - Math.random() * 15,
    };
  };

  /* ─────────────────────────────
     ⏱️ MAIN LOOP (mit Delay & Random)
  ───────────────────────────── */
  useEffect(() => {
    let running = true;

    const sleep = (min: number, max: number) =>
      new Promise((r) =>
        setTimeout(r, Math.random() * (max - min) + min)
      );

    const loop = async () => {

      // 🚀 INITIAL DELAY (wichtig!)
      await sleep(2000, 4000);

      while (running) {

        // 💫 Shooting Star
        if (config.shootingStars && Math.random() > 0.6) {
          setShootingStar({
            id: Date.now(),
            ...createFlightPath(),
          });
        }

        await sleep(1500, 4000);

        // ☄️ Comet
        if (config.comet && Math.random() > 0.75) {
          setComet({
            id: Date.now(),
            ...createFlightPath(),
          });
        }

        await sleep(3000, 6000);

        // 🪐 Gas Giant
        if (config.gasGiant && Math.random() > 0.85) {
          setGas({
            id: Date.now(),
            y: randomY(),
          });
        }

        await sleep(4000, 8000);

        // 🌞 Solar Explosion (selten!)
        if (config.solarExplosion && Math.random() > 0.9) {
          setSolar({
            id: Date.now(),
            x: randomX(),
            y: randomY(),
          });
        }
      }
    };

    loop();

    const pulse = setInterval(() => {
      if (config.pulse) setPulseKey((p) => p + 1);
    }, 45000);

    return () => {
      running = false;
      clearInterval(pulse);
    };
  }, [config]);

  /* ─────────────────────────────
     UI
  ───────────────────────────── */
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">

      {/* ✨ STARS */}
      {config.stars &&
        stars.map((s, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: s.size,
              height: s.size,
              left: `${s.x}%`,
              top: `${s.y}%`,
              opacity: s.opacity,
            }}
            animate={{
              opacity: [s.opacity * 0.5, s.opacity, s.opacity * 0.5],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
            }}
          />
        ))}

      {/* ☄️ COMET */}
      <AnimatePresence>
        {comet && (
          <motion.div
            key={comet.id}
            initial={{
              x: comet.start.x,
              y: comet.start.y,
              scale: 0.3,
              opacity: 0,
              filter: "blur(6px)",
            }}
            animate={{
              x: comet.end.x,
              y: comet.end.y,
              scale: [0.3, 1.8, 0.4],
              opacity: [0, 1, 1, 0],
              filter: ["blur(6px)", "blur(0px)", "blur(2px)"],
            }}
            transition={{ duration: 6, ease: "linear" }}
            className="absolute flex items-center"
            style={{ rotate: `${comet.rotate}deg` }}
          >
            <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_30px_white]" />
            <div className="w-[260px] h-[2px] bg-gradient-to-r from-white via-violet-500 to-transparent blur-[1px]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💫 SHOOTING STAR */}
      <AnimatePresence>
        {shootingStar && (
          <motion.div
            key={shootingStar.id}
            initial={{
              x: shootingStar.start.x,
              y: shootingStar.start.y,
              opacity: 0,
              width: 0,
            }}
            animate={{
              x: shootingStar.end.x,
              y: shootingStar.end.y,
              opacity: [0, 1, 0],
              width: [0, 220, 0],
            }}
            transition={{ duration: 1.2 }}
            className="absolute h-[2px] rounded-full"
            style={{
              transform: `rotate(${shootingStar.rotate}deg)`,
              background:
                "linear-gradient(90deg, white, rgba(255,255,255,0.3), transparent)",
            }}
          />
        )}
      </AnimatePresence>

      {/* 🪐 GAS */}
      <AnimatePresence>
        {gas && (
          <motion.div
            key={gas.id}
            initial={{ x: "-120%", opacity: 0 }}
            animate={{
              x: "120%",
              opacity: [0, 0.2, 0.2, 0],
            }}
            transition={{ duration: 100, ease: "linear" }}
            className="absolute w-[500px] h-[500px] rounded-full border border-violet-500/10"
            style={{
              top: `${gas.y}%`,
            }}
          />
        )}
      </AnimatePresence>

      {/* 🌞 SOLAR EXPLOSION */}
      <AnimatePresence>
        {solar && (
          <motion.div
            key={solar.id}
            initial={{
              scale: 0.05,
              opacity: 0,
              filter: "blur(40px)",
            }}
            animate={{
              scale: [0.05, 0.6, 2.8],
              opacity: [0, 0.7, 0],
              filter: ["blur(40px)", "blur(6px)", "blur(14px)"],
            }}
            transition={{ duration: 5 }}
            className="absolute rounded-full"
            style={{
              top: `${solar.y}%`,
              left: `${solar.x}%`,
              width: 180,
              height: 180,
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, white 0%, #06B6D4 30%, #7C3AED 60%, transparent 80%)",
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};