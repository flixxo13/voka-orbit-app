import { motion, AnimatePresence } from 'motion/react';
import { Zap, Star } from 'lucide-react';
import { getLevelData } from '../hooks/useSettings';
import { useEffect, useRef } from 'react';

interface XPBarProps {
  xp: number;
  streak: number;
}

export function XPBar({ xp, streak }: XPBarProps) {
  const { level, xpIntoLevel, xpNeededForLevel, progressPercent } = getLevelData(xp);

  return (
    <div className="flex items-center gap-3 px-1">
      {/* Level Badge */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Star size={14} className="text-white fill-white" />
        </div>
        <div>
          <div className="text-[9px] font-black text-amber-400/70 uppercase tracking-[0.2em] leading-none">LEVEL</div>
          <div className="text-sm font-black text-white leading-tight">{level}</div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] font-bold text-amber-400/60 flex items-center gap-0.5">
            <Zap size={9} className="fill-current" />
            {xpIntoLevel} / {xpNeededForLevel} XP
          </span>
          <span className="text-[9px] font-bold text-white/30">{progressPercent}%</span>
        </div>
        <div className="xp-bar-track">
          <motion.div
            className="xp-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>
      </div>

      {/* Streak Badge */}
      <AnimatePresence>
        {streak > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center gap-1 bg-orange-500/15 border border-orange-500/30 rounded-xl px-2.5 py-1.5 shrink-0"
          >
            <span className="text-base leading-none">🔥</span>
            <span className="text-sm font-black text-orange-400">{streak}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   XP GAIN TOAST — Größer, spring-bounce, orbit glow
   ============================================================ */
interface XPToastProps {
  amount: number;
  label?: string;
  isNegative?: boolean;
  isCombo?: boolean;
  isWarning?: boolean;
  isSummary?: boolean;
  onDone?: () => void;
}

export function XPToast({ amount, label, isNegative, isCombo, isWarning, isSummary, onDone }: XPToastProps) {
  // Hohe XP-Gewinne (kein Hint benutzt) → Violet-Glow statt Amber
  const isBonus = amount >= 20 && !isNegative;
  // Kleine Gewinne im Hint-Modus (+1 XP) → Grün zur besseren Unterscheidung
  const isSmallReward = amount < 10 && !isNegative && !isCombo;

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  
  useEffect(() => {
    const t = setTimeout(() => {
      if (onDoneRef.current) onDoneRef.current();
    }, isSummary ? 3500 : 2000);
    return () => clearTimeout(t);
  }, [isSummary]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1, ...(isWarning ? { x: [-8, 8, -6, 6, 0] } : {}) }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="pointer-events-none z-50 origin-right"
    >
      <motion.div
        animate={{
          boxShadow: isBonus
            ? ['0 0 0px rgba(124,58,237,0)', '0 0 20px rgba(124,58,237,0.8)', '0 0 0px rgba(124,58,237,0)']
            : isWarning
            ? ['0 0 0px rgba(239,68,68,0)', '0 0 25px rgba(239,68,68,0.9)', '0 0 10px rgba(239,68,68,0.5)']
            : isNegative
            ? ['0 0 0px rgba(239,68,68,0)', '0 0 14px rgba(239,68,68,0.5)', '0 0 0px rgba(239,68,68,0)']
            : isCombo
            ? ['0 0 0px rgba(16,185,129,0)', '0 0 25px rgba(16,185,129,0.9)', '0 0 10px rgba(16,185,129,0.5)']
            : isSmallReward
            ? ['0 0 0px rgba(16,185,129,0)', '0 0 14px rgba(16,185,129,0.5)', '0 0 0px rgba(16,185,129,0)']
            : ['0 0 0px rgba(245,158,11,0)', '0 0 14px rgba(245,158,11,0.5)', '0 0 0px rgba(245,158,11,0)'],
        }}
        transition={{ duration: isWarning || isCombo ? 0.8 : 0.6, delay: 0.1 }}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border ${
          isBonus
            ? 'bg-violet-500/20 border-violet-400/40'
            : isWarning || isNegative
            ? 'bg-red-500/20 border-red-500/50'
            : isCombo
            ? 'bg-emerald-500/25 border-emerald-400/60'
            : isSmallReward
            ? 'bg-emerald-500/20 border-emerald-500/40'
            : 'bg-amber-500/20 border-amber-500/40'
        }`}
      >
        <Zap size={10} className={`fill-current ${isBonus ? 'text-violet-300' : isWarning || isNegative ? 'text-red-400' : isCombo || isSmallReward ? 'text-emerald-400' : 'text-amber-400'}`} />
        <span className={`text-[10px] uppercase tracking-wider font-black ${isBonus ? 'text-violet-300' : isWarning || isNegative ? 'text-red-400' : isCombo || isSmallReward ? 'text-emerald-400' : 'text-amber-400'}`}>
          {isNegative ? '-' : '+'}{Math.abs(amount)} XP{label ? ` ${label}` : ''}
        </span>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   LEVEL UP OVERLAY — Orbit-Ring-Burst + animierter Planet
   ============================================================ */
interface LevelUpProps {
  level: number;
  onDone: () => void;
}

export function LevelUpOverlay({ level, onDone }: LevelUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-sm"
      onClick={onDone}
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 20 }}
        className="flex flex-col items-center gap-5 text-center px-8"
      >
        {/* Orbit-Ring-Burst — 3 Ringe expandieren nacheinander */}
        <div className="relative flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-violet-400/60"
              initial={{ width: 80, height: 80, opacity: 0.8 }}
              animate={{ width: 80 + (i + 1) * 80, height: 80 + (i + 1) * 80, opacity: 0 }}
              transition={{ duration: 1.2, delay: i * 0.22, ease: 'easeOut', repeat: Infinity, repeatDelay: 1.8 }}
            />
          ))}

          {/* Planet-Kern */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="relative w-20 h-20 flex items-center justify-center"
          >
            {/* Orbit-Ring */}
            <div
              className="absolute w-28 h-28 rounded-full border border-violet-400/30"
              style={{ transform: 'rotateX(70deg)' }}
            />
            {/* Planet */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-purple-700 shadow-[0_0_40px_rgba(124,58,237,0.8),0_0_80px_rgba(124,58,237,0.3)] flex items-center justify-center">
              <Star size={22} className="text-white fill-white" />
            </div>
          </motion.div>
        </div>

        {/* Label */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[11px] font-black text-violet-300/70 uppercase tracking-[0.35em] mb-2"
          >
            LEVEL UP!
          </motion.div>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 350, damping: 16 }}
            className="text-7xl font-black text-white"
            style={{ textShadow: '0 0 40px rgba(124,58,237,0.9), 0 0 80px rgba(124,58,237,0.4)' }}
          >
            {level}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-violet-300/60 text-sm font-bold mt-2"
          >
            Du bist im Orbit gestiegen! 🚀
          </motion.div>
        </div>

        <motion.div
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-[10px] text-white/35 uppercase tracking-widest mt-2"
        >
          Tippe um fortzufahren
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
