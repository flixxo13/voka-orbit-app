import { db, type Card, type QuizReview } from './storage-local';
import { calculateNextReview } from './fsrs';

export async function getQuizCards(deckId?: number, limit: number = 20) {
  const allDecks = await db.decks.toArray();
  const activeDeckIds = new Set(allDecks.filter(d => d.isActive !== false).map(d => d.id));

  let allCards: Card[];
  if (deckId !== undefined) {
    const targetDeck = allDecks.find(d => d.id === deckId);
    if (!targetDeck || targetDeck.isActive === false) return [];
    allCards = await db.cards.where('deckId').equals(deckId).toArray();
  } else {
    allCards = await db.cards.toArray();
    allCards = allCards.filter(c => activeDeckIds.has(c.deckId));
  }

  const now = Date.now();
  const dueReviews = await db.quizReviews
    .where('nextDueAt')
    .belowOrEqual(now)
    .toArray();

  const dueCardIds = new Set(dueReviews.map(r => r.cardId));
  const reviewedCardIds = new Set((await db.quizReviews.toArray()).map(r => r.cardId));
  
  const newCards = allCards.filter(c => !reviewedCardIds.has(c.id!));
  const dueCards = allCards.filter(c => dueCardIds.has(c.id!));
  
  return [...dueCards, ...newCards].slice(0, limit);
}

export async function getDistractors(card: Card, count: number = 2): Promise<string[]> {
  // 1. Try to get distractors from the same deck
  let sameDeckCards = await db.cards
    .where('deckId')
    .equals(card.deckId)
    .filter(c => c.id !== card.id)
    .toArray();

  // 2. If not enough, get from other active decks
  if (sameDeckCards.length < count) {
    const activeDecks = await db.decks.filter(d => d.isActive !== false).toArray();
    const activeIds = activeDecks.map(d => d.id).filter((id): id is number => id !== undefined);
    const otherCards = await db.cards
      .where('deckId')
      .anyOf(activeIds)
      .filter(c => c.id !== card.id && c.deckId !== card.deckId)
      .toArray();
    sameDeckCards = [...sameDeckCards, ...otherCards];
  }

  // Shuffle and pick
  const shuffled = sameDeckCards.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(c => c.back);
}

export async function submitQuizReview(cardId: number, grade: number) {
  const existingReview = await db.quizReviews.where('cardId').equals(cardId).first();
  
  const nextReview = calculateNextReview(
    grade,
    existingReview?.interval,
    existingReview?.ease
  );

  const review: QuizReview = {
    cardId,
    grade,
    reviewedAt: Date.now(),
    nextDueAt: nextReview.nextDueAt,
    interval: nextReview.nextInterval,
    ease: nextReview.nextEase
  };

  if (existingReview?.id) {
    await db.quizReviews.update(existingReview.id, review);
  } else {
    await db.quizReviews.add(review);
  }
}
