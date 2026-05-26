import { useState, useEffect, useCallback } from 'react';

/* ============================================================
   TYPES
   ============================================================ */
export interface XPGain {
  amount: number;
  reason: string;
}

export interface UserProfile {
  callsign: string;   // z.B. "Felix", "Orbit-247"
  avatarId: number;   // 0–5 (6 Preset-Avatare)
  createdAt: number;
  isDefault: boolean; // true = wurde weggeklickt
}

interface Settings {
  theme: 'dark' | 'light';
  dailyGoal: number;
  streak: number;
  lastReviewDate: string | null;
  xp: number;
  level: number;
  totalCardsLearned: number;
  hintsUsedToday: number;
  lastHintResetDate: string | null;
  profile: UserProfile | null;
  soundEnabled: boolean;
}

/* ============================================================
   XP CONSTANTS
   ============================================================ */
export const XP_REWARDS = {
  CARD_CORRECT: 10,
  CARD_NO_HINT: 20,       // Bonus for no hints used
  CARD_EASY: 5,           // Extra for "Leicht"
  EARLY_SOLVE: 15,        // Bonus for solving with < 3 hints (deprecated)
  DAILY_STREAK_BONUS: 10,
  CARD_AGAIN: 0,
  HINT_CORRECT_LETTER: 1, // Reward per correct letter
  HINT_STREAK_BONUS: 1,   // Extra bonus starting from 2nd consecutive correct
  HINT_COMPLETION_BONUS: 1, // Bonus for fully completing the hint
} as const;

export const XP_COSTS = {
  HINT_ENTRY: 3,          // Cost to enter hint mode
  HINT_LETTER: 3,         // (deprecated)
  HINT_WRONG_LETTER: 1,   // Cost per wrong guess
  HINT_ESCALATION: 2,     // Escalated cost for 3+ consecutive wrong guesses
  HINT_EXAMPLE_SENTENCE: 2, // Cost to reveal the example sentence
  HINT_FULL_REVEAL: 15,   // (deprecated)
} as const;

export function getRevealCost(remainingLetters: number): number {
  return Math.max(5, remainingLetters);
}

/** XP needed to reach a given level (simple formula: level * 120) */
export function xpForLevel(level: number): number {
  return level * 120;
}

/** Total XP accumulated to reach the START of a level */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

/** Get current level data from raw total XP */
export function getLevelData(totalXp: number) {
  const safeXp = Math.max(0, totalXp);
  let level = 1;
  let accumulated = 0;
  while (true) {
    const needed = xpForLevel(level);
    if (accumulated + needed > safeXp) {
      return {
        level,
        xpIntoLevel: safeXp - accumulated,
        xpNeededForLevel: needed,
        progressPercent: Math.floor(((safeXp - accumulated) / needed) * 100),
      };
    }
    accumulated += needed;
    level++;
    if (level > 999) break;
  }
  return { level: 999, xpIntoLevel: 0, xpNeededForLevel: 1, progressPercent: 100 };
}

/* ============================================================
   DEFAULT STATE
   ============================================================ */
const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  dailyGoal: 15,
  streak: 0,
  lastReviewDate: null,
  xp: 0,
  level: 1,
  totalCardsLearned: 0,
  hintsUsedToday: 0,
  lastHintResetDate: null,
  profile: null,
  soundEnabled: true,
};

const STORAGE_KEY = 'vokaorbit_settings_v2';

/* ============================================================
   HOOK
   ============================================================ */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults for forward-compatibility
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  // Persist to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Request persistent storage on first mount
  useEffect(() => {
    if (navigator.storage?.persist) {
      navigator.storage.persist().then((granted) => {
        if (!granted) console.warn('[VokaOrbit] Persistent storage not granted');
      });
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  /* ----------------------------------------------------------
     STREAK
     ---------------------------------------------------------- */
  const incrementStreak = useCallback(() => {
    setSettings(prev => {
      const today = new Date().toISOString().split('T')[0];
      if (prev.lastReviewDate === today) return prev; // Already counted today

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const newStreak =
        prev.lastReviewDate === yesterdayStr
          ? prev.streak + 1
          : 1; // Reset or start

      return {
        ...prev,
        streak: newStreak,
        lastReviewDate: today,
        // Bonus XP for streak
        xp: prev.xp + XP_REWARDS.DAILY_STREAK_BONUS,
      };
    });
  }, []);

  /* ----------------------------------------------------------
     XP SYSTEM
     ---------------------------------------------------------- */
  const gainXP = useCallback((amount: number): boolean => {
    let leveledUp = false;
    setSettings(prev => {
      const newXP = prev.xp + amount;
      const oldLevel = getLevelData(prev.xp).level;
      const newLevel = getLevelData(newXP).level;
      leveledUp = newLevel > oldLevel;
      return { ...prev, xp: newXP, level: newLevel };
    });
    return leveledUp;
  }, []);

  const spendXP = useCallback((amount: number): boolean => {
    let success = false;
    setSettings(prev => {
      if (prev.xp < amount) return prev; // Not enough XP
      success = true;
      return { ...prev, xp: prev.xp - amount };
    });
    return success;
  }, []);

  const canAffordHint = useCallback((lettersToReveal = 1): boolean => {
    return settings.xp >= XP_COSTS.HINT_LETTER * lettersToReveal;
  }, [settings.xp]);

  /* ----------------------------------------------------------
     TOTAL CARDS LEARNED
     ---------------------------------------------------------- */
  const recordCardLearned = useCallback(() => {
    setSettings(prev => ({ ...prev, totalCardsLearned: prev.totalCardsLearned + 1 }));
  }, []);

  const setTheme = useCallback((t: 'dark' | 'light') => {
    updateSettings({ theme: t });
  }, [updateSettings]);

  const setProfile = useCallback((p: UserProfile) => {
    updateSettings({ profile: p });
  }, [updateSettings]);

  const toggleSound = useCallback(() => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  }, [settings.soundEnabled, updateSettings]);

  return {
    settings,
    updateSettings,
    setTheme,
    setProfile,
    toggleSound,
    hasProfile: settings.profile !== null,
    incrementStreak,
    gainXP,
    spendXP,
    canAffordHint,
    recordCardLearned,
    levelData: getLevelData(settings.xp),
  };
}
