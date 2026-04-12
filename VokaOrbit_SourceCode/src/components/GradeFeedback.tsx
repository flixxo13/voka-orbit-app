import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Zap, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

type Grade = 1 | 2 | 3 | 4;

interface GradeFeedbackProps {
  grade: Grade;
  xpGained: number;
  onDone: () => void;
}

const GRADE_CONFIG = {
  1: {
    icon: <X size={28} />,
    label: 'Nochmal',
    bg: 'from-red-600/80 to-red-700/80',
    border: 'border-red-500/40',
    iconBg: 'bg-red-500/20',
    textColor: 'text-red-300',
    shake: true,
  },
  2: {
    icon: <span className="text-2xl">😓</span>,
    label: 'Schwer',
    bg: 'from-orange-600/80 to-orange-700/80',
    border: 'border-orange-500/40',
    iconBg: 'bg-orange-500/20',
    textColor: 'text-orange-300',
    shake: false,
  },
  3: {
    icon: <Check size={28} />,
    label: 'Gut!',
    bg: 'from-emerald-600/80 to-emerald-700/80',
    border: 'border-emerald-500/40',
    iconBg: 'bg-emerald-500/20',
    textColor: 'text-emerald-300',
    shake: false,
  },
  4: {
    icon: <Star size={28} className="fill-current" />,
    label: 'Leicht! ⭐',
    bg: 'from-amber-500/80 to-yellow-600/80',
    border: 'border-amber-400/40',
    iconBg: 'bg-amber-400/20',
    textColor: 'text-amber-300',
    shake: false,
  },
} as const;

export function GradeFeedback({ grade, xpGained, onDone }: GradeFeedbackProps) {
  const config = GRADE_CONFIG[grade];

  useEffect(() => {
    const timer = setTimeout(onDone, 800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={config.shake
        ? { opacity: 1, scale: 1, y: 0, x: [0, -12, 12, -8, 8, -4, 4, 0] }
        : { opacity: 1, scale: 1, y: 0 }
      }
      exit={{ opacity: 0, scale: 0.7, y: -20 }}
      transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      className={`
        absolute inset-x-4 top-1/2 -translate-y-1/2 z-50
        flex flex-col items-center gap-3 py-6 px-6 rounded-[24px]
        bg-gradient-to-br ${config.bg}
        border ${config.border}
        backdrop-blur-2xl shadow-2xl
        pointer-events-none
      `}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 15 }}
        className={`w-14 h-14 rounded-2xl ${config.iconBg} flex items-center justify-center ${config.textColor}`}
      >
        {config.icon}
      </motion.div>

      {/* Label */}
      <span className={`text-xl font-black ${config.textColor} tracking-tight`}>
        {config.label}
      </span>

      {/* XP Gained */}
      {xpGained > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full px-3 py-1"
        >
          <Zap size={12} className="text-amber-400 fill-current" />
          <span className="text-sm font-black text-amber-300">+{xpGained} XP</span>
        </motion.div>
      )}

      {/* Particle burst for "Leicht" */}
      {grade === 4 && <StarBurst />}
    </motion.div>
  );
}

/* ── Particle Burst ── */
function StarBurst() {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    angle: (i / 8) * 360,
    distance: 50 + Math.random() * 30,
    size: 4 + Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px]">
      {particles.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 1, scale: 0, x: '50%', y: '50%' }}
            animate={{ opacity: 0, scale: 1, x: `calc(50% + ${tx}px)`, y: `calc(50% + ${ty}px)` }}
            transition={{ duration: 0.6, delay: i * 0.03, ease: 'easeOut' }}
            style={{ width: p.size, height: p.size }}
            className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400"
          />
        );
      })}
    </div>
  );
}
