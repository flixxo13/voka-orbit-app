import Dexie, { type Table } from 'dexie';

export interface Deck {
  id?: number;
  name: string;
  language: string;
  createdAt: number;
  isActive: boolean; // New property
}

export interface Card {
  id?: number;
  deckId: number;
  front: string;
  back: string;
  exampleFront?: string;
  exampleBack?: string;
  createdAt: number;
}

export interface Review {
  id?: number;
  cardId: number;
  grade: number; // 1: Again, 2: Hard, 3: Good, 4: Easy
  reviewedAt: number;
  nextDueAt: number;
  interval: number; // in days
  ease: number; // ease factor
}

export interface QuizReview extends Review {}

export class VokaOrbitDB extends Dexie {
  decks!: Table<Deck>;
  cards!: Table<Card>;
  reviews!: Table<Review>;
  quizReviews!: Table<QuizReview>;

  constructor() {
    super('VokaOrbitDB');
    this.version(3).stores({
      decks: '++id, name, language, isActive',
      cards: '++id, deckId, front, back',
      reviews: '++id, cardId, nextDueAt',
      quizReviews: '++id, cardId, nextDueAt'
    });
  }
}

export const db = new VokaOrbitDB();
