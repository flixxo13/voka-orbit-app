import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const CelestialEffects = () => {
  const [shootingStar, setShootingStar] = useState<{ id: number; x: number; y: number } | null>(null);

  // Logik für zufällige Sternschnuppen (alle 8-15 Sekunden)
  useEffect(() => {
    const trigger = () => {
      const delay = Math.random() * 7000 + 8000; 
      return setTimeout(() => {
        setShootingStar({
          id: Date.now(),
          x: Math.random() * 80 + 10,
          y: Math.random() * 40 + 5,
        });
        trigger();
      }, delay);
    };
    const timer = trigger();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      
      {/* 1. Subtiler Nebel-Drift (nutzt deine Brand-Farbe Violett) */}
      <motion.div 
        className="absolute -top-[10%] -right-[10%] w-[80%] h-[70%] rounded-full opacity-10 blur-[120px]"
        style={{ background: 'var(--color-orbit-purple)' }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.05, 0.12, 0.05],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 2. Pulsierende "lebendige" Sterne im Hintergrund */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute w-[1.5px] h-[1.5px] bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: '0 0 4px rgba(255,255,255,0.8)'
          }}
          animate={{ opacity: [0.1, 0.7, 0.1] }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5
          }}
        />
      ))}

      {/* 3. Die Sternschnuppe */}
      <AnimatePresence>
        {shootingStar && (
          <motion.div
            key={shootingStar.id}
            initial={{ x: `${shootingStar.x}%`, y: `${shootingStar.y}%`, opacity: 0, width: 0 }}
            animate={{ 
              x: `${shootingStar.x + 20}%`, 
              y: `${shootingStar.y + 15}%`, 
              opacity: [0, 1, 0],
              width: ['0px', '140px', '0px']
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute h-[1px] bg-gradient-to-r from-transparent via-white to-transparent rotate-[32deg]"
            style={{ boxShadow: '0 0 10px rgba(255,255,255,0.5)' }}
            onAnimationComplete={() => setShootingStar(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
