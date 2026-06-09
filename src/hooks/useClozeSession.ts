import { useState, useEffect, useCallback, useMemo } from 'react';
import { getClozeCards, submitClozeReview, type ClozeData } from '../core/cloze-session';

export function useClozeSession(deckId?: number) {
  const [cards, setCards] = useState<ClozeData[]>([]);
  const [batchOffset, setBatchOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  // States per batch
  const [inputs, setInputs] = useState<string[]>(["", "", ""]);
  const [solved, setSolved] = useState<boolean[]>([false, false, false]);
  const [hadError, setHadError] = useState<boolean[]>([false, false, false]);
  const [showTranslation, setShowTranslation] = useState<boolean[]>([false, false, false]);
  const [showHints, setShowHints] = useState(false);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    // Wir laden ein großes Paket (z.B. 15), das sind 5 Runden á 3 Sätze
    const clozeCards = await getClozeCards(15);
    setCards(clozeCards);
    setBatchOffset(0);
    resetBatchState();
    setIsFinished(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const resetBatchState = () => {
    setInputs(["", "", ""]);
    setSolved([false, false, false]);
    setHadError([false, false, false]);
    setShowTranslation([false, false, false]);
    setShowHints(false);
  };

  const currentBatch = useMemo(() => {
    if (cards.length === 0) return [];
    const start = batchOffset * 3;
    // Es kann sein, dass wir am Ende weniger als 3 haben, aber wir haben ja beim Fetch abgeschnitten
    return cards.slice(start, start + 3);
  }, [cards, batchOffset]);

  const randomizedHintPool = useMemo(() => {
    const words = currentBatch.map(c => c.targetWord);
    // Shuffle
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    return words;
  }, [currentBatch]);

  useEffect(() => {
    // Wenn in der aktuellen Runde alle gelöst wurden
    if (currentBatch.length > 0 && solved.every((s, i) => i >= currentBatch.length || s)) {
      const timer = setTimeout(async () => {
        // RSR Updates in FSRS submitten
        for (let i = 0; i < currentBatch.length; i++) {
          const item = currentBatch[i];
          const errorMade = hadError[i];
          // Grade 4 für Perfect, 2 für Hard/Error
          const grade = errorMade ? 2 : 4;
          await submitClozeReview(item.card.id!, grade);
        }

        // Nächster Batch
        const nextOffset = batchOffset + 1;
        if (nextOffset * 3 >= cards.length) {
          setIsFinished(true);
        } else {
          setBatchOffset(nextOffset);
          resetBatchState();
        }
      }, 900); // 900ms Pause zum Freuen
      return () => clearTimeout(timer);
    }
  }, [solved, currentBatch, hadError, batchOffset, cards.length]);

  const handleTyping = (index: number, value: string) => {
    if (solved[index]) return;

    const target = currentBatch[index].targetWord;
    // Nur Buchstaben erlauben, evtl auch Bindestriche wenn nötig, aber standardmäßig letters
    const sanitizedValue = value.replace(/[^a-zA-ZäöüßÄÖÜ\-']/g, ""); 

    const currentLength = sanitizedValue.length;
    if (currentLength > 0) {
      const targetSub = target.substring(0, currentLength);
      // Case-insensitive Prüfung
      if (sanitizedValue.toLowerCase() !== targetSub.toLowerCase()) {
        setHadError(prev => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
      }
    }

    setInputs(prev => {
      const next = [...prev];
      next[index] = sanitizedValue;
      return next;
    });

    if (sanitizedValue.toLowerCase() === target.toLowerCase()) {
      setSolved(prev => {
        const next = [...prev];
        next[index] = true;
        return next;
      });
    }
  };

  const toggleTranslation = (index: number) => {
    setShowTranslation(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  return {
    cards,
    currentBatch,
    batchOffset,
    inputs,
    solved,
    hadError,
    showTranslation,
    showHints,
    setShowHints,
    randomizedHintPool,
    handleTyping,
    toggleTranslation,
    isLoading,
    isFinished,
    restart: loadSession
  };
}
