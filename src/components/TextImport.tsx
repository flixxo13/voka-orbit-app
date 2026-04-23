import { useState } from 'react';
import { db } from '../core/storage-local';
import { CheckCircle, AlertCircle, Trash2, FileText } from 'lucide-react';

interface ParsedVocab {
  foreign: string;
  native: string;
  exampleForeign: string;
  exampleNative: string;
  line: number;
}

export function TextImport({ deckId, onImportSuccess }: { deckId: number, onImportSuccess: () => void }) {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<ParsedVocab[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const parseVocabText = (input: string): { data: ParsedVocab[], errors: string[] } => {
    const lines = input.split('\n');
    const data: ParsedVocab[] = [];
    const errs: string[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      const parts = trimmedLine.split(';');
      if (parts.length !== 4) {
        errs.push(`Zeile ${index + 1}: Ungültiges Format (erwartet 4 Felder, gefunden ${parts.length})`);
      } else {
        data.push({
          foreign: parts[0].trim(),
          native: parts[1].trim(),
          exampleForeign: parts[2].trim(),
          exampleNative: parts[3].trim(),
          line: index + 1
        });
      }
    });

    return { data, errors: errs };
  };

  const handleCheck = () => {
    const { data, errors } = parseVocabText(text);
    setPreview(data);
    setErrors(errors);
    setSuccess(null);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    try {
      const cardsToInsert = preview.map(v => ({
        deckId,
        front: v.foreign,
        back: v.native,
        exampleFront: v.exampleForeign,
        exampleBack: v.exampleNative,
        createdAt: Date.now()
      }));

      await db.cards.bulkAdd(cardsToInsert);
      setSuccess(`${preview.length} Vokabeln erfolgreich angelegt!`);
      setText('');
      setPreview([]);
      onImportSuccess();
    } catch (err) {
      setErrors(['Fehler beim Speichern in der Datenbank.']);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-orbit-card p-6 border border-white/20 shadow-xl space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="text-orbit-purple w-5 h-5" />
        <h3 className="text-xs font-bold tracking-[0.12em] uppercase text-white">
          Vokabeln importieren
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Text-Liste einfügen
          </label>
          <p className="text-[10px] text-slate-400 mb-2">
            Format: Fremdsprache;Deutsch;Beispielsatz Fremd;Beispielsatz Deutsch
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="airport;Flughafen;I arrived at the airport early.;Ich kam früh am Flughafen an."
            className="w-full h-40 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orbit-purple transition-all resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCheck}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all uppercase text-xs tracking-wider"
          >
            Prüfen
          </button>
          <button
            onClick={() => { setText(''); setPreview([]); setErrors([]); }}
            className="p-3 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-xl transition-all"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-1">
            {errors.map((err, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-red-400">
                <AlertCircle size={14} /> {err}
              </div>
            ))}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-2 text-xs text-green-400">
            <CheckCircle size={14} /> {success}
          </div>
        )}

        {preview.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Vorschau ({preview.length} Karten)
              </h4>
              <button
                onClick={handleImport}
                className="bg-orbit-purple hover:bg-orbit-indigo text-white font-bold px-6 py-2 rounded-full transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-orbit-purple/20"
              >
                Jetzt anlegen
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/50">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-400 sticky top-0">
                  <tr>
                    <th className="p-3">Fremd</th>
                    <th className="p-3">Deutsch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {preview.map((v, i) => (
                    <tr key={i} className="text-slate-300">
                      <td className="p-3 font-medium">{v.foreign}</td>
                      <td className="p-3">{v.native}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
