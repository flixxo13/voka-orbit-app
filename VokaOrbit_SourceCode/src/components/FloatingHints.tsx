import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { type Card } from '../core/storage-local';
import { XP_COSTS, XP_REWARDS } from '../hooks/useSettings';
import { Zap, Lightbulb, CheckCircle, Edit3 } from 'lucide-react';

/* ============================================================
   TYPES
   ============================================================ */
interface OrbitHintSystemProps {
  card: Card;
  xp: number;
  onSpendXP: (amount: number) => boolean;
  onGainXP: (amount: number) => void;
  onRevealComplete: () => void; // called when word fully revealed
  onEarlySolve: (correct: boolean, xpBonus: number) => void;
}

/* ============================================================
   PLANET COLORS for orbs
   ============================================================ */
const ORB_COLORS = [
  { bg: '#7C3AED', glow: 'rgba(124,58,237,0.7)', label: '#fff' },
  { bg: '#06B6D4', glow: 'rgba(6,182,212,0.7)',  label: '#fff' },
  { bg: '#EC4899', glow: 'rgba(236,72,153,0.7)', label: '#fff' },
  { bg: '#FB923C', glow: 'rgba(251,146,60,0.7)', label: '#fff' },
  { bg: '#2DD4BF', glow: 'rgba(45,212,191,0.7)', label: '#0A0A2E' },
  { bg: '#A78BFA', glow: 'rgba(167,139,250,0.7)', label: '#fff' },
  { bg: '#F59E0B', glow: 'rgba(245,158,11,0.7)', label: '#0A0A2E' },
  { bg: '#60A5FA', glow: 'rgba(96,165,250,0.7)', label: '#fff' },
];

/* ============================================================
   LETTER TILE – individual character slot
   ============================================================ */
interface LetterTileProps {
  char: string;
  isRevealed: boolean;
  isSpace: boolean;
  delay?: number;
}

function LetterTile({ char, isRevealed, isSpace, delay = 0 }: LetterTileProps) {
  if (isSpace) return <div className="letter-tile-space" />;

  return (
    <div className="relative">
      <motion.div
        className={`letter-tile ${isRevealed ? 'letter-tile-filled' : 'letter-tile-empty'}`}
        initial={false}
        animate={isRevealed ? {
          scale: [1, 1.3, 1],
          opacity: 1,
        } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, delay, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <AnimatePresence>
          {isRevealed && (
            <motion.span
              key="letter"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay }}
            >
              {char}
            </motion.span>
          )}
        </AnimatePresence>
        {!isRevealed && (
          <span className="text-white/20 text-xl font-black">_</span>
        )}
      </motion.div>
    </div>
  );
}

/* ============================================================
   ORBIT ORB – single orbiting letter planet
   (Uses RAF + direct DOM writes for zero re-render overhead)
   ============================================================ */
interface OrbProps {
  letter: string;
  colorIndex: number;
  orbitRX: number;
  orbitRY: number;
  speed: number;       // radians/second
  startAngle: number;  // initial angle in radians
  size: number;        // px
  isInserting: boolean;
  targetX: number;     // px, relative to orbit center
  targetY: number;
  onInserted: () => void;
}

