import { Play } from 'lucide-react';
import { motion } from 'motion/react';

interface LaunchScreenProps {
  onStart: () => void;
}

import { LogoAnimation } from '../components/LogoAnimation';

export function LaunchScreen({ onStart }: LaunchScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 gap-8">

      {/* ── Logo Animation ── */}
      <div className="relative flex items-center justify-center mt-4 h-48">
        <LogoAnimation scale={0.7} className="absolute" />
      </div>

      {/* ── Headline ── */}
      <div className="flex flex-col items-center gap-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-[10px] font-black text-violet-400/60 uppercase tracking-[0.35em]"
        >
          Globaler Review
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-3xl font-black text-white uppercase tracking-tight"
          style={{ textShadow: '0 0 30px rgba(124,58,237,0.5)' }}
        >
          Mission Launch
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-sm text-white/40 max-w-xs leading-relaxed font-medium"
        >
          Alle fälligen Vokabeln aus aktiven Decks — eine Session, volle Konzentration.
        </motion.p>
      </div>

      {/* ── CTA Button ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="w-full max-w-xs"
      >
        <motion.button
          onClick={onStart}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          className="relative w-full overflow-hidden py-5 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 group"
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            boxShadow: '0 8px 32px rgba(124,58,237,0.45), 0 2px 8px rgba(124,58,237,0.3)',
          }}
        >
          {/* Shimmer-Effekt beim Hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.5 }}
          />
          <Play size={20} className="fill-current relative z-10 group-hover:scale-110 transition-transform" />
          <span className="relative z-10">Session Starten</span>
        </motion.button>

        {/* Subtiler Pulse-Hinweis unter dem Button */}
        <motion.p
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          className="text-[9px] text-white/25 uppercase tracking-widest text-center mt-4 font-bold"
        >
          Tippe zum Starten
        </motion.p>
      </motion.div>

    </div>
  );
}
