import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

/* ─────────────────────────────
   ⚙️ CONFIG (modular!)
──────────────────────────── */
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
    pulse: true,
  },
}: {
  config?: EffectsConfig;
}) => {
  /* ─────────────────────────────
     🌌 STARFIELD (stabil, kein rerender jitter)
  ───────────────────────────── */
  const stars = useMemo(() => {
    return Array.from({ length: 30 }).map(() => {
      const depth = Math.random(); // Parallax-Level

      return {
        x: Math.random() * 100,
        y: Math.random() * 130 - 10, // wichtig für S23
        size: depth * 2 + 0.5,
        opacity: 0.3 + depth * 0.7,
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

  /* ─────────────────────────────
     🎯 HELPER: echte Flugbahn
  ───────────────────────────── */
  const createFlightPath = () => {
    const fromLeft = Math.random() > 0.5;

    const startY = Math.random() * 120 - 10;
    const endY = startY + (Math.random() * 40 + 30); // garantiert diagonal

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
     🔁 LOOP SYSTEM
  ───────────────────────────── */
  useEffect(() => {
    let running = true;

    const loop = async () => {
      while (running) {
        // ⭐ Shooting Star
        if (config.shootingStars && Math.random() > 0.5) {
          const path = createFlightPath();

          setShootingStar({
            id: Date.now(),
            ...path,
          });
        }

        // ☄️ Komet (selten + majestätisch)
        if (config.comet && Math.random() > 0.8) {
          const path = createFlightPath();

          setComet({
            id: Date.now(),
            ...path,
          });
        }

        // 🪐 Gas Giant
        if (config.gasGiant && Math.random() > 0.94) {
          setGas({
            id: Date.now(),
            y: Math.random() * 60 + 10,
          });
        }

        await new Promise((r) => setTimeout(r, 2500));
      }
    };

    loop();

    const pulse = setInterval(() => {
      if (config.pulse) setPulseKey((p) => p + 1);
    }, 40000);

    return () => {
      running = false;
      clearInterval(pulse);
    };
  }, [config]);

  /* ─────────────────────────────
     🚀 COMET SHOWER (extern triggerbar!)
  ───────────────────────────── */
  const triggerCometShower = (count = 6) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const path = createFlightPath();
        setComet({ id: Date.now() + i, ...path });
      }, i * 300);
    }
  };

  // 👉 OPTIONAL: global verfügbar machen
  (window as any).triggerCometShower = triggerCometShower;

  /* ─────────────────────────────
     UI
  ───────────────────────────── */
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">

      {/* ✨ STARS (Parallax!) */}
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

      {/* 🌌 NEBULA (diagonal drift!) */}
      {config.nebula && (
        <motion.div
          className="absolute w-[160%] h-[80%] -left-1/3 top-1/4 rounded-full blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, #7C3AED 0%, transparent 70%)",
          }}
          animate={{
            x: ["-15%", "15%", "-15%"],
            y: ["0%", "12%", "0%"],
            opacity: [0.12, 0.25, 0.12],
          }}
          transition={{ duration: 30, repeat: Infinity }}
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
              opacity: [0, 0.2, 0.2, 0],
            }}
            transition={{ duration: 100, ease: "linear" }}
            className="absolute w-[500px] h-[500px] rounded-full border border-violet-500/10"
            style={{
              top: `${gas.y}%`,
              boxShadow:
                "inset 0 0 80px rgba(124,58,237,0.1)",
            }}
          />
        )}
      </AnimatePresence>

      {/* ☄️ KOMET (Depth + Blur!) */}
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
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute h-[2px] rounded-full"
            style={{
              transform: `rotate(${shootingStar.rotate}deg)`,
              background:
                "linear-gradient(90deg, white, rgba(255,255,255,0.3), transparent)",
              filter: "blur(0.5px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* 💓 ORBIT PULSE */}
      <AnimatePresence>
        {config.pulse && (
          <motion.div
            key={pulseKey}
            initial={{ scale: 0.2, opacity: 0.4 }}
            animate={{ scale: 2.8, opacity: 0 }}
            transition={{ duration: 7 }}
            className="absolute top-1/2 left-1/2 w-[220px] h-[220px] -translate-x-1/2 -translate-y-1/2 border border-cyan-400/20 rounded-full"
          />
        )}
      </AnimatePresence>
    </div>
  );
};