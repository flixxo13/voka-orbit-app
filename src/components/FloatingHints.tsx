import { motion, AnimatePresence } from 'motion/react';
import { useState, useCallback } from 'react';
import { type Card } from '../core/storage-local';
import { XP_COSTS, XP_REWARDS, getRevealCost } from '../hooks/useSettings';
import { Zap, Sparkles } from 'lucide-react';

/* ============================================================
   TYPES
   ============================================================ */
interface OrbitHintSystemProps {
  card: Card;
  xp: number;
  onSpendXP: (amount: number, isWarning?: boolean) => boolean;
  onGainXP: (amount: number, label?: string, isCombo?: boolean) => void;
  onRevealComplete: () => void;
  onAbortHint: (cost: number) => void;
  onXpDepleted: () => void;
}

interface OrbData {
  id: string;
  letter: string;
  colorIdx: number;
  zone: 0 | 1 | 2 | 3;
}

/* ============================================================
   COLORS – vibrant space palette
   ============================================================ */
const ORB_COLORS = [
  { from: '#7C3AED', to: '#6D28D9', glow: '0 0 20px 4px rgba(124,58,237,0.6)' },
  { from: '#06B6D4', to: '#0891B2', glow: '0 0 20px 4px rgba(6,182,212,0.6)' },
  { from: '#EC4899', to: '#DB2777', glow: '0 0 20px 4px rgba(236,72,153,0.6)' },
  { from: '#F59E0B', to: '#D97706', glow: '0 0 20px 4px rgba(245,158,11,0.6)' },
  { from: '#10B981', to: '#059669', glow: '0 0 20px 4px rgba(16,185,129,0.6)' },
  { from: '#60A5FA', to: '#3B82F6', glow: '0 0 20px 4px rgba(96,165,250,0.6)' },
] as const;

/* ============================================================
   4 FIXED FLOAT ZONES (% of container width/height)
   Each orb gently oscillates within its zone.
   ============================================================ */
const ZONES: Array<{ x: string; y: string }> = [
  { x: '12%',  y: '10%' },  // top-left
  { x: '62%',  y: '5%'  },  // top-right
  { x: '5%',   y: '55%' },  // bottom-left
  { x: '68%',  y: '52%' },  // bottom-right
];

/* ============================================================
   HELPERS
   ============================================================ */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a pool of 4 unique letters:
 * - Always includes the correct next letter
 * - Up to 3 distractors from the target word (plausible, related)
 * - Padded with common German letters if needed
 */
function buildPool(word: string, nextIdx: number): OrbData[] {
  const clean = word.toUpperCase().replace(/ /g, '').split('');
  if (nextIdx >= clean.length) return [];

  const correct = clean[nextIdx];
  const wordLetters = [...new Set(clean)].filter(l => l !== correct);
  const fillers   = ['A','E','I','O','U','S','T','R','N'].filter(
    l => l !== correct && !wordLetters.includes(l)
  );

  const extras  = shuffle([...wordLetters, ...fillers]).slice(0, 3);
  const pool    = shuffle([correct, ...extras]);

  return pool.map((letter, i) => ({
    id:       `${letter}-${nextIdx}-${i}-${Math.random().toString(36).slice(2)}`,
    letter,
    colorIdx: i,
    zone:     i as 0 | 1 | 2 | 3,
  }));
}

/* ============================================================
   ORB COMPONENT – gentle floating, tap feedback
   ============================================================ */
function FloatOrb({
  orb,
  isWrong,
  onTap,
}: {
  orb: OrbData;
  isWrong: boolean;
  onTap: () => void;
}) {
  const color  = ORB_COLORS[orb.colorIdx % ORB_COLORS.length];
  const zone   = ZONES[orb.zone];
  // unique float timing per zone slot
  const floatDur    = 2.4 + orb.zone * 0.55;
  const floatDelay  = orb.zone * 0.3;
  const floatAmp    = 10 + orb.zone * 2;
  const sideAmp     = 6 + (orb.zone % 2) * 4;

  return (
    <motion.button
      layout
      key={orb.id}
      initial={{ scale: 0, opacity: 0 }}
      animate={isWrong
        ? {
            scale: 1, opacity: 1,
            x: [-8, 8, -8, 8, 0],
            boxShadow: ['0 0 0px 0px rgba(239,68,68,0)', '0 0 18px 6px rgba(239,68,68,0.7)', '0 0 0px 0px rgba(239,68,68,0)'],
          }
        : {
            scale: 1, opacity: 1,
            y: [0, -floatAmp, 0],
            x: [0, sideAmp, 0],
          }
      }
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
      transition={isWrong
        ? { duration: 0.45, x: { duration: 0.4 }, boxShadow: { duration: 0.5 } }
        : {
            scale:   { type: 'spring', stiffness: 280, damping: 16, delay: floatDelay * 0.5 },
            opacity: { duration: 0.3, delay: floatDelay * 0.5 },
            y:       { duration: floatDur, repeat: Infinity, ease: 'easeInOut', delay: floatDelay },
            x:       { duration: floatDur * 1.3, repeat: Infinity, ease: 'easeInOut', delay: floatDelay * 0.6 },
          }
      }
      style={{
        position: 'absolute',
        left: zone.x,
        top:  zone.y,
        width:  56,
        height: 56,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
        boxShadow: color.glow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        fontWeight: 900,
        color: '#fff',
        border: '1.5px solid rgba(255,255,255,0.2)',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        zIndex: 10,
      }}
      whileTap={{ scale: 0.85 }}
      onClick={onTap}
    >
      {orb.letter}
    </motion.button>
  );
}

