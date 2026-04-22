import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const CelestialEffects = () => {
  const [comet, setComet] = useState<{ id: number; start: any; end: any; scale: number[] } | null>(null);
  const [shootingStar, setShootingStar] = useState<{ id: number; x: number; y: number; angle: number } | null>(null);
  const [largeObject, setLargeObject] = useState<{ id: number; pos: any } | null>(null);

  useEffect(() => {
    // 1. SCHNUPPEN: Jetzt über den ganzen Screen verteilt
    const triggerStar = () => {
      const delay = Math.random() * 3000 + 4000;
      return setTimeout(() => {
        setShootingStar({ 
          id: Date.now(), 
          x: Math.random() * 90, 
          y: Math.random() * 80, // Jetzt bis 80% der Höhe
          angle: Math.random() * 40 + 10 
        });
        triggerStar();
      }, delay);
    };

    // 2. DER VOKA-KOMET: Mit "Anflug"-Tiefe (Diagonal)
    const triggerComet = () => {
      const delay = Math.random() * 15000 + 20000;
      return setTimeout(() => {
        const fromLeft = Math.random() > 0.5;
        setComet({
          id: Date.now(),
          start: { x: fromLeft ? "-50%" : "150%", y: Math.random() * 100 + "%" },
          end: { x: fromLeft ? "150%" : "-50%", y: Math.random() * 100 + "%" },
          scale: [0.3, 1.5, 0.5] // Startet klein, wird groß (nah), wird wieder klein
        });
        triggerComet();
      }, delay);
    };

    // 3. DER GASRIESE: Deutlich präsenter für OLED/Mobile
    const triggerLarge = () => {
      const delay = 120000 + Math.random() * 120000;
      return setTimeout(() => {
        setLargeObject({ id: Date.now(), pos: Math.random() * 60 });
        triggerLarge();
      }, delay);
    };

    const t1 = triggerStar(); const t2 = triggerComet(); const t3 = triggerLarge();
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      
      {/* ── STÄRKERER NEBULA GLOW (Sichtbar auf Mobile) ── */}
      <motion.div 
        className="absolute top-1/4 -left-1/4 w-[150%] h-[50%] rounded-full opacity-20 blur-[100px]"
        style={{ background: 'radial-gradient(circle, var(--color-orbit-purple) 0%, transparent 70%)' }}
        animate={{ opacity: [0.1, 0.2, 0.1], x: ['-10%', '10%', '-10%'] }}
        transition={{ duration: 15, repeat: Infinity }}
      />

      {/* ── GASRIESE: Größer und mit mehr Struktur ── */}
      <AnimatePresence>
        {largeObject && (
          <motion.div
            key={largeObject.id}
            initial={{ x: '-150%', y: `${largeObject.pos}%`, opacity: 0, scale: 0.8 }}
            animate={{ x: '150%', opacity: [0, 0.25, 0.25, 0], scale: 1.2 }}
            transition={{ duration: 80, ease: "linear" }}
            className="absolute w-[800px] h-[800px] flex items-center justify-center"
          >
            {/* Sichtbarer Kern für Mobile */}
            <div className="w-[300px] h-[300px] rounded-full bg-violet-900/10 border border-violet-500/10 shadow-[0_0_100px_rgba(124,58,237,0.15)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KOMET MIT TIEFEN-EFFEKT (Scale & Blur) ── */}
      <AnimatePresence>
        {comet && (
          <motion.div
            key={comet.id}
            initial={{ x: comet.start.x, y: comet.start.y, opacity: 0, scale: comet.scale[0], filter: 'blur(4px)' }}
            animate={{ 
              x: comet.end.x, 
              y: comet.end.y, 
              opacity: [0, 1, 1, 0], 
              scale: comet.scale,
              filter: ['blur(4px)', 'blur(0px)', 'blur(2px)']
            }}
            transition={{ duration: 3.5, ease: "easeInOut" }}
            className="absolute flex items-center z-50"
          >
            {/* Glühender Kopf */}
            <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_20px_#fff,0_0_40px_var(--color-orbit-purple)]" />
            {/* Dynamischer Schweif */}
            <div className="h-[3px] w-[400px]" style={{ 
              background: 'linear-gradient(90deg, white, var(--color-orbit-purple), transparent)',
              transform: comet.start.x.includes('-') ? 'rotate(0deg)' : 'rotate(180deg)',
              transformOrigin: 'left'
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SCHNUPPEN ÜBER DEN GANZEN SCREEN ── */}
      <AnimatePresence>
        {shootingStar && (
          <motion.div
            key={shootingStar.id}
            initial={{ x: `${shootingStar.x}%`, y: `${shootingStar.y}%`, opacity: 0, width: 0 }}
            animate={{ 
              x: `${shootingStar.x + 20}%`, 
              y: `${shootingStar.y + 15}%`, 
              opacity: [0, 1, 0], 
              width: [0, 150, 0] 
            }}
            transition={{ duration: 0.8 }}
            className="absolute h-px bg-white/40"
            style={{ transform: `rotate(${shootingStar.angle}deg)` }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};
