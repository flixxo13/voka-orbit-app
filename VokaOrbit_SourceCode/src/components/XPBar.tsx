import { motion, AnimatePresence } from 'motion/react';
import { Zap, Star } from 'lucide-react';
import { getLevelData } from '../hooks/useSettings';

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
          <div className="text-[9px] font-black text-amber-400/70 uppercase tracking-[0.2em] leading-none">
            LEVEL
          </div>
          <div className="text-sm font-black text-white leading-tight">
            {level}
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] font-bold text-amber-400/60 flex items-center gap-0.5">
            <Zap size={9} className="fill-current" />
            {xpIntoLevel} / {xpNeededForLevel} XP
          </span>
          <span className="text-[9px] font-bold text-white/30">
            {progressPercent}%
          </span>
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
   XP GAIN TOAST (shows floating "+15 XP" text)
   ============================================================ */
interface XPToastProps {
  amount: number;
  label?: string;
  onDone?: () => void;
}

export function XPToast({ amount, label, onDone }: XPToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.8 }}
      animate={{ opacity: 1, y: -40, scale: 1 }}
      exit={{ opacity: 0, y: -70, scale: 0.8 }}
      onAnimationComplete={onDone}
      className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 backdrop-blur-md">
        <Zap size={12} className="text-amber-400 fill-current" />
        <span className="text-sm font-black text-amber-400">
          +{amount} XP{label ? ` ${label}` : ''}
        </span>
      </div>
    </motion.div>
  );
}

/* ============================================================
   LEVEL UP OVERLAY
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onDone}
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex flex-col items-center gap-4 text-center p-8"
      >
        {/* Glowing star burst */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="text-7xl"
        >
          ⭐
        </motion.div>
        <div>
          <div className="text-[10px] font-black text-amber-400/70 uppercase tracking-[0.3em] mb-2">
            LEVEL UP!
          </div>
          <div className="text-6xl font-black text-white">
            {level}
          </div>
          <div className="text-amber-400/60 text-sm font-bold mt-2">
            Du bist im Orbit gestiegen!
          </div>
        </div>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-[10px] text-white/40 uppercase tracking-widest mt-4"
        >
          Tippe um fortzufahren
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
