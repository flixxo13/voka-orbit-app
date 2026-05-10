import { db, type Card, type Review } from './storage-local';

export async function getDueCards(deckId?: number, limit: number = 20) {
  // 1. Get all active decks first (handle undefined as active for backward compatibility)
  const allDecks = await db.decks.toArray();
  const activeDeckIds = new Set(allDecks.filter(d => d.isActive !== false).map(d => d.id));

  // 2. Get cards (either in specific deck or all active)
  let allCards;
  if (deckId !== undefined) {
    const targetDeck = allDecks.find(d => d.id === deckId);
    if (!targetDeck || targetDeck.isActive === false) return [];
    allCards = await db.cards.where('deckId').equals(deckId).toArray();
  } else {
    // Global review: only cards from active decks
    allCards = await db.cards.toArray();
    allCards = allCards.filter(c => activeDeckIds.has(c.deckId));
  }

  // 3. Get cards that have reviews and are due
  const now = Date.now();
  const dueReviews = await db.reviews
    .where('nextDueAt')
    .belowOrEqual(now)
    .toArray();

  const dueCardIds = new Set(dueReviews.map(r => r.cardId));
  const reviewedCardIds = new Set((await db.reviews.toArray()).map(r => r.cardId));
  
  const newCards = allCards.filter(c => !reviewedCardIds.has(c.id!));
  const dueCards = allCards.filter(c => dueCardIds.has(c.id!));
  
  // Mix due cards and new cards
  const sessionCards = [...dueCards, ...newCards].slice(0, limit);
  
  return sessionCards;
}
