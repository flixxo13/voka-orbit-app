import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const CelestialEffects = () => {
  const [comet, setComet] = useState<{ id: number; start: any; end: any; scale: number[] } | null>(null);
  const [shootingStar, setShootingStar] = useState<{ id: number; x: number; y: number; angle: number } | null>(null);
  const [largeObject, setLargeObject] = useState<{ id: number; y: number } | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    // 1. Sternschnuppen (Diagonal & über den ganzen Screen)
    const triggerStar = () => {
      const delay = Math.random() * 3000 + 4000;
      return setTimeout(() => {
        setShootingStar({ 
          id: Date.now(), 
          x: Math.random() * 80, 
          y: Math.random() * 70, 
          angle: Math.random() * 30 + 15 
        });
        triggerStar();
      }, delay);
    };

    // 2. Voka-Komet (3D-Effekt: kommt von fern nach nah)
    const triggerComet = () => {
      const delay = Math.random() * 15000 + 15000;
      return setTimeout(() => {
        const fromLeft = Math.random() > 0.5;
        setComet({
          id: Date.now(),
          start: { x: fromLeft ? "-20%" : "120%", y: (Math.random() * 40 + 10) + "%" },
          end: { x: fromLeft ? "120%" : "-20%", y: (Math.random() * 60 + 40) + "%" },
          scale: [0.1, 1.8, 0.2] // Erzeugt den "Anflug-Effekt"
        });
        triggerComet();
      }, delay);
    };

    // 3. Gasriese (Sichtbarer auf Mobile)
    const triggerLarge = () => {
      const delay = 120000 + Math.random() * 60000;
      return setTimeout(() => {
        setLargeObject({ id: Date.now(), y: Math.random() * 50 + 10 });
        triggerLarge();
      }, delay);
    };

    const pulseInterval = setInterval(() => setPulseKey(p => p + 1), 40000);
    const t1 = triggerStar(); const t2 = triggerComet(); const t3 = triggerLarge();
    
    return () => { 
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); 
      clearInterval(pulseInterval); 
    };
  }, []);

  return (
    // Wir lassen den Z-Index auf 1, damit es hinter der Schrift bleibt, aber vor dem Hintergrund
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      
      {/* ── BASIS-STERNE (Immer da, funkelnd) ── */}
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-[2px] h-[2px] bg-white rounded-full"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ opacity: [0.1, 0.8, 0.1], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 5 }}
        />
      ))}

      {/* ── NEBULA GLOW (Violett-Blau Drift) ── */}
      <motion.div 
        className="absolute top-1/4 -left-1/4 w-[150%] h-[60%] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(circle, var(--color-orbit-purple) 0%, transparent 70%)' }}
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity }}
      />

      {/* ── DER GASRIESE (Groß & Geisterhaft) ── */}
      <AnimatePresence>
        {largeObject && (
          <motion.div
            key={largeObject.id}
            initial={{ x: '-120%', y: `${largeObject.y}%`, opacity: 0 }}
            animate={{ x: '120%', opacity: [0, 0.2, 0.2, 0] }}
            transition={{ duration: 80, ease: "linear" }}
            className="absolute w-[600px] h-[600px] rounded-full border border-violet-500/10 shadow-[inset_0_0_80px_rgba(124,58,237,0.1)]"
          />
        )}
      </AnimatePresence>

      {/* ── DER VOKA-KOMET (Diagonal mit 3D-Anflug) ── */}
      <AnimatePresence>
        {comet && (
          <motion.div
            key={comet.id}
            initial={{ x: comet.start.x, y: comet.start.y, opacity: 0, scale: comet.scale[0] }}
            animate={{ 
              x: comet.end.x, 
              y: comet.end.y, 
              opacity: [0, 1, 1, 0], 
              scale: comet.scale 
            }}
            transition={{ duration: 3, ease: "linear" }}
            className="absolute flex items-center z-50"
            style={{ rotate: comet.start.x.includes('-') ? '25deg' : '155deg' }}
          >
            <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_20px_#fff,0_0_40px_var(--color-orbit-purple)]" />
            <div className="h-[3px] w-[300px]" style={{ 
              background: 'linear-gradient(90deg, white, var(--color-orbit-purple), transparent)',
              filter: 'blur(1px)'
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SCHNUPPEN (Sichtbarer & Schneller) ── */}
      <AnimatePresence>
        {shootingStar && (
          <motion.div
            key={shootingStar.id}
            initial={{ x: `${shootingStar.x}%`, y: `${shootingStar.y}%`, opacity: 0, width: 0 }}
            animate={{ x: `${shootingStar.x + 25}%`, y: `${shootingStar.y + 15}%`, opacity: [0, 1, 0], width: [0, 200, 0] }}
            transition={{ duration: 0.6 }}
            className="absolute h-[1.5px] bg-white shadow-[0_0_10px_white]"
            style={{ transform: `rotate(${shootingStar.angle}deg)` }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};
