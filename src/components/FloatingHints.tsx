import { motion, AnimatePresence } from 'motion/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { type Card } from '../core/storage-local';
import { XP_COSTS, XP_REWARDS, getRevealCost } from '../hooks/useSettings';
import { Zap, Sparkles } from 'lucide-react';
import { PlanetVibe } from './PlanetVibe';
import { playTapSound, playCorrectSound, playWrongSound, playShuffleSound, vibrateTap, vibrateWrong, vibrateCombo, vibrateCorrect, vibrateShake } from '../core/audio';

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
  soundEnabled?: boolean;
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

// FloatOrb has been replaced by PlanetVibe and CSS animations.

/* ============================================================
   LETTER BLANK – individual slot in the answer row
   ============================================================ */
function LetterBlank({
  char,
  isRevealed,
  isNext,
  consecutiveCorrect = 0,
  consecutiveWrong = 0,
  wordLength = 1,
}: {
  char: string;
  isRevealed: boolean;
  isNext: boolean;
  consecutiveCorrect?: number;
  consecutiveWrong?: number;
  wordLength?: number;
}) {
  const isCombo = isNext && consecutiveCorrect >= 2;
  const isError = isNext && consecutiveWrong > 0;

  // Dynamische Skalierung für Combo (Pulse + Glow) basierend auf Streak vs. Wortlänge
  // Starts building up significantly after 2 correct hits
  const streakRatio = Math.min(Math.max(consecutiveCorrect - 1, 0) / Math.max(wordLength - 1, 1), 1);
  
  // Pulse wird stärker je länger der Streak
  const pulseScaleTarget = isCombo ? 1.05 + (streakRatio * 0.25) : 1; 
  // Glow wird größer und deckender
  const glowSize = 10 + (streakRatio * 40); // 10px bis 50px
  const glowOpacity = 0.4 + (streakRatio * 0.6); // 0.4 bis 1.0

  return (
    <motion.div
      animate={
        isRevealed ? { scale: [1, 1.2, 1] } : 
        isError ? { scale: [1, 1.1, 1], x: [-3, 3, -3, 3, 0] } :
        isCombo ? { scale: [1, pulseScaleTarget, 1] } :
        { scale: 1 }
      }
      transition={
        isRevealed ? { duration: 0.3, ease: "easeOut" } :
        isError ? { duration: 0.4 } :
        isCombo ? { duration: Math.max(1.2 - (streakRatio * 0.5), 0.5), repeat: Infinity } : // pulse gets faster
        {}
      }
      className={`
        w-9 h-11 rounded-xl flex items-center justify-center
        text-base font-black border transition-all duration-300 backdrop-blur-sm
        ${isRevealed
          ? 'bg-purple-500/20 border-purple-400/50 text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]'
          : isNext
          ? `bg-white/5 text-white/20 ${
              isError ? `border-pink-500 shadow-[0_0_${Math.min(8 + consecutiveWrong * 5, 25)}px_rgba(236,72,153,${Math.min(0.3 + consecutiveWrong * 0.15, 0.9)})]` 
            : isCombo ? `border-amber-400` 
            : 'border-white/30 shadow-[0_0_8px_rgba(255,255,255,0.15)]'
            }`
          : 'bg-white/5 border-white/10 text-white/10'
        }
      `}
      style={{
        boxShadow: isNext && isCombo ? `0 0 ${glowSize}px rgba(251,191,36,${glowOpacity})` : undefined
      }}
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
  soundEnabled = true,
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
  const hasTriggeredDoneRef = useRef(false);
  const [deadOrbIds, setDeadOrbIds] = useState<string[]>([]);
  
  // Shake detection state
  const lastShakeRef = useRef({ time: 0, x: 0, y: 0, z: 0 });
  const [isShaking, setIsShaking] = useState(false);
  const [shufflesRemaining, setShufflesRemaining] = useState(3);
  
  // Black Hole State
  const [bhCharge, setBhCharge] = useState(0);
  const [suckedOrbId, setSuckedOrbId] = useState<string | null>(null);
  const [bhUsesRemaining, setBhUsesRemaining] = useState(3);
  const [emptyFeedback, setEmptyFeedback] = useState(false);
  const [tapRippleKey, setTapRippleKey] = useState(0);
  // Keep a ref to latest pool/deadOrbIds/animatingOrbId to avoid stale closures
  const poolRef = useRef(pool);
  const deadOrbIdsRef = useRef(deadOrbIds);
  const animatingOrbIdRef = useRef(animatingOrbId);
  useEffect(() => { poolRef.current = pool; }, [pool]);
  useEffect(() => { deadOrbIdsRef.current = deadOrbIds; }, [deadOrbIds]);
  useEffect(() => { animatingOrbIdRef.current = animatingOrbId; }, [animatingOrbId]);

  /* ── Black Hole: slow passive decay ── */
  useEffect(() => {
    if (bhCharge <= 0 || bhCharge >= 100) return;
    const timer = setTimeout(() => {
      setBhCharge(prev => Math.max(0, prev - 2));
    }, 150);
    return () => clearTimeout(timer);
  }, [bhCharge]);

  const handleCenterTap = useCallback(() => {
    // Block while animating, sucking, or done
    if (isDone || suckedOrbId !== null || animatingOrbIdRef.current !== null) return;
    
    // Empty feedback if uses exhausted
    if (bhUsesRemaining <= 0) {
      vibrateWrong(); // haptic NO
      setEmptyFeedback(true);
      setTimeout(() => setEmptyFeedback(false), 400);
      return;
    }

    setTapRippleKey(Date.now()); // Trigger tactile ripple

    setBhCharge(prev => {
      const next = prev + 15; // ~7 rapid taps to fill
      if (next >= 100) {
        vibrateShake();
        playShuffleSound(soundEnabled);

        const currentPool = poolRef.current;
        const currentDead = deadOrbIdsRef.current;

        const distractor = currentPool.find(orb =>
          !cleanWord.includes(orb.letter) &&
          !currentDead.includes(orb.id) &&
          orb.id !== animatingOrbIdRef.current
        );

        if (distractor) {
          setBhUsesRemaining(u => u - 1);
          setSuckedOrbId(distractor.id);
          setTimeout(() => {
            setPool(p => p.filter(orb => orb.id !== distractor.id));
            setSuckedOrbId(null);
            setBhCharge(0);
          }, 600);
        } else {
          setTimeout(() => setBhCharge(0), 400);
        }
      }
      return Math.min(next, 100);
    });
  }, [isDone, suckedOrbId, bhUsesRemaining, cleanWord, soundEnabled]);

  /* ── Shake ── */
  useEffect(() => {
    let shakeCount = 0;
    let lastShakeTime = 0;

    const handleMotion = (e: DeviceMotionEvent) => {
      const current = e.accelerationIncludingGravity;
      if (!current || !current.x) return;
      const now = Date.now();
      
      if (now - lastShakeRef.current.time > 100) {
        const deltaX = Math.abs(current.x - lastShakeRef.current.x);
        const deltaY = Math.abs((current.y || 0) - lastShakeRef.current.y);
        const deltaZ = Math.abs((current.z || 0) - lastShakeRef.current.z);
        
        // Threshold for a strong, sharp movement
        if (deltaX + deltaY + deltaZ > 25 && !isDone && animatingOrbId === null && shufflesRemaining > 0) {
            if (now - lastShakeTime > 450) {
                shakeCount = 0; // strict reset: requires short, rapid shakes
            }
            shakeCount++;
            lastShakeTime = now;
            
            // Require 4 rapid back-and-forth shakes
            if (shakeCount >= 4 && !isShaking) {
                shakeCount = 0;
                setIsShaking(true);
                setShufflesRemaining(prev => prev - 1);
                playShuffleSound(soundEnabled);
                vibrateShake();
                
                // Drift out for 1.5s, then shuffle and return
                setTimeout(() => {
                  setIsShaking(false);
                  setPool(prev => {
                    const shuffled = shuffle([...prev]);
                    return shuffled.map((orb, i) => ({ ...orb, zone: i as 0|1|2|3 }));
                  });
                }, 1500);
            }
        }
        
        lastShakeRef.current = {
          time: now,
          x: current.x,
          y: current.y || 0,
          z: current.z || 0
        };
      }
    };

    if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [isDone, animatingOrbId, soundEnabled, isShaking, shufflesRemaining]);

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
      playTapSound(soundEnabled);
      setAnimatingOrbId(orb.id);
      
      const newCorrect = consecutiveCorrect + 1;
      setConsecutiveCorrect(newCorrect);
      setConsecutiveWrong(0);

      // Give XP reward
      let reward = XP_REWARDS.HINT_CORRECT_LETTER;
      const isCombo = newCorrect >= 2;
      if (isCombo) {
        reward += XP_REWARDS.HINT_STREAK_BONUS;
        vibrateCombo();
        setShowSparks(true);
        setTimeout(() => setShowSparks(false), 1500);
      } else {
        vibrateTap();
      }
      onGainXP(reward, undefined, isCombo);

    } else {
      // ❌ Wrong – shake + red glow
      playWrongSound(soundEnabled);
      vibrateWrong();
      setWrongOrbId(orb.id);
      setTimeout(() => setWrongOrbId(null), 600);

      setDeadOrbIds(prev => [...prev, orb.id]);

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
    playCorrectSound(soundEnabled);
    vibrateCorrect();
    const letter  = cleanWord[nextBlankIdx];
    const newFilled = filledLetters.map((v, i) => i === nextBlankIdx ? letter : v);
    setFilledLetters(newFilled);

    const nextIdx = nextBlankIdx + 1;
    setNextBlankIdx(nextIdx);
    setAnimatingOrbId(null);

    if (nextIdx >= totalLetters) {
      if (hasTriggeredDoneRef.current) return;
      hasTriggeredDoneRef.current = true;
      setIsDone(true);
      onGainXP(XP_REWARDS.HINT_COMPLETION_BONUS, 'Wort komplett!');
      onRevealComplete();
    } else {
      setDeadOrbIds([]);
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

        {/* Decorative orbit rings and stars */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ perspective: '800px' }}>
          {/* Subtle localized nebula glow for the hint area */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.12)_0%,_transparent_70%)] opacity-100" />
          
          {/* Localized Starfield */}
          <div 
            className="absolute inset-0 opacity-40" 
            style={{
              backgroundImage: 'radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 90px 40px, #fff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 160px 120px, rgba(255,255,255,0.8), rgba(0,0,0,0))',
              backgroundSize: '200px 200px',
            }}
          />

          {/* 3D Orbit Rings – outer: tilt, inner: spin + moving bright spot */}

          {/* Ring 1 – large, violet */}
          <motion.div
            animate={{
              rotateX: [70, 74, 70, 66, 70],
              rotateY: [-15, -10, -15, -20, -15],
            }}
            transition={{
              rotateX: { duration: 18, repeat: Infinity, ease: 'easeInOut' },
              rotateY: { duration: 22, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="absolute"
            style={{ width: '95%', height: '95%' }}
          >
            <motion.div
              animate={{ rotateZ: 360 }}
              transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '100%', height: '100%',
                borderRadius: '50%',
                border: '1px solid rgba(139,92,246,0.03)',
                borderTopColor: 'rgba(139,92,246,0.10)',
                borderBottomColor: 'rgba(139,92,246,0.01)',
                boxShadow: 'inset 0 0 20px rgba(139,92,246,0.02)',
              }}
            />
          </motion.div>

          {/* Ring 2 – medium, cyan */}
          <motion.div
            animate={{
              rotateX: [65, 69, 65, 61, 65],
              rotateY: [20, 26, 20, 14, 20],
            }}
            transition={{
              rotateX: { duration: 24, repeat: Infinity, ease: 'easeInOut' },
              rotateY: { duration: 19, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="absolute"
            style={{ width: '75%', height: '75%' }}
          >
            <motion.div
              animate={{ rotateZ: -360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '100%', height: '100%',
                borderRadius: '50%',
                border: '1px solid rgba(6,182,212,0.03)',
                borderLeftColor: 'rgba(6,182,212,0.10)',
                borderRightColor: 'rgba(6,182,212,0.01)',
              }}
            />
          </motion.div>

          {/* Ring 3 – small, white */}
          <motion.div
            animate={{
              rotateX: [75, 79, 75, 71, 75],
              rotateY: [5, 10, 5, 0, 5],
            }}
            transition={{
              rotateX: { duration: 20, repeat: Infinity, ease: 'easeInOut' },
              rotateY: { duration: 15, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="absolute"
            style={{ width: '55%', height: '55%' }}
          >
            <motion.div
              animate={{ rotateZ: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '100%', height: '100%',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.02)',
                borderRightColor: 'rgba(255,255,255,0.08)',
                borderLeftColor: 'rgba(255,255,255,0.01)',
              }}
            />
          </motion.div>
        </div>
        
        {/* Black Hole UI & Tap Target */}
        <div 
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <div 
            className={`absolute w-32 h-32 rounded-full touch-manipulation z-20 ${bhUsesRemaining > 0 ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            onClick={handleCenterTap}
          />

          {/* Empty Feedback (Error Shake) */}
          <AnimatePresence>
            {emptyFeedback && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 0.5, x: [-5, 5, -5, 5, 0] }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute w-16 h-16 rounded-full bg-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.5)] border border-pink-500/40 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Tactile Tap Ripple */}
          <AnimatePresence>
            {tapRippleKey > 0 && (
              <motion.div
                key={tapRippleKey}
                initial={{ scale: Math.max(0.1, bhCharge / 100), opacity: 0.8 }}
                animate={{ scale: Math.max(0.1, bhCharge / 100) + 0.3, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute w-16 h-16 rounded-full border-2 border-purple-400 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Charge indicator – always fades out smoothly via AnimatePresence */}
          <AnimatePresence>
            {bhCharge > 0 && bhUsesRemaining > 0 && (
              <motion.div
                key="bh-charge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: Math.max(0.1, bhCharge / 100), opacity: 1 }}
                exit={{ scale: 0, opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="absolute w-16 h-16 rounded-full flex items-center justify-center pointer-events-none overflow-hidden"
                style={{
                  boxShadow: '0 0 40px rgba(139,92,246,0.9), inset 0 0 15px rgba(6,182,212,0.8)',
                  background: 'radial-gradient(circle at center, #000 35%, #1a0b2e 75%, #4c1d95 100%)',
                  border: '1px solid rgba(139,92,246,0.3)'
                }}
              >
                {/* Fast spinning accretion/turbulence texture */}
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-[200%] h-[200%] opacity-60 mix-blend-color-dodge pointer-events-none"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, rgba(6,182,212,0.6) 15%, transparent 35%, rgba(139,92,246,0.6) 65%, transparent 85%)'
                  }}
                />
                {/* Pure Black Core to act as the deep void */}
                <div className="absolute w-8 h-8 bg-black rounded-full pointer-events-none" style={{ boxShadow: '0 0 15px 5px #000' }} />
              </motion.div>
            )}
          </AnimatePresence>
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
              // Comet animation: fly toward center from the planet's own side
              // Zones 0 & 2 are left-side → fly right (+x); zones 1 & 3 are right-side → fly left (-x)
              const isLeftZone = orb.zone === 0 || orb.zone === 2;
              const targetX = isLeftZone ? 130 : -130;
              return (
                <motion.div
                  key={orb.id}
                  initial={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                  animate={{ scale: 0.25, opacity: 0, x: targetX, y: 180 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  onAnimationComplete={handleOrbAnimDone}
                  style={{
                    position: 'absolute',
                    left: ZONES[orb.zone].x,
                    top: ZONES[orb.zone].y,
                    zIndex: 20,
                  }}
                >
                  <PlanetVibe
                    letter={orb.letter}
                    colorFrom={ORB_COLORS[orb.colorIdx % ORB_COLORS.length].from}
                    colorTo={ORB_COLORS[orb.colorIdx % ORB_COLORS.length].to}
                    isDead={false}
                    isWrong={false}
                  />
                  {/* Comet trail */}
                  <div style={{
                    position: 'absolute', inset: -6, borderRadius: '50%',
                    background: ORB_COLORS[orb.colorIdx % ORB_COLORS.length].from,
                    opacity: 0.6, filter: 'blur(12px)', zIndex: -1,
                  }} />
                </motion.div>
              );
            }
            
            if (orb.id === suckedOrbId) {
              return (
                <motion.div
                  key={orb.id}
                  initial={{ scale: 1, opacity: 1, left: ZONES[orb.zone].x, top: ZONES[orb.zone].y, x: 0, y: 0 }}
                  animate={{ scaleX: 0, scaleY: 3, opacity: 0, left: '50%', top: '50%', x: '-50%', y: '-50%', rotate: 720 }}
                  transition={{ duration: 0.6, ease: [0.32, 0, 0.67, 0] }}
                  style={{ position: 'absolute', zIndex: 15 }}
                >
                  <PlanetVibe
                    letter={orb.letter}
                    colorFrom={ORB_COLORS[orb.colorIdx % ORB_COLORS.length].from}
                    colorTo={ORB_COLORS[orb.colorIdx % ORB_COLORS.length].to}
                    isDead={false}
                    isWrong={false}
                  />
                </motion.div>
              );
            }

            const isDead = deadOrbIds.includes(orb.id);
            const isWrong = wrongOrbId === orb.id;
            const color = ORB_COLORS[orb.colorIdx % ORB_COLORS.length];
            const zone = ZONES[orb.zone];
            const floatClasses = ['animate-planet-float', 'animate-planet-float-fast', 'animate-planet-float-slow', 'animate-planet-float'];
            
            const parallaxFactors = [
              { x: 0.8, y: 1.2 }, // top-left
              { x: 1.2, y: 0.8 }, // top-right
              { x: 1.0, y: 1.5 }, // bottom-left
              { x: 1.5, y: 1.0 }, // bottom-right
            ];
            
            // Calculate chaotic drift directions for the shake effect based on colorIdx to keep it deterministic
            const driftX = (orb.colorIdx % 2 === 0 ? -1 : 1) * (40 + (orb.colorIdx * 10));
            const driftY = (orb.colorIdx % 3 === 0 ? -1 : 1) * (50 + (orb.colorIdx * 5));
            const driftRotate = (orb.colorIdx % 2 === 0 ? -15 : 15);
            
            return (
              <motion.div 
                layout
                key={orb.id}
                className={isDead ? '' : floatClasses[orb.colorIdx % 4]}
                style={{
                  position: 'absolute',
                  left: zone.x,
                  top: zone.y,
                  zIndex: isDead ? 5 : 10,
                }}
                transition={{ layout: { type: 'spring', stiffness: 50, damping: 14 } }}
              >
                <motion.div
                  animate={isShaking && !isDead ? {
                    x: driftX,
                    y: driftY,
                    rotate: driftRotate,
                    scale: 1.15
                  } : { x: 0, y: 0, rotate: 0, scale: 1 }}
                  transition={isShaking ? {
                    duration: 1.5,
                    ease: "easeOut"
                  } : {
                    type: 'spring',
                    stiffness: 50,
                    damping: 12,
                    duration: 2
                  }}
                >
                  <PlanetVibe
                    letter={orb.letter}
                    colorFrom={color.from}
                    colorTo={color.to}
                    isDead={isDead}
                    isWrong={isWrong}
                    onTap={() => handleTap(orb)}
                    parallaxFactor={parallaxFactors[orb.zone % 4]}
                  />
                </motion.div>
              </motion.div>
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
              wordLength={totalLetters}
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
