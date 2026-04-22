import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const CelestialEffects = () => {
  const [comet, setComet] = useState<{ id: number; y: number; direction: number } | null>(null);
  const [shootingStar, setShootingStar] = useState<{ id: number; x: number; y: number } | null>(null);
  const [largeObject, setLargeObject] = useState<{ id: number } | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    // 1. Kleine Sternschnuppen (Alle 5-8 Sek.)
    const triggerStar = () => {
      const delay = Math.random() * 3000 + 5000;
      return setTimeout(() => {
        setShootingStar({ id: Date.now(), x: Math.random() * 80, y: Math.random() * 40 });
        triggerStar();
      }, delay);
    };

    // 2. Der VOKA-KOMET (Alle 25-45 Sek.)
    const triggerComet = () => {
      const delay = Math.random() * 20000 + 25000;
      return setTimeout(() => {
        setComet({ 
          id: Date.now(), 
          y: Math.random() * 50 + 10, 
          direction: Math.random() > 0.5 ? 1 : -1 
        });
        triggerComet();
      }, delay);
    };

    // 3. Der GASRIESE (Sehr selten: Alle 4-7 Min.)
    const triggerLarge = () => {
      const delay = 240000 + Math.random() * 180000;
      return setTimeout(() => {
        setLargeObject({ id: Date.now() });
        triggerLarge();
      }, delay);
    };

    // 4. Orbital-Impuls (Alle 50 Sek.)
    const pulseInterval = setInterval(() => setPulseKey(p => p + 1), 50000);

    const t1 = triggerStar();
    const t2 = triggerComet();
    const t3 = triggerLarge();
    
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearInterval(pulseInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      
      {/* ── BASIS: TWINKLE STARS ── */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[1.2px] h-[1.2px] bg-white rounded-full opacity-20"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 5 }}
        />
      ))}

      {/* ── LAYER: NEBULA GLOW ── */}
      <motion.div 
        className="absolute -top-1/4 -right-1/4 w-full h-full rounded-full opacity-5 blur-[120px]"
        style={{ background: 'var(--color-orbit-purple)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 20, repeat: Infinity }}
      />

      {/* ── HERO: DER GASRIESE (Majestätischer Drift) ── */}
      <AnimatePresence>
        {largeObject && (
          <motion.div
            key={largeObject.id}
            initial={{ x: '-120%', y: '10%', opacity: 0 }}
            animate={{ x: '120%', y: '30%', opacity: [0, 0.08, 0.08, 0] }}
            transition={{ duration: 100, ease: "linear" }}
            className="absolute w-[500px] h-[500px]"
          >
            <div className="absolute inset-0 rounded-full blur-[80px] bg-violet-500/10" />
            <div className="absolute inset-[100px] rounded-full" 
                 style={{ background: 'radial-gradient(circle at 30% 30%, rgba(6,182,212,0.08), transparent)' }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] rounded-full border border-white/5 rotate-12" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EFFECT: ORBITAL-IMPULS (Herzschlag) ── */}
      <AnimatePresence>
        <motion.div
          key={`pulse-${pulseKey}`}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 3.5, opacity: [0, 0.1, 0] }}
          transition={{ duration: 12, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-violet-500/10"
        />
      </AnimatePresence>

      {/* ── DYNAMIK: DER VOKA-KOMET ── */}
      <AnimatePresence>
        {comet && (
          <motion.div
            key={comet.id}
            initial={{ x: comet.direction > 0 ? "-120%" : "120%", y: `${comet.y}%`, opacity: 0 }}
            animate={{ x: comet.direction > 0 ? "150%" : "-150%", y: `${comet.y + 12}%`, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.5, ease: "linear" }}
            className="absolute flex items-center"
            style={{ transform: `rotate(${comet.direction > 0 ? '12deg' : '168deg'})` }}
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_12px_#fff,0_0_25px_var(--color-orbit-purple)] z-10" />
            <div className="h-[1.5px] blur-[0.5px]" style={{ 
              width: '250px', 
              background: 'linear-gradient(to right, white, var(--color-orbit-purple), transparent)',
              transform: comet.direction < 0 ? 'rotate(180deg)' : 'none'
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DYNAMIK: KLEINE STERNSCHNUPPEN ── */}
      <AnimatePresence>
        {shootingStar && (
          <motion.div
            key={shootingStar.id}
            initial={{ x: `${shootingStar.x}%`, y: `${shootingStar.y}%`, opacity: 0, width: 0 }}
            animate={{ x: `${shootingStar.x + 12}%`, y: `${shootingStar.y + 8}%`, opacity: [0, 0.8, 0], width: [0, 80, 0] }}
            transition={{ duration: 0.7 }}
            className="absolute h-px bg-white/60 rotate-[20deg]"
          />
        )}
      </AnimatePresence>

    </div>
  );
};
