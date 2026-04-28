import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../core/storage-local';
import { useState } from 'react';
import { Plus, Book, Trash2, Edit2, X, List, Power, PowerOff, Import, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PromptBuilder } from '../components/PromptBuilder';
import { TextImport } from '../components/TextImport';
import { useGlobalStats } from '../hooks/useStats';

/* ── Planet color slots ── */
const PLANET_THEMES = [
  { gradient: 'from-violet-500 to-purple-700',  glow: 'shadow-violet-600/40',  ring: 'border-violet-500/30', badge: 'bg-violet-500/20 text-violet-300' },
  { gradient: 'from-cyan-400 to-teal-600',       glow: 'shadow-cyan-500/40',    ring: 'border-cyan-500/30',   badge: 'bg-cyan-500/20 text-cyan-300' },
  { gradient: 'from-pink-500 to-rose-700',       glow: 'shadow-pink-600/40',    ring: 'border-pink-500/30',   badge: 'bg-pink-500/20 text-pink-300' },
  { gradient: 'from-amber-400 to-orange-600',    glow: 'shadow-amber-500/40',   ring: 'border-amber-500/30',  badge: 'bg-amber-500/20 text-amber-300' },
  { gradient: 'from-blue-400 to-indigo-600',     glow: 'shadow-blue-500/40',    ring: 'border-blue-500/30',   badge: 'bg-blue-500/20 text-blue-300' },
  { gradient: 'from-lime-400 to-emerald-600',    glow: 'shadow-emerald-500/40', ring: 'border-emerald-500/30',badge: 'bg-emerald-500/20 text-emerald-300' },
] as const;

