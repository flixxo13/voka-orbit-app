# VokaOrbit – QA & Code-Analyse Report
**Analysiert:** Alle 18 Quelldateien | **Datum:** Mai 2026  
**Stack:** React 19 · TypeScript · Vite · Dexie (IndexedDB) · Framer Motion · Tailwind

---

## 1. Zusammenfassung des Projekt-Zustands

Der Gesamtzustand ist **solide für einen MVP**, leidet aber unter mehreren **kritischen Datenkorruptions-Bugs** und einem **systemischen Problem im XP-State-Management**, das sich durch alle Lernmodi zieht. Die Architektur (Screens, Hooks, Core) ist sauber getrennt. Die UI-Qualität ist hoch.

**Kritischste Baustellen auf einen Blick:**
1. `handleDeleteDeck` hinterlässt dauerhaft Datenmüll in der DB (Logikfehler).
2. Das XP-System hat eine Race Condition: XP-Gewinne und Streak-Boni können sich gegenseitig überschreiben (Silent Data Loss).
3. `useStats` berechnet `newCards` falsch – der Wert kann **negativ** werden.
4. `setTimeout` in `handleGrade` hat kein Cleanup → Memory Leak & doppelte DB-Writes bei schneller Navigation.
5. Auf Android (Capacitor WebView): `window.confirm()` ist geblockt → Löschen von Decks/Karten funktioniert nicht.

---

## 2. Detaillierte Fehler- und Bug-Liste

---

### 🔴 KRITISCH

---

**ID:** 01  
**Datei/Zeile:** `src/screens/DeckScreen.tsx` (Zeile 80–84)  
**Priorität:** Kritisch  
**Beschreibung:** `handleDeleteDeck` löscht die Karten in Zeile 81 und versucht **danach** in Zeile 83 dieselben Karten nochmal abzufragen, um ihre IDs für das Review-Cleanup zu bekommen. Da die Karten bereits gelöscht sind, liefert die Query ein leeres Array. **Reviews werden nie gelöscht.** Außerdem fehlt die `quizReviews`-Tabelle im Cleanup komplett. Jeder Deck-Delete hinterlässt dauerhaft Datenmüll.

```ts
// ❌ IST (Zeile 80–84):
await db.decks.delete(id);
await db.cards.where('deckId').equals(id).delete(); // Karten weg!
await db.reviews.where('cardId').anyOf(
  (await db.cards.where('deckId').equals(id).toArray()) // Gibt [] zurück!
    .map(c => c.id!)
).delete(); // Löscht nichts.
// quizReviews werden nie berührt!

// ✅ FIX:
const cardIds = (await db.cards.where('deckId').equals(id).toArray())
  .map(c => c.id!);
await db.reviews.where('cardId').anyOf(cardIds).delete();
await db.quizReviews.where('cardId').anyOf(cardIds).delete();
await db.cards.where('deckId').equals(id).delete();
await db.decks.delete(id);
```

---

**ID:** 02  
**Datei/Zeile:** `src/hooks/useSettings.ts` (Zeile 162–167, 174–178)  
**Priorität:** Kritisch  
**Beschreibung:** **Race Condition im XP-State.** Alle XP-Callbacks (`gainXP`, `spendXP`, `incrementStreak`) lesen `settings.xp` aus einer **stale Closure** statt über den funktionalen State-Updater. Wenn `gainXP` und `incrementStreak` im selben Event-Handler aufgerufen werden (wie in `handleGrade` in LearnScreen), lesen beide denselben alten Wert. Das zweite `updateSettings` überschreibt das erste. **Ergebnis: Entweder der Karten-XP oder der Streak-Bonus geht still verloren.**

```ts
// ❌ IST (liest stale settings.xp):
const gainXP = useCallback((amount: number) => {
  const newXP = settings.xp + amount; // stale!
  updateSettings({ xp: newXP, level: newLevel });
}, [settings.xp, updateSettings]);

// ✅ FIX (funktionaler Updater):
const gainXP = useCallback((amount: number): boolean => {
  let leveledUp = false;
  setSettings(prev => {
    const newXP = prev.xp + amount;
    const newLevel = getLevelData(newXP).level;
    leveledUp = newLevel > prev.level;
    return { ...prev, xp: newXP, level: newLevel };
  });
  return leveledUp;
}, []);
```
Gleiches Fix-Muster für `spendXP`, `incrementStreak`, `recordCardLearned`.

