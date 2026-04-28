import { db } from './storage-local';
import type { Deck, Card, Review, QuizReview } from './storage-local';

/* ============================================================
   TYPES
   ============================================================ */
const SETTINGS_KEY = 'vokaorbit_settings_v2';

export interface VokaOrbitBackup {
  version: 1 | 2;
  app: 'VokaOrbit';
  exportedAt: number;
  settings: Record<string, unknown> | null;  // localStorage: XP, Level, Streak, etc.
  data: {
    decks: Deck[];
    cards: Card[];
    reviews: Review[];
    quizReviews: QuizReview[];
  };
}

export interface ImportResult {
  decks: number;
  cards: number;
  reviews: number;
  quizReviews: number;
}

/* ============================================================
   EXPORT — alle Daten → .json Datei herunterladen
   ============================================================ */
export async function exportBackup(): Promise<void> {
  const [decks, cards, reviews, quizReviews] = await Promise.all([
    db.decks.toArray(),
    db.cards.toArray(),
    db.reviews.toArray(),
    db.quizReviews.toArray(),
  ]);

  // Settings aus localStorage sichern
  let settings: Record<string, unknown> | null = null;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) settings = JSON.parse(raw);
  } catch { /* ignore */ }

  const backup: VokaOrbitBackup = {
    version: 2,
    app: 'VokaOrbit',
    exportedAt: Date.now(),
    settings,
    data: { decks, cards, reviews, quizReviews },
  };

  const json  = JSON.stringify(backup, null, 2);
  const blob  = new Blob([json], { type: 'application/json' });
  const url   = URL.createObjectURL(blob);
  const date  = new Date().toISOString().split('T')[0];
  const link  = document.createElement('a');
  link.href     = url;
  link.download = `vokaorbit-backup-${date}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ============================================================
   IMPORT — Datei einlesen & validieren
   ============================================================ */
export function parseBackupFile(file: File): Promise<VokaOrbitBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as VokaOrbitBackup;
        if (parsed.app !== 'VokaOrbit' || !parsed.data) {
          reject(new Error('Keine gültige VokaOrbit-Backup-Datei.'));
        } else if (parsed.version !== 1 && parsed.version !== 2) {
          reject(new Error(`Backup-Version ${parsed.version} wird nicht unterstützt.`));
        } else {
          resolve(parsed);
        }
      } catch {
        reject(new Error('Datei konnte nicht gelesen werden.'));
      }
    };
    reader.onerror = () => reject(new Error('Datei-Lesefehler.'));
    reader.readAsText(file);
  });
}

/* ============================================================
   RESTORE (Ersetzen) — Alle Daten löschen und Backup einspielen
   ID-Beziehungen bleiben erhalten, da Tabellen leer sind.
   ============================================================ */
export async function restoreBackup(backup: VokaOrbitBackup): Promise<ImportResult> {
  // 1. Alle Tabellen leeren
  await Promise.all([
    db.decks.clear(),
    db.cards.clear(),
    db.reviews.clear(),
    db.quizReviews.clear(),
  ]);

  // 2. Daten mit Original-IDs wiederherstellen
  await db.decks.bulkAdd(backup.data.decks);
  await db.cards.bulkAdd(backup.data.cards);
  if (backup.data.reviews.length)     await db.reviews.bulkAdd(backup.data.reviews);
  if (backup.data.quizReviews.length) await db.quizReviews.bulkAdd(backup.data.quizReviews);

  // 3. Settings (XP, Level, Streak etc.) wiederherstellen
  if (backup.settings) {
    // Theme nicht überschreiben — User soll aktuelle Präferenz behalten
    const current = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    const merged  = { ...backup.settings, theme: current.theme ?? backup.settings.theme ?? 'dark' };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  }

  return {
    decks:       backup.data.decks.length,
    cards:       backup.data.cards.length,
    reviews:     backup.data.reviews.length,
    quizReviews: backup.data.quizReviews.length,
  };
}

/* ============================================================
   MERGE — Backup hinzufügen ohne bestehende Daten zu löschen.
   IDs werden remapped damit keine Konflikte entstehen.
   ============================================================ */
export async function mergeBackup(backup: VokaOrbitBackup): Promise<ImportResult> {
  const deckIdMap = new Map<number, number>();  // oldId → newId
  const cardIdMap = new Map<number, number>();

  let decksAdded = 0;
  let cardsAdded = 0;
  let reviewsAdded = 0;
  let quizReviewsAdded = 0;

  // Decks einfügen (ohne ID, Dexie vergibt neue)
  for (const deck of backup.data.decks) {
    const { id: oldId, ...deckData } = deck;
    const newId = await db.decks.add(deckData);
    if (oldId !== undefined) deckIdMap.set(oldId, newId as number);
    decksAdded++;
  }

  // Karten einfügen mit remappter deckId
  for (const card of backup.data.cards) {
    const { id: oldId, deckId, ...cardData } = card;
    const newDeckId = deckIdMap.get(deckId) ?? deckId;
    const newId = await db.cards.add({ ...cardData, deckId: newDeckId });
    if (oldId !== undefined) cardIdMap.set(oldId, newId as number);
    cardsAdded++;
  }

  // Reviews einfügen mit remappter cardId
  for (const review of backup.data.reviews) {
    const { id: _id, cardId, ...reviewData } = review;
    const newCardId = cardIdMap.get(cardId) ?? cardId;
    await db.reviews.add({ ...reviewData, cardId: newCardId });
    reviewsAdded++;
  }

  for (const qr of backup.data.quizReviews) {
    const { id: _id, cardId, ...qrData } = qr;
    const newCardId = cardIdMap.get(cardId) ?? cardId;
    await db.quizReviews.add({ ...qrData, cardId: newCardId });
    quizReviewsAdded++;
  }

  return { decks: decksAdded, cards: cardsAdded, reviews: reviewsAdded, quizReviews: quizReviewsAdded };
}
