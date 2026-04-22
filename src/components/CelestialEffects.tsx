import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const CelestialEffects = () => {
  const [shootingStar, setShootingStar] = useState<{ id: number; x: number; y: number } | null>(null);

  // TEST: Sofort und alle 4 Sekunden eine fette Sternschnuppe
  useEffect(() => {
    const trigger = () => {
      setShootingStar({ id: Date.now(), x: 20 + Math.random() * 50, y: 10 + Math.random() * 30 });
    };
    trigger(); // Einmal sofort
    const interval = setInterval(trigger, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1, border: '2px solid transparent' }}>
      
      {/* DEBUG MARKER: Wenn du diesen roten Punkt oben links siehst, läuft die Datei! */}
      <div className="absolute top-5 left-5 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_red] z-[999]" />

      {/* Extrem helle Test-Sterne */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full"
          style={{ left: `${10 + i * 8}%`, top: `${20 + (i % 3) * 10}%` }}
          animate={{ scale: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      ))}

      {/* Fette Test-Sternschnuppe */}
      <AnimatePresence>
        {shootingStar && (
          <motion.div
            key={shootingStar.id}
            initial={{ x: `${shootingStar.x}%`, y: `${shootingStar.y}%`, opacity: 0, width: 0 }}
            animate={{ 
              x: `${shootingStar.x + 20}%`, 
              y: `${shootingStar.y + 15}%`, 
              opacity: [0, 1, 0],
              width: ['0px', '250px', '0px'] 
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute h-1 bg-white rotate-[30deg] z-[999]"
            style={{ boxShadow: '0 0 20px #fff' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
