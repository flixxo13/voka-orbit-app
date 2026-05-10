import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from './hooks/useSettings';
import { LearnScreen } from './screens/LearnScreen';
import { QuizScreen } from './screens/QuizScreen';
import { DeckScreen } from './screens/DeckScreen';
import { LaunchScreen } from './screens/LaunchScreen';
import { CardManagementScreen } from './screens/CardManagementScreen';
import { StatsScreen } from './screens/StatsScreen';
import { XPBar, LevelUpOverlay } from './components/XPBar';
import { ProfileSetupModal, AVATARS } from './components/ProfileSetupModal';
import { Rocket, LayoutGrid, BarChart3, Brain, ShieldCheck, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CelestialEffects, type CelestialMode } from './components/CelestialEffects';
import { Sun, Moon } from 'lucide-react';

type Screen = 'decks' | 'launch' | 'learn' | 'quiz' | 'stats' | 'manage';

export default function App() {
  const { settings, levelData, setTheme, setProfile, hasProfile } = useSettings();
  const theme = settings.theme;
  const [screen, setScreen] = useState<Screen>('decks');
  const [activeDeckId, setActiveDeckId] = useState<number | null>(null);
  const [manageDeckId, setManageDeckId] = useState<number | null>(null);
  const [isGlobalReview, setIsGlobalReview] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(levelData.level);

  // Profil-Modal State
  const [profileModal, setProfileModal] = useState<{ mode: 'setup' | 'edit'; callback?: () => void } | null>(null);

  // requireProfile: prüft ob Profil vorhanden, sonst Modal öffnen und Aktion danach ausführen
  const pendingAction = useRef<(() => void) | null>(null);
  const requireProfile = useCallback((action: () => void) => {
    if (hasProfile) { action(); return; }
    pendingAction.current = action;
    setProfileModal({ mode: 'setup', callback: action });
  }, [hasProfile]);

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
    requireProfile(() => {
      setActiveDeckId(id);
      setIsGlobalReview(false);
      setScreen('learn');
    });
  };

  const startGlobalReview = () => {
    requireProfile(() => {
      setActiveDeckId(null);
      setIsGlobalReview(true);
      setScreen('launch');
    });
  };

  const isLearning = screen === 'learn' || screen === 'launch' || screen === 'manage';

  const celestialMode: CelestialMode =
    screen === 'launch' ? 'epic'
    : screen === 'learn'  ? 'focus'
    : screen === 'quiz'   ? 'active'
    : 'ambient';

  return (
    <div className={`${theme === 'light' ? 'orbit-light' : 'orbit-dark'} min-h-screen w-full overflow-x-hidden relative`}
      style={{ transition: 'background 0.8s ease' }}
    >
      
      {/* ── LAYER 0: NEBEL (fixed, vor Sternen) ── */}
      <NebulaBackground theme={theme} />

      {/* ── LAYER 1: WELTRAUM-EFFEKTE ── */}
      <CelestialEffects mode={celestialMode} theme={theme} testMode={screen === 'decks'} />

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
        {/* Compact Orbit Header */}
        <AnimatePresence>
          {!isLearning && (
            <motion.header
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22 }}
              className="relative flex justify-between items-center mb-6 shrink-0 px-3 py-2 bg-white/[0.04] backdrop-blur-[20px] border border-white/[0.08] rounded-[28px] mx-1 mt-2 shadow-lg shadow-black/20"
            >
              {/* Left: Compact Logo */}
              <motion.div
                whileTap={{ scale: 0.9, rotate: -15 }}
                onClick={goHome}
                className="cursor-pointer shrink-0"
              >
                <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  <rect width="40" height="40" rx="14" fill="url(#hbg)"/>
                  <ellipse cx="20" cy="21" rx="14" ry="6.5" stroke="rgba(196,181,253,0.65)" strokeWidth="1.5" transform="rotate(-20 20 21)" fill="none"/>
                  <circle cx="20" cy="19" r="6" fill="url(#hpl)"/>
                </svg>
              </motion.div>

              {/* Right: Status & Avatar */}
              <div className="flex items-center gap-2.5">
                {/* Offline Indicator */}
                <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20" title="100% lokal & sicher">
                  <ShieldCheck size={14} className="text-emerald-400" />
                </div>
                
                {/* Level & Streak */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <span className="text-[10px] font-black text-violet-400 tracking-wider">LV{levelData.level}</span>
                  {settings.streak > 0 && (
                    <div className="flex items-center gap-1 text-orange-400">
                      <Flame size={12} className="fill-current" />
                      <span className="text-[11px] font-black">{settings.streak}</span>
                    </div>
                  )}
                </div>

                {/* Avatar */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setProfileModal({ mode: 'edit' })}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-lg border border-white/20 ml-0.5 shadow-inner shadow-white/10"
                >
                  {settings.profile ? AVATARS[settings.profile.avatarId] : '🧑‍🚀'}
                </motion.button>
              </div>

              {/* Bottom XP Bar Line */}
              <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,0.8)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelData.progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </motion.header>
          )}
        </AnimatePresence>         )}
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
                <StatsScreen theme={theme} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
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
                <DeckScreen
                  onSelectDeck={startDeck}
                  onManageCards={(id) => { setManageDeckId(id); setScreen('manage'); }}
                  requireProfile={requireProfile}
                />
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
          className={`bottom-nav${theme === 'light' ? ' bottom-nav-light' : ''}`}
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

      {/* ── PROFIL-MODAL ── */}
      <ProfileSetupModal
        isOpen={profileModal !== null}
        mode={profileModal?.mode ?? 'setup'}
        initialProfile={settings.profile ?? undefined}
        onComplete={(profile) => {
          setProfile(profile);
          setProfileModal(null);
          const action = pendingAction.current;
          pendingAction.current = null;
          action?.();
        }}
        onDismiss={() => setProfileModal(null)}
      />
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

