import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../core/storage-local';

export function useStats(deckId?: number) {
  const stats = useLiveQuery(async () => {
    let allCards;
    if (deckId) {
      allCards = await db.cards.where('deckId').equals(deckId).toArray();
    } else {
      const activeDecks = await db.decks.filter(d => d.isActive !== false).toArray();
      const activeIds = activeDecks.map(d => d.id).filter((id): id is number => id !== undefined);
      allCards = await db.cards.where('deckId').anyOf(activeIds).toArray();
    }
    
    const allReviews = await db.reviews.toArray();
    const cardIds = new Set(allCards.map(c => c.id));
    const deckReviews = allReviews.filter(r => cardIds.has(r.cardId));

    const totalCards = allCards.length;
    const totalReviewed = deckReviews.length;
    const newCards = totalCards - totalReviewed;

    // Learning stages
    const learning = deckReviews.filter(r => r.interval < 1).length;
    const review = deckReviews.filter(r => r.interval >= 1).length;

    // Retention (Average Grade)
    const avgGrade = deckReviews.length > 0
      ? deckReviews.reduce((acc, r) => acc + r.grade, 0) / deckReviews.length
      : 0;

    // Next due distribution
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const dueNow = deckReviews.filter(r => r.nextDueAt <= now).length;
    const overdueCount = deckReviews.filter(r => r.nextDueAt < todayMs).length;
    const totalDue = dueNow + newCards;
    
    // Decks info
    const allDecks = await db.decks.toArray();
    const activeDecks = allDecks.filter(d => d.isActive !== false);
    
    return {
      totalCards,
      newCards,
      learning,
      review,
      totalReviewed,
      avgGrade,
      dueNow,
      overdueCount,
      totalDue,
      activeDecksCount: activeDecks.length,
      totalDecksCount: allDecks.length,
      activeDecksNames: activeDecks.map(d => d.name),
      lastUpdate: Date.now()
    };
  }, [deckId]);

  return stats;
}

export function useGlobalStats() {
  return useStats();
}

export function useDetailedCardStats() {
  return useLiveQuery(async () => {
    const cards = await db.cards.toArray();
    const reviews = await db.reviews.toArray();
    const decks = await db.decks.toArray();
    
    return cards.map(card => {
      const review = reviews.find(r => r.cardId === card.id);
      const deck = decks.find(d => d.id === card.deckId);
      return {
        ...card,
        review,
        deckName: deck?.name || 'Unbekannt'
      };
    }).sort((a, b) => {
      // Sort by next due date, then by creation date
      if (a.review && b.review) return a.review.nextDueAt - b.review.nextDueAt;
      if (a.review) return -1;
      if (b.review) return 1;
      return b.createdAt - a.createdAt;
    });
  });
}