/* ============================================================
   LETTER BLANK – individual slot in the answer row
   ============================================================ */
function LetterBlank({
  char,
  isRevealed,
  isNext,
  consecutiveCorrect = 0,
  consecutiveWrong = 0,
}: {
  char: string;
  isRevealed: boolean;
  isNext: boolean;
  consecutiveCorrect?: number;
  consecutiveWrong?: number;
}) {
  const isCombo = isNext && consecutiveCorrect >= 2;
  const isWarning = isNext && consecutiveWrong >= 3;
  const isDanger = isNext && consecutiveWrong > 0 && consecutiveWrong < 3;

  return (
    <motion.div
      animate={
        isRevealed ? { scale: [1, 1.3, 1] } : 
        isWarning ? { scale: [1, 1.1, 1], borderColor: ['rgba(255,255,255,0.4)', 'rgba(239,68,68,0.8)', 'rgba(255,255,255,0.4)'] } :
        isCombo ? { scale: [1, 1.05, 1], borderColor: ['rgba(255,255,255,0.4)', 'rgba(251,191,36,0.8)', 'rgba(255,255,255,0.4)'] } :
        { scale: 1 }
      }
      transition={
        isRevealed ? { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] } :
        isWarning ? { duration: 0.5, repeat: Infinity } :
        isCombo ? { duration: 1.2, repeat: Infinity } :
        {}
      }
      className={`
        w-9 h-11 rounded-xl flex items-center justify-center
        text-base font-black border-2 transition-all duration-200
        ${isRevealed
          ? 'bg-violet-500/25 border-violet-400/70 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]'
          : isNext
          ? `bg-white/6 text-white/20 ${
              isWarning ? 'border-red-500 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.5),0_0_10px_rgba(239,68,68,0.5)]' 
            : isCombo ? 'border-amber-400 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.4),0_0_10px_rgba(251,191,36,0.4)]' 
            : isDanger ? 'border-red-400/50 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.2)]' 
            : 'border-white/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]'
            }`
          : 'bg-white/4 border-white/10 text-white/10'
        }
      `}
    >
      {isRevealed ? char : ''}
    </motion.div>
  );
}

/* ============================================================
   ORBIT HINT SYSTEM – main component
   ============================================================ */
