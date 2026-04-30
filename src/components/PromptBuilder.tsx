import { useState } from 'react';
import { Copy, Sparkles } from 'lucide-react';

export function PromptBuilder() {
  const [topic, setTopic] = useState('');
  const [copied, setCopied] = useState(false);

  const promptTemplate = `Erzeuge mir eine Liste von Vokabeln im folgenden Format (KEIN JSON, nur Text):

Jede Zeile:
Fremdsprache;Deutsch;Beispielsatz Fremdsprache;Beispielsatz Deutsch

Beispiel:
airport;Flughafen;I arrived at the airport early.;Ich kam früh am Flughafen an.
delay;Verspätung;The flight had a long delay.;Der Flug hatte eine lange Verspätung.

Erzeuge 20 Vokabeln zu folgendem Thema: ${topic || '[THEMA HIER]'}.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(promptTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-orbit-card p-6 border border-white/20 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-orbit-cyan w-5 h-5" />
        <h3 className="text-xs font-bold tracking-[0.12em] uppercase text-orbit-cyan">
          KI-Vokabel-Prompt
        </h3>
      </div>
      
      <p className="text-sm text-slate-400 mb-4">
        Gib ein Thema ein und kopiere den Prompt für eine KI (z.B. Gemini), um passende Vokabeln zu erhalten.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Thema
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="z.B. Im Hotel, Am Flughafen..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orbit-purple transition-all"
          />
        </div>

        <div className="relative">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Prompt Vorschau
          </label>
          <div className="bg-slate-900/80 rounded-xl p-4 text-xs font-mono text-slate-300 whitespace-pre-wrap border border-slate-800 max-h-40 overflow-y-auto">
            {promptTemplate}
          </div>
          <button
            onClick={handleCopy}
            className="absolute top-8 right-2 p-2 bg-orbit-purple hover:bg-orbit-indigo text-white rounded-lg transition-colors shadow-lg flex items-center gap-2 text-[10px] font-bold uppercase"
          >
            {copied ? 'Kopiert!' : <><Copy size={14} /> Kopieren</>}
          </button>
        </div>
      </div>
    </div>
  );
}
