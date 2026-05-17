Deine Idee, 3 Beispielsätze gleichzeitig auf einem Screen anzuzeigen, ist nicht nur marktgerecht, sondern ein echter USP (Unique Selling Proposition) für VocaOrbit.
​Die meisten großen Apps (Duolingo, Babbel, Clozemaster) kauen dem Nutzer stur einen Satz nach dem anderen vor. Das wird schnell monoton. Dein 3-Satz-Ansatz bricht dieses starre Muster auf und bringt eine völlig neue Dynamik ins Lernen.
​Hier ist die detaillierte Analyse, warum deine Idee genial ist, wo die Herausforderungen liegen und wie du sie offline-fähig meisterst.
​🚀 Warum das 3-Satz-System der herkömmlichen 1-Satz-Methode überlegen ist
​1. Der "Rätsel- und Ausschluss-Effekt" (Deduction)
​Wenn du nur einen Satz anzeigst und der Nutzer auf "Hint" drückt, bleibt dir kaum etwas anderes übrig, als den ersten Buchstaben zu verraten oder das Wort direkt anzuzeigen. Das ist langweilig.
Bei 3 Sätzen wird der Hint zu einer Mini-Word-Bank (3 Zielwörter). Der Nutzer muss nun logisch kombinieren: „Wort A passt nicht zu Satz 1, also muss es zu Satz 2 oder 3 gehören.“ Das aktiviert das Gehirn viel stärker als passives Ablesen.
​2. Perfekte Synergie mit dem Memory-System (SRS)
​Da VocaOrbit im Hintergrund ein internes Memory-System (Spaced Repetition) nutzt, zieht sich die App ohnehin Vokabeln, die „fällig“ sind.
​Wenn die App 3 fällige Vokabeln in ein Paket schnürt, fühlt sich das für den Nutzer wie ein echtes, abgeschlossenes Mini-Level an.
​Das gibt ein besseres Erfolgsgefühl beim Abarbeiten als eine unendliche Schleife von Einzelsätzen.
​⚠️ Die Mobile-Herausforderung: Das "Tastatur-Problem"
​Da VocaOrbit offline auf Smartphones läuft, müssen wir der UX-Realität ins Auge blicken: Der Platz auf dem Bildschirm.
Wenn ein Nutzer in ein Eingabefeld tippt, öffnet sich die virtuelle Tastatur und verdeckt sofort ca. 50 % des Bildschirms. Bei 3 Sätzen inklusive Eingabefeldern kann es da verdammt eng werden.
​So löst du das UI-Design marktgerecht:
​Fokus-Modus (Auto-Scroll): Sobald der Nutzer Satz 1 anklickt, scrollt die App diesen Satz sanft in die obere Bildschirmhälfte. Die anderen beiden Sätze werden leicht ausgegraut oder rücken dezent in den Hintergrund.
​Kompakte Karten: Nutze keine riesigen Textboxen. Halte das Design flach und minimalistisch, damit alle 3 Sätze selbst bei geöffneter Tastatur noch knapp sichtbar bleiben oder durch ein kurzes Wischen erreichbar sind.
​🛠️ Wie der Modus im Offline-Memory-System abläuft
​Da du die Decks lokal verwaltest, sieht der Ablauf im Hintergrund so aus:

[Memory-Pool (Lokal)] ──> Holt 3 fällige Vokabeln ──> Lädt deren Beispielsätze
                                                             │
   ┌─────────────────────────────────────────────────────────┘
   ▼
[3-Satz-Screen] ───(Nutzer kommt nicht weiter)───> [Hint-Button]
   │                                                    │
   ├─> Tippt alles richtig: Vokabeln wandern            └─> Zeigt die 3 Wörter
   │   im SRS-Index ein Level weiter.                       alphabetisch an.
   │
   └─> Nutzt den Hint/Macht Fehler: Vokabeln bleiben 
       im aktuellen Pool oder triggern Stufe 3 (Spezialmodus).