function OrbitOrb({
  letter,
  colorIndex,
  orbitRX,
  orbitRY,
  speed,
  startAngle,
  size,
  isInserting,
  targetX,
  targetY,
  onInserted,
}: OrbProps) {
  const orbRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const color = ORB_COLORS[colorIndex % ORB_COLORS.length];

  // Orbit animation via RAF (no state = no re-renders)
  useEffect(() => {
    if (isInserting) return; // Let motion handle the insert animation

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000;
      const angle = startAngle + elapsed * speed;
      const x = Math.cos(angle) * orbitRX;
      const y = Math.sin(angle) * orbitRY;

      if (orbRef.current) {
        orbRef.current.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isInserting, startAngle, speed, orbitRX, orbitRY]);

  return (
    <motion.div
      ref={orbRef}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color.bg,
        boxShadow: `0 0 ${size * 0.8}px ${size * 0.25}px ${color.glow}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 900,
        color: color.label,
        zIndex: 20,
        cursor: 'default',
        willChange: 'transform',
      }}
      // When isInserting, animate to the target (shooting star!)
      animate={isInserting ? {
        x: targetX - orbitRX * Math.cos(startAngle),
        y: targetY - orbitRY * Math.sin(startAngle),
        scale: [1, 1.4, 0.3],
        opacity: [1, 1, 0],
      } : { scale: 1, opacity: 1 }}
      transition={isInserting ? {
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1],
      } : undefined}
      onAnimationComplete={() => {
        if (isInserting) onInserted();
      }}
      // Appear with a bang
      initial={{ scale: 0, opacity: 0 }}
      // Initial appear animation
      whileHover={{ scale: 1.15 }}
    >
      {letter}
      {/* Glow ring */}
      <motion.div
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: '50%',
          border: `1.5px solid ${color.glow}`,
          opacity: 0.4,
        }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
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
  onEarlySolve,
}: OrbitHintSystemProps) {
  const word = card.back.trim();
  const letters = word.split('').filter(c => c !== ' ');
  const totalNonSpace = letters.length;

  const [revealedCount, setRevealedCount] = useState(0);
  const [insertingIndex, setInsertingIndex] = useState<number | null>(null);
  const [orbsVisible, setOrbsVisible] = useState(true);
  const [earlyGuessMode, setEarlyGuessMode] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [guessResult, setGuessResult] = useState<'correct' | 'wrong' | null>(null);
  const [totalXPSpent, setTotalXPSpent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build the display array (chars + space markers)
  const displayChars = word.split('').map((c, i) => ({
    char: c.toUpperCase(),
    isSpace: c === ' ',
    originalIndex: i,
    nonSpaceIndex: word.slice(0, i + 1).replace(/ /g, '').length - 1,
  }));

  // How many letters are currently revealed in the display
  const revealedSet = new Set(
    displayChars
      .filter(d => !d.isSpace && d.nonSpaceIndex < revealedCount)
      .map(d => d.nonSpaceIndex)
  );

  // Reveal next letter (costs XP)
  const revealNextLetter = useCallback(() => {
    if (revealedCount >= totalNonSpace) return;
    const cost = XP_COSTS.HINT_LETTER;
    const success = onSpendXP(cost);
    if (!success) return;

    setTotalXPSpent(prev => prev + cost);
    setInsertingIndex(revealedCount);
  }, [revealedCount, totalNonSpace, onSpendXP]);

  // After orb finishes "flying" into the tile
  const handleOrbInserted = useCallback(() => {
    setRevealedCount(prev => {
      const next = prev + 1;
      if (next >= totalNonSpace) {
        setOrbsVisible(false);
        onRevealComplete();
      }
      return next;
    });
    setInsertingIndex(null);
  }, [totalNonSpace, onRevealComplete]);

  // Auto-reveal: after 2.5s delay, reveal next letter
  useEffect(() => {
    if (revealedCount >= totalNonSpace || insertingIndex !== null || earlyGuessMode) return;
    const timer = setTimeout(revealNextLetter, 2500);
    return () => clearTimeout(timer);
  }, [revealedCount, insertingIndex, earlyGuessMode, revealNextLetter, totalNonSpace]);

  // Early guess submission
  const submitGuess = () => {
    const correct = guessInput.trim().toLowerCase() === word.toLowerCase();
    setGuessResult(correct ? 'correct' : 'wrong');

    if (correct) {
      // XP bonus for early solve (less letters revealed = more bonus)
      const lettersRemaining = totalNonSpace - revealedCount;
      const bonus = Math.floor(XP_REWARDS.EARLY_SOLVE * (lettersRemaining / totalNonSpace));
      onGainXP(bonus);
      onEarlySolve(true, bonus);
      setRevealedCount(totalNonSpace);
      setOrbsVisible(false);
    } else {
      setTimeout(() => {
        setGuessResult(null);
        setGuessInput('');
      }, 1000);
    }
  };

  // Non-space letters as orbs (only unrevealed ones)
  const orbLetters = letters.slice(revealedCount).map((letter, i) => ({
    letter: letter.toUpperCase(),
    orbitIndex: i,
  }));

  const orbitCenterRX = 110;
  const orbitCenterRY = 55;

  const canAfford = xp >= XP_COSTS.HINT_LETTER;

  return (
    <div className="flex flex-col items-center gap-6 w-full">

      {/* ── Question label ── */}
      <div className="text-center">
        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">
          Wie heißt das auf Deutsch?
        </p>
        <h2 className="text-3xl font-black text-white tracking-tight">
          {card.front}
        </h2>
        {card.exampleFront && (
          <p className="text-sm text-white/40 italic mt-1 max-w-xs mx-auto leading-relaxed">
            „{card.exampleFront}"
          </p>
        )}
      </div>

      {/* ── Orbit Arena ── */}
      <div ref={containerRef} className="relative w-full" style={{ height: 200 }}>
        {/* Orbit ring decorations */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-full border border-white/5"
            style={{ width: orbitCenterRX * 2 + 60, height: orbitCenterRY * 2 + 60 }}
          />
          <div
            className="absolute rounded-full border border-white/[0.03]"
            style={{ width: orbitCenterRX * 2 + 100, height: orbitCenterRY * 2 + 100 }}
          />
        </div>

        {/* Fill-in-the-blank word */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-wrap justify-center gap-1.5">
            {displayChars.map((d, i) => (
              <LetterTile
                key={i}
                char={d.char}
                isSpace={d.isSpace}
                isRevealed={!d.isSpace && d.nonSpaceIndex < revealedCount}
                delay={0}
              />
            ))}
          </div>
        </div>

        {/* Orbiting letter orbs */}
        {orbsVisible && orbLetters.map((orb, i) => {
          const angle = (i / Math.max(orbLetters.length, 1)) * Math.PI * 2;
          const speed = 0.4 + (i % 3) * 0.1;
          const isCurrentlyInserting = insertingIndex === revealedCount && i === 0;

          return (
            <motion.div
              key={`orb-${revealedCount + i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.12, type: 'spring', stiffness: 300, damping: 20 }}
            >
              <OrbitOrb
                letter={orb.letter}
                colorIndex={revealedCount + i}
                orbitRX={orbitCenterRX + (i % 2) * 18}
                orbitRY={orbitCenterRY + (i % 3) * 8}
                speed={speed}
                startAngle={angle}
                size={36 - Math.min(i, 4) * 2}
                isInserting={isCurrentlyInserting}
                targetX={0}
                targetY={0}
                onInserted={handleOrbInserted}
              />
            </motion.div>
          );
        })}
      </div>

      {/* ── Early Guess Area ── */}
      <AnimatePresence mode="wait">
        {!earlyGuessMode ? (
          <motion.div
            key="hint-controls"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full space-y-3"
          >
            {/* XP cost info */}
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-white/40">
              <Lightbulb size={12} className="text-amber-400/60" />
              <span>Buchstaben fliegen automatisch ein</span>
              <span className="text-amber-400/70 font-black">−{XP_COSTS.HINT_LETTER} XP/Buchstabe</span>
            </div>

            {/* "Ich kenn's!" button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setEarlyGuessMode(true)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Edit3 size={16} />
              Ich kenn's! <span className="text-amber-400/60 text-xs">(+bis zu {XP_REWARDS.EARLY_SOLVE} XP Bonus)</span>
            </motion.button>

            {/* XP display */}
            <div className="flex items-center justify-center gap-1.5">
              <Zap size={12} className="text-amber-400/60 fill-current" />
              <span className="text-[11px] font-black text-white/50">{xp} XP verfügbar</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="guess-input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full space-y-3"
          >
            <div className="relative">
              <input
                autoFocus
                type="text"
                value={guessInput}
                onChange={e => setGuessInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitGuess()}
                placeholder="Deutsch eingeben..."
                className={`w-full px-5 py-4 rounded-2xl text-center text-lg font-black outline-none transition-all ${
                  guessResult === 'wrong'
                    ? 'bg-red-500/20 border-2 border-red-500/60 text-red-300 animate-shake'
                    : guessResult === 'correct'
                    ? 'bg-emerald-500/20 border-2 border-emerald-500/60 text-emerald-300'
                    : 'bg-white/5 border-2 border-white/10 text-white focus:border-violet-500/60'
                }`}
              />
              {guessResult === 'correct' && (
                <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" size={22} />
              )}
            </div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setEarlyGuessMode(false); setGuessInput(''); setGuessResult(null); }}
                className="flex-1 py-3 rounded-xl text-white/40 font-bold text-xs uppercase tracking-wider bg-white/5"
              >
                Zurück
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={submitGuess}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-700/30"
              >
                Prüfen ✓
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
