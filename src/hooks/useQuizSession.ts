import { useState, useEffect, useCallback } from 'react';
import { type Card } from '../core/storage-local';
import { getQuizCards, getDistractors, submitQuizReview } from '../core/quiz-session';

export interface QuizQuestion {
  card: Card;
  options: string[];
}

export function useQuizSession(deckId?: number) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    const cards = await getQuizCards(deckId);
    
    const quizQuestions = await Promise.all(cards.map(async (card) => {
      const distractors = await getDistractors(card);
      const options = [card.back, ...distractors].sort(() => 0.5 - Math.random());
      return { card, options };
    }));

    setQuestions(quizQuestions);
    setCurrentIndex(0);
    setIsFinished(false);
    setIsLoading(false);
  }, [deckId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const submitAnswer = async (grade: number) => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;
    await submitQuizReview(currentQuestion.card.id!, grade);
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  return {
    currentQuestion: questions[currentIndex],
    currentIndex,
    totalQuestions: questions.length,
    isLoading,
    isFinished,
    submitAnswer,
    nextQuestion,
    restart: loadSession
  };
}
