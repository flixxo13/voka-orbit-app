import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Lightbulb, Check, X } from 'lucide-react';
import { useClozeSession } from '../hooks/useClozeSession';
import { LogoAnimation } from '../components/LogoAnimation';

interface ClozeScreenProps {
  onClose: () => void;
}

export function ClozeScreen({ onClose }: ClozeScreenProps) {
  const {
    currentBatch,
    batchOffset,
    inputs,
    solved,
    hadError,
    showTranslation,
    showHints,
    setShowHints,
    randomizedHintPool,
    handleTyping,
    toggleTranslation,
    isLoading,
    isFinished,
    restart
  } = useClozeSession();

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleFocusScroll = (index: number) => {
    const el = rowRefs.current[index];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getInputFeedbackClass = (index: number) => {
    if (solved[index]) {
      return "border-emerald-500/80 bg-emerald-950/20 text-emerald-400";
    }
    if (inputs[index].length === 0) {
      return "border-slate-800 bg-slate-950/90 text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50";
    }
    if (hadError[index]) {
      return "border-rose-500 bg-rose-950/20 text-rose-400"; 
    }
    return "border-amber-500/80 bg-slate-950/40 text-amber-300"; 
  };

  const maskSentence = (sentence: string, word: string) => {
    if (!word) return sentence;
    // Replace the word with underscores (case-insensitive)
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return sentence.replace(regex, '____');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isFinished || currentBatch.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-6 px-4">
        <div className="relative flex items-center justify-center h-32">
          <LogoAnimation scale={0.6} className="absolute" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-wider mb-2 text-glow-amber">LÜCKENTEXT ABGESCHLOSSEN</h2>
          <p className="text-white/60">Super gemacht! Du hast alle Wörter fehlerfrei eingesetzt.</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
          <button
            onClick={restart}
            className="w-full py-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 font-bold text-amber-300 transition-colors"
          >
            NOCHMAL SPIELEN
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-white transition-colors"
          >
            ZURÜCK ZUM MENÜ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative px-2">
      {/* ── Header ── */}
      <header className="flex justify-between items-center mb-6 pt-2">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
        >
          <ArrowLeft size={20} className="text-white/80" />
        </button>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400">
            BATCH {batchOffset + 1}
          </div>
        </div>
      </header>

      {/* ── 3-Satz Container ── */}
      <div className="flex-1 flex flex-col gap-4 pb-32">
        <AnimatePresence mode="popLayout">
          {currentBatch.map((item, index) => {
            const isSolved = solved[index];
            const maskedSentence = maskSentence(item.sentence, item.targetWord);
            // Fallback wenn Regex wegen Sonderzeichen nicht matcht:
            const displaySentence = maskedSentence === item.sentence && item.targetWord 
               ? item.sentence.replace(item.targetWord, '____') 
               : maskedSentence;

            return (
              <motion.div
                key={`${batchOffset}-${item.card.id}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                ref={(el) => { rowRefs.current[index] = el; }}
                className="p-4 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-xl"
              >
                {/* Header (Status & Toggle) */}
                <div className="flex justify-between items-center mb-3">
                  <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase flex items-center gap-1 ${
                    isSolved ? "bg-emerald-500/20 text-emerald-400" : "bg-indigo-500/20 text-indigo-400"
                  }`}>
                    {isSolved ? <Check size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
                    SATZ {index + 1}
                  </div>
                  
                  <button
                    onClick={() => toggleTranslation(index)}
                    className={`text-[10px] font-bold px-2 py-1 rounded transition-colors border ${
                      showTranslation[index] 
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300" 
                        : "bg-white/5 border-white/10 text-white/50 hover:text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {showTranslation[index] ? "🙈 ÜBERSETZUNG" : "👁️ ÜBERSETZUNG"}
                  </button>
                </div>

                {/* Sentence */}
                <p className="text-sm md:text-base text-slate-200 font-medium tracking-wide mb-4 leading-relaxed">
                  {displaySentence}
                </p>

                {/* Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={inputs[index]}
                    disabled={isSolved}
                    onFocus={() => handleFocusScroll(index)}
                    onChange={(e) => handleTyping(index, e.target.value)}
                    placeholder={"• ".repeat(item.targetWord.length)}
                    className={`w-full max-w-[240px] rounded-lg px-4 py-2 text-sm font-mono tracking-widest outline-none border transition-all ${getInputFeedbackClass(index)}`}
                  />
                  {/* Feedback Icon inside input */}
                  {isSolved && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                      <Check size={18} />
                    </div>
                  )}
                  {hadError[index] && !isSolved && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400">
                      <X size={18} />
                    </div>
                  )}
                </div>

                {/* Translation Display */}
                <AnimatePresence>
                  {showTranslation[index] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 text-xs text-slate-400 border-l-2 border-slate-700 pl-3 py-1 bg-white/[0.02] rounded-r">
                        {item.translation}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Hint Pool (Sticky Bottom) ── */}
      <div className="fixed bottom-24 left-0 right-0 px-4 z-40 pointer-events-none">
        <div className="max-w-2xl mx-auto flex flex-col items-center pointer-events-auto">
          {!showHints ? (
            <button
              onClick={() => setShowHints(true)}
              className="flex items-center gap-2 bg-indigo-950/60 hover:bg-indigo-900/80 backdrop-blur-md text-indigo-300 border border-indigo-500/30 px-4 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all shadow-lg"
            >
              <Lightbulb size={14} />
              Hint-Pool öffnen
            </button>
          ) : (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-4 shadow-2xl shadow-black/50"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">Wort-Pool (Zufällig)</span>
                <button onClick={() => setShowHints(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {randomizedHintPool.map((word, i) => {
                  const isSolvedInBatch = currentBatch.some((v, idx) => v.targetWord === word && solved[idx]);
                  return (
                    <span
                      key={i}
                      className={`px-3 py-1.5 rounded-lg text-sm font-mono tracking-wide font-bold border transition-colors ${
                        isSolvedInBatch
                          ? "bg-black/40 border-white/5 text-white/30 line-through"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      }`}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>

    </div>
  );
}
