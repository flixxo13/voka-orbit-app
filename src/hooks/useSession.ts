import { useState, useEffect, useCallback } from 'react';
import { db, type Card, type Review } from '../core/storage-local';
import { calculateNextReview } from '../core/fsrs';
import { getDueCards } from '../core/session';

export function useSession(deckId?: number | null) {
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({ 
    completed: 0, 
    total: 0, 
    totalInDeck: 0, 
    activeDecks: [] as { name: string, count: number }[] 
  });

  const loadSession = useCallback(async () => {
    // If deckId is null, we are not in a session
    if (deckId === null) return;
    
    setIsLoading(true);
    const cards = await getDueCards(deckId === undefined ? undefined : deckId);
    
    // Check total cards to distinguish "nothing to do" from "no cards at all"
    let totalInDeck = 0;
    let activeDecks: { name: string, count: number }[] = [];
    
    if (deckId === undefined) {
      // Global - count cards in active decks
      const allActiveDecks = await db.decks.filter(d => d.isActive !== false).toArray();
      for (const deck of allActiveDecks) {
        if (deck.id !== undefined) {
          const count = await db.cards.where('deckId').equals(deck.id).count();
          activeDecks.push({ name: deck.name, count });
          totalInDeck += count;
        }
      }
    } else if (deckId !== null) {
      const deck = await db.decks.get(deckId);
      if (deck && deck.id !== undefined) {
        const count = await db.cards.where('deckId').equals(deck.id).count();
        activeDecks = [{ name: deck.name, count }];
        totalInDeck = count;
      }
    }

    setSessionCards(cards);
    setSessionStats({ completed: 0, total: cards.length, totalInDeck, activeDecks });
    setCurrentIndex(0);
    setIsLoading(false);
  }, [deckId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const submitReview = async (grade: number) => {
    const card = sessionCards[currentIndex];
    if (!card || !card.id) return;

    // Get existing review or create new
    const existingReview = await db.reviews.where('cardId').equals(card.id).first();
    
    const { nextInterval, nextEase, nextDueAt } = calculateNextReview(
      grade,
      existingReview?.interval || 0,
      existingReview?.ease || 2.5
    );

    const reviewData: Review = {
      cardId: card.id,
      grade,
      reviewedAt: Date.now(),
      nextDueAt,
      interval: nextInterval,
      ease: nextEase
    };

    if (existingReview?.id) {
      await db.reviews.update(existingReview.id, reviewData);
    } else {
      await db.reviews.add(reviewData);
    }

    // Update session state
    setSessionStats(prev => ({ ...prev, completed: prev.completed + 1 }));
    setCurrentIndex(prev => prev + 1);
  };

  return {
    currentCard: sessionCards[currentIndex] || null,
    isFinished: currentIndex >= sessionCards.length && sessionCards.length > 0,
    isLoading,
    sessionStats,
    submitReview,
    resetSession: loadSession
  };
}
