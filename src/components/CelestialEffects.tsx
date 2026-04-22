import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const CelestialEffects = () => {
  const [shootingStar, setShootingStar] = useState<{ id: number; x: number; y: number; type: 'slim' | 'comet' } | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    const trigger = () => {
      // Zufall: 80% normale Sternschnuppe, 20% fetter Komet
      const isComet = Math.random() > 0.8;
      const delay = isComet ? Math.random() * 15000 + 20000 : Math.random() * 5000 + 5000;

      return setTimeout(() => {
        setShootingStar({
          id: Date.now(),
          x: Math.random() * 70 + 5,
          y: Math.random() * 40 + 5,
          type: isComet ? 'comet' : 'slim'
        });
        trigger();
      }, delay);
    };

    // Orbital-Impuls alle 45 Sekunden triggern
    const pulseInterval = setInterval(() => {
      setPulseKey(prev => prev + 1);
    }, 45000);

    const timer = trigger();
    return () => {
      clearTimeout(timer);
      clearInterval(pulseInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      
      {/* ── 1. ORBITAL IMPULS (Die sanfte Welle) ── */}
      <AnimatePresence>
        <motion.div
          key={`pulse-${pulseKey}`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 4, opacity: [0, 0.15, 0] }}
          transition={{ duration: 8, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-violet-500/30"
          style={{ boxShadow: 'inset 0 0 50px rgba(124, 58, 237, 0.1)' }}
        />
      </AnimatePresence>

      {/* ── 2. NEBULA DRIFT (Sanfter Hintergrund-Glow) ── */}
      <motion.div 
        className="absolute -bottom-[10%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-10 blur-[120px]"
        style={{ background: 'var(--color-orbit-cyan)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.08, 0.03] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── 3. STERNSCHNUPPEN & KOMETEN ── */}
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
              x: `${shootingStar.x + (shootingStar.type === 'comet' ? 35 : 20)}%`, 
              y: `${shootingStar.y + (shootingStar.type === 'comet' ? 25 : 15)}%`, 
              opacity: [0, 1, 0],
              width: shootingStar.type === 'comet' ? ['0px', '280px', '0px'] : ['0px', '140px', '0px']
            }}
            transition={{ 
              duration: shootingStar.type === 'comet' ? 1.5 : 0.8, 
              ease: "easeOut" 
            }}
            className={`absolute rotate-[32deg] ${
              shootingStar.type === 'comet' 
                ? 'h-[3px] bg-gradient-to-r from-transparent via-violet-400 to-transparent' 
                : 'h-[1px] bg-gradient-to-r from-transparent via-white to-transparent'
            }`}
            style={{ 
              boxShadow: shootingStar.type === 'comet' 
                ? '0 0 20px rgba(167, 139, 250, 0.6)' 
                : '0 0 10px rgba(255, 255, 255, 0.4)' 
            }}
            onAnimationComplete={() => setShootingStar(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};