---

**ID:** 03  
**Datei/Zeile:** `src/hooks/useStats.ts` (Zeile 20–21, 40)  
**Priorität:** Kritisch  
**Beschreibung:** `totalReviewed = deckReviews.length` zählt alle **Review-Einträge**, nicht eindeutige Karten. Eine Karte, die 5-mal bewertet wurde, zählt als 5. Daraus folgt: `newCards = totalCards - totalReviewed` **kann negativ werden**, was zu falschen Stats und einem negativen `totalDue` führt.

```ts
// ❌ IST:
const totalReviewed = deckReviews.length; // Zählt alle Einträge!
const newCards = totalCards - totalReviewed; // Kann negativ sein!

// ✅ FIX:
const reviewedCardIds = new Set(deckReviews.map(r => r.cardId));
const totalReviewed = reviewedCardIds.size; // Eindeutige Karten
const newCards = Math.max(0, totalCards - totalReviewed);
```

---

**ID:** 04  
**Datei/Zeile:** `src/screens/LearnScreen.tsx` (Zeile 110–116)  
**Priorität:** Kritisch  
**Beschreibung:** **Memory Leak & doppelte DB-Writes.** `handleGrade` feuert ein `setTimeout(async, 850)` ohne Cleanup. Navigiert der User innerhalb von 850ms zurück, ist die Komponente bereits unmounted. Das Timeout feuert trotzdem und ruft `setGradeFeedback`, `setPhase`, `setIsFlipped` und `await submitReview(grade)` auf. Dies erzeugt React-Warnings, kann zu doppelten Review-Einträgen in der DB führen und crasht bei React Strict Mode.

```ts
// ✅ FIX: useRef für das Timeout + Cleanup in useEffect
const gradeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// In handleGrade:
if (gradeTimerRef.current) clearTimeout(gradeTimerRef.current);
gradeTimerRef.current = setTimeout(async () => {
  setGradeFeedback(null);
  setPhase('card');
  setIsFlipped(false);
  dragX.set(0);
  await submitReview(grade);
}, 850);

// Cleanup-useEffect hinzufügen:
useEffect(() => {
  return () => { if (gradeTimerRef.current) clearTimeout(gradeTimerRef.current); };
}, []);
```

---

**ID:** 05  
**Datei/Zeile:** `src/screens/DeckScreen.tsx` + `src/screens/CardManagementScreen.tsx`  
**Priorität:** Kritisch (für Android)  
**Beschreibung:** **`window.confirm()` ist in Android WebViews (Capacitor) geblockt.** Das bedeutet: Der Confirm-Dialog erscheint nie, die Funktion returned `false`, das Löschen von Decks und Karten ist auf der Android-App komplett deaktiviert. Da wir genau für Android bauen, ist das ein Show-Stopper.

```tsx
// ❌ IST:
if (!window.confirm(`Deck „${name}" wirklich löschen?`)) return;