export function DeckScreen({ onSelectDeck, onManageCards, requireProfile }: {
  onSelectDeck: (id: number) => void;
  onManageCards: (id: number) => void;
  requireProfile: (action: () => void) => void;
}) {
  const decks = useLiveQuery(() => db.decks.toArray());
  const stats = useGlobalStats();

  const [activeTab, setActiveTab] = useState<'list' | 'import'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<{ id: number; name: string; language: string } | null>(null);
  const [showAddCardModal, setShowAddCardModal] = useState<number | null>(null);
  const [selectedDeckForImport, setSelectedDeckForImport] = useState<number | null>(null);

  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckLang, setNewDeckLang] = useState('Englisch');
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [newCardExFront, setNewCardExFront] = useState('');
  const [newCardExBack, setNewCardExBack] = useState('');

  const handleAddDeck = async () => {
    if (!newDeckName.trim()) return;
    const id = await db.decks.add({
      name: newDeckName.trim(),
      language: newDeckLang.trim() || 'Englisch',
      createdAt: Date.now(),
      isActive: true,
    });
    if (activeTab === 'import') setSelectedDeckForImport(id as number);
    setNewDeckName('');
    setShowAddModal(false);
  };

  const handleEditDeck = async () => {
    if (!showEditModal || !showEditModal.name.trim()) return;
    await db.decks.update(showEditModal.id, { name: showEditModal.name, language: showEditModal.language });
    setShowEditModal(null);
  };

  const handleAddSingleCard = async () => {
    if (!showAddCardModal || !newCardFront.trim() || !newCardBack.trim()) return;
    await db.cards.add({
      deckId: showAddCardModal,
      front: newCardFront.trim(),
      back: newCardBack.trim(),
      exampleFront: newCardExFront.trim() || undefined,
      exampleBack: newCardExBack.trim() || undefined,
      createdAt: Date.now(),
    });
    setNewCardFront(''); setNewCardBack(''); setNewCardExFront(''); setNewCardExBack('');
    setShowAddCardModal(null);
  };

  const handleToggleActive = async (id: number, current: boolean) => {
    await db.decks.update(id, { isActive: !current });
  };

  const handleDeleteDeck = async (id: number, name: string) => {
    if (!window.confirm(`Deck „${name}" und alle Karten wirklich löschen?`)) return;
    await db.decks.delete(id);
    await db.cards.where('deckId').equals(id).delete();
    await db.reviews.where('cardId').anyOf(
      (await db.cards.where('deckId').equals(id).toArray()).map(c => c.id!)
    ).delete();
  };

  return (
    <div className="space-y-6 pb-4">

      {/* ── Global Stats Banner ── */}
      {stats && stats.totalCards > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Aktiv', value: stats.activeDecksCount, color: 'text-violet-400' },
            { label: 'Fällig', value: stats.totalDue, color: 'text-amber-400' },
            { label: 'Gelernt', value: stats.totalReviewed, color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="glass-card p-3.5 flex flex-col items-center text-center">
              <span className={`text-xl font-black ${s.color} leading-none`}>{s.value}</span>
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab bar ── */}
      <div className="flex bg-white/5 p-1 rounded-2xl">
        <TabBtn label="Decks" icon={<LayoutGrid size={14} />} active={activeTab === 'list'} onClick={() => setActiveTab('list')} />
        <TabBtn label="Import" icon={<Import size={14} />} active={activeTab === 'import'} onClick={() => setActiveTab('import')} />
      </div>

      {/* ═══════ DECKS TAB ═══════ */}
      {activeTab === 'list' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Dein Orbit</h2>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => requireProfile(() => setShowAddModal(true))}
              className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-700/30"
            >
              <Plus size={20} className="text-white" />
            </motion.button>
          </div>

          <div className="space-y-3">
            {decks?.map((deck, i) => (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <PlanetDeckCard
                  deck={deck}
                  themeIndex={i % PLANET_THEMES.length}
                  onClick={() => deck.isActive !== false && onSelectDeck(deck.id!)}
                  onDelete={() => handleDeleteDeck(deck.id!, deck.name)}
                  onEdit={() => setShowEditModal({ id: deck.id!, name: deck.name, language: deck.language })}
                  onAddCard={() => setShowAddCardModal(deck.id!)}
                  onManageCards={() => onManageCards(deck.id!)}
                  onToggleActive={() => handleToggleActive(deck.id!, deck.isActive !== false)}
                />
              </motion.div>
            ))}

            {decks?.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-10 flex flex-col items-center text-center gap-4 border border-dashed border-white/10"
              >
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 5 }}
                  className="text-5xl"
                >
                  🪐
                </motion.div>
                <div>
                  <h3 className="text-lg font-black text-white/60 uppercase tracking-tight mb-1">
                    Dein Orbit ist leer
                  </h3>
                  <p className="text-white/30 text-xs max-w-[200px] leading-relaxed">
                    Erstelle dein erstes Deck und starte deine Reise durchs Vokabel-Universum.
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => requireProfile(() => setShowAddModal(true))}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-violet-700/30"
                >
                  Erstes Deck erstellen
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ IMPORT TAB ═══════ */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <PromptBuilder />
          <div className="space-y-3">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">
              Ziel-Deck wählen
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => requireProfile(() => setShowAddModal(true))}
                className="flex-shrink-0 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider border-2 border-dashed border-violet-500/40 text-violet-400 hover:bg-violet-500/10 transition-all"
              >
                + Neues Deck
              </motion.button>
              {decks?.map(deck => (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  key={deck.id}
                  onClick={() => setSelectedDeckForImport(deck.id!)}
                  className={`flex-shrink-0 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all ${
                    selectedDeckForImport === deck.id
                      ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-700/30'
                      : 'bg-white/5 text-white/50 border-white/10'
                  }`}
                >
                  {deck.name}
                </motion.button>
              ))}
            </div>
            {selectedDeckForImport ? (
              <TextImport deckId={selectedDeckForImport} onImportSuccess={() => setActiveTab('list')} />
            ) : (
              <div className="glass-card p-8 text-center text-white/30 text-sm italic">
                Wähle oben ein Deck aus.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <DeckModal
        show={showAddModal}
        title="Neues Deck"
        name={newDeckName}
        language={newDeckLang}
        onChangeName={setNewDeckName}
        onChangeLang={setNewDeckLang}
        onConfirm={handleAddDeck}
        onCancel={() => setShowAddModal(false)}
        confirmLabel="Erstellen"
      />
      {showEditModal && (
        <DeckModal
          show
          title="Deck bearbeiten"
          name={showEditModal.name}
          language={showEditModal.language}
          onChangeName={n => setShowEditModal(m => m ? { ...m, name: n } : m)}
          onChangeLang={l => setShowEditModal(m => m ? { ...m, language: l } : m)}
          onConfirm={handleEditDeck}
          onCancel={() => setShowEditModal(null)}
          confirmLabel="Speichern"
        />
      )}
      {showAddCardModal && (
        <AddCardModal
          onConfirm={handleAddSingleCard}
          onCancel={() => setShowAddCardModal(null)}
          front={newCardFront} onFront={setNewCardFront}
          back={newCardBack} onBack={setNewCardBack}
          exFront={newCardExFront} onExFront={setNewCardExFront}
          exBack={newCardExBack} onExBack={setNewCardExBack}
        />
      )}
    </div>
  );
}

