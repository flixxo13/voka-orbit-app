import { Rocket, Download, Play, Info, FileCode } from 'lucide-react';
import { motion } from 'motion/react';

interface LaunchScreenProps {
  onStart: () => void;
}

export function LaunchScreen({ onStart }: LaunchScreenProps) {
  const downloadHintDocs = () => {
    const content = `VokaOrbit - Cognitive Enhancer & Hint-System Dokumentation

1. PHILOSOPHIE: LERNEN STATT SPIELEN
VokaOrbit ist kein kompetitives Spiel, sondern ein kognitiver Verstärker. Das Hint-System ist darauf ausgelegt, die Erinnerung sanft zu aktivieren ("Active Recall"), ohne Frust durch Bestrafung zu erzeugen.
- Kein Zeitdruck.
- Keine harten Penalties (kein Zurückwerfen von Buchstaben).
- Fokus auf Verständnis und Struktur.

2. SMART HINTS (INTELLIGENTE ENTHÜLLUNG)
Die Hints folgen einer pädagogischen Logik:
- Hint 1 (Orientierung): Zeigt Start- und Endbuchstaben.
- Hint 2 (Struktur): Enthüllt Vokale und markante Konsonanten.
- Hint 3 (Fast gelöst): Füllt das Wort zu ca. 70% auf.

3. CONFIDENCE-BASED HINTING
Vor dem ersten Hint fragt das System: "Wie sicher bist du?"
- Unsicher (😬): Das System gibt großzügigere Hints.
- Mittel (🙂): Standard-Hint-Logik.
- Sicher (😎): Minimale Hilfe, um den eigenen Recall maximal zu fordern.

4. THINKING ASSISTANCE (VISUELLE FÜHRUNG)
- Ghost Path: Beim Antippen eines Buchstabens zeigt eine subtile Linie die Richtung zu seinem Slot.
- Slot Echo: Der nächste gesuchte Slot pulsiert sanft, um die Struktur ohne Worte zu erklären.
- Probe Click: Ein langer Tap auf einen Buchstaben zeigt kurz seine Zielposition als Vorschau (Ghost Preview).

5. FEHLERLOGIK: GUIDANCE STATT PUNISHMENT
- Phase 1 (Hint-Modus): Falscher Klick -> Roter Glow + Hinweis "Kommt später!".
- Phase 2 (Vervollständigung): Falscher Buchstabe -> Buchstabe "klebt" kurz am falschen Ort und gleitet dann sanft zurück. Der richtige Slot pulsiert stärker.

6. MEMORY ENCODING (DER ABSCHLUSS)
Nach der Fertigstellung eines Wortes:
- Completion Moment: Das Wort erscheint groß, Buchstaben verbinden sich mit einem Glow-Effekt.
- Bedeutung: Die Übersetzung wird direkt unter dem Wort eingeblendet.
- Active Recall Loop: Das Wort verschwindet kurz darauf, und du kannst entscheiden, ob du es zur Festigung direkt nochmal buchstabieren möchtest.

7. VISUELLE SKIZZE
[ Vokabelkarte: "ubiquitous" ]
          /  \\
   ( U ) -- Orbit -- ( S )  <-- Hint 1 (Start/Ende)
          \\  /

[ U . . . . . . . . S ] <-- Wort-Slots (Punkte = Lücken)
  ^                 ^
(Visuelle Führung durch Slot-Echo und Ghost-Paths)`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'VokaOrbit_Hint_System.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAppSpec = () => {
    const content = `VokaOrbit - Technische & Funktionale Spezifikation

1. ÜBERSICHT
VokaOrbit ist eine hochmoderne Vokabel-Lern-App, die kognitive Psychologie mit einem immersiven "Orbit"-Interface kombiniert. Ziel ist es, den Wortschatz durch Active Recall und Spaced Repetition (SRS) effizient und nachhaltig zu festigen.

2. KERN-ALGORITHMUS (FSRS-LOGIK)
Die App nutzt eine angepasste Version des Free Spaced Repetition Scheduler (FSRS):
- Intervalle: Berechnet basierend auf der Schwierigkeit (1-4) und der bisherigen Stabilität der Erinnerung.
- Ease Factor: Passt sich dynamisch an die Leistung des Nutzers an.
- Overdue-Handling: Überfällige Karten werden priorisiert, wobei das neue Intervall vom tatsächlichen Review-Zeitpunkt aus berechnet wird.

3. INTERAKTIONS-MODELL: DER ORBIT
- Spelling-Mechanik: Wörter werden nicht nur gelesen, sondern im "Orbit" (einer kreisförmigen Anordnung) buchstabiert.
- Haptisches Feedback: Visuelle "Glow"-Effekte und sanfte Animationen verstärken die korrekte Eingabe.
- Hint-System: Ein mehrstufiges Hilfesystem (Start/Ende -> Vokale -> Fast gelöst) unterstützt den Abruf, ohne die kognitive Last zu nehmen.

4. DATENHALTUNG & PRIVATSPHÄRE
- Local-First: Alle Daten (Decks, Karten, Reviews) werden lokal im Browser via IndexedDB (Dexie.js) gespeichert.
- Keine Cloud-Pflicht: Deine Fortschritte gehören dir und verlassen dein Gerät nicht ohne expliziten Export.

5. FEATURES
- AI Prompt Builder: Generierung von Vokabellisten durch KI-Unterstützung.
- Text-Import: Schnelles Hinzufügen von Listen im CSV/Text-Format.
- Detaillierte Statistiken: Visualisierung der Lernkurve, Kartenverteilung und Algorithmus-Details.
- Dark Mode: Optimiert für nächtliche Lernsessions.

6. TECHNISCHER STACK
- Frontend: React 18, TypeScript, Vite.
- Styling: Tailwind CSS.
- Animationen: Motion (framer-motion).
- Datenbank: Dexie.js (IndexedDB wrapper).
- Icons: Lucide React.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'VokaOrbit_Spezifikation.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadSourceCode = () => {
    window.location.href = '/api/download-zip';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-orbit-purple rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-orbit-purple/40"
      >
        <Rocket className="text-white w-12 h-12" />
      </motion.div>

      <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tight">
        Mission Launch
      </h2>
      
      <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-xs leading-relaxed">
        Bereit für den globalen Review? Alle fälligen Vokabeln aus allen aktiven Decks werden in dieser Session abgefragt.
      </p>

      <div className="flex flex-col w-full max-w-xs gap-4">
        <button
          onClick={onStart}
          className="w-full bg-orbit-purple hover:bg-orbit-indigo text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-orbit-purple/20 uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 group"
        >
          <Play size={20} className="fill-current group-hover:scale-110 transition-transform" />
          Session Starten
        </button>

        <button
          onClick={downloadHintDocs}
          className="w-full bg-white/5 text-white/80 font-bold py-4 rounded-2xl transition-all border border-white/10 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/10 glass-card"
        >
          <Download size={16} />
          Hint-Logik (TXT)
        </button>

        <button
          onClick={downloadAppSpec}
          className="w-full bg-white/5 text-white/80 font-bold py-4 rounded-2xl transition-all border border-white/10 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/10 glass-card"
        >
          <Download size={16} />
          App Spezifikation (TXT)
        </button>

        <button
          onClick={downloadSourceCode}
          className="w-full bg-white/5 text-white font-black py-4 rounded-2xl transition-all shadow-lg uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 border border-white/10"
        >
          <FileCode size={16} />
          Source Code (ZIP)
        </button>

        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex gap-3 text-left">
          <Info className="text-amber-500 shrink-0" size={18} />
          <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
            Das Hint-System nutzt eine fortschrittliche Orbit-Mechanik mit Fly-Back-Penalty und Sternen-Effekten. Lade die Doku für Details herunter.
          </p>
        </div>
      </div>
    </div>
  );
}
