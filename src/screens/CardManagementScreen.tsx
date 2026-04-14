import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Card } from '../core/storage-local';
import { useState } from 'react';
import { ArrowLeft, Trash2, Edit2, X, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function CardManagementScreen({ deckId, onBack }: { deckId: number, onBack: () => void }) {
  const deck = useLiveQuery(() => db.decks.get(deckId), [deckId]);
  const cards = useLiveQuery(async () => {
    const cardList = await db.cards.where('deckId').equals(deckId).toArray();
    const cardIds = cardList.map(c => c.id).filter((id): id is number => id !== undefined);
    const reviews = await db.reviews.where('cardId').anyOf(cardIds).toArray();
    
    return cardList.map(card => ({
      ...card,
      review: reviews.find(r => r.cardId === card.id)
    }));
  }, [deckId]);
  
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [editExFront, setEditExFront] = useState('');
  const [editExBack, setEditExBack] = useState('');

  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newExFront, setNewExFront] = useState('');
  const [newExBack, setNewExBack] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const handleDeleteCard = async (id: number) => {
    if (confirm('Diese Karte wirklich löschen?')) {
      await db.cards.delete(id);
      await db.reviews.where('cardId').equals(id).delete();
    }
  };

  const handleStartEdit = (card: Card) => {
    setEditingCard(card);
    setEditFront(card.front);
    setEditBack(card.back);
    setEditExFront(card.exampleFront || '');
    setEditExBack(card.exampleBack || '');
  };

  const handleSaveEdit = async () => {
    if (!editingCard || !editFront || !editBack) return;
    
    await db.cards.update(editingCard.id!, {
      front: editFront,
      back: editBack,
      exampleFront: editExFront,
      exampleBack: editExBack
    });
    
    setEditingCard(null);
  };

  const handleAddCard = async () => {
    if (!newFront || !newBack) return;
    
    await db.cards.add({
      deckId,
      front: newFront,
      back: newBack,
      exampleFront: newExFront,
      exampleBack: newExBack,
      createdAt: Date.now()
    });
    
    setNewFront('');
    setNewBack('');
    setNewExFront('');
    setNewExBack('');
    setShowAddModal(false);
  };

  return (
    <div className="bg-transparent p-6 pb-32 relative">
      {/* Subtle background glow to match the video vibe */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orbit-purple/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orbit-cyan/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-2xl mx-auto space-y-12 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <motion.button 
              whileHover={{ scale: 1.1, x: -5 }}
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="p-3 bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl text-slate-600 dark:text-slate-400 hover:text-orbit-purple transition-colors border border-white/10"
            >
              <ArrowLeft size={24} />
            </motion.button>
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-serif italic text-slate-800 dark:text-white tracking-tight"
              >
                {deck?.name || 'Deck'}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1"
              >
                {cards?.length || 0} Karten verwalten
              </motion.p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAddModal(true)}
            className="p-4 bg-orbit-purple text-white rounded-2xl shadow-2xl shadow-orbit-purple/40 hover:bg-orbit-indigo transition-all border border-white/20 flex"
          >
            <Plus size={28} />
          </motion.button>
        </div>

        <motion.div 
          className="space-y-6"
        >
          {cards?.map((card, index) => (
            <motion.div 
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ 
                y: -8,
                scale: 1.02,
                transition: { type: "spring", stiffness: 400, damping: 10 }
              }}
              className="glass-card p-8 flex items-center justify-between group relative overflow-hidden"
            >
              {/* Floating Animation Wrapper for the whole card content */}
              <motion.div
                className="flex flex-1 items-center justify-between w-full"
                animate={{
                  y: [0, -6, 0],
                  rotateZ: [0, index % 2 === 0 ? 0.5 : -0.5, 0],
                }}
                transition={{
                  duration: 5 + (index % 4),
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.1
                }}
              >
                {/* Subtle lens flare effect on hover */}
                <motion.div 
                  className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none z-0"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '200%' }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                
                <div className="flex-1 min-w-0 pr-8 relative z-10">
                <div className="mb-6">
                  <span className="text-[10px] font-black text-orbit-purple uppercase tracking-[0.4em] block mb-2 opacity-40">Vorderseite</span>
                  <p className="text-2xl font-bold text-white leading-tight break-words tracking-tight font-sans">{card.front}</p>
                </div>
                <div className="mb-6">
                  <span className="text-[10px] font-black text-orbit-cyan uppercase tracking-[0.4em] block mb-2 opacity-40">Rückseite</span>
                  <p className="text-lg text-slate-600 dark:text-slate-300 leading-tight break-words font-medium opacity-80">{card.back}</p>
                </div>
                {card.review ? (
                  <div className="flex gap-8 pt-6 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-50">Intervall</span>
                      <span className="text-xs font-bold text-slate-400">{card.review.interval.toFixed(1)}d</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-50">Ease</span>
                      <span className="text-xs font-bold text-slate-400">{card.review.ease.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-50">Fällig</span>
                      <div className="flex flex-col">
                        {card.review.nextDueAt < todayMs ? (
                          <span className="text-xs font-bold text-red-400/80">Heute</span>
                        ) : (
                          <span className={`text-xs font-bold ${card.review.nextDueAt <= Date.now() ? 'text-emerald-400/80' : 'text-slate-400/80'}`}>
                            {new Date(card.review.nextDueAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-6 border-t border-white/5">
                    <span className="px-3 py-1 bg-orbit-purple/10 text-orbit-purple text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-orbit-purple/20">New Orbit</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center gap-2 shrink-0 relative z-10">
                <motion.button 
                  whileHover={{ scale: 1.2, color: '#06B6D4' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleStartEdit(card)}
                  className="p-3 text-slate-500 transition-colors bg-white/5 rounded-xl border border-white/5"
                >
                  <Edit2 size={20} />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.2, color: '#EF4444' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDeleteCard(card.id!)}
                  className="p-3 text-slate-500 transition-colors bg-white/5 rounded-xl border border-white/5"
                >
                  <Trash2 size={20} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        ))}

          {cards?.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 glass-card border-dashed border-white/10"
            >
              <p className="text-slate-500 text-sm font-medium">Keine Karten in diesem Deck.</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Floating Action Button (FAB) – sits above the global bottom nav */}
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[95]"
      >
        <motion.button 
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-3 px-7 py-3.5 bg-violet-600/90 backdrop-blur-2xl text-white rounded-full shadow-2xl shadow-violet-900/60 border border-violet-400/20 font-black uppercase tracking-[0.15em] text-[10px]"
        >
          <Plus size={16} />
          Vokabel hinzufügen
        </motion.button>
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingCard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingCard(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Vokabel bearbeiten</h3>
                <button onClick={() => setEditingCard(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Vorderseite (Fremdsprache)</label>
                    <input 
                      type="text" 
                      value={editFront}
                      onChange={(e) => setEditFront(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-orbit-purple rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-bold outline-none transition-all"
                      placeholder="z.B. airport"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Rückseite (Deutsch)</label>
                    <input 
                      type="text" 
                      value={editBack}
                      onChange={(e) => setEditBack(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-orbit-cyan rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-bold outline-none transition-all"
                      placeholder="z.B. Flughafen"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Beispielsatz (Optional)</h4>
                  <div>
                    <input 
                      type="text" 
                      value={editExFront}
                      onChange={(e) => setEditExFront(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-orbit-purple/50 rounded-2xl px-5 py-3 text-sm text-slate-800 dark:text-white outline-none transition-all mb-2"
                      placeholder="Satz in Fremdsprache"
                    />
                    <input 
                      type="text" 
                      value={editExBack}
                      onChange={(e) => setEditExBack(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-orbit-cyan/50 rounded-2xl px-5 py-3 text-sm text-slate-800 dark:text-white outline-none transition-all"
                      placeholder="Satz auf Deutsch"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSaveEdit}
                  disabled={!editFront || !editBack}
                  className="w-full bg-orbit-purple hover:bg-orbit-indigo disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl shadow-xl shadow-orbit-purple/20 transition-all uppercase tracking-[0.2em] mt-4"
                >
                  Speichern
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Neue Vokabel</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Vorderseite (Fremdsprache)</label>
                    <input 
                      type="text" 
                      value={newFront}
                      onChange={(e) => setNewFront(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-orbit-purple rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-bold outline-none transition-all"
                      placeholder="z.B. airport"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Rückseite (Deutsch)</label>
                    <input 
                      type="text" 
                      value={newBack}
                      onChange={(e) => setNewBack(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-orbit-cyan rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-bold outline-none transition-all"
                      placeholder="z.B. Flughafen"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Beispielsatz (Optional)</h4>
                  <div>
                    <input 
                      type="text" 
                      value={newExFront}
                      onChange={(e) => setNewExFront(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-orbit-purple/50 rounded-2xl px-5 py-3 text-sm text-slate-800 dark:text-white outline-none transition-all mb-2"
                      placeholder="Satz in Fremdsprache"
                    />
                    <input 
                      type="text" 
                      value={newExBack}
                      onChange={(e) => setNewExBack(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-orbit-cyan/50 rounded-2xl px-5 py-3 text-sm text-slate-800 dark:text-white outline-none transition-all"
                      placeholder="Satz auf Deutsch"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAddCard}
                  disabled={!newFront || !newBack}
                  className="w-full bg-orbit-purple hover:bg-orbit-indigo disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl shadow-xl shadow-orbit-purple/20 transition-all uppercase tracking-[0.2em] mt-4"
                >
                  Hinzufügen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
