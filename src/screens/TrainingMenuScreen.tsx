import React from 'react';
import { motion } from 'motion/react';
import { Brain, Type, Lock, Star } from 'lucide-react';

interface TrainingMenuScreenProps {
  onSelectMode: (mode: 'quiz' | 'cloze') => void;
}

export function TrainingMenuScreen({ onSelectMode }: TrainingMenuScreenProps) {
  return (
    <div className="flex flex-col h-full px-4 pt-6 pb-32 max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black tracking-wider text-white mb-2">TRAINING</h1>
        <p className="text-sm text-white/60">Wähle deine bevorzugte Trainingsmethode aus.</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Wort-Quiz */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectMode('quiz')}
          className="relative overflow-hidden w-full text-left bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-2xl p-5 backdrop-blur-md transition-all shadow-lg"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Brain size={24} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-100">Wort-Quiz</h3>
              <p className="text-xs text-indigo-300/70 uppercase tracking-widest font-mono">Erkennen & Verstehen</p>
            </div>
          </div>
          <p className="text-sm text-indigo-200/80 leading-relaxed mt-3">
            Klassisches Multiple-Choice Training. Wähle die richtige Übersetzung aus 4 Optionen. Perfekt für den Aufbau deines passiven Wortschatzes.
          </p>
        </motion.button>

        {/* Lückentext */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectMode('cloze')}
          className="relative overflow-hidden w-full text-left bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 rounded-2xl p-5 backdrop-blur-md transition-all shadow-lg"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-2 relative z-10">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <Type size={24} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-100 flex items-center gap-2">
                Lückentext
                <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Pro</span>
              </h3>
              <p className="text-xs text-amber-300/70 uppercase tracking-widest font-mono">Aktiver Wortschatz</p>
            </div>
          </div>
          <p className="text-sm text-amber-200/80 leading-relaxed mt-3 relative z-10">
            Tippe die gesuchten Vokabeln in den echten englischen Satz-Kontext ein. Ultimative Herausforderung für fließendes Englisch!
          </p>
        </motion.button>

        {/* Platzhalter für künftige Modi */}
        <div className="relative overflow-hidden w-full text-left bg-white/[0.02] border border-white/5 rounded-2xl p-5 backdrop-blur-md opacity-60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <Star size={24} className="text-white/20" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white/40">Hörverstehen</h3>
                <p className="text-xs text-white/20 uppercase tracking-widest font-mono">In Entwicklung</p>
              </div>
            </div>
            <Lock size={20} className="text-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