export function OrbitHintSystem({
  card,
  xp,
  onSpendXP,
  onGainXP,
  onRevealComplete,
  onAbortHint,
  onXpDepleted,
}: OrbitHintSystemProps) {
  const word         = card.back.trim();
  const cleanWord    = word.toUpperCase().replace(/ /g, '');
  const totalLetters = cleanWord.length;

  // Display structure: chars with space markers
  const displayChars = word.split('').map((c, rawIdx) => ({
    char:       c.toUpperCase(),
    isSpace:    c === ' ',
    letterIdx:  c !== ' '
      ? word.slice(0, rawIdx + 1).replace(/ /g, '').length - 1
      : -1,
  }));

  const [nextBlankIdx,   setNextBlankIdx]   = useState(0);
  const [filledLetters,  setFilledLetters]   = useState<(string | null)[]>(() => Array(totalLetters).fill(null));
  const [pool,           setPool]            = useState<OrbData[]>(() => buildPool(word, 0));
  const [wrongOrbId,     setWrongOrbId]      = useState<string | null>(null);
  const [animatingOrbId, setAnimatingOrbId]  = useState<string | null>(null);  // orb flying toward blank
  const [isDone,         setIsDone]          = useState(false);
  const [isExampleRevealed, setIsExampleRevealed] = useState(false);

  // New tracking for XP logic
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [showSparks, setShowSparks] = useState(false);

  /* ── Reveal Example Sentence ── */
  const handleRevealExample = useCallback(() => {
    if (xp >= XP_COSTS.HINT_EXAMPLE_SENTENCE) {
      if (onSpendXP(XP_COSTS.HINT_EXAMPLE_SENTENCE)) {
        setIsExampleRevealed(true);
      }
    } else {
      onXpDepleted();
    }
  }, [xp, onSpendXP, onXpDepleted]);

  /* ── Tap an orb ── */
  const handleTap = useCallback((orb: OrbData) => {
    if (animatingOrbId !== null || isDone) return;

    const expected = cleanWord[nextBlankIdx];
    if (orb.letter === expected) {
      // ✅ Correct
      setAnimatingOrbId(orb.id);
      
      const newCorrect = consecutiveCorrect + 1;
      setConsecutiveCorrect(newCorrect);
      setConsecutiveWrong(0);

      // Give XP reward
      let reward = XP_REWARDS.HINT_CORRECT_LETTER;
      const isCombo = newCorrect >= 2;
      if (isCombo) {
        reward += XP_REWARDS.HINT_STREAK_BONUS;
        setShowSparks(true);
        setTimeout(() => setShowSparks(false), 1500);
      }
      onGainXP(reward, isCombo ? 'Kombi!' : undefined, isCombo);

    } else {
      // ❌ Wrong – shake + red glow
      setWrongOrbId(orb.id);
      setTimeout(() => setWrongOrbId(null), 600);

      const newWrong = consecutiveWrong + 1;
      setConsecutiveWrong(newWrong);
      setConsecutiveCorrect(0);

      const penalty = newWrong >= 3 ? XP_COSTS.HINT_ESCALATION : XP_COSTS.HINT_WRONG_LETTER;
      const isWarning = newWrong >= 3;
      
      // Spend XP, if it drops to 0 or below, abort
      const canAfford = onSpendXP(penalty, isWarning);
      if (!canAfford || xp - penalty <= 0) {
        onXpDepleted();
      } else {
        // Randomly reposition remaining orbs to prevent static learning
        setPool(prev => {
          const shuffled = shuffle([...prev]);
          return shuffled.map((orb, i) => ({ ...orb, zone: i as 0|1|2|3 }));
        });
      }
    }
  }, [animatingOrbId, isDone, cleanWord, nextBlankIdx, onSpendXP, onGainXP, onXpDepleted, consecutiveCorrect, consecutiveWrong, xp]);

  /* ── Called when the comet animation completes ── */
  const handleOrbAnimDone = useCallback(() => {
    const letter  = cleanWord[nextBlankIdx];
    const newFilled = filledLetters.map((v, i) => i === nextBlankIdx ? letter : v);
    setFilledLetters(newFilled);

    const nextIdx = nextBlankIdx + 1;
    setNextBlankIdx(nextIdx);
    setAnimatingOrbId(null);

    if (nextIdx >= totalLetters) {
      setIsDone(true);
      onGainXP(XP_REWARDS.HINT_COMPLETION_BONUS, 'Wort komplett!');
      onRevealComplete();
    } else {
      setPool(buildPool(word, nextIdx));
    }
  }, [cleanWord, nextBlankIdx, filledLetters, totalLetters, word, onRevealComplete]);

  /* ── Reveal all remaining letters (Abbruch) ── */
  const handleRevealAll = useCallback(() => {
    const remaining = totalLetters - nextBlankIdx;
    const cost = getRevealCost(remaining);
    
    // Set filled state immediately
    const allLetters = cleanWord.split('');
    setFilledLetters(allLetters);
    setNextBlankIdx(totalLetters);
    setIsDone(true);

    onAbortHint(cost);
  }, [cleanWord, totalLetters, nextBlankIdx, onAbortHint]);

  /* ── Render ── */
  return (
    <div className="flex flex-col w-full gap-3 select-none">

      {/* ── Orb Float Zone ── */}
      <div className="relative w-full" style={{ minHeight: 200 }}>

        {/* Decorative orbit rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{
            width: '85%', height: '72%',
            borderRadius: '50%',
            border: '1px solid rgba(167,139,250,0.08)',
            transform: 'rotate(-15deg)',
          }} />
          <div style={{
            position: 'absolute',
            width: '65%', height: '54%',
            borderRadius: '50%',
            border: '1px solid rgba(6,182,212,0.06)',
            transform: 'rotate(10deg)',
          }} />
        </div>

        {/* Golden Sparks (Streak) */}
        <AnimatePresence>
          {showSparks && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            >
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    x: [0, (Math.random() - 0.5) * 200],
                    y: [0, (Math.random() - 0.5) * 200],
                    opacity: [1, 0]
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                />
              ))}
              <Sparkles className="w-16 h-16 text-amber-400 opacity-50 animate-spin-slow" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating letter orbs */}
        <AnimatePresence>
          {pool.map(orb => {
            if (orb.id === animatingOrbId) {
              // Comet animation: shrink and fly down toward the blank area
              return (
                <motion.div
                  key={orb.id}
                  initial={{ scale: 1, opacity: 1,  left: ZONES[orb.zone].x, top: ZONES[orb.zone].y }}
                  animate={{ scale: 0.15, opacity: 0, y: 180 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  onAnimationComplete={handleOrbAnimDone}
                  style={{
                    position: 'absolute',
                    left: ZONES[orb.zone].x,
                    top:  ZONES[orb.zone].y,
                    width: 56, height: 56,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${ORB_COLORS[orb.colorIdx % ORB_COLORS.length].from}, ${ORB_COLORS[orb.colorIdx % ORB_COLORS.length].to})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 900, color: '#fff',
                    pointerEvents: 'none', zIndex: 20,
                  }}
                >
                  {orb.letter}
                  {/* Comet trail */}
                  <div style={{
                    position: 'absolute', inset: -6, borderRadius: '50%',
                    background: ORB_COLORS[orb.colorIdx % ORB_COLORS.length].from,
                    opacity: 0.3, filter: 'blur(8px)', zIndex: -1,
                  }} />
                </motion.div>
              );
            }

            return (
              <FloatOrb
                key={orb.id}
                orb={orb}
                isWrong={wrongOrbId === orb.id}
                onTap={() => handleTap(orb)}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Target word (center) ── */}
      <div className="text-center py-1 flex flex-col items-center">
        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">
          Wie heißt das auf Deutsch?
        </p>
        <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
          {card.front}
        </h2>
        {card.exampleFront && (
          <div className="mt-3 min-h-[32px] flex items-center justify-center relative w-full">
            <AnimatePresence mode="wait">
              {!isExampleRevealed ? (
                <motion.button
                  key="example-btn"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRevealExample}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card border text-[10px] font-black uppercase tracking-wider transition-all ${
                    xp >= XP_COSTS.HINT_EXAMPLE_SENTENCE 
                      ? 'border-white/10 text-white/40 hover:bg-white/10' 
                      : 'border-red-500/20 text-red-400/50 cursor-not-allowed'
                  }`}
                >
                  📖 Beispielsatz
                  <span className={xp >= XP_COSTS.HINT_EXAMPLE_SENTENCE ? 'text-white/20' : 'text-red-400/30'}>
                    −{XP_COSTS.HINT_EXAMPLE_SENTENCE} XP
                  </span>
                </motion.button>
              ) : (
                <motion.p
                  key="example-text"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-white/70 italic max-w-[260px] mx-auto leading-relaxed px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.03)]"
                >
                  „{card.exampleFront}“
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Letter blanks (below word) ── */}
      <div className="flex flex-wrap justify-center gap-1.5 px-2 py-2">
        {displayChars.map((d, i) => {
          if (d.isSpace) return <div key={i} className="w-2" />;
          const isRevealed = d.letterIdx >= 0 && filledLetters[d.letterIdx] !== null;
          const isNext     = d.letterIdx === nextBlankIdx && !isDone;
          return (
            <LetterBlank
              key={i}
              char={d.char}
              isRevealed={isRevealed}
              isNext={isNext}
              consecutiveCorrect={consecutiveCorrect}
              consecutiveWrong={consecutiveWrong}
            />
          );
        })}
      </div>

      {/* ── Footer: XP info + reveal button ── */}
      <div className="flex flex-col items-center gap-3 pt-1">
        <div className="flex items-center gap-1.5 text-[10px] text-white/35 font-bold">
          <Zap size={11} className="text-amber-400/60 fill-current" />
          <span>{xp} XP verfügbar</span>
        </div>

        {!isDone && nextBlankIdx < totalLetters && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={handleRevealAll}
            className="px-6 py-2.5 rounded-2xl bg-white/6 border border-white/12
              text-white/50 font-black text-[10px] uppercase tracking-wider
              hover:bg-white/10 transition-all"
          >
            ✨ Lösung aufdecken
            <span className="ml-1.5 text-red-400/60">
              (−{getRevealCost(totalLetters - nextBlankIdx)} XP)
            </span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
