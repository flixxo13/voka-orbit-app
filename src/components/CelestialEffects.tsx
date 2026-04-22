import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const CelestialEffects = () => {
  const [shootingStar, setShootingStar] = useState<{ id: number; x: number; y: number } | null>(null);

  // Logik für zufällige Sternschnuppen
  useEffect(() => {
    const triggerNext = () => {
      const delay = Math.random() * 20000 + 10000; // Alle 10-30 Sek.
      return setTimeout(() => {
        setShootingStar({
          id: Date.now(),
          x: Math.random() * 80, // Startposition
          y: Math.random() * 40,
        });
        triggerNext();
      }, delay);
    };

    const timer = triggerNext();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      
      {/* 1. Ferne, pulsierende Sterne (Konstante Eleganz) */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute w-1 h-1 bg-violet-300/30 rounded-full blur-[1px]"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.1, 0.5, 0.1],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* 2. Subtiler Nebel-Glanz (Marken-Farbe Violett) */}
      <motion.div 
        className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/5 blur-[120px]"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 15, repeat: Infinity }}
      />

      {/* 3. Sternschnuppen-Animation */}
      <AnimatePresence>
        {shootingStar && (
          <motion.div
            key={shootingStar.id}
            initial={{ x: `${shootingStar.x}%`, y: `${shootingStar.y}%`, opacity: 0, width: 0 }}
            animate={{ 
              x: `${shootingStar.x + 20}%`, 
              y: `${shootingStar.y + 15}%`, 
              opacity: [0, 1, 0],
              width: ['0px', '100px', '0px']
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute h-[1px] bg-gradient-to-r from-transparent via-white to-transparent rotate-[35deg]"
            onAnimationComplete={() => setShootingStar(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};
