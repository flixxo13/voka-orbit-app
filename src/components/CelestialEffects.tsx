import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const CelestialEffects = () => {
  const [shootingStar, setShootingStar] = useState<{ id: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const trigger = () => {
      const delay = Math.random() * 8000 + 5000; // Alle 5-13 Sek.
      return setTimeout(() => {
        setShootingStar({
          id: Date.now(),
          x: Math.random() * 80,
          y: Math.random() * 40,
        });
        trigger();
      }, delay);
    };
    const timer = trigger();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {/* Sanfter Nebel-Drift (passend zur Marke) */}
      <motion.div 
        className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'var(--color-orbit-purple)' }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Die Sternschnuppe */}
      <AnimatePresence>
        {shootingStar && (
          <motion.div
            key={shootingStar.id}
            initial={{ x: `${shootingStar.x}%`, y: `${shootingStar.y}%`, opacity: 0, width: 0 }}
            animate={{ 
              x: `${shootingStar.x + 25}%`, 
              y: `${shootingStar.y + 20}%`, 
              opacity: [0, 1, 0],
              width: ['0px', '180px', '0px']
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "linear" }}
            className="absolute h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent rotate-[30deg]"
            style={{ boxShadow: '0 0 15px white' }}
            onAnimationComplete={() => setShootingStar(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
