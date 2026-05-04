import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import { type Card } from '../core/storage-local';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface OrbitCardProps {
  card: Card;
  isFlipped: boolean;
  onReveal: () => void;
  disableTapReveal?: boolean;
}

export function OrbitCard({ card, isFlipped, onReveal, disableTapReveal = false }: OrbitCardProps) {
  const [showExamples, setShowExamples] = useState(false);

  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div 
      className="relative w-full max-w-md perspective-1000 h-[400px]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className={`w-full h-full relative ${disableTapReveal ? 'cursor-default' : 'cursor-pointer'}`}
        style={{ 
          transformStyle: 'preserve-3d',
          rotateX: isFlipped ? 0 : rotateX,
          rotateY: isFlipped ? 180 : rotateY,
        }}
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        onClick={() => !disableTapReveal && onReveal()}
      >
        {/* Front Side */}
        <div className="absolute inset-0 backface-hidden bg-white/5 dark:bg-[#1A1A35]/40 backdrop-blur-3xl rounded-[2.5rem] p-8 flex flex-col items-center justify-center shadow-[0_0_50px_-12px_rgba(139,92,246,0.3)] border border-white/10 overflow-hidden">
          {/* Subtle Glow Effect */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-orbit-purple/20 blur-[80px] rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orbit-cyan/10 blur-[80px] rounded-full" />
          
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-[0.3em] uppercase mb-6 opacity-60">
            TARGET WORD
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white text-center break-words w-full tracking-tight leading-tight">
            {card.front}
          </h2>
          {!isFlipped && !disableTapReveal && (
            <motion.div 
              className="mt-12 px-6 py-2 bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-full text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] border border-white/5"
              animate={{ opacity: [0.4, 0.8, 0.4], y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              TAP TO REVEAL
            </motion.div>
          )}
        </div>

        {/* Back Side (Inverse) */}
        <div 
          className="absolute inset-0 backface-hidden bg-white/10 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 flex flex-col items-center justify-center shadow-[0_0_50px_-12px_rgba(6,182,212,0.3)] border border-white/20"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <span className="text-[10px] font-black text-orbit-cyan dark:text-orbit-purple tracking-[0.3em] uppercase opacity-80">
              TRANSLATION
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white text-center break-words w-full tracking-tight leading-tight">
            {card.back}
          </h2>

          {(card.exampleFront || card.exampleBack) && (
            <div className="mt-8 w-full">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowExamples(!showExamples); }}
                className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-orbit-cyan dark:hover:text-orbit-purple transition-colors"
              >
                {showExamples ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showExamples ? 'AUSBLENDEN' : 'BEISPIELSATZ'}
              </button>
              
              <AnimatePresence>
                {showExamples && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-4 bg-white/5 dark:bg-slate-100 rounded-2xl space-y-2">
                      {card.exampleFront && (
                        <p className="text-sm text-slate-200 dark:text-slate-700 italic">
                          "{card.exampleFront}"
                        </p>
                      )}
                      {card.exampleBack && (
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {card.exampleBack}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
