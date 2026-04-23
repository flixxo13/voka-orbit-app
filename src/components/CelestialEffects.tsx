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

  /* ── Sterne ── */
  const starCount = mode === 'focus' ? 12 : 24;

  const stars = useMemo(() => Array.from({ length: starCount }).map(() => {
    const depth = Math.random();
    return {
      x: Math.random() * 96 + 2,
      y: Math.random() * 96 + 2,
      // Sterne im Dashboard deutlich größer & heller
      size: mode === 'focus' ? depth * 1.8 + 0.4 : depth * 3 + 0.6,
      opacity: mode === 'focus' ? 0.08 + depth * 0.18 : 0.35 + depth * 0.6,
      duration: mode === 'focus' ? 7 + depth * 6 : 3 + depth * 4,
      delay: Math.random() * 5,
      // Zufällig einige sehr helle Sterne
      bright: Math.random() > 0.75,
    };
  }), [starCount, mode]);

  const starsRef = useRef(stars);
  useEffect(() => { starsRef.current = stars; }, [stars]);

  const [comet, setComet]               = useState<any>(null);
  const [shootingStar, setShootingStar] = useState<any>(null);
  const [gas, setGas]                   = useState<any>(null);
  const [solar, setSolar]               = useState<any>(null);
  const [flicker, setFlicker]           = useState<any>(null);

  /* ── Flugbahn in PIXEL (nicht in %, die sind relativ zur Element-Größe!) ── */
  const createFlightPath = () => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const fromLeft = Math.random() > 0.5;
    const startY = H * (Math.random() * 0.75 + 0.05);
    const endY = Math.min(H * 0.95, startY + H * (Math.random() * 0.3 + 0.1));
    return {
      startX: fromLeft ? -250 : W + 250,
      endX:   fromLeft ? W + 250 : -250,
      startY,
      endY,
      rotate: fromLeft ? 20 + Math.random() * 15 : 160 - Math.random() * 15,
    };
  };

  const sleep = (min: number, max: number) => {
    const f = testMode ? 0.12 : 1;
    return new Promise((r) => setTimeout(r, (Math.random() * (max - min) + min) * f));
  };

  /* ── Event Loop ── */
  useEffect(() => {
    if (mode === 'focus') return;
    let running = true;

    const loop = async () => {
      await sleep(600, 1500);

      while (running) {
        // Shooting Star
        if (Math.random() > (mode === 'epic' ? 0.45 : 0.38)) {
          setShootingStar({ id: Date.now(), ...createFlightPath() });
        }
        await sleep(mode === 'epic' ? 1500 : 2000, mode === 'epic' ? 3500 : 6000);

        // Komet
        if (Math.random() > (mode === 'epic' ? 0.65 : mode === 'active' ? 0.80 : 0.70)) {
          setComet({ id: Date.now(), ...createFlightPath() });
        }
        await sleep(mode === 'epic' ? 2500 : 4000, mode === 'epic' ? 5000 : 10000);

        // Gas Giant (epic + ambient)
        if (mode !== 'active' && Math.random() > 0.78) {
          setGas({ id: Date.now(), y: Math.random() * 70 + 5 });
        }
        await sleep(mode === 'epic' ? 3000 : 8000, mode === 'epic' ? 6000 : 18000);

        // Solar Explosion — startet von einem echten Stern
        if (mode !== 'active' && Math.random() > (mode === 'epic' ? 0.82 : 0.78)) {
          const list = starsRef.current;
          const star = list[Math.floor(Math.random() * list.length)];
          const x = Math.max(10, Math.min(88, star.x));
          const y = Math.max(8,  Math.min(82, star.y));

          setFlicker({ id: Date.now(), x, y });
          await sleep(750, 750);

          const dur = [8, 12, 16][Math.floor(Math.random() * 3)];
          setSolar({ id: Date.now(), x, y, duration: dur, scale: 3 + Math.random() * 2.5 });
          setFlicker(null);
        }
        await sleep(mode === 'epic' ? 4000 : 12000, mode === 'epic' ? 8000 : 28000);
      }
    };

    loop();
    return () => { running = false; };
  }, [mode, testMode]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">

      {/* ✨ STERNE — heller & auffälliger im Dashboard */}
      {stars.map((s, i) => (
        <motion.div
          key={`star-${mode}-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            width: s.size,
            height: s.size,
            left: `${s.x}%`,
            top:  `${s.y}%`,
            opacity: s.opacity,
            boxShadow: (mode !== 'focus' && s.bright)
              ? `0 0 ${s.size * 3}px ${s.size}px rgba(255,255,255,0.6)`
              : 'none',
          }}
          animate={
            mode === 'focus'
              ? { opacity: [s.opacity * 0.3, s.opacity, s.opacity * 0.3] }
              : s.bright
                // Helle Sterne: dramatischeres Funkeln
                ? { opacity: [s.opacity * 0.2, s.opacity, s.opacity * 0.4, s.opacity, s.opacity * 0.2], scale: [1, 1.6, 1.1, 1.8, 1] }
                : { opacity: [s.opacity * 0.4, s.opacity, s.opacity * 0.4], scale: [1, 1.3, 1] }
          }
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* ⭐ Pre-Explosion Flicker */}
      <AnimatePresence>
        {flicker && (
          <motion.div
            key={flicker.id}
            className="absolute rounded-full"
            style={{ left: `${flicker.x}%`, top: `${flicker.y}%`, width: 4, height: 4, transform: 'translate(-50%,-50%)' }}
            animate={{
              scale: [1, 4, 2, 8, 3, 14],
              backgroundColor: ['#fff', '#fff', '#06B6D4', '#fff', '#A78BFA', '#fff'],
              boxShadow: [
                '0 0 4px 2px rgba(255,255,255,0.8)',
                '0 0 18px 8px rgba(255,255,255,0.9),0 0 36px 16px rgba(6,182,212,0.5)',
                '0 0 8px 3px rgba(255,255,255,0.7)',
                '0 0 28px 12px rgba(255,255,255,1),0 0 56px 24px rgba(124,58,237,0.65)',
                '0 0 12px 5px rgba(255,255,255,0.8)',
                '0 0 50px 22px rgba(255,255,255,1),0 0 100px 44px rgba(6,182,212,0.7)',
              ],
            }}
            transition={{ duration: 0.75, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* ☄️ KOMET — jetzt mit pixel-basierten Koordinaten */}
      <AnimatePresence>
        {comet && (
          <motion.div
            key={comet.id}
            className="absolute flex items-center"
            initial={{ x: comet.startX, y: comet.startY, scale: 0.4, opacity: 0, rotate: comet.rotate }}
            animate={{
              x: comet.endX, y: comet.endY,
              scale: [0.4, 2.0, 0.6],
              opacity: [0, 1, 1, 0],
              filter: ['blur(8px)', 'blur(0px)', 'blur(3px)'],
            }}
            transition={{ duration: 7, ease: 'linear' }}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-[0_0_40px_white,0_0_80px_#06B6D4]" />
            <div className="absolute w-10 h-10 rounded-full bg-cyan-400/30 blur-[10px]" />
            <div className="h-[4px] w-[320px] bg-gradient-to-r from-white via-cyan-400 via-violet-500 to-transparent blur-[2px]" />
            <div className="absolute h-[8px] w-[280px] bg-gradient-to-r from-white/40 to-transparent blur-[6px]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💫 SHOOTING STAR — jetzt mit pixel-basierten Koordinaten */}
      <AnimatePresence>
        {shootingStar && (
          <motion.div
            key={shootingStar.id}
            className="absolute h-[2px] rounded-full"
            style={{ background: 'linear-gradient(90deg, white, rgba(255,255,255,0.3), transparent)' }}
            initial={{ x: shootingStar.startX, y: shootingStar.startY, rotate: shootingStar.rotate, opacity: 0, width: 0 }}
            animate={{ x: shootingStar.endX, y: shootingStar.endY, opacity: [0, 1, 0], width: [0, 240, 0] }}
            transition={{ duration: 1.2, ease: 'linear' }}
          />
        )}
      </AnimatePresence>

      {/* 🪐 GAS GIANT */}
      <AnimatePresence>
        {gas && (
          <motion.div
            key={gas.id}
            initial={{ x: -600, opacity: 0 }}
            animate={{ x: window.innerWidth + 600, opacity: [0, 0.2, 0.2, 0] }}
            transition={{ duration: 90, ease: 'linear' }}
            className="absolute w-[500px] h-[500px] rounded-full border border-violet-500/10"
            style={{ top: `${gas.y}%` }}
          />
        )}
      </AnimatePresence>

      {/* 🌞 SONNENEXPLOSION — langsam, von einem Stern, mit Strahlen & Schockwellen */}
      <AnimatePresence>
        {solar && (
          <>
            <motion.div
              key={solar.id}
              initial={{ scale: 0.01, opacity: 0 }}
              animate={{
                scale:   [0.01, 0.08, 0.55, solar.scale, solar.scale * 1.1, solar.scale * 0.8, solar.scale * 0.4],
                opacity: [0,    1,    1,    0.92,         0.72,              0.42,               0],
                filter:  ['blur(0px)', 'blur(2px)', 'blur(6px)', 'blur(12px)', 'blur(16px)', 'blur(20px)', 'blur(24px)'],
              }}
              transition={{ duration: solar.duration, times: [0, 0.06, 0.22, 0.45, 0.65, 0.82, 1], ease: 'easeOut' }}
              className="absolute rounded-full"
              style={{
                top: `${solar.y}%`, left: `${solar.x}%`,
                width: 200, height: 200,
                transform: 'translate(-50%,-50%)',
                background: 'radial-gradient(circle, #ffffff 0%, #06B6D4 18%, #7C3AED 48%, rgba(124,58,237,0.25) 72%, transparent 90%)',
              }}
            />

            {/* 8 Solar Flares */}
            {Array.from({ length: 8 }, (_, i) => (
              <motion.div
                key={`${solar.id}-flare-${i}`}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: [0, 1, 0.5, 0], opacity: [0, 0.9, 0.5, 0] }}
                transition={{ duration: solar.duration * 0.35, delay: 0.1 + i * 0.04, ease: 'easeOut' }}
                className="absolute rounded-full"
                style={{
                  top: `${solar.y}%`, left: `${solar.x}%`,
                  width: 2, height: 65 + i * 12,
                  transformOrigin: 'center top',
                  transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-50%)`,
                  background: 'linear-gradient(to bottom, white, #06B6D4, transparent)',
                }}
              />
            ))}

            {/* 4 Schockwellen — abwechselnd Cyan/Violet */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={`${solar.id}-wave-${i}`}
                initial={{ scale: 0.05, opacity: 0.8 }}
                animate={{ scale: 3.5 + i * 2.2, opacity: [0.8, 0.4, 0.15, 0] }}
                transition={{ duration: solar.duration * (0.28 + i * 0.2), delay: i * 0.4, ease: 'easeOut' }}
                className="absolute rounded-full"
                style={{
                  width: 220, height: 220,
                  top: `${solar.y}%`, left: `${solar.x}%`,
                  transform: 'translate(-50%,-50%)',
                  border: `1px solid ${i % 2 === 0 ? 'rgba(6,182,212,0.55)' : 'rgba(124,58,237,0.45)'}`,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};