import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, CheckCircle2, XCircle, ArrowRight, Trophy, RefreshCcw, ArrowLeft, Zap, ChevronUp, ChevronDown } from 'lucide-react';
import { useQuizSession } from '../hooks/useQuizSession';
import { useSettings } from '../hooks/useSettings';

interface QuizScreenProps {
  deckId?: number;
  onClose: () => void;
}

export function QuizScreen({ deckId, onClose }: QuizScreenProps) {
  const { settings, gainXP, spendXP, incrementStreak } = useSettings();
  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    isLoading,
    isFinished,
    submitAnswer,
    nextQuestion,
    restart
  } = useQuizSession(deckId);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [quizHistory, setQuizHistory] = useState<{ word: string, correct: boolean, xpDelta: number }[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!isFinished && currentIndex === 0) {
      setQuizHistory([]);
      setShowDetails(false);
    }
  }, [isFinished, currentIndex]);

  const handleOptionClick = (option: string) => {
    if (selectedOption !== null) return;

    const correct = option === currentQuestion.card.back;
    setSelectedOption(option);
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      gainXP(1);
      incrementStreak();
      setQuizHistory(prev => [...prev, { word: currentQuestion.card.front, correct: true, xpDelta: 1 }]);
    } else {
      spendXP(1);
      setQuizHistory(prev => [...prev, { word: currentQuestion.card.front, correct: false, xpDelta: -1 }]);
    }
    
    // Submit the review immediately but don't move forward
    submitAnswer(correct ? 3 : 1);
  };

  const handleNext = () => {
    nextQuestion();
    setSelectedOption(null);
    setIsCorrect(null);
    setShowResult(false);
    setShowExample(false);
  };

  // Animation variants
  const shakeVariants = {
    shake: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.4 }
    }
  };

  const glowVariants = {
    correct: {
      boxShadow: [
        "0 0 0px rgba(34, 197, 94, 0)",
        "0 0 20px rgba(34, 197, 94, 0.6)",
        "0 0 0px rgba(34, 197, 94, 0)"
      ],
      transition: { duration: 0.6, repeat: 1 }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Brain className="w-12 h-12 text-indigo-500" />
        </motion.div>
        <p className="text-gray-500 font-medium">Lade Quiz-Session...</p>
      </div>
    );
  }

  if (isFinished || totalQuestions === 0) {
    const correctCount = quizHistory.filter(h => h.correct).length;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-6 px-4"
      >
        <div className="relative flex items-center justify-center">
          {/* Orbit-Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute w-32 h-32 rounded-full border border-amber-400/25"
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.6)] relative z-10 border border-amber-300/50"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
        </div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-black text-white mb-2"
        >
          {totalQuestions === 0 ? "Alles erledigt!" : "Quiz-Meister!"}
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/50 text-sm max-w-xs leading-relaxed"
        >
          {totalQuestions === 0 
            ? "Keine Vokabeln im aktuellen Deck." 
            : "Schneller Check bestanden! Dein Gedächtnis ist aktiv. Nutze den Lernmodus für tiefen, dauerhaften Fortschritt. 🏆"}
        </motion.p>

        {totalQuestions > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card p-4 w-full max-w-xs"
          >
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xl font-black text-emerald-400">{correctCount}/{totalQuestions}</div>
                <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold">Richtig</div>
              </div>
              <div>
                <div className="text-xl font-black text-amber-400">{settings.streak}</div>
                <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold">Streak 🔥</div>
              </div>
              <div>
                <div className="text-xl font-black text-violet-400">{settings.xp}</div>
                <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold">XP ⚡</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Stats Details Accordion ── */}
        {totalQuestions > 0 && quizHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="w-full max-w-xs"
          >
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-center gap-1.5 w-full py-2 text-[10px] font-bold text-white/40 hover:text-white/60 uppercase tracking-widest transition-colors"
            >
              Bilanz Details
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass-card mt-2 p-3 flex flex-col gap-2 max-h-[30vh] overflow-y-auto rounded-2xl text-left border border-white/10 custom-scrollbar">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2 mb-1">
                      <span>{correctCount} Richtig • {totalQuestions - correctCount} Falsch</span>
                      <span>Bilanz</span>
                    </div>
                    {quizHistory.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                        <span className="font-bold text-white/80 truncate pr-2">{item.word}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
                            item.correct ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {item.correct ? 'Richtig' : 'Falsch'}
                          </span>
                          <span className={`text-xs font-black w-8 text-right ${item.xpDelta > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                            {item.xpDelta > 0 ? '+' : ''}{item.xpDelta}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <div className="flex flex-col w-full gap-3 max-w-xs">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            whileTap={{ scale: 0.96 }}
            onClick={restart}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black rounded-full shadow-[0_0_20px_rgba(124,58,237,0.4)] uppercase tracking-wider text-sm hover:scale-[0.98] transition-transform"
          >
            Neue Runde
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            whileTap={{ scale: 0.96 }}
            onClick={onClose}
            className="w-full py-4 bg-white/[0.04] backdrop-blur-[20px] border border-white/10 text-white/60 font-black rounded-full uppercase tracking-wider text-sm hover:bg-white/10 transition-colors"
          >
            Dashboard
          </motion.button>
        </div>
      </motion.div>
    );
  }

  const progress = ((currentIndex) / totalQuestions) * 100;
  
  // Check if options are long to decide grid layout
  const hasLongOptions = currentQuestion.options.some(opt => opt.length > 20);

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-4 py-2 select-none">
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center text-white/60"
        >
          <ArrowLeft size={20} />
        </motion.button>

        {/* Progress */}
        <div className="flex-1 glass-card px-4 py-2.5 flex items-center justify-between">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-wider">
            {currentIndex + 1} / {totalQuestions}
          </span>
          <div className="flex-1 mx-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <Zap size={12} className="fill-current" />
            <span className="text-[11px] font-black">{settings.xp}</span>
          </div>
        </div>
      </div>

      {/* Main Card Area */}
      <div className="flex-1 flex flex-col justify-center relative py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.card.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 100 }}
            drag={showResult ? "x" : false}
            dragConstraints={{ left: 0, right: 100 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 50) handleNext();
            }}
            className="w-full"
          >
            <motion.div 
              variants={isCorrect === false ? shakeVariants : glowVariants}
              animate={isCorrect === false ? "shake" : (isCorrect === true ? "correct" : "")}
              className={`relative rounded-[28px] p-6 sm:p-10 shadow-2xl transition-all duration-500 border flex flex-col items-center justify-center text-center min-h-[260px] overflow-hidden ${
                showResult 
                  ? (isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-pink-500/10 border-pink-500/30')
                  : 'bg-white/[0.04] backdrop-blur-[20px] border-white/[0.08]'
              }`}
            >
              {/* Decorative Background Element */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />

              <div className="flex flex-col items-center gap-1.5 mb-4">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] block ${
                  showResult ? (isCorrect ? 'text-emerald-400' : 'text-pink-400') : 'text-violet-400'
                }`}>
                  {showResult ? (isCorrect ? 'Exzellent!' : 'Fast richtig!') : 'Vokabel-Orbit'}
                </span>
                {showResult && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    isCorrect ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                  }`}>
                    {isCorrect ? '+1 XP' : '-1 XP'}
                  </span>
                )}
              </div>
              
              <h1 className={`font-black text-white break-words w-full leading-tight ${
                currentQuestion.card.front.length > 15 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'
              }`}>
                {currentQuestion.card.front}
              </h1>

              {showResult && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 pt-6 border-t border-white/10 w-full"
                >
                  <div className="text-[10px] font-bold text-white/30 mb-1 uppercase tracking-widest">Bedeutung</div>
                  <div className={`font-black text-violet-400 ${
                    currentQuestion.card.back.length > 15 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
                  }`}>
                    {currentQuestion.card.back}
                  </div>
                </motion.div>
              )}

              {!showResult && currentQuestion.card.exampleFront && (
                <div className="mt-6 flex justify-center w-full">
                  {!showExample ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowExample(true); }}
                      className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white/40 hover:text-white/60 uppercase tracking-widest transition-all"
                    >
                      Beispielsatz anzeigen
                    </button>
                  ) : (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-white/40 italic text-sm sm:text-base max-w-xs px-4"
                    >
                      "{currentQuestion.card.exampleFront}"
                    </motion.p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Options Grid */}
      <div className={`mt-4 grid gap-3 ${
        hasLongOptions ? 'grid-cols-1' : 'grid-cols-2'
      }`}>
        {currentQuestion.options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isCorrectOption = option === currentQuestion.card.back;
          const isLastItem = idx === currentQuestion.options.length - 1;
          const isThirdOfThree = currentQuestion.options.length === 3 && isLastItem;
          
          let buttonClass = "relative group overflow-hidden w-full p-4 sm:p-6 rounded-3xl text-center font-bold transition-all border-2 flex flex-col items-center justify-center min-h-[80px] sm:min-h-[100px] shadow-sm ";
          
          if (isThirdOfThree && !hasLongOptions) {
            buttonClass += " col-span-2 max-w-[80%] mx-auto ";
          }

          if (selectedOption === null) {
            buttonClass += "bg-white/[0.04] backdrop-blur-[10px] border-white/10 text-white hover:bg-white/10 hover:border-violet-400/50 active:scale-95";
          } else if (isSelected) {
            buttonClass += isCorrect 
              ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
              : "bg-pink-500/20 border-pink-400/50 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.2)]";
          } else if (isCorrectOption) {
            buttonClass += "bg-emerald-500/10 border-emerald-400/30 text-emerald-400/70";
          } else {
            buttonClass += "bg-white/5 border-transparent text-white/30 opacity-40 scale-[0.98]";
          }

          return (
            <motion.button
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileTap={selectedOption === null ? { scale: 0.95 } : {}}
              onClick={() => handleOptionClick(option)}
              disabled={selectedOption !== null}
              className={buttonClass}
            >
              <span className="text-base sm:text-lg leading-tight">{option}</span>
              {selectedOption !== null && isCorrectOption && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </motion.div>
              )}
              {isSelected && !isCorrect && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2">
                  <XCircle className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Footer / Interaction Hint */}
      <div className="h-20 flex items-center justify-center mt-2">
        {showResult ? (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleNext}
            className="group flex items-center justify-center gap-3 w-full py-4 bg-violet-600 text-white rounded-full font-black text-lg shadow-[0_0_20px_rgba(124,58,237,0.4)] active:scale-95 transition-all border border-violet-400/30"
          >
            Nächste Karte
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <p className="text-white/30 text-[11px] font-black uppercase tracking-widest">
              Wähle die Lösung
            </p>
            <div className="flex gap-1 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400/30 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400/60 animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400/90 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Swipe Hint (Only when result shown) */}
      {showResult && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-gray-400 dark:text-gray-600 font-medium -mt-4"
        >
          Tipp: Swipe nach rechts für die nächste Karte
        </motion.div>
      )}
    </div>
  );
}
