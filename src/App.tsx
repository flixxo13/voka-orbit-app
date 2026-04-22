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

// IMPORT DER NEUEN EFFEKTE
import { CelestialEffects } from './components/CelestialEffects';

type Screen = 'decks' | 'launch' | 'learn' | 'quiz' | 'stats' | 'manage';

export default function App() {
  const { settings, levelData } = useSettings();
  const [screen, setScreen] = useState<Screen>('decks');
  const [activeDeckId, setActiveDeckId] = useState<number | null>(null);
  const [manageDeckId, setManageDeckId] = useState<number | null>(null);
  const [isGlobalReview, setIsGlobalReview] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(levelData.level);

  // Level-Up Erkennung
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

  const isLearning = screen === 'learn' || screen === 'launch' || screen === 'manage';

  return (
    <div className="orbit-dark min-h-screen w-full overflow-x-hidden relative">
      
      {/* ── LAYER 1: WELTRAUM-EFFEKTE ── 
          Liegt absolut im Hintergrund, z-index wird in der Komponente gesteuert */}
      <CelestialEffects />

      {/* ── LAYER 2: OVERLAYS ── */}
      <AnimatePresence>
        {showLevelUp && (
          <LevelUpOverlay
            level={levelData.level}
            onDone={() => setShowLevelUp(false)}
          />
        )}
      </AnimatePresence>

      {/* ── LAYER 3: HAUPT-UI ── 
          relative z-10 stellt sicher, dass Klicks und Texte ÜBER den Effekten liegen */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-28 relative z-10 min-h-screen flex flex-col safe-top">

        {/* Header */}
        <AnimatePresence>
          {!isLearning && (
            <motion.header
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22 }}
              className="flex justify-between items-center mb-4 shrink-0 px-2 pt-2"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  whileTap={{ scale: 0.9, rotate: -15 }}
                  onClick={goHome}
                  className="cursor-pointer shrink-0"
                >
                  <svg width="42" height="42" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient id="hbg" cx="35%" cy="25%">
                        <stop offset="0%" stopColor="#7C3AED"/>
                        <stop offset="100%" stopColor="#4C1D95"/>
                      </radialGradient>
                      <radialGradient id="hpl" cx="30%" cy="25%">
                        <stop offset="0%" stopColor="#DDD6FE"/>
                        <stop offset="100%" stopColor="#8B5CF6"/>
                      </radialGradient>
                    </defs>
                    <rect width="40" height="40" rx="11" fill="url(#hbg)"/>
                    <ellipse cx="20" cy="21" rx="14" ry="6.5"
                      stroke="rgba(196,181,253,0.65)" strokeWidth="1.5"
                      transform="rotate(-20 20 21)" fill="none"/>
                    <circle cx="20" cy="19" r="6" fill="url(#hpl)"/>
                  </svg>
                </motion.div>
                <div>
                  <h1 className="text-xl font-black tracking-tighter text-white leading-none">VokaOrbit</h1>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.18em] mt-0.5">Lerne · Orbit · Meistere</p>
                </div>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* XP Bar */}
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

        {/* Main Content Area */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            {screen === 'manage' && manageDeckId ? (
              <motion.div key="manage" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
                <CardManagementScreen deckId={manageDeckId} onBack={goHome} />
              </motion.div>
            ) : screen === 'stats' ? (
              <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }}>
                <StatsScreen />
              </motion.div>
            ) : screen === 'quiz' ? (
              <motion.div key="quiz" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25 }}>
                <QuizScreen onClose={goHome} />
              </motion.div>
            ) : screen === 'launch' ? (
              <motion.div key="launch" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25 }}>
                <LaunchScreen onStart={() => setScreen('learn')} />
              </motion.div>
            ) : screen === 'learn' ? (
              <motion.div key="learn" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                <LearnScreen deckId={isGlobalReview ? undefined : activeDeckId!} onBack={goHome} />
              </motion.div>
            ) : (
              <motion.div key="decks" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
                <DeckScreen onSelectDeck={startDeck} onManageCards={(id) => { setManageDeckId(id); setScreen('manage'); }} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ── BOTTOM NAV ── */}
      <AnimatePresence>
        {!isLearning && (
          <motion.nav
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bottom-nav"
          >
            <div className="flex items-center justify-around w-full max-w-2xl mx-auto px-2 py-2">
              <NavButton icon={<LayoutGrid size={22} />} label="Orbit" active={screen === 'decks'} onClick={goHome} />
              <NavDivider />
              <NavButton icon={<Rocket size={22} />} label="Launch" active={screen === 'launch'} onClick={startGlobalReview} />
              <NavDivider />
              <NavButton icon={<Brain size={22} />} label="Quiz" active={screen === 'quiz'} onClick={() => setScreen('quiz')} />
              <NavDivider />
              <NavButton icon={<BarChart3 size={22} />} label="Stats" active={screen === 'stats'} onClick={() => setScreen('stats')} />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Helpers ── */
function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; }) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all duration-200 ${
        active ? 'text-violet-400' : 'text-white/40 hover:text-white/60'
      }`}
    >
      {active && (
        <motion.div
          layoutId="nav-active-dot"
          className="absolute -top-1 w-5 h-[3px] rounded-full bg-violet-500 shadow-[0_0_10px_rgba(124,58,237,0.8)]"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-[0.12em]">{label}</span>
    </motion.button>
  );
}

function NavDivider() { return <div className="w-px h-6 bg-white/8 mx-0.5" />; }
