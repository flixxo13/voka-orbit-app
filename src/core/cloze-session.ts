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
function getGermanScore(text: string): number {
  let score = 0;
  // Starke Indikatoren: Umlaute
  if (/[äöüßÄÖÜß]/.test(text)) score += 3;
  
  const words = text.toLowerCase().match(/\b[a-zäöüß]+\b/g) || [];
  const germanStopWords = [
    'der', 'die', 'das', 'und', 'ist', 'ein', 'eine', 'einen', 'einem', 'einer',
    'mit', 'auf', 'für', 'sich', 'dem', 'des', 'den', 'zu', 'von', 'im', 'am',
    'wie', 'auch', 'es', 'sie', 'er', 'wir', 'ihr', 'dass', 'ich', 'du',
    'mich', 'dich', 'mir', 'dir', 'uns', 'ihnen', 'sein', 'haben', 'wird', 'werden',
    'sind', 'oder', 'als', 'um', 'noch', 'aus', 'nur', 'da', 'dann'
  ];
  
  for (const word of words) {
    if (germanStopWords.includes(word)) score += 1;
  }
  return score;
}

/**
 * Heuristik um zu bestimmen, welcher Teil der Karte das fremdsprachige Zielwort ist
 * und welcher der übersetzte Beispielsatz. Verhindert, dass deutsche Wörter
 * im Lückentext eingesetzt werden müssen.
 */
export function extractClozeData(card: Card): ClozeData {
  const frontLower = card.front.toLowerCase();
  const backLower = card.back.toLowerCase();
  const exFrontLower = (card.exampleFront || '').toLowerCase();
  const exBackLower = (card.exampleBack || '').toLowerCase();

  const scoreFront = getGermanScore(exFrontLower) + getGermanScore(frontLower);
  const scoreBack = getGermanScore(exBackLower) + getGermanScore(backLower);

  let targetWord = card.front;
  let sentence = card.exampleFront || '';
  let translation = card.exampleBack || '';

  // Wenn eine Seite deutlich "deutscher" ist als die andere, ist die ANDERE Seite die Fremdsprache
  if (scoreFront > scoreBack) {
    // Front ist Deutsch -> Back ist Fremdsprache
    targetWord = card.back;
    sentence = card.exampleBack || card.back;
    translation = card.exampleFront || card.front;
  } else if (scoreBack > scoreFront) {
    // Back ist Deutsch -> Front ist Fremdsprache
    targetWord = card.front;
    sentence = card.exampleFront || card.front;
    translation = card.exampleBack || card.back;
  } else {
    // Fallback falls Score gleich ist (z.B. beides 0 wegen sehr kurzer Sätze)
    if (exFrontLower.includes(frontLower)) {
      targetWord = card.front;
      sentence = card.exampleFront || card.front;
      translation = card.exampleBack || card.back;
    } else if (exBackLower.includes(backLower)) {
      targetWord = card.back;
      sentence = card.exampleBack || card.back;
      translation = card.exampleFront || card.front;
    } else {
      // Absoluter Fallback
      targetWord = card.front;
      sentence = card.exampleFront || card.front;
      translation = card.exampleBack || card.back;
    }
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
