import { motion } from 'motion/react';
import { Check, X, Zap, Star } from 'lucide-react';
import { useEffect } from 'react';

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
    bg: 'from-red-600/70 to-red-900/70',
    border: 'border-red-500/50',
    iconBg: 'bg-red-500/20',
    textColor: 'text-red-300',
    shake: true,
  },
  2: {
    icon: <span className="text-2xl">😓</span>,
    label: 'Schwer',
    bg: 'from-orange-600/70 to-orange-900/70',
    border: 'border-orange-500/40',
    iconBg: 'bg-orange-500/20',
    textColor: 'text-orange-300',
    shake: false,
  },
  3: {
    icon: <Check size={28} />,
    label: 'Gut!',
    bg: 'from-emerald-600/70 to-emerald-900/70',
    border: 'border-emerald-500/40',
    iconBg: 'bg-emerald-500/20',
    textColor: 'text-emerald-300',
    shake: false,
  },
  4: {
    icon: <Star size={28} className="fill-current" />,
    label: 'Leicht! ⭐',
    bg: 'from-amber-500/70 to-yellow-700/70',
    border: 'border-amber-400/50',
    iconBg: 'bg-amber-400/20',
    textColor: 'text-amber-300',
    shake: false,
  },
} as const;

export function GradeFeedback({ grade, xpGained, onDone }: GradeFeedbackProps) {
  const config = GRADE_CONFIG[grade];

  useEffect(() => {
    const timer = setTimeout(onDone, 850);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={
        config.shake
          ? { opacity: 1, scale: 1, y: 0, x: [0, -14, 14, -9, 9, -4, 4, 0] }
          : { opacity: 1, scale: 1, y: 0 }
      }
      exit={{ opacity: 0, scale: 0.7, y: -20 }}
      transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
      className={`
        absolute inset-x-4 top-1/2 -translate-y-1/2 z-50
        flex flex-col items-center gap-3 py-6 px-6 rounded-[24px]
        bg-gradient-to-br ${config.bg}
        border ${config.border}
        backdrop-blur-2xl shadow-2xl
        pointer-events-none overflow-hidden
      `}
    >
      {/* Grade-spezifische Hintergrund-Effekte */}
      {grade === 1 && <SonarRings />}
      {grade === 3 && <OrbitWave />}
      {grade === 4 && <OrbitRingBurst />}

      {/* Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.08, type: 'spring', stiffness: 420, damping: 14 }}
        className={`w-14 h-14 rounded-2xl ${config.iconBg} flex items-center justify-center ${config.textColor}`}
      >
        {config.icon}
      </motion.div>

      {/* Label */}
      <motion.span
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className={`text-xl font-black ${config.textColor} tracking-tight`}
      >
        {config.label}
      </motion.span>

      {/* XP Badge */}
      {xpGained > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.22, type: 'spring', stiffness: 380, damping: 18 }}
          className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full px-3 py-1"
        >
          <Zap size={12} className="text-amber-400 fill-current" />
          <span className="text-sm font-black text-amber-300">+{xpGained} XP</span>
        </motion.div>
      )}

      {/* StarBurst nur für Grade 4 */}
      {grade === 4 && <StarBurst />}
    </motion.div>
  );
}

/* ── Sonar Pulse Rings (Grade 1 — Nochmal) ── */
function SonarRings() {
  return (
    <div className="absolute inset-0 pointer-events-none rounded-[24px]">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-[24px] border-2 border-red-400/80"
          initial={{ scale: 1, opacity: 0.85 }}
          animate={{ scale: 1.22 + i * 0.14, opacity: 0 }}
          transition={{ duration: 0.55, delay: i * 0.11, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

/* ── Orbit Expand Wave (Grade 3 — Gut) ── */
function OrbitWave() {
  return (
    <div className="absolute inset-0 pointer-events-none rounded-[24px]">
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-[24px] border border-emerald-400/70"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.18 + i * 0.14, opacity: 0 }}
          transition={{ duration: 0.65, delay: i * 0.18, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

/* ── Orbit Ring Burst (Grade 4 — Leicht) ── */
function OrbitRingBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none rounded-[24px]">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-[24px] border border-amber-300/70"
          initial={{ scale: 1, opacity: 0.9 }}
          animate={{ scale: 1.2 + i * 0.18, opacity: 0 }}
          transition={{ duration: 0.7, delay: i * 0.11, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

/* ── Verbesserter StarBurst (Grade 4) — mehr Partikel, Amber+Violet Mix ── */
function StarBurst() {
  const COLORS = ['#F59E0B', '#A78BFA', '#FCD34D', '#7C3AED', '#FBBF24', '#C4B5FD'];

  const particles = Array.from({ length: 12 }, (_, i) => ({
    angle: (i / 12) * 360,
    distance: 60 + Math.random() * 50,
    size: 3 + Math.random() * 5,
    color: COLORS[i % COLORS.length],
    duration: 0.5 + Math.random() * 0.2,
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
            transition={{ duration: p.duration, delay: i * 0.025, ease: 'easeOut' }}
            style={{ width: p.size, height: p.size, backgroundColor: p.color }}
            className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full"
          />
        );
      })}
    </div>
  );
}
