import { useSession } from '../hooks/useSession';
import { useSettings, XP_REWARDS, XP_COSTS } from '../hooks/useSettings';
import { OrbitCard } from '../components/OrbitCard';
import { OrbitHintSystem } from '../components/FloatingHints';
import { GradeFeedback } from '../components/GradeFeedback';
import { XPToast } from '../components/XPBar';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { ArrowLeft, Star, Rocket, Check, X, FastForward, Zap, Info, ChevronDown, ChevronUp } from 'lucide-react';

type LearnPhase = 'card' | 'hint';

interface PendingXP { amount: number; label: string; key: number; isNegative?: boolean; isCombo?: boolean; isWarning?: boolean; isSummary?: boolean; }

export function LearnScreen({ deckId, onBack }: { deckId?: number; onBack: () => void }) {
  const { settings, gainXP, spendXP, incrementStreak } = useSettings();
  const { currentCard, isFinished, isLoading, sessionStats, submitReview, resetSession } = useSession(deckId);

  const [phase, setPhase] = useState<LearnPhase>('card');
  const [isFlipped, setIsFlipped] = useState(false);
  const [gradeFeedback, setGradeFeedback] = useState<{ grade: number; xpDelta: number } | null>(null);
  const [hintsUsedThisCard, setHintsUsedThisCard] = useState(0);
  const [forceNochmal, setForceNochmal] = useState(false);
  const [showHintInfo, setShowHintInfo] = useState(false);
  const [pendingXP, setPendingXP] = useState<PendingXP[]>([]);
  const [sessionHistory, setSessionHistory] = useState<{ word: string, grade: number, xpDelta: number }[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const hintXpDeltaRef = useRef(0);

  // Swipe gesture motion values
  const dragX = useMotionValue(0);
  const cardRotate = useTransform(dragX, [-180, 0, 180], [-6, 0, 6]);
  const leftOpacity = useTransform(dragX, [-150, -50, 0], [1, 0.4, 0]);
  const rightOpacity = useTransform(dragX, [0, 50, 150], [0, 0.4, 1]);

  // Reset per card
  useEffect(() => {
    setPhase('card');
    setIsFlipped(false);
    setHintsUsedThisCard(0);
    setForceNochmal(false);
    hintXpDeltaRef.current = 0;
    setPendingXP([]); // Clear toasts on new card
    dragX.set(0);
  }, [currentCard?.id]);

  // Reset session history when starting a new session
  useEffect(() => {
    if (!isFinished) {
      setSessionHistory([]);
      setShowDetails(false);
    }
  }, [isFinished]);

  /* ── XP helpers ── */
  const showXP = useCallback((amount: number, label?: string, isNegative?: boolean, isCombo?: boolean, isWarning?: boolean, isSummary?: boolean) => {
    const key = Date.now() + Math.random();
    setPendingXP(prev => {
      if (isSummary) {
        return [{ amount, label: label ?? '', key, isNegative, isCombo, isWarning, isSummary }];
      }
      const next = [...prev, { amount, label: label ?? '', key, isNegative, isCombo, isWarning, isSummary }];
      return next.length > 2 ? next.slice(next.length - 2) : next;
    });
  }, []);

  const handleSpendXP = useCallback((amount: number, isWarning?: boolean): boolean => {
    const ok = spendXP(amount);
    if (ok) {
      showXP(amount, '', true, false, isWarning);
      hintXpDeltaRef.current -= amount;
    }
    return ok;
  }, [spendXP, showXP]);

  const handleGainXP = useCallback((amount: number, label?: string, isCombo?: boolean) => {
    gainXP(amount);
    showXP(amount, label, false, isCombo, false);
    hintXpDeltaRef.current += amount;
  }, [gainXP, showXP]);

  /* ── Grade a card ── */
  const handleGrade = useCallback(async (grade: 1 | 2 | 3 | 4) => {
    let xpDelta = 0;
    if (grade === 1) xpDelta = -2;
    if (grade === 2) xpDelta = -1;
    if (grade === 3) xpDelta = 1;
    if (grade === 4) xpDelta = 2;

    if (xpDelta > 0) {
      gainXP(xpDelta);
      incrementStreak();
      showXP(xpDelta);
    } else if (xpDelta < 0) {
      spendXP(Math.abs(xpDelta));
      showXP(Math.abs(xpDelta), '', true);
    }

    setGradeFeedback({ grade, xpDelta });

    // Track history
    if (currentCard) {
      setSessionHistory(prev => [...prev, {
        word: currentCard.front,
        grade,
        xpDelta
      }]);
    }

    setTimeout(async () => {
      setGradeFeedback(null);
      setPhase('card');
      setIsFlipped(false);
      dragX.set(0);
      await submitReview(grade);
    }, 850);
  }, [hintsUsedThisCard, gainXP, incrementStreak, showXP, submitReview, dragX]);

  /* ── Hint reveal complete → flip card, back to card phase ── */
  const handleRevealComplete = useCallback(() => {
    setTimeout(() => {
      const delta = hintXpDeltaRef.current;
      showXP(Math.abs(delta), 'Bilanz', delta < 0, false, false, true);
    }, 600);
    setIsFlipped(true);
    setPhase('card');
  }, [showXP]);

  /* ── Hint Abort & Depleted ── */
  const handleAbortHint = useCallback((cost: number) => {
    if (cost > 0) {
      spendXP(cost);
      showXP(cost, 'Aufgedeckt', true);
      hintXpDeltaRef.current -= cost;
    }
    setTimeout(() => {
      const delta = hintXpDeltaRef.current;
      showXP(Math.abs(delta), 'Bilanz', delta < 0, false, false, true);
    }, 600);
    setForceNochmal(true);
    setIsFlipped(true);
    setPhase('card');
  }, [spendXP, showXP]);

  const handleXpDepleted = useCallback(() => {
    showXP(0, 'XP Leer!', true);
    setTimeout(() => {
      const delta = hintXpDeltaRef.current;
      showXP(Math.abs(delta), 'Bilanz', delta < 0, false, false, true);
    }, 600);
    setForceNochmal(true);
    setIsFlipped(true);
    setPhase('card');
  }, [showXP]);

  /* ── Swipe-to-grade handler ── */
  const handleDragEnd = useCallback((_: unknown, info: { offset: { x: number } }) => {
    dragX.set(0);
    if (Math.abs(info.offset.x) > 80) {
      if (info.offset.x < 0) {
        handleGrade(1);  // Swipe left = Nochmal
      } else if (info.offset.x > 0) {
        if (forceNochmal) {
          // Do nothing, swipe right is disabled
        } else if (hintsUsedThisCard > 0) {
          handleGrade(2); // Swipe right = Schwer
        } else {
          handleGrade(3); // Swipe right = Gut
        }
      }
    }
  }, [handleGrade, dragX, forceNochmal, hintsUsedThisCard]);

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
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-6 px-4"
      >
        {/* ── Mini Orbit Visual ── */}
        <div className="relative flex items-center justify-center">
          {/* Orbit-Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute w-28 h-28 rounded-full border border-violet-400/25"
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
          </motion.div>
          {/* Planet */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl relative z-10"
            style={{
              background: hasCards
                ? 'radial-gradient(circle at 35% 30%, #A78BFA, #7C3AED 55%, #4C1D95)'
                : 'radial-gradient(circle at 35% 30%, #60A5FA, #3B82F6 55%, #1D4ED8)',
              boxShadow: hasCards
                ? '0 0 30px rgba(124,58,237,0.6), 0 0 60px rgba(124,58,237,0.2)'
                : '0 0 30px rgba(96,165,250,0.6), 0 0 60px rgba(96,165,250,0.2)',
            }}
          >
            {hasCards ? '🚀' : '🪐'}
          </motion.div>
        </div>

        {/* ── Headline ── */}
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-black text-white mb-2"
          >
            {hasCards ? 'Mission erfüllt!' : 'Keine Karten'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/50 text-sm max-w-xs leading-relaxed"
          >
            {hasCards
              ? 'Alle fälligen Vokabeln angeschaut. Dein Voka Orbit wächst. Bleib dran.'
              : 'Füge Vokabeln zu einem aktiven Deck hinzu, um zu starten.'}
          </motion.p>
        </div>

        {/* ── Stats mit Count-Up ── */}
        {hasCards && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card p-4 w-full max-w-xs"
          >
            <div className="grid grid-cols-3 gap-3 text-center">
              <StatCount value={sessionStats.completed} color="text-violet-400" label="Gelernt" delay={0.4} />
              <StatCount value={settings.streak} color="text-amber-400" label="Streak 🔥" delay={0.5} />
              <StatCount value={settings.xp} color="text-emerald-400" label="XP ⚡" delay={0.6} />
            </div>
          </motion.div>
        )}

        {/* ── Stats Details Accordion ── */}
        {hasCards && sessionHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="w-full max-w-xs"
          >
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-center gap-1.5 w-full py-2 text-[10px] font-bold text-white/40 hover:text-white/60 uppercase tracking-widest transition-colors"
            >
              Bilanz Details
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass-card mt-2 p-3 flex flex-col gap-2 max-h-[30vh] overflow-y-auto rounded-2xl text-left border border-white/10 custom-scrollbar">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2 mb-1">
                      <span>Vokabel</span>
                      <span>Bilanz</span>
                    </div>
                    {sessionHistory.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                        <span className="font-bold text-white/80 truncate pr-2">{item.word}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
                            item.grade >= 3 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {item.grade === 1 ? 'Nochmal' : item.grade === 2 ? 'Schwer' : item.grade === 3 ? 'Gut' : 'Leicht'}
                          </span>
                          <span className={`text-xs font-black w-8 text-right ${item.xpDelta > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                            {item.xpDelta > 0 ? '+' : ''}{item.xpDelta}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Buttons ── */}
        <div className="flex flex-col w-full max-w-xs gap-3">
          {hasCards && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              whileTap={{ scale: 0.96 }}
              onClick={resetSession}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black rounded-full shadow-[0_0_20px_rgba(124,58,237,0.4)] uppercase tracking-wider text-sm hover:scale-[0.98] transition-transform"
            >
              Nochmal lernen
            </motion.button>
          )}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            whileTap={{ scale: 0.96 }}
            onClick={onBack}
            className="w-full py-4 bg-white/[0.04] backdrop-blur-[20px] border border-white/10 text-white/60 font-black rounded-full uppercase tracking-wider text-sm hover:bg-white/10 transition-colors"
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
      <div className="absolute top-14 right-0 flex flex-col items-end gap-1.5 pointer-events-none z-50">
        <AnimatePresence>
          {pendingXP.map(p => (
            <XPToast key={p.key} amount={p.amount} label={p.label} isNegative={p.isNegative} isCombo={p.isCombo} isWarning={p.isWarning} isSummary={p.isSummary} onDone={() =>
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

      {/* ── Content ── */}
      <AnimatePresence mode="wait">

        {/* PHASE: Card – tap to flip front↔back, swipe to grade */}
        {phase === 'card' && (
          <motion.div
            key="card-phase"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-5"
          >
            {/* Grade feedback overlay */}
            <AnimatePresence>
              {gradeFeedback && (
                <GradeFeedback
                  grade={gradeFeedback.grade as 1 | 2 | 3 | 4}
                  xpDelta={gradeFeedback.xpDelta}
                  onDone={() => setGradeFeedback(null)}
                />
              )}
            </AnimatePresence>

            {/* Card + swipe wrapper */}
            <div className="relative w-full">
              {/* Swipe indicators */}
              <motion.div style={{ opacity: leftOpacity }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 text-red-400 font-black text-xs pointer-events-none select-none">
                ↩ Nochmal
              </motion.div>
              <motion.div style={{ opacity: rightOpacity }}
                className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 ${hintsUsedThisCard > 0 ? 'text-orange-400' : 'text-emerald-400'} font-black text-xs pointer-events-none select-none`}>
                {forceNochmal ? '' : hintsUsedThisCard > 0 ? 'Schwer ↪' : 'Gut ↪'}
              </motion.div>

              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                style={{ x: dragX, rotate: cardRotate }}
                onDragEnd={handleDragEnd}
                className="touch-pan-y cursor-grab active:cursor-grabbing"
              >
                <OrbitCard
                  card={currentCard}
                  isFlipped={isFlipped}
                  onReveal={() => setIsFlipped(f => !f)}
                  disableTapReveal={false}
                />
              </motion.div>
            </div>

            {/* ─ Grade buttons (back side only) ─ */}
            <AnimatePresence>
              {isFlipped && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className={`w-full max-w-md grid ${
                    forceNochmal ? 'grid-cols-1' :
                    hintsUsedThisCard > 0 ? 'grid-cols-2' : 'grid-cols-4'
                  } gap-2`}
                >
                  {GRADE_BUTTONS.filter(btn => 
                    forceNochmal ? btn.grade === 1 :
                    (hintsUsedThisCard === 0 || btn.grade <= 2)
                  ).map(btn => (
                    <GradeBtn key={btn.grade} {...btn} onClick={() => handleGrade(btn.grade as 1|2|3|4)} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─ Hint button (front side only) ─ */}
            <AnimatePresence>
              {!isFlipped && hintsUsedThisCard === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-3 mt-2"
                >
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (settings.xp >= XP_COSTS.HINT_ENTRY) {
                        spendXP(XP_COSTS.HINT_ENTRY);
                        showXP(XP_COSTS.HINT_ENTRY, 'Hint', true);
                        setHintsUsedThisCard(1);
                        setPhase('hint');
                      }
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl glass-card border ${settings.xp >= XP_COSTS.HINT_ENTRY ? 'border-amber-500/20 text-amber-400 hover:bg-white/5' : 'border-white/10 text-white/30'} text-xs font-black uppercase tracking-wider transition-colors`}
                  >
                    💡 Hint Modus
                    <span className={settings.xp >= XP_COSTS.HINT_ENTRY ? 'text-amber-400/50' : 'text-white/20'}>−{XP_COSTS.HINT_ENTRY} XP</span>
                  </motion.button>
                  
                  {/* Info Text & Details */}
                  <div className="flex flex-col items-center gap-1.5 w-full max-w-[280px] text-center">
                    <p className="text-[10px] text-white/40 leading-relaxed font-medium">
                      Nutze die Aktiv-Hilfe, um der Vokabel auf die Spur zu kommen. Festige sie im Orbit-Puzzle und verdiene dabei zusätzliche XP!
                    </p>
                    <button 
                      onClick={() => setShowHintInfo(!showHintInfo)} 
                      className="flex items-center gap-1 text-[9px] text-white/20 hover:text-white/40 uppercase tracking-widest font-bold transition-colors mt-1"
                    >
                      <Info size={10} />
                      {showHintInfo ? 'Details ausblenden' : 'Details einblenden'}
                    </button>
                    <AnimatePresence>
                      {showHintInfo && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden w-full"
                        >
                          <div className="mt-2 text-[9px] text-white/40 text-left bg-white/5 p-3 rounded-xl border border-white/5 space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="text-amber-400/70 mt-0.5">⚡</span>
                              <p><strong className="text-white/60">Einstieg:</strong> −3 XP beim Starten.</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-emerald-400/70 mt-0.5">✓</span>
                              <p><strong className="text-white/60">Erfolg:</strong> +1 XP pro Buchstabe (+2 XP ab dem 2. in Folge).</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-red-400/70 mt-0.5">✗</span>
                              <p><strong className="text-white/60">Fehler:</strong> −1 XP (Eskalation auf −2 XP bei 3 Fehlern in Folge).</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-violet-400/70 mt-0.5">✨</span>
                              <p><strong className="text-white/60">Abschluss:</strong> +1 XP Bonus für das komplette Wort.</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Swipe hint label */}
            {!isFlipped && (
              <p className="text-[9px] font-bold text-white/15 uppercase tracking-widest select-none">
                ← Nochmal · Tippen zum Umdrehen · {forceNochmal ? '' : hintsUsedThisCard > 0 ? 'Schwer →' : 'Gut →'}
              </p>
            )}
          </motion.div>
        )}

        {/* PHASE: Hint (Orbit Letters) */}
        {phase === 'hint' && (
          <motion.div
            key="hint-phase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col min-h-[62vh]"
          >
            <OrbitHintSystem
              card={currentCard}
              xp={settings.xp}
              soundEnabled={settings.soundEnabled}
              onSpendXP={handleSpendXP}
              onGainXP={(amount, label) => { gainXP(amount); showXP(amount, label); }}
              onRevealComplete={handleRevealComplete}
              onAbortHint={handleAbortHint}
              onXpDepleted={handleXpDepleted}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

/* ── Grade Button Config ── */
const GRADE_BUTTONS = [
  { grade: 1, label: 'Nochmal', icon: <X size={18} />,            color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { grade: 2, label: 'Schwer',  icon: <FastForward size={18} />,  color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { grade: 3, label: 'Gut',     icon: <Check size={18} />,         color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
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

/* ── StatCount: Zahl animiert von 0 auf Endwert ── */
function StatCount({ value, color, label, delay }: {
  value: number; color: string; label: string; delay: number;
}) {
  const [display, setDisplay] = useState(0);
  const [glowing, setGlowing] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === 0) return;
    const timeout = setTimeout(() => {
      const duration = 600;
      const start = performance.now();

      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * value));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setDisplay(value);
          setGlowing(true);
          setTimeout(() => setGlowing(false), 400);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, delay]);

  return (
    <div>
      <div
        className={`text-xl font-black ${color} transition-all duration-200`}
        style={glowing ? { filter: 'brightness(1.6) drop-shadow(0 0 8px currentColor)' } : {}}
      >
        {display}
      </div>
      <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold">{label}</div>
    </div>
  );
}