/* ── Nebula-Hintergrund (fixed, unter Sternen) ── */
function NebulaBackground({ theme }: { theme: 'dark' | 'light' }) {
  const isLight = theme === 'light';
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>

      {/* Violett/Lavendel — oben-links, driftet rechts-unten */}
      <div style={{
        position: 'absolute',
        width: '145%', height: '75%',
        left: '-55%', top: '-30%',
        background: isLight
          ? 'radial-gradient(ellipse at 60% 50%, rgba(167,139,250,0.14) 0%, rgba(167,139,250,0.04) 40%, rgba(167,139,250,0.01) 70%, transparent 100%)'
          : 'radial-gradient(ellipse at 60% 50%, rgba(124,58,237,0.22) 0%, rgba(124,58,237,0.08) 40%, rgba(124,58,237,0.02) 70%, transparent 100%)',
        filter: 'blur(70px)',
        animation: `${isLight ? 'nebula-light-violet' : 'nebula-violet'} 85s ease-in-out infinite`,
        animationDelay: '0s',
      }} />

      {/* Cyan/Eisblau — unten-rechts, driftet links-oben */}
      <div style={{
        position: 'absolute',
        width: '130%', height: '70%',
        right: '-50%', bottom: '-20%',
        background: isLight
          ? 'radial-gradient(ellipse at 40% 50%, rgba(147,210,255,0.12) 0%, rgba(147,210,255,0.04) 40%, rgba(147,210,255,0.01) 70%, transparent 100%)'
          : 'radial-gradient(ellipse at 40% 50%, rgba(6,182,212,0.18) 0%, rgba(6,182,212,0.06) 40%, rgba(6,182,212,0.01) 70%, transparent 100%)',
        filter: 'blur(70px)',
        animation: `${isLight ? 'nebula-light-cyan' : 'nebula-cyan'} 110s ease-in-out infinite`,
        animationDelay: '-38s',
      }} />

      {/* Pink/Rosé — rechts-mitte, driftet links */}
      <div style={{
        position: 'absolute',
        width: '110%', height: '55%',
        right: '-55%', top: '30%',
        background: isLight
          ? 'radial-gradient(ellipse at 55% 45%, rgba(251,182,206,0.12) 0%, rgba(251,182,206,0.04) 40%, rgba(251,182,206,0.01) 70%, transparent 100%)'
          : 'radial-gradient(ellipse at 55% 45%, rgba(236,72,153,0.16) 0%, rgba(236,72,153,0.05) 40%, rgba(236,72,153,0.01) 70%, transparent 100%)',
        filter: 'blur(70px)',
        animation: `${isLight ? 'nebula-light-pink' : 'nebula-pink'} 140s ease-in-out infinite`,
        animationDelay: '-65s',
      }} />

    </div>
  );
}