/* ── Planet Deck Card ── */
function PlanetDeckCard({ deck, themeIndex, onClick, onDelete, onEdit, onAddCard, onManageCards, onToggleActive }: {
  deck: any; themeIndex: number;
  onClick: () => void; onDelete: () => void; onEdit: () => void;
  onAddCard: () => void; onManageCards: () => void; onToggleActive: () => void;
}) {
  const theme = PLANET_THEMES[themeIndex];
  const cardCount = useLiveQuery(() => db.cards.where('deckId').equals(deck.id).count(), [deck.id]);
  
  // Fällige Karten
  const dueCount = useLiveQuery(async () => {
    const now = Date.now();
    const reviews = await db.reviews.where('nextDueAt').belowOrEqual(now).toArray();
    const ids = reviews.map(r => r.cardId);
    return db.cards.where('id').anyOf(ids).and(c => c.deckId === deck.id).count();
  }, [deck.id]);

  // Gelernte Karten (Karten mit Review, die in der Zukunft liegen)
  const learnedCount = useLiveQuery(async () => {
    const now = Date.now();
    const reviews = await db.reviews.where('nextDueAt').above(now).toArray();
    const ids = reviews.map(r => r.cardId);
    return db.cards.where('id').anyOf(ids).and(c => c.deckId === deck.id).count();
  }, [deck.id]);

  const total = cardCount ?? 0;
  const due = dueCount ?? 0;
  const learned = learnedCount ?? 0;
  const isActive = deck.isActive !== false;
  const pct = total > 0 ? Math.round(((total - due) / total) * 100) : 0;
  const circumference = 2 * Math.PI * 22;

  const firstLetter = deck.name ? deck.name.charAt(0).toUpperCase() : '?';

  return (
    <motion.div
      whileHover={isActive ? { y: -3, scale: 1.01 } : {}}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass-card p-4 flex flex-col gap-4 cursor-pointer transition-opacity ${!isActive ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-4">
        {/* Planet with progress ring */}
        <div className="relative shrink-0 w-16 h-16">
          {/* SVG progress ring with orbit animation */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 animate-orbit-slow" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <motion.circle
              cx="28" cy="28" r="22" fill="none"
              stroke={isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
              transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            />
          </svg>
          
          {/* Planet globe with float and initial letter */}
          <div className={`absolute inset-2 rounded-full bg-gradient-to-br ${theme.gradient} shadow-lg ${theme.glow} flex items-center justify-center animate-planet-float`}>
            <span className="text-white/90 font-black text-2xl tracking-tight leading-none pt-0.5">
              {firstLetter}
            </span>
          </div>

          {/* Gamified Due Badge over the planet */}
          {due > 0 && isActive && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute -top-1 -right-2 px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-xl border-2 border-[#0A0A2E] z-10 ${theme.badge}`}
            >
              <span className="text-[9px] font-black uppercase tracking-wider whitespace-nowrap">{due} fällig</span>
            </motion.div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-white text-base truncate tracking-tight">{deck.name}</h3>
          <div className="flex flex-col mt-0.5">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-wider">{deck.language}</span>
            <span className="text-[10px] font-bold text-white/30 truncate mt-0.5">{total} Karten • {learned} gelernt</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t border-white/5 pt-3 flex justify-between items-center" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <IconBtn icon={<Plus size={15} />} color="text-white/40" onClick={onAddCard} title="Vokabel hinzufügen" />
          <IconBtn icon={<List size={15} />} color="text-white/40" onClick={onManageCards} title="Karten verwalten" />
        </div>
        <div className="flex items-center gap-1">
          <IconBtn icon={<Edit2 size={15} />} color="text-white/40" onClick={onEdit} title="Bearbeiten" />
          <IconBtn icon={<Trash2 size={15} />} color="text-red-400/60 hover:text-red-400" onClick={onDelete} title="Löschen" />
          <div className="w-px h-4 bg-white/10 mx-1" />
          <IconBtn icon={isActive ? <Power size={15} /> : <PowerOff size={15} />} color={isActive ? 'text-emerald-400' : 'text-white/30'} onClick={onToggleActive} title={isActive ? 'Deaktivieren' : 'Aktivieren'} />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Helpers ── */
function IconBtn({ icon, color, onClick, title }: { icon: React.ReactNode; color: string; onClick: () => void; title: string }) {
  return (
    <motion.button whileTap={{ scale: 0.85 }} onClick={onClick} title={title}
      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5 ${color}`}>
      {icon}
    </motion.button>
  );
}

function TabBtn({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${active ? 'bg-white/10 text-white' : 'text-white/30'}`}>
      {icon}{label}
    </button>
  );
}

/* ── Modals ── */
function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pt-4 pb-28 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="glass-card w-full max-w-md p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </div>
  );
}

function DeckModal({ show, title, name, language, onChangeName, onChangeLang, onConfirm, onCancel, confirmLabel }: {
  show: boolean; title: string; name: string; language: string;
  onChangeName: (v: string) => void; onChangeLang: (v: string) => void;
  onConfirm: () => void; onCancel: () => void; confirmLabel: string;
}) {
  if (!show) return null;
  return (
    <ModalOverlay>
      <h3 className="text-xl font-black text-white uppercase tracking-tight">{title}</h3>
      <input autoFocus value={name} onChange={e => onChangeName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onConfirm()}
        placeholder="z.B. Englisch Grundwortschatz"
        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/20 focus:border-violet-500/60 outline-none text-sm"
      />
      <input value={language} onChange={e => onChangeLang(e.target.value)}
        placeholder="Sprache"
        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/20 focus:border-violet-500/60 outline-none text-sm"
      />
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 py-3.5 rounded-2xl text-white/40 font-bold text-xs uppercase tracking-wider bg-white/5">Abbrechen</button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={onConfirm}
          className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-700/30">
          {confirmLabel}
        </motion.button>
      </div>
    </ModalOverlay>
  );
}

function AddCardModal({ onConfirm, onCancel, front, onFront, back, onBack, exFront, onExFront, exBack, onExBack }: {
  onConfirm: () => void; onCancel: () => void;
  front: string; onFront: (v: string) => void;
  back: string; onBack: (v: string) => void;
  exFront: string; onExFront: (v: string) => void;
  exBack: string; onExBack: (v: string) => void;
}) {
  return (
    <ModalOverlay>
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-white uppercase tracking-tight">Neue Vokabel</h3>
        <button onClick={onCancel} className="text-white/40"><X size={20} /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input autoFocus value={front} onChange={e => onFront(e.target.value)} placeholder="Englisch"
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm placeholder-white/20 focus:border-violet-500/60 outline-none" />
        <input value={back} onChange={e => onBack(e.target.value)} placeholder="Deutsch"
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm placeholder-white/20 focus:border-violet-500/60 outline-none" />
      </div>
      <textarea value={exFront} onChange={e => onExFront(e.target.value)} placeholder="Beispielsatz (Englisch) – optional"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm placeholder-white/20 focus:border-violet-500/60 outline-none resize-none h-16" />
      <textarea value={exBack} onChange={e => onExBack(e.target.value)} placeholder="Beispielsatz (Deutsch) – optional"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm placeholder-white/20 focus:border-violet-500/60 outline-none resize-none h-16" />
      <motion.button whileTap={{ scale: 0.95 }} onClick={onConfirm}
        className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-violet-700/30">
        Hinzufügen
      </motion.button>
    </ModalOverlay>
  );
}