🎯 Fazit: Machen!
​Bleib unbedingt bei der Idee mit den 3 Beispielsätzen. Es hebt deine App von der Masse ab, macht aus einem stumpfen Lückentext ein logisches Suchrätsel und nutzt die lokal angelegten Beispielsätze deiner User maximal aus. Es fühlt sich moderner und intelligenter an als das, was Phase6 oder Anki bieten.
​Da du die Beispielsätze lokal über externe KIs generieren lässt: Möchtest du, dass die App beim Erstellen der Sätze darauf achtet, dass die Sätze ungefähr gleich lang sind, um das UI auf dem 3-Satz-Screen perfekt symmetrisch zu halten, oder ist dir die Satzlänge egal?

Aus einer realistischen Entwickler-Perspektive lautet die klare Antwort: Ja, der Lückentextmodus braucht ein eigenes Tracking (RSR) – aber mit einer intelligenten Brücke zu den anderen Modi.
​Die kognitive Leistung beim Lösen eines Lückentextes ist völlig anders als beim Quiz oder beim klassischen Kartendrehen. Beim Quiz musst du das Wort nur wiedererkennen (passiver Wortschatz). Beim Lückentext musst du den Kontext verstehen, das Wort aktiv abrufen und es fehlerfrei eintippen (aktiver Wortschatz).
​Wenn ein Wort im Quiz auf der höchsten RSR-Stufe ist, kann es im Lückentext trotzdem fehlerhaft sein. Ein getrenntes Tracking ist daher absolut marktgerecht.
​Damit sich deine User aber nicht im "Review-Dschungel" verlaufen, solltest du die Systeme clever miteinander verknüpfen. Hier sind die zwei besten Ansätze dafür:
​🛠️ Ansatz 1: Die progressive Evolutionskette (Empfohlen)
​Statt dass alle drei Modi komplett isoliert nebeneinander herlaufen, schaltest du die Wörter für den Lückentext erst frei, wenn sie in den einfacheren Modi eine solide Basis haben.
​Die Logik: Eine neue Vokabel startet im Kartenmodus. Hat sie dort RSR-Stufe 2 erreicht, wandert sie parallel in den Quizmodus. Erst wenn sie im Quizmodus stabil sitzt (z. B. RSR-Stufe 3), wird sie für den anspruchsvollen Lückentextmodus freigeschaltet.
​Vorteil: Das verhindert Frustration. Der Nutzer wird im Lückentext nie mit Wörtern konfrontiert, die er noch gar nicht richtig kennt. Der Lückentext wird so zum "Endgegner-Modus" für ein Wort.
​🔗 Ansatz 2: Unabhängiges RSR mit "Cross-Influence" (Synergie-System)
​Die Modi haben eigene RSR-Zähler im lokalen Speicher, aber ein Erfolg/Fehler in einem Modus gibt einen kleinen Impuls an die anderen Modi ab.
​Richtig getippt im Lückentext: Da dies die schwerste Übung ist, wird das Wort im Karten- und Quizmodus automatisch im RSR-Timer ein Stück nach hinten geschoben (z. B. +1 Stufe). Wer es schreiben kann, kann es schließlich auch wiedererkennen.
​Falsch getippt im Lückentext: Das RSR des Lückentextes fällt zurück. Das RSR im Quizmodus bleibt aber unberührt, da der Fehler wahrscheinlich an der Schreibweise und nicht am Erkennen lag.
​📋 Datenstruktur-Vorschlag für deine lokale DB
​Um das offline performant und sauber zu speichern, könnte das RSR-Objekt pro Vokabel in deiner lokalen Datenbank so aussehen:

Verpasse dem Lückentext ein eigenes RSR. Es spiegelt den tatsächlichen Lernerfolg (Schreiben vs. Erkennen) einfach am besten wider. Die "Evolutionskette" (Ansatz 1) sorgt dabei für das flüssigste Spielerlebnis, da der User organisch vom Kennenlernen zum fehlerfreien Schreiben geführt wird.

