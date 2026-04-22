import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const CelestialEffects = () => {
  const [shootingStar, setShootingStar] = useState<{ id: number; x: number; y: number; type: 'slim' | 'comet' } | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    // 1. Logik für Schnuppen & Kometen
    const triggerStar = () => {
      const isComet = Math.random() > 0.85; // 15% Chance auf einen Kometen
      const delay = isComet ? 15000 + Math.random() * 10000 : 4000 + Math.random() * 6000;

      return setTimeout(() => {
        setShootingStar({
          id: Date.now(),
          x: 5 + Math.random() * 80,
          y: 5 + Math.random() * 40,
          type: isComet ? 'comet' : 'slim'
        });
        triggerStar();
      }, delay);
    };

    // 2. Logik für den Orbital-Impuls (alle 40 Sek)
    const pulseInterval = setInterval(() => {
      setPulseKey(prev => prev + 1);
    }, 40000);

    const timer = triggerStar();
    return () => {
      clearTimeout(timer);
      clearInterval(pulseInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      
      {/* ── BACKGROUND: Twinkling Stars (Damit es nie leer aussieht) ── */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-[1.5px] h-[1.5px] bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: '0 0 3px rgba(255,255,255,0.4)'
          }}
          animate={{ opacity: [0.1, 0.6, 0.1] }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5
          }}
        />
      ))}

      {/* ── EFFECT: Orbital-Impuls (Die sanfte Schockwelle) ── */}
      <AnimatePresence>
        <motion.div
          key={`pulse-${pulseKey}`}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: 3, opacity: [0, 0.12, 0] }}
          transition={{ duration: 10, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-violet-500/20"
          style={{ boxShadow: 'inset 0 0 60px rgba(124, 58, 237, 0.05)' }}
        />
      </AnimatePresence>

      {/* ── EFFECT: Nebula Glow (Sanfter Farbdrift) ── */}
      <motion.div 
        className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] rounded-full opacity-5 blur-[100px]"
        style={{ background: 'var(--color-orbit-purple)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.07, 0.03] }}
        transition={{ duration: 20, repeat: Infinity }}
      />

      {/* ── EFFECT: Sternschnuppen & Voka-Kometen ── */}
      <AnimatePresence>
        {shootingStar && (
          <motion.div
            key={shootingStar.id}
            initial={{ x: `${shootingStar.x}%`, y: `${shootingStar.y}%`, opacity: 0, width: 0 }}
            animate={{ 
              x: `${shootingStar.x + (shootingStar.type === 'comet' ? 30 : 20)}%`, 
              y: `${shootingStar.y + (shootingStar.type === 'comet' ? 20 : 15)}%`, 
              opacity: [0, 1, 0],
              width: shootingStar.type === 'comet' ? ['0px', '220px', '0px'] : ['0px', '120px', '0px']
            }}
            transition={{ 
              duration: shootingStar.type === 'comet' ? 1.2 : 0.7, 
              ease: "circOut" 
            }}
            className={`absolute rotate-[35deg] z-50 ${
              shootingStar.type === 'comet' 
                ? 'h-[2px] bg-gradient-to-r from-transparent via-violet-300 to-transparent' 
                : 'h-[1px] bg-gradient-to-r from-transparent via-white to-transparent'
            }`}
            style={{ 
              boxShadow: shootingStar.type === 'comet' 
                ? '0 0 15px rgba(167, 139, 250, 0.5)' 
                : '0 0 8px rgba(255, 255, 255, 0.3)' 
            }}
            onAnimationComplete={() => setShootingStar(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