// ✅ FIX: Eigene Confirm-Modal-Komponente bauen:
const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
// ... ConfirmModal-Komponente rendern statt window.confirm()
```

---

### 🟠 HOCH

---

**ID:** 06  
**Datei/Zeile:** `src/core/fsrs.ts` (Zeile 18–19)  
**Priorität:** Hoch  
**Beschreibung:** **"Again" (Grade 1) funktioniert nicht als "Nochmal in dieser Session"**. `nextInterval = 0` → `addDays(new Date(), 0)` ergibt den aktuellen Moment. Die Karte ist damit zwar sofort wieder fällig, aber `sessionCards` ist ein **festes Snapshot** das beim Session-Start geladen wurde. Die Karte erscheint in der aktuellen Session nicht nochmal. Nutzer erwarten bei "Nochmal" eine Wiederholung noch in derselben Session.

```ts
// ✅ FIX: In useSession.ts, nach submitReview mit grade===1:
// Karte ans Ende der sessionCards-Queue schieben
if (grade === 1) {
  setSessionCards(prev => {
    const card = prev[currentIndex];
    const rest = prev.filter((_, i) => i !== currentIndex);
    return [...rest, card]; // Ans Ende anhängen
  });
  // currentIndex NICHT erhöhen – nächste Karte ist dieselbe Position
  return;
}
```

---

**ID:** 07  
**Datei/Zeile:** `src/core/backup.ts` (Zeile 96–108)  
**Priorität:** Hoch  
**Beschreibung:** **Keine Transaktion bei Restore.** `restoreBackup` löscht alle Tabellen mit `Promise.all`, dann fügt Daten sequentiell hinzu. Schlägt ein `bulkAdd` fehl (Speicher voll, korrupte Daten), sind die Tabellen geleert aber nicht wiederhergestellt. **Alle Nutzerdaten sind verloren.**

```ts
// ✅ FIX: Dexie-Transaktion verwenden:
await db.transaction('rw', [db.decks, db.cards, db.reviews, db.quizReviews], async () => {
  await Promise.all([db.decks.clear(), db.cards.clear(), db.reviews.clear(), db.quizReviews.clear()]);
  await db.decks.bulkAdd(backup.data.decks);
  await db.cards.bulkAdd(backup.data.cards);
  if (backup.data.reviews.length) await db.reviews.bulkAdd(backup.data.reviews);
  if (backup.data.quizReviews.length) await db.quizReviews.bulkAdd(backup.data.quizReviews);
});
```

---

**ID:** 08  
**Datei/Zeile:** `src/hooks/useStats.ts` (Zeile 22–24)  
**Priorität:** Hoch  
**Beschreibung:** **Lernphasen-Statistik (Learning/Review) zählt alle Review-Einträge, nicht den aktuellen Stand.** Eine Karte, die früher `interval < 1` hatte, jetzt aber bei `interval = 14` ist, zählt noch in "Lernen". Es wird der neueste Review pro Karte benötigt.

```ts
// ✅ FIX: Latest Review pro Card ermitteln
const latestReviewPerCard = new Map<number, Review>();
for (const r of deckReviews) {
  const existing = latestReviewPerCard.get(r.cardId);
  if (!existing || r.reviewedAt > existing.reviewedAt) {
    latestReviewPerCard.set(r.cardId, r);
  }
}
const latestReviews = [...latestReviewPerCard.values()];
const learning = latestReviews.filter(r => r.interval < 1).length;
const review   = latestReviews.filter(r => r.interval >= 1).length;
```

---

**ID:** 09  
**Datei/Zeile:** `src/core/audio.ts` (Zeile 10)  
**Priorität:** Hoch  
**Beschreibung:** `audioCtx.resume()` wird ohne `await` aufgerufen. Auf Android WebView und iOS ist `AudioContext` häufig suspended bis zur ersten User-Geste. Die `resume()`-Promise wird ignoriert → Sounds schlagen silent fehl. Der nachfolgende Code baut Nodes auf einem suspended Context auf.

```ts
// ✅ FIX:
async function getContext(): Promise<AudioContext> {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  return audioCtx;
}
// Alle play*-Funktionen müssen dann async werden:
export async function playTapSound(enabled: boolean) {
  if (!enabled) return;
  const ctx = await getContext();
  // ...
}
```

---

**ID:** 10  
**Datei/Zeile:** `src/hooks/useSession.ts` (gesamte `loadSession`)  
**Priorität:** Hoch  
**Beschreibung:** **Kein Error-Handling in `loadSession`.** Jeder IndexedDB-Fehler (Speicher voll, Browser-Quota, DB-Korruption) lässt `isLoading` auf `true` stehen. Der User sieht ewig den Lade-Spinner ohne Fehlermeldung.

```ts
// ✅ FIX:
const [error, setError] = useState<string | null>(null);

