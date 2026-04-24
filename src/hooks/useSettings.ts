import { useState, useEffect, useCallback } from 'react';

/* ============================================================
   TYPES
   ============================================================ */
export interface XPGain {
  amount: number;
  reason: string;
}

interface Settings {
  theme: 'dark' | 'light';
  dailyGoal: number;
  streak: number;
  lastReviewDate: string | null;
  // XP System
  xp: number;
  level: number;
  totalCardsLearned: number;
  hintsUsedToday: number;
  lastHintResetDate: string | null;
}

/* ============================================================
   XP CONSTANTS
   ============================================================ */
export const XP_REWARDS = {
  CARD_CORRECT: 10,
  CARD_NO_HINT: 20,       // Bonus for no hints used
  CARD_EASY: 5,           // Extra for "Leicht"
  EARLY_SOLVE: 15,        // Bonus for solving with < 3 hints
  DAILY_STREAK_BONUS: 10,
  CARD_AGAIN: 0,
} as const;

export const XP_COSTS = {
  HINT_LETTER: 3,         // Cost per revealed letter
  HINT_FULL_REVEAL: 15,   // Cost to reveal entire word
} as const;

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
  let level = 1;
  let accumulated = 0;
  while (true) {
    const needed = xpForLevel(level);
    if (accumulated + needed > totalXp) {
      return {
        level,
        xpIntoLevel: totalXp - accumulated,
        xpNeededForLevel: needed,
        progressPercent: Math.floor(((totalXp - accumulated) / needed) * 100),
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
    const today = new Date().toISOString().split('T')[0];
    if (settings.lastReviewDate === today) return; // Already counted today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const newStreak =
      settings.lastReviewDate === yesterdayStr
        ? settings.streak + 1
        : 1; // Reset or start

    updateSettings({
      streak: newStreak,
      lastReviewDate: today,
      // Bonus XP for streak
      xp: settings.xp + XP_REWARDS.DAILY_STREAK_BONUS,
    });
  }, [settings, updateSettings]);

  /* ----------------------------------------------------------
     XP SYSTEM
     ---------------------------------------------------------- */
  const gainXP = useCallback((amount: number): boolean => {
    const newXP = settings.xp + amount;
    const oldLevel = getLevelData(settings.xp).level;
    const newLevel = getLevelData(newXP).level;
    const leveledUp = newLevel > oldLevel;
    updateSettings({ xp: newXP, level: newLevel });
    return leveledUp;
  }, [settings.xp, updateSettings]);

  const spendXP = useCallback((amount: number): boolean => {
    if (settings.xp < amount) return false; // Not enough XP
    updateSettings({ xp: settings.xp - amount });
    return true;
  }, [settings.xp, updateSettings]);

  const canAffordHint = useCallback((lettersToReveal = 1): boolean => {
    return settings.xp >= XP_COSTS.HINT_LETTER * lettersToReveal;
  }, [settings.xp]);

  /* ----------------------------------------------------------
     TOTAL CARDS LEARNED
     ---------------------------------------------------------- */
  const recordCardLearned = useCallback(() => {
    updateSettings({ totalCardsLearned: settings.totalCardsLearned + 1 });
  }, [settings.totalCardsLearned, updateSettings]);

  const setTheme = useCallback((t: 'dark' | 'light') => {
    updateSettings({ theme: t });
  }, [updateSettings]);

  return {
    settings,
    updateSettings,
    setTheme,
    incrementStreak,
    gainXP,
    spendXP,
    canAffordHint,
    recordCardLearned,
    levelData: getLevelData(settings.xp),
  };
}
