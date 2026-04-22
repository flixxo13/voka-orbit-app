import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const CelestialEffects = () => {
  const [comet, setComet] = useState<{ id: number; start: any; end: any } | null>(null);
  const [shootingStar, setShootingStar] = useState<{ id: number; x: number; y: number; tx: number; ty: number } | null>(null);

  useEffect(() => {
    // 1. STERNSCHNUPPEN: Jetzt über die VOLLE Höhe verteilt
    const triggerStar = () => {
      const delay = Math.random() * 3000 + 4000;
      return setTimeout(() => {
        const startY = Math.random() * 90; // Von 0% bis 90% der Höhe
        setShootingStar({ 
          id: Date.now(), 
          x: Math.random() * 80, 
          y: startY,
          tx: 20 + Math.random() * 20, // Flugweite X
          ty: 10 + Math.random() * 20  // Flugweite Y
        });
        triggerStar();
      }, delay);
    };

    // 2. DER KOMET: Jetzt VIEL LANGSAMER (8 Sek.) und diagonal über den ganzen Screen
    const triggerComet = () => {
      const delay = Math.random() * 20000 + 15000;
      return setTimeout(() => {
        const fromLeft = Math.random() > 0.5;
        setComet({
          id: Date.now(),
          // Startet außerhalb des Screens, fliegt diagonal durch die Mitte
          start: { x: fromLeft ? "-30%" : "130%", y: (Math.random() * 30) + "%" },
          end: { x: fromLeft ? "130%" : "-30%", y: (Math.random() * 40 + 50) + "%" }
        });
        triggerComet();
      }, delay);
    };

    const t1 = triggerStar(); const t2 = triggerComet();
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      
      {/* ── BACKGROUND: TWINKLE STARS (Überall verteilt) ── */}
      {[...Array(30)].map((_, i) => (
        <div key={i} className="absolute w-[1.5px] h-[1.5px] bg-white rounded-full opacity-20"
             style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }} />
      ))}

      {/* ── DER KOMET: Langsam, groß & diagonal ── */}
      <AnimatePresence>
        {comet && (
          <motion.div
            key={comet.id}
            initial={{ x: comet.start.x, y: comet.start.y, opacity: 0, scale: 0.4 }}
            animate={{ 
              x: comet.end.x, 
              y: comet.end.y, 
              opacity: [0, 0.8, 0.8, 0], 
              scale: [0.4, 1.2, 0.6] // 3D-Effekt: Kommt näher und zieht weg
            }}
            transition={{ duration: 8, ease: "linear" }} // Von 3s auf 8s verlangsamt!
            className="absolute flex items-center z-50"
            style={{ rotate: comet.start.x.includes('-') ? '20deg' : '160deg' }}
          >
            {/* Kometen-Kern */}
            <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_25px_#fff,0_0_50px_var(--color-orbit-purple)]" />
            {/* Extra langer Schweif */}
            <div className="h-[2px] w-[500px]" style={{ 
              background: 'linear-gradient(90deg, white, var(--color-orbit-purple), transparent)',
              filter: 'blur(1px)'
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STERNSCHNUPPEN: Quer über den Screen ── */}
      <AnimatePresence>
        {shootingStar && (
          <motion.div
            key={shootingStar.id}
            initial={{ x: `${shootingStar.x}%`, y: `${shootingStar.y}%`, opacity: 0, width: 0 }}
            animate={{ 
              x: `${shootingStar.x + shootingStar.tx}%`, 
              y: `${shootingStar.y + shootingStar.ty}%`, 
              opacity: [0, 1, 0], 
              width: [0, 250, 0] 
            }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute h-[1.5px] bg-white rotate-[25deg] shadow-[0_0_10px_white]"
          />
        )}
      </AnimatePresence>

    </div>
  );
};