const loadSession = useCallback(async () => {
  if (deckId === null) return;
  setIsLoading(true);
  setError(null);
  try {
    const cards = await getDueCards(/* ... */);
    // ...
  } catch (e) {
    setError('Fehler beim Laden der Session. Bitte neu starten.');
    console.error('[VokaOrbit] loadSession failed:', e);
  } finally {
    setIsLoading(false);
  }
}, [deckId]);
```

---

### 🟡 MEDIUM

---

**ID:** 11  
**Datei/Zeile:** `src/core/quiz-session.ts` (Zeile 54)  
**Priorität:** Medium  
**Beschreibung:** `.sort(() => 0.5 - Math.random())` ist ein **mathematisch verzerrter Shuffle** (Knuth-Kritik). Einige Anordnungen erscheinen statistisch häufiger als andere, was bei Quiz-Optionen auffällt. Der richtige Shuffle ist bereits an anderer Stelle als `shuffle()` in `FloatingHints.tsx` implementiert.

```ts
// ✅ FIX: Fisher-Yates verwenden
function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const shuffled = fisherYates(sameDeckCards);
```

---

**ID:** 12  
**Datei/Zeile:** `src/screens/CardManagementScreen.tsx` (Zeile 20)  
**Priorität:** Medium  
**Beschreibung:** `useState<any | null>` für `editingCard` – TypeScript-Typsicherheit komplett ausgeschaltet. Zugriffe auf `editingCard.id!` oder `editingCard.front` sind ungeprüft und können zu Runtime-Errors führen wenn die Card-Struktur sich ändert.

```ts
// ✅ FIX:
import { type Card } from '../core/storage-local';
const [editingCard, setEditingCard] = useState<Card | null>(null);
```

---

**ID:** 13  
**Datei/Zeile:** `src/screens/LearnScreen.tsx` (Zeile 601)  
**Priorität:** Medium  
**Beschreibung:** `StatCount` bricht bei `value === 0` mit `return` ab. Wenn sich der Wert von einem positiven Wert auf 0 ändert (z.B. nach einem XP-Verlust auf genau 0), bleibt die angezeigte Zahl beim alten Wert stehen, statt 0 zu zeigen.

```ts
// ✅ FIX: Early return entfernen, 0 als gültigen Endwert behandeln:
useEffect(() => {
  // Kein early return für value === 0
  const timeout = setTimeout(() => {
    if (value === 0) { setDisplay(0); return; } // Direkt auf 0 setzen
    // ... Animation-Logik für value > 0
  }, delay * 1000);
  return () => { clearTimeout(timeout); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
}, [value, delay]);
```

---

**ID:** 14  
**Datei/Zeile:** `src/screens/QuizScreen.tsx` (Zeile 32–35)  
**Priorität:** Medium  
**Beschreibung:** Quiz-History-Reset-Bedingung `!isFinished && currentIndex === 0` ist fragil. Beim Neustart (`restart()`) bleibt `isFinished` kurz auf `true` während die neue Session lädt. Die History wird nicht gecleart und kann aus der Vorherigen Session in die Ergebnisansicht der neuen Session einfließen.

```ts
// ✅ FIX: Reset beim restart()-Call selbst, nicht in useEffect:
const handleRestart = useCallback(() => {
  setQuizHistory([]);
  setShowDetails(false);
  restart(); // Session neu laden
}, [restart]);
```

---

**ID:** 15  
**Datei/Zeile:** `src/core/backup.ts` (Zeile 77)  
**Priorität:** Medium  
**Beschreibung:** Die Backup-Versionsvalidierung prüft nur `1` und `2`, aber der geparste Typ wird als `VokaOrbitBackup` gecastet ohne vorherige Strukturprüfung. Eine manipulierte JSON-Datei ohne `data.decks`-Array würde erst bei `bulkAdd` crashen, nach dem Löschen aller Daten.

```ts
// ✅ FIX: Struktur validieren bevor Daten vertraut werden:
function isValidBackup(parsed: unknown): parsed is VokaOrbitBackup {
  const b = parsed as VokaOrbitBackup;
  return (
    b?.app === 'VokaOrbit' &&
    (b.version === 1 || b.version === 2) &&
    Array.isArray(b.data?.decks) &&
    Array.isArray(b.data?.cards) &&
    Array.isArray(b.data?.reviews) &&
    Array.isArray(b.data?.quizReviews)
  );
}
```

---

### 🔵 NIEDRIG

---

**ID:** 16  
**Datei/Zeile:** `src/core/session.ts` (Zeile 12–14)  
**Priorität:** Niedrig  
**Beschreibung:** `getDueCards` lädt alle Reviews (`db.reviews.toArray()`) für die Berechnung von `reviewedCardIds`, selbst wenn nur ein spezifisches Deck angefragt wird. Bei großen Datenbanken (>1000 Karten) ist das eine unnötig teure Query.

```ts
// ✅ FIX: CardIds-Set der aktuellen Karten verwenden:
const cardIds = allCards.map(c => c.id!);
const reviewedCardIds = new Set(
  (await db.reviews.where('cardId').anyOf(cardIds).toArray()).map(r => r.cardId)
);
```

---

**ID:** 17  
**Datei/Zeile:** `src/hooks/useSettings.ts` (Zeile 76–88)  
**Priorität:** Niedrig  
**Beschreibung:** `getLevelData` nutzt eine `while(true)`-Schleife die bis Level 999 läuft. Bei `totalXp = 0` oder negativen Werten läuft sie korrekt, aber bei einem Bug der XP ins Negative treibt, bricht die Logik nicht sauber ab und gibt Level 1 zurück. Kein kritisches Problem, aber ein Guard schadet nicht.

```ts
// ✅ FIX: Guard für negative XP
export function getLevelData(totalXp: number) {
  const safeXp = Math.max(0, totalXp);
  // ... restliche Logik mit safeXp
}
```

---

**ID:** 18  
**Datei/Zeile:** `src/components/TextImport.tsx`  
**Priorität:** Niedrig  
**Beschreibung:** Kein Limit für die Anzahl importierbarer Karten. Ein Nutzer könnte versehentlich 10.000+ Zeilen importieren, was den Browser einfriert. Ein simples Limit + Warnung wäre UX-freundlich.

```ts
// ✅ FIX: Limit in parseVocabText hinzufügen:
const MAX_IMPORT = 500;
if (data.length > MAX_IMPORT) {
  errs.push(`Maximum ${MAX_IMPORT} Karten pro Import erlaubt.`);
  return { data: data.slice(0, MAX_IMPORT), errors: errs };
}
```

---

## 3. Empfohlene nächste Schritte

Nach Priorität sortiert:

| Prio | ID | Aufgabe | Aufwand |
|------|-----|---------|---------|
| 🔴 1 | #01 | `handleDeleteDeck` – Reviews VOR Cards löschen, quizReviews ergänzen | ~10 min |
| 🔴 2 | #05 | `window.confirm()` → Custom Confirm Modal (Android-kritisch) | ~30 min |
| 🔴 3 | #02 | XP Race Condition in `useSettings` – funktionale Updater einbauen | ~20 min |
| 🔴 4 | #03 | Stats: `newCards` auf unique cardIds umstellen | ~10 min |
| 🔴 5 | #04 | `setTimeout` in `handleGrade` → Ref + Cleanup | ~15 min |
| 🟠 6 | #07 | Backup Restore → Dexie-Transaktion | ~10 min |
| 🟠 7 | #06 | FSRS "Again" → Karte ans Session-Ende schieben | ~20 min |
| 🟠 8 | #08 | Stats Lernphasen → nur letztes Review pro Karte | ~15 min |
| 🟠 9 | #09 | Audio `resume()` awaiten | ~10 min |
| 🟠10 | #10 | `loadSession` Error Handling | ~15 min |
| 🟡11 | #12 | `editingCard` Typ: `any` → `Card` | ~5 min |
| 🟡12 | #14 | Quiz History Reset beim restart() statt useEffect | ~10 min |
| 🟡13 | #15 | Backup Struktur-Validierung | ~15 min |
| 🔵14 | #11 | Fisher-Yates Shuffle in quiz-session.ts | ~5 min |
| 🔵15 | #16 | getDueCards: nur deck-spezifische Reviews laden | ~10 min |

**Gesamtaufwand für alle kritischen & hohen Fixes: ca. 3 Stunden** – und die App wäre production-ready für den Android-Launch.
