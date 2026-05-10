import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { UserProfile } from '../hooks/useSettings';

/* ── Konstanten ─────────────────────────────────────────────────────────────── */
export const AVATARS = ['🪐', '🚀', '⭐', '🛰️', '☄️', '👨‍🚀'] as const;

function randomDefaultProfile(): UserProfile {
  return {
    callsign: `Orbit-${Math.floor(Math.random() * 900) + 100}`,
    avatarId: Math.floor(Math.random() * AVATARS.length),
    createdAt: Date.now(),
    isDefault: true,
  };
}

/* ── Props ──────────────────────────────────────────────────────────────────── */
interface ProfileSetupModalProps {
  isOpen: boolean;
  mode: 'setup' | 'edit';          // setup = erstes Mal, edit = nachträglich ändern
  initialProfile?: UserProfile;
  onComplete: (profile: UserProfile) => void;
  onDismiss?: () => void;          // nur im setup-Mode: Überspringen
}

/* ── Komponente ─────────────────────────────────────────────────────────────── */
export function ProfileSetupModal({
  isOpen,
  mode,
  initialProfile,
  onComplete,
  onDismiss,
}: ProfileSetupModalProps) {
  const [callsign, setCallsign] = useState(
    initialProfile?.isDefault ? '' : (initialProfile?.callsign ?? '')
  );
  const [avatarId, setAvatarId] = useState(initialProfile?.avatarId ?? 0);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const name = callsign.trim() || (mode === 'edit' ? (initialProfile?.callsign ?? 'Orbit') : '');
    if (!name && mode === 'edit') return; // In Edit-Mode muss ein Name vorhanden sein
    onComplete({
      callsign: name || randomDefaultProfile().callsign,
      avatarId,
      createdAt: initialProfile?.createdAt ?? Date.now(),
      isDefault: false,
    });
  };

  const handleSkip = () => {
    const def = randomDefaultProfile();
    def.avatarId = avatarId; // behalte den gewählten Avatar auch beim Überspringen
    onComplete(def);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="profile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm"
            onClick={mode === 'setup' ? handleSkip : undefined}
          />

          {/* Modal Card */}
          <motion.div
            key="profile-modal"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-x-4 bottom-28 z-[71] max-w-md mx-auto glass-card p-7 space-y-6"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="space-y-1">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-[0.22em]">
                {mode === 'setup' ? '✦ Initialisierung' : '✦ Profil bearbeiten'}
              </p>
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                {mode === 'setup' ? 'Dein Callsign,\nPilot.' : 'Callsign & Avatar'}
              </h2>
              {mode === 'setup' && (
                <p className="text-xs text-white/40 leading-relaxed pt-0.5">
                  Wähle einen Avatar und gib deinen Namen ein — oder überspringe diesen Schritt.
                </p>
              )}
            </div>

            {/* Avatar-Grid */}
            <div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">
                Avatar wählen
              </p>
              <div className="flex gap-2 justify-between">
                {AVATARS.map((emoji, idx) => (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setAvatarId(idx)}
                    className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center transition-all
                      ${avatarId === idx
                        ? 'bg-violet-600/80 ring-2 ring-violet-400 shadow-lg shadow-violet-700/30'
                        : 'bg-white/6 hover:bg-white/12'
                      }`}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">
                Dein Callsign
              </p>
              <input
                autoFocus={mode === 'edit'}
                value={callsign}
                onChange={e => setCallsign(e.target.value.slice(0, 20))}
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                placeholder={mode === 'setup' ? 'z.B. Felix, Nova, Cosmo…' : 'Callsign eingeben'}
                maxLength={20}
                className="w-full bg-white/6 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/25 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 outline-none text-sm font-semibold transition-all"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              {mode === 'setup' && (
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3.5 rounded-2xl text-white/35 font-bold text-xs uppercase tracking-wider bg-white/4 hover:bg-white/8 transition-all"
                >
                  Überspringen
                </button>
              )}
              {mode === 'edit' && (
                <button
                  onClick={onDismiss}
                  className="flex-1 py-3.5 rounded-2xl text-white/35 font-bold text-xs uppercase tracking-wider bg-white/4 hover:bg-white/8 transition-all"
                >
                  Abbrechen
                </button>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleConfirm}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-700/30"
              >
                {mode === 'setup' ? 'Mission starten' : 'Speichern'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
