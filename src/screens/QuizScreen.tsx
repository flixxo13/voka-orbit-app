import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, CheckCircle2, XCircle, ArrowRight, Trophy, RefreshCcw, ArrowLeft, Zap } from 'lucide-react';
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

  const handleOptionClick = (option: string) => {
    if (selectedOption !== null) return;

    const correct = option === currentQuestion.card.back;
    setSelectedOption(option);
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      gainXP(1);
      incrementStreak();
    } else {
      spendXP(1);
    }
    
    // Submit the review immediately but don't move forward
    submitAnswer(correct ? 3 : 1);
  };

  const handleNext = () => {
    nextQuestion();
    setSelectedOption(null);
    setIsCorrect(null);
    setShowResult(false);
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
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-[70vh] text-center px-6"
      >
        <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Trophy className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          {totalQuestions === 0 ? "Alles erledigt!" : "Quiz-Meister!"}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xs">
          {totalQuestions === 0 
            ? "Du hast aktuell keine fälligen Quiz-Karten. Ruh dich aus!"
            : "Hervorragende Leistung! Dein Vokabel-Orbit wächst weiter."}
        </p>
        <div className="flex flex-col w-full gap-4 max-w-sm">
          <button
            onClick={restart}
            className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-transform"
          >
            <RefreshCcw className="w-5 h-5" />
            Neue Runde
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold active:scale-95 transition-transform"
          >
            Dashboard
          </button>
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
                <p className="mt-4 text-gray-400 dark:text-gray-500 italic text-base sm:text-lg max-w-xs">
                  "{currentQuestion.card.exampleFront}"
                </p>
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