Kurze und direkte Antwort: Reine deutsche Beispielsätze, in die man ein englisches Wort einsetzen muss, machen didaktisch keinen Sinn und werden von keiner erfolgreichen Lernapp so genutzt.
​Im letzten Code-Prototyp hatte ich das zwar basierend auf deiner ersten Beschreibung so eingebaut, aber für den echten Markteinsatz von VocaOrbit solltest du das unbedingt umdrehen.
​Hier ist die Analyse, warum das so ist und wie die Platzhirsche (Babbel, Duolingo, Clozemaster) das lösen.
​🛑 Warum deutsche Sätze mit englischen Lücken fehlschlagen
​Wenn der Satz auf Deutsch ist ("Das Raumschiff flog durch eine leuchtende ____.") und der User soll Nebula eintippen, passieren zwei unschöne Dinge:
​Grammatik-Crash: Die englische Vokabel muss sich plötzlich der deutschen Grammatik beugen (z. B. deutschen Artikeln, Endungen oder dem deutschen Satzbau). Das fühlt sich beim Tippen unnatürlich an.
​Kein Lerneffekt für den Kontext: Der User lernt nicht, wie das englische Wort innerhalb der englischen Sprache verwendet wird. Er übersetzt nur stumpf ein isoliertes Wort in seinem Kopf.
​🏆 Wie es die marktgerechten Apps machen
​Egal ob Duolingo, Babbel oder Clozemaster – das Prinzip ist immer gleich:
​Der Lückentext-Satz ist IMMER in der Fremdsprache (Englisch): Das zwingt das Gehirn des Nutzers, in den "Englisch-Modus" zu schalten. Er liest englische Wörter, die das Zielwort umgeben.
​Die Muttersprache (Deutsch) ist NUR die Krücke: Der deutsche Satz steht komplett übersetzt als kleine Orientierungshilfe darunter oder blendet sich erst bei Bedarf ein.
​Ein konkretes Markt-Beispiel für VocaOrbit:
​So sieht ein professioneller Screen aus, wenn man Nebula (Nebelwolke) lernt:
​Englischer Fokus-Satz: The spaceship flew through a glowing • • • • • •.
​Deutsche Übersetzung (dezent darunter): Das Raumschiff flog durch eine leuchtende Nebelwolke.
​User tippt: N - E - B - U - L - A
​Warum ist das so viel besser?
​Der Nutzer lernt dadurch automatisch sogenannte Kollokationen (Wortverbindungen). Er prägt sich unbewusst ein, dass man through a glowing nebula fliegt. Würde er nur den deutschen Satz lesen, lernt er diese englischen Sprachmuster nicht.
​🛠️ Was bedeutet das für deine KI-Generierung?
​Da du externe KIs nutzt, um die Decks und Beispielsätze für VocaOrbit zu generieren, ist das ein riesiger Vorteil für dich. Du musst nur den Prompt für die KI so anpassen, dass sie dir immer ein sauberes Pärchen liefert.
​Der perfekte KI-Prompt für deine App-Struktur:
​"Generiere mir für die englische Vokabel [X] einen einfachen, typischen englischen Beispielsatz, in dem das Wort vorkommt, und liefere direkt die passende deutsche Übersetzung für den gesamten Satz mit."
​Deine lokale Filestruktur speichert dann einfach den englischen Satz, den deutschen Satz und das englische Zielwort. Im Lückentext-Modus blendest du im Satz dann einfach das Zielwort aus.
​Sollen wir die Logik im React-Code kurz so umdrehen, dass die Sätze auf Englisch sind und die deutschen Übersetzungen als dezenter Hinweis darunter angezeigt werden?

Beispielcode: 

