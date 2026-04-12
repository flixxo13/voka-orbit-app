import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../core/storage-local';
import { useSession } from '../hooks/useSession';
import { useSettings, XP_REWARDS, XP_COSTS } from '../hooks/useSettings';
import { OrbitCard } from '../components/OrbitCard';
import { OrbitHintSystem } from '../components/FloatingHints';
import { GradeFeedback } from '../components/GradeFeedback';
import { XPToast } from '../components/XPBar';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Star, Rocket, Check, X, FastForward, Zap } from 'lucide-react';

type LearnPhase = 'card' | 'hint' | 'grading';

interface PendingXP { amount: number; label: string; key: number }

export function LearnScreen({ deckId, onBack }: { deckId?: number; onBack: () => void }) {
  const { settings, gainXP, spendXP, incrementStreak } = useSettings();
  const { currentCard, isFinished, isLoading, sessionStats, submitReview, resetSession } = useSession(deckId);

  const [phase, setPhase] = useState<LearnPhase>('card');
  const [isFlipped, setIsFlipped] = useState(false);
  const [gradeFeedback, setGradeFeedback] = useState<{ grade: number; xp: number } | null>(null);
  const [hintsUsedThisCard, setHintsUsedThisCard] = useState(0);
  const [pendingXP, setPendingXP] = useState<PendingXP[]>([]);
  const [xpKey, setXpKey] = useState(0);

  // Reset per card
  useEffect(() => {
    setPhase('card');
    setIsFlipped(false);
    setHintsUsedThisCard(0);
  }, [currentCard?.id]);

  /* ── XP helpers ── */
  const showXP = useCallback((amount: number, label?: string) => {
    setPendingXP(prev => [...prev, { amount, label: label ?? '', key: xpKey }]);
    setXpKey(k => k + 1);
  }, [xpKey]);

  const handleSpendXP = useCallback((amount: number): boolean => {
    const ok = spendXP(amount);
    if (ok) setHintsUsedThisCard(h => h + amount / XP_COSTS.HINT_LETTER);
    return ok;
  }, [spendXP]);

  const handleGainXP = useCallback((amount: number) => {
    gainXP(amount);
    showXP(amount, '🌟 Frühzeitig!');
  }, [gainXP, showXP]);

  /* ── Grade a card ── */
  const handleGrade = useCallback(async (grade: 1 | 2 | 3 | 4) => {
    // Calculate XP for this grade
    let xpEarned = 0;
    if (grade >= 3) {
      xpEarned += XP_REWARDS.CARD_CORRECT;
      if (grade === 4) xpEarned += XP_REWARDS.CARD_EASY;
      if (hintsUsedThisCard === 0) xpEarned += XP_REWARDS.CARD_NO_HINT;
      gainXP(xpEarned);
      incrementStreak();
    }

    setGradeFeedback({ grade, xp: xpEarned });
    if (xpEarned > 0) showXP(xpEarned);

    setTimeout(async () => {
      setGradeFeedback(null);
      setPhase('card');
      await submitReview(grade);
    }, 850);
  }, [hintsUsedThisCard, gainXP, incrementStreak, showXP, submitReview]);

  /* ── Hint reveal complete → go to grading ── */
  const handleRevealComplete = useCallback(() => {
    setIsFlipped(true);
    setPhase('grading');
  }, []);

  /* ── Early solve ── */
  const handleEarlySolve = useCallback((correct: boolean, bonus: number) => {
    if (correct) {
      setIsFlipped(true);
      setPhase('grading');
      showXP(bonus, '⚡ Bonus!');
    }
  }, [showXP]);

  /* ──────────────── LOADING ──────────────── */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
          <Rocket className="text-violet-400 w-10 h-10" />
        </motion.div>
        <p className="text-white/40 font-black uppercase tracking-widest text-xs">Orbit wird berechnet…</p>
      </div>
    );
  }

  /* ──────────────── FINISHED ──────────────── */
  if (isFinished || !currentCard) {
    const hasCards = (sessionStats.totalInDeck ?? 0) > 0;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-6 px-4"
      >
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="text-7xl"
        >
          {hasCards ? '🚀' : '🪐'}
        </motion.div>
        <div>
          <h2 className="text-3xl font-black text-white mb-2">
            {hasCards ? 'Mission erfüllt!' : 'Keine Karten'}
          </h2>
          <p className="text-white/50 text-sm max-w-xs leading-relaxed">
            {hasCards
              ? 'Du hast alle fälligen Vokabeln gelernt. Dein Orbit ist stabil. 🛸'
              : 'Füge Vokabeln zu einem aktiven Deck hinzu, um zu starten.'}
          </p>
        </div>

        {/* Session stats */}
        {hasCards && (
          <div className="glass-card p-4 w-full max-w-xs">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xl font-black text-violet-400">{sessionStats.completed}</div>
                <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold">Gelernt</div>
              </div>
              <div>
                <div className="text-xl font-black text-amber-400">{settings.streak}</div>
                <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold">Streak 🔥</div>
              </div>
              <div>
                <div className="text-xl font-black text-emerald-400">{settings.xp}</div>
                <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold">XP ⚡</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col w-full max-w-xs gap-3">
          {hasCards && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={resetSession}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black rounded-2xl shadow-lg shadow-violet-700/30 uppercase tracking-wider text-sm"
            >
              Nochmal lernen
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-full py-4 bg-white/5 border border-white/10 text-white/60 font-black rounded-2xl uppercase tracking-wider text-sm"
          >
            Zum Dashboard
          </motion.button>
        </div>
      </motion.div>
    );
  }

  /* ──────────────── MAIN LEARN SCREEN ──────────────── */
  return (
    <div className="flex flex-col gap-4 py-2 relative min-h-[80vh]">

      {/* XP Toasts */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-50">
        <AnimatePresence>
          {pendingXP.map(p => (
            <XPToast key={p.key} amount={p.amount} label={p.label} onDone={() =>
              setPendingXP(prev => prev.filter(x => x.key !== p.key))
            } />
          ))}
        </AnimatePresence>
      </div>

      {/* ── Top Bar ── */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center text-white/60"
        >
          <ArrowLeft size={20} />
        </motion.button>

        {/* Progress */}
        <div className="flex-1 glass-card px-4 py-2.5 flex items-center justify-between">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-wider">
            {sessionStats.completed + 1} / {sessionStats.total}
          </span>
          <div className="flex-1 mx-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
              animate={{ width: `${((sessionStats.completed) / Math.max(sessionStats.total, 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <Zap size={12} className="fill-current" />
            <span className="text-[11px] font-black">{settings.xp}</span>
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      <AnimatePresence mode="wait">

        {/* PHASE: Card */}
        {phase === 'card' && (
          <motion.div
            key="card-phase"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center gap-6"
          >
            <OrbitCard
              card={currentCard}
              isFlipped={isFlipped}
              onReveal={() => { setIsFlipped(true); setPhase('grading'); }}
              disableTapReveal={false}
            />

            {/* Actions */}
            <div className="w-full max-w-md flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setIsFlipped(true); setPhase('grading'); }}
                className="flex-1 h-16 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-violet-700/30 uppercase tracking-[0.2em]"
              >
                AUFDECKEN
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setPhase('hint')}
                className="w-16 h-16 rounded-2xl glass-card flex flex-col items-center justify-center gap-1 text-amber-400 border border-amber-500/20"
              >
                <span className="text-lg">💡</span>
                <span className="text-[8px] font-black uppercase tracking-tighter text-amber-400/60">
                  -{XP_COSTS.HINT_LETTER}XP
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* PHASE: Hint (Orbit Letters) */}
        {phase === 'hint' && (
          <motion.div
            key="hint-phase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="glass-card p-6 relative"
          >
            {/* Grade feedback overlay */}
            <AnimatePresence>
              {gradeFeedback && (
                <GradeFeedback
                  grade={gradeFeedback.grade as 1 | 2 | 3 | 4}
                  xpGained={gradeFeedback.xp}
                  onDone={() => setGradeFeedback(null)}
                />
              )}
            </AnimatePresence>

            <OrbitHintSystem
              card={currentCard}
              xp={settings.xp}
              onSpendXP={handleSpendXP}
              onGainXP={handleGainXP}
              onRevealComplete={handleRevealComplete}
              onEarlySolve={handleEarlySolve}
            />

            {/* Grade buttons (shown after reveal) */}
            <AnimatePresence>
              {phase === 'hint' && isFlipped && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 grid grid-cols-4 gap-2"
                >
                  {GRADE_BUTTONS.map(btn => (
                    <GradeBtn key={btn.grade} {...btn} onClick={() => handleGrade(btn.grade as 1|2|3|4)} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* PHASE: Grading (card fully revealed) */}
        {phase === 'grading' && (
          <motion.div
            key="grading-phase"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 relative"
          >
            {/* Grade feedback */}
            <AnimatePresence>
              {gradeFeedback && (
                <GradeFeedback
                  grade={gradeFeedback.grade as 1 | 2 | 3 | 4}
                  xpGained={gradeFeedback.xp}
                  onDone={() => setGradeFeedback(null)}
                />
              )}
            </AnimatePresence>

            <OrbitCard
              card={currentCard}
              isFlipped={true}
              onReveal={() => {}}
              disableTapReveal={true}
            />

            <div className="w-full max-w-md grid grid-cols-4 gap-2">
              {GRADE_BUTTONS.map(btn => (
                <GradeBtn key={btn.grade} {...btn} onClick={() => handleGrade(btn.grade as 1|2|3|4)} />
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

/* ── Grade Button Config ── */
const GRADE_BUTTONS = [
  { grade: 1, label: 'Nochmal', icon: <X size={18} />, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { grade: 2, label: 'Schwer',  icon: <FastForward size={18} />, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { grade: 3, label: 'Gut',     icon: <Check size={18} />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { grade: 4, label: 'Leicht',  icon: <Star size={18} className="fill-current" />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
] as const;

function GradeBtn({ label, icon, color, onClick }: {
  label: string; icon: React.ReactNode; color: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border transition-all ${color}`}
    >
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </motion.button>
  );
}
