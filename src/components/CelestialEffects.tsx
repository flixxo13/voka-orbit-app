import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const CelestialEffects = () => {
  const [comet, setComet] = useState<{ id: number; start: any; end: any; scale: number[] } | null>(null);
  const [shootingStar, setShootingStar] = useState<{ id: number; x: number; y: number; angle: number } | null>(null);
  const [largeObject, setLargeObject] = useState<{ id: number; pos: number } | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    // 1. Kleine Sternschnuppen (Überall auf dem Screen)
    const triggerStar = () => {
      const delay = Math.random() * 3000 + 4000;
      return setTimeout(() => {
        setShootingStar({ 
          id: Date.now(), 
          x: Math.random() * 90, 
          y: Math.random() * 80, 
          angle: Math.random() * 45 + 10 
        });
        triggerStar();
      }, delay);
    };

    // 2. Der VOKA-KOMET (Mit Tiefen-Effekt / Scale)
    const triggerComet = () => {
      const delay = Math.random() * 15000 + 15000;
      return setTimeout(() => {
        const fromLeft = Math.random() > 0.5;
        setComet({
          id: Date.now(),
          start: { x: fromLeft ? "-60%" : "160%", y: Math.random() * 100 + "%" },
          end: { x: fromLeft ? "160%" : "-60%", y: (Math.random() * 100 + 20) + "%" },
          scale: [0.2, 1.4, 0.4] 
        });
        triggerComet();
      }, delay);
    };

    // 3. Der GASRIESE (Majestätisch & Präsent)
    const triggerLarge = () => {
      const delay = 180000 + Math.random() * 120000; 
      return setTimeout(() => {
        setLargeObject({ id: Date.now(), pos: Math.random() * 50 });
        triggerLarge();
      }, delay);
    };

    // 4. Der ORBITAL-IMPULS (Herzschlag alle 45 Sek.)
    const pulseInterval = setInterval(() => setPulseKey(p => p + 1), 45000);

    const t1 = triggerStar(); const t2 = triggerComet(); const t3 = triggerLarge();
    return () => { 
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); 
      clearInterval(pulseInterval); 
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      
      {/* ── 1. BASIS: TWINKLE STARS (Wieder da!) ── */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-[1.5px] h-[1.5px] bg-white rounded-full"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 5 }}
        />
      ))}

      {/* ── 2. NEBULA GLOW (Verstärkt für S23) ── */}
      <motion.div 
        className="absolute top-1/4 -left-1/4 w-[150%] h-[60%] rounded-full opacity-15 blur-[120px]"
        style={{ background: 'radial-gradient(circle, var(--color-orbit-purple) 0%, transparent 70%)' }}
        animate={{ x: ['-5%', '5%', '-5%'], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── 3. HERO: GASRIESE ── */}
      <AnimatePresence>
        {largeObject && (
          <motion.div
            key={largeObject.id}
            initial={{ x: '-150%', y: `${largeObject.pos}%`, opacity: 0 }}
            animate={{ x: '150%', opacity: [0, 0.2, 0.2, 0] }}
            transition={{ duration: 90, ease: "linear" }}
            className="absolute w-[700px] h-[700px]"
          >
            <div className="absolute inset-0 rounded-full blur-[90px] bg-violet-600/10" />
            <div className="absolute inset-[120px] rounded-full border border-violet-500/10 shadow-[inset_0_0_50px_rgba(124,58,237,0.1)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 4. EFFECT: ORBITAL-IMPULS (Der Herzschlag) ── */}
      <AnimatePresence>
        <motion.div
          key={`pulse-${pulseKey}`}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 3.5, opacity: [0, 0.15, 0] }}
          transition={{ duration: 12, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-violet-500/15"
        />
      </AnimatePresence>

      {/* ── 5. DYNAMIK: KOMET MIT TIEFEN-EFFEKT ── */}
      <AnimatePresence>
        {comet && (
          <motion.div
            key={comet.id}
            initial={{ x: comet.start.x, y: comet.start.y, opacity: 0, scale: comet.scale[0], filter: 'blur(3px)' }}
            animate={{ 
              x: comet.end.x, 
              y: comet.end.y, 
              opacity: [0, 1, 1, 0], 
              scale: comet.scale,
              filter: ['blur(3px)', 'blur(0px)', 'blur(2px)']
            }}
            transition={{ duration: 3.2, ease: "linear" }}
            className="absolute flex items-center z-50"
          >
            <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_15px_#fff,0_0_30px_var(--color-orbit-purple)]" />
            <div className="h-[2px] w-[350px]" style={{ 
              background: 'linear-gradient(90deg, white, var(--color-orbit-purple), transparent)',
              transform: comet.start.x.includes('-') ? 'rotate(0deg)' : 'rotate(180deg)',
              transformOrigin: 'left'
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 6. DYNAMIK: SCHNUPPEN (Vollflächig) ── */}
      <AnimatePresence>
        {shootingStar && (
          <motion.div
            key={shootingStar.id}
            initial={{ x: `${shootingStar.x}%`, y: `${shootingStar.y}%`, opacity: 0, width: 0 }}
            animate={{ x: `${shootingStar.x + 15}%`, y: `${shootingStar.y + 10}%`, opacity: [0, 0.8, 0], width: [0, 100, 0] }}
            transition={{ duration: 0.7 }}
            className="absolute h-px bg-white/50"
            style={{ transform: `rotate(${shootingStar.angle}deg)` }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};