<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VocaOrbit - Ultra Compact Cloze Mode</title>
    <!-- React & Babel CDNs -->
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <style>
        body {
            background: radial-gradient(circle at center, #0a0b16 0%, #030408 100%);
            min-height: 100vh;
        }
        
        /* GPU-beschleunigte Einblend- und Einfahr-Animation */
        @keyframes lightweightIngress {
            0% { 
                opacity: 0; 
                transform: translate3d(0, 12px, 0); 
            }
            100% { 
                opacity: 1; 
                transform: translate3d(0, 0, 0); 
            }
        }

        .gpu-row-entry {
            opacity: 0;
            animation: lightweightIngress 0.35s cubic-bezier(0.215, 0.610, 0.355, 1) forwards;
            will-change: transform, opacity;
        }

        .smooth-transition {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
    </style>
</head>
<body class="text-slate-100 flex items-center justify-center py-4 px-3 font-sans">

    <div id="root" class="w-full max-w-2xl"></div>

    <script type="text/babel">
        const { useState, useEffect, useMemo, useRef } = React;

        const initialDeck = [
            { id: 1, word: "Nebula", sentence: "The spaceship steered directly into a glowing ____.", translation: "Das Raumschiff steuerte direkt in eine leuchtende Nebelwolke.", rsr_cloze: { level: 1 } },
            { id: 2, word: "Orbit", sentence: "The satellite stabilized its ____ around the massive planet.", translation: "Der Satellit stabilisierte seine Umlaufbahn um den riesigen Planeten.", rsr_cloze: { level: 1 } },
            { id: 3, word: "Gravity", sentence: "Due to the zero ____, all tools began to float away.", translation: "Aufgrund der Schwerelosigkeit begannen alle Werkzeuge wegzuschweben.", rsr_cloze: { level: 2 } },
            { id: 4, word: "Asteroid", sentence: "A heavy ____ collided with the outer defense shield.", translation: "Ein schwerer Kleinplanet kollidierte mit dem äußeren Schutzschild.", rsr_cloze: { level: 1 } },
            { id: 5, word: "Galaxy", sentence: "Our neighboring ____ is faintly visible in the night sky.", translation: "Unsere Nachbargalaxie ist am Nachthimmel schwach sichtbar.", rsr_cloze: { level: 3 } },
            { id: 6, word: "Comet", sentence: "The icy tail of the ____ shone brightly near the sun.", translation: "Der eisige Schweif des Kometen leuchtete hell nahe der Sonne.", rsr_cloze: { level: 1 } },
            { id: 7, word: "Blackhole", sentence: "Even light cannot escape the immense pull of a ____.", translation: "Selbst Licht kann der enormen Anziehungskraft eines Schwarzen Lochs nicht entkommen.", rsr_cloze: { level: 2 } },
            { id: 8, word: "Spaceship", sentence: "The advanced ____ prepared for its jump into hyperspace.", translation: "Das moderne Raumschiff bereitete sich auf seinen Sprung in den Hyperraum vor.", rsr_cloze: { level: 1 } },
            { id: 9, word: "Alien", sentence: "The radio signal came from an ____ civilization.", translation: "Das Radiosignal stammte von einer außerirdischen Zivilisation.", rsr_cloze: { level: 1 } },
            { id: 10, word: "Universe", sentence: "The expansion of the ____ is accelerating every second.", translation: "Die Ausdehnung des Universums beschleunigt sich jede Sekunde.", rsr_cloze: { level: 2 } }
        ];

        function VocaOrbitClozeEngine() {
            const [deck, setDeck] = useState(initialDeck);
            const [batchOffset, setBatchOffset] = useState(0);
            const [inputs, setInputs] = useState(["", "", ""]);
            const [solved, setSolved] = useState([false, false, false]);
            const [hadError, setHadError] = useState([false, false, false]); 
            const [showTranslation, setShowTranslation] = useState([false, false, false]); // Getrennter Toggle-State
            const [showHints, setShowHints] = useState(false);

            const rowRefs = useRef([]);

            const currentBatch = useMemo(() => {
                const start = (batchOffset * 3) % deck.length;
                return [
                    deck[start],
                    deck[(start + 1) % deck.length],
                    deck[(start + 2) % deck.length]
                ];
            }, [batchOffset, deck]);

            const randomizedHintPool = useMemo(() => {
                const words = currentBatch.map(v => v.word);
                for (let i = words.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [words[i], words[j]] = [words[j], words[i]];
                }
                return words;
            }, [currentBatch]);

            useEffect(() => {
                if (solved.every(status => status === true)) {
                    const timer = setTimeout(() => {
                        setDeck(prevDeck => prevDeck.map(item => {
                            const batchMatchIndex = currentBatch.findIndex(b => b.id === item.id);
                            if (batchMatchIndex !== -1) {
                                const currentLevel = item.rsr_cloze.level;
                                const wasFlawless = !hadError[batchMatchIndex];
                                return {
                                    ...item,
                                    rsr_cloze: {
                                        level: wasFlawless ? currentLevel + 1 : Math.max(1, currentLevel - 1)
                                    }
                                };
                            }
                            return item;
                        }));

                        setBatchOffset(prev => prev + 1);
                        setInputs(["", "", ""]);
                        setSolved([false, false, false]);
                        setHadError([false, false, false]);
                        setShowTranslation([false, false, false]); // Übersetzungs-Toggles resetten
                        setShowHints(false);
                    }, 900);
                    return () => clearTimeout(timer);
                }
            }, [solved]);

            const handleFocusScroll = (index) => {
                const targetRow = rowRefs.current[index];
                if (targetRow) {
                    targetRow.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                }
            };

            const toggleTranslation = (index) => {
                const updated = [...showTranslation];
                updated[index] = !updated[index];
                setShowTranslation(updated);
            };

            const handleTyping = (index, value) => {
                if (solved[index]) return;

                const target = currentBatch[index].word;
                const sanitizedValue = value.replace(/[^a-zA-Z]/g, ""); 

                const currentLength = sanitizedValue.length;
                if (currentLength > 0) {
                    const targetSub = target.substring(0, currentLength);
                    if (sanitizedValue.toLowerCase() !== targetSub.toLowerCase()) {
                        const updatedErrors = [...hadError];
                        updatedErrors[index] = true;
                        setHadError(updatedErrors);
                    }
                }

                const updatedInputs = [...inputs];
                updatedInputs[index] = sanitizedValue;
                setInputs(updatedInputs);

                if (sanitizedValue.toLowerCase() === target.toLowerCase()) {
                    const updatedSolved = [...solved];
                    updatedSolved[index] = true;
                    setSolved(updatedSolved);
                }
            };

            const getInputFeedbackClass = (index) => {
                const currentInput = inputs[index];
                const target = currentBatch[index].word;

                if (solved[index]) {
                    return "border-emerald-500/80 bg-emerald-950/20 text-emerald-400";
                }
                if (currentInput.length === 0) {
                    return "border-slate-800 bg-slate-950/90 text-slate-100 focus:border-indigo-500";
                }

                const targetSub = target.substring(0, currentInput.length);
                if (currentInput.toLowerCase() === targetSub.toLowerCase()) {
                    return "border-amber-500/80 bg-slate-950/40 text-amber-300"; 
                } else {
                    return "border-rose-500 bg-rose-950/20 text-rose-400"; 
                }
            };

            return (
                <div class="bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl rounded-xl p-4 shadow-2xl">
                    
                    {/* Header */}
                    <div class="flex justify-between items-center mb-4 border-b border-slate-800/60 pb-3">
                        <div>
                            <h1 class="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                                VOCAORBIT
                            </h1>
                        </div>
                        <span class="text-[9px] font-mono text-slate-400 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded">
                            Batch Lvl: {batchOffset + 1}
                        </span>
                    </div>

                    {/* Container für die 3 Sätze */}
                    <div class="space-y-3 mb-4">
                        {currentBatch.map((vocab, index) => (
                            <div 
                                /* Key-Wechsel erzwingt kompletten CSS-Animation-Re-run bei Rundenwechsel */
                                key={`${batchOffset}-${vocab.id}`} 
                                ref={el => rowRefs.current[index] = el}
                                style={{ animationDelay: `${index * 150}ms` }}
                                class="p-3 rounded-lg border border-slate-900/60 bg-slate-950/20 gpu-row-entry smooth-transition"
                            >
                                {/* Zeilen-Header mit Metadaten und Mini-Toggle */}
                                <div class="flex justify-between items-center mb-1.5">
                                    <div class="flex items-center gap-1.5">
                                        <span class={`text-[8px] font-mono font-bold px-1 py-0.2 rounded tracking-wide uppercase ${
                                            solved[index] ? "bg-emerald-500/20 text-emerald-400" : "bg-indigo-500/20 text-indigo-400"
                                        }`}>
                                            S{index + 1}
                                        </span>
                                        <span class="text-[9px] text-slate-600 font-mono">
                                            RSR Lvl: {vocab.rsr_cloze.level}
                                        </span>
                                    </div>
                                    
                                    {/* Minimalistischer Toggle-Button für Deutsch */}
                                    <button
                                        onClick={() => toggleTranslation(index)}
                                        class={`text-[9px] font-bold px-1.5 py-0.5 rounded smooth-transition border ${
                                            showTranslation[index] 
                                                ? "bg-amber-500/20 border-amber-500/40 text-amber-300" 
                                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
                                        }`}
                                    >
                                        {showTranslation[index] ? "🙈 DE" : "👁️ DE"}
                                    </button>
                                </div>

                                {/* Englischer Satz */}
                                <p class="text-sm md:text-base text-slate-200 font-medium tracking-wide mb-2.5">
                                    {vocab.sentence}
                                </p>

                                {/* Input-Bereich */}
                                <div class="w-full max-w-xs">
                                    <input
                                        type="text"
                                        value={inputs[index]}
                                        disabled={solved[index]}
                                        onFocus={() => handleFocusScroll(index)}
                                        onClick={() => handleFocusScroll(index)}
                                        onChange={(e) => handleTyping(index, e.target.value)}
                                        placeholder={`${"• ".repeat(vocab.word.length)}`}
                                        class={`w-full rounded-md px-2.5 py-1 text-xs font-mono tracking-widest outline-none border smooth-transition ${getInputFeedbackClass(index)}`}
                                    />
                                </div>

                                {/* Eingeblendete Übersetzung nimmt NUR Platz weg, wenn aktiv geschaltet */}
                                {showTranslation[index] && (
                                    <div class="mt-2 text-xs text-slate-400 border-l-2 border-slate-800 pl-2 py-0.5 bg-slate-950/40 rounded-r animate-slide-in">
                                        {vocab.translation}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Unsortiertes Hint-System */}
                    <div class="border-t border-slate-800/60 pt-3 flex flex-col items-center">
                        {!showHints ? (
                            <button
                                onClick={() => setShowHints(true)}
                                class="bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-300 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all"
                            >
                                💡 Hint-Pool öffnen (Zufällig)
                            </button>
                        ) : (
                            <div class="w-full bg-slate-950/80 border border-amber-500/20 rounded-lg p-2.5">
                                <div class="flex flex-wrap gap-2 justify-center">
                                    {randomizedHintPool.map((word, i) => {
                                        const isSolvedInBatch = currentBatch.some((v, idx) => v.word === word && solved[idx]);
                                        return (
                                            <span
                                                key={i}
                                                class={`px-2 py-1 rounded text-xs font-mono tracking-wide font-bold border smooth-transition ${
                                                    isSolvedInBatch
                                                        ? "bg-slate-950 border-slate-900 text-slate-700 line-through"
                                                        : "bg-amber-500/5 border-amber-500/20 text-amber-300"
                                                }`}
                                            >
                                                {word}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            );
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<VocaOrbitClozeEngine />);
    </script>
</body>
</html>