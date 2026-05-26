import { db, type Card, type ClozeReview } from './storage-local';
import { calculateNextReview } from './fsrs';

export interface ClozeData {
  card: Card;
  targetWord: string;
  sentence: string;
  translation: string;
}

/**
 * Heuristik um zu bestimmen, welcher Teil der Karte das englische Zielwort ist
 * und welcher der übersetzte Beispielsatz.
 */
export function extractClozeData(card: Card): ClozeData {
  const frontLower = card.front.toLowerCase();
  const backLower = card.back.toLowerCase();
  const exFrontLower = (card.exampleFront || '').toLowerCase();
  const exBackLower = (card.exampleBack || '').toLowerCase();

  let targetWord = card.front;
  let sentence = card.exampleFront || '';
  let translation = card.exampleBack || '';

  if (exFrontLower.includes(frontLower)) {
    targetWord = card.front;
    sentence = card.exampleFront || '';
    translation = card.exampleBack || card.back;
  } else if (exBackLower.includes(backLower)) {
    targetWord = card.back;
    sentence = card.exampleBack || '';
    translation = card.exampleFront || card.front;
  } else if (exFrontLower.includes(backLower)) {
    targetWord = card.back;
    sentence = card.exampleFront || '';
    translation = card.exampleBack || card.front;
  } else if (exBackLower.includes(frontLower)) {
    targetWord = card.front;
    sentence = card.exampleBack || '';
    translation = card.exampleFront || card.back;
  } else {
    // Fallback
    targetWord = card.front;
    sentence = card.exampleFront || card.front;
    translation = card.exampleBack || card.back;
  }

  return { card, targetWord, sentence, translation };
}

export async function getClozeCards(limit: number = 15): Promise<ClozeData[]> {
  const allDecks = await db.decks.toArray();
  const activeDeckIds = new Set(allDecks.filter(d => d.isActive !== false).map(d => d.id));

  // Nur Karten mit Beispielsätzen laden
  let allCards = await db.cards.toArray();
  allCards = allCards.filter(c => activeDeckIds.has(c.deckId) && (c.exampleFront || c.exampleBack));

  const now = Date.now();
  const dueReviews = await db.clozeReviews
    .where('nextDueAt')
    .belowOrEqual(now)
    .toArray();

  const dueCardIds = new Set(dueReviews.map(r => r.cardId));
  const reviewedCardIds = new Set((await db.clozeReviews.toArray()).map(r => r.cardId));
  
  const newCards = allCards.filter(c => !reviewedCardIds.has(c.id!));
  const dueCards = allCards.filter(c => dueCardIds.has(c.id!));
  
  // Kombinieren und zuschneiden, auf ein Vielfaches von 3 (für die 3er-Batches)
  let selected = [...dueCards, ...newCards].slice(0, limit);
  
  // Sicherstellen, dass es ein Vielfaches von 3 ist
  const remainder = selected.length % 3;
  if (remainder !== 0) {
    selected = selected.slice(0, selected.length - remainder);
  }

  return selected.map(extractClozeData);
}

export async function submitClozeReview(cardId: number, grade: number) {
  const existingReview = await db.clozeReviews.where('cardId').equals(cardId).first();
  
  const nextReview = calculateNextReview(
    grade,
    existingReview?.interval,
    existingReview?.ease
  );

  const review: ClozeReview = {
    cardId,
    grade,
    reviewedAt: Date.now(),
    nextDueAt: nextReview.nextDueAt,
    interval: nextReview.nextInterval,
    ease: nextReview.nextEase
  };

  if (existingReview?.id) {
    await db.clozeReviews.update(existingReview.id, review);
  } else {
    await db.clozeReviews.add(review);
  }
}
