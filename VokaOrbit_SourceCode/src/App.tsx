import { useState, useEffect } from 'react';
import { useSettings } from './hooks/useSettings';
import { LearnScreen } from './screens/LearnScreen';
import { QuizScreen } from './screens/QuizScreen';
import { DeckScreen } from './screens/DeckScreen';
import { LaunchScreen } from './screens/LaunchScreen';
import { CardManagementScreen } from './screens/CardManagementScreen';
import { StatsScreen } from './screens/StatsScreen';
import { XPBar, LevelUpOverlay } from './components/XPBar';
import { Rocket, LayoutGrid, BarChart3, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Screen = 'decks' | 'launch' | 'learn' | 'quiz' | 'stats' | 'manage';

export default function App() {
  const { settings, levelData } = useSettings();
  const [screen, setScreen] = useState<Screen>('decks');
  const [activeDeckId, setActiveDeckId] = useState<number | null>(null);
  const [manageDeckId, setManageDeckId] = useState<number | null>(null);
  const [isGlobalReview, setIsGlobalReview] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(levelData.level);

  // Detect level-up
  useEffect(() => {
    if (levelData.level > prevLevel) {
      setShowLevelUp(true);
      setPrevLevel(levelData.level);
    }
  }, [levelData.level, prevLevel]);

  const goHome = () => {
    setScreen('decks');
    setActiveDeckId(null);
    setIsGlobalReview(false);
    setManageDeckId(null);
  };

  const startDeck = (id: number) => {
    setActiveDeckId(id);
    setIsGlobalReview(false);
    setScreen('learn');
  };

  const startGlobalReview = () => {
    setActiveDeckId(null);
    setIsGlobalReview(true);
    setScreen('launch');
  };

  const isLearning = screen === 'learn' || screen === 'launch';

  return (
    <div className="orbit-dark min-h-screen w-full overflow-x-hidden">
      {/* Level Up Overlay */}
      <AnimatePresence>
        {showLevelUp && (
          <LevelUpOverlay
            level={levelData.level}
            onDone={() => setShowLevelUp(false)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-28 relative min-h-screen flex flex-col safe-top">

        {/* ── HEADER ── */}
        <header className="flex justify-between items-center mb-4 shrink-0 px-2">
          <div className="flex items-center gap-3">
            <motion.div
              whileTap={{ scale: 0.9, rotate: -15 }}
              onClick={goHome}
              className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-700/40 cursor-pointer"
            >
              <Rocket className="text-white w-5 h-5" />
            </motion.div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white leading-none">
                VokaOrbit
              </h1>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">
                Vocabulary in Space
              </p>
            </div>
          </div>
        </header>

        {/* ── XP BAR (hidden while learning) ── */}
        <AnimatePresence>
          {!isLearning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-5 px-2"
            >
              <XPBar xp={settings.xp} streak={settings.streak} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1">
          <AnimatePresence mode="wait">

            {screen === 'manage' && manageDeckId ? (
              <motion.div key="manage"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              >
                <CardManagementScreen
                  deckId={manageDeckId}
                  onBack={goHome}
                />
              </motion.div>

            ) : screen === 'stats' ? (
              <motion.div key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <StatsScreen />
              </motion.div>

            ) : screen === 'quiz' ? (
              <motion.div key="quiz"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <QuizScreen onClose={goHome} />
              </motion.div>

            ) : screen === 'launch' ? (
              <motion.div key="launch"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <LaunchScreen onStart={() => setScreen('learn')} />
              </motion.div>

            ) : screen === 'learn' ? (
              <motion.div key="learn"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <LearnScreen
                  deckId={isGlobalReview ? undefined : activeDeckId!}
                  onBack={goHome}
                />
              </motion.div>

            ) : (
              <motion.div key="decks"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                <DeckScreen
                  onSelectDeck={startDeck}
                  onManageCards={(id) => { setManageDeckId(id); setScreen('manage'); }}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ── BOTTOM NAV (hidden while learning) ── */}
      <AnimatePresence>
        {!isLearning && (
          <motion.nav
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bottom-nav"
          >
            <div className="flex items-center gap-1 bg-white/5 backdrop-blur-2xl px-4 py-3 rounded-[28px] shadow-2xl border border-white/10">

              <NavButton
                icon={<LayoutGrid size={20} />}
                label="Orbit"
                active={screen === 'decks'}
                onClick={goHome}
              />
              <NavDivider />
              <NavButton
                icon={<Rocket size={20} />}
                label="Launch"
                active={screen === 'launch'}
                onClick={startGlobalReview}
              />
              <NavDivider />
              <NavButton
                icon={<Brain size={20} />}
                label="Quiz"
                active={screen === 'quiz'}
                onClick={() => setScreen('quiz')}
              />
              <NavDivider />
              <NavButton
                icon={<BarChart3 size={20} />}
                label="Stats"
                active={screen === 'stats'}
                onClick={() => setScreen('stats')}
              />

            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Small helpers ── */
function NavButton({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-1 rounded-2xl transition-all ${
        active ? 'text-violet-400' : 'text-white/30 hover:text-white/60'
      }`}
    >
      {icon}
      <span className="text-[8px] font-black uppercase tracking-[0.15em]">{label}</span>
    </motion.button>
  );
}

function NavDivider() {
  return <div className="w-px h-5 bg-white/10 mx-1" />;
}
