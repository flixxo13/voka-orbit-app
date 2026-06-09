import { addDays } from 'date-fns';

/**
 * Simple FSRS-like algorithm for MVP.
 * Returns the next interval and ease factor based on the grade.
 */
export function calculateNextReview(
  grade: number,
  currentInterval: number = 0,
  currentEase: number = 2.5
) {
  let nextInterval: number;
  let nextEase = currentEase;

  // Grade: 1: Again, 2: Hard, 3: Good, 4: Easy
  switch (grade) {
    case 1: // Again
      nextInterval = 0; // Review again in the same session or very soon
      nextEase = Math.max(1.3, currentEase - 0.2);
      break;
    case 2: // Hard
      nextInterval = currentInterval === 0 ? 1 : Math.max(1, currentInterval * 1.2);
      nextEase = Math.max(1.3, currentEase - 0.15);
      break;
    case 3: // Good
      nextInterval = currentInterval === 0 ? 1 : Math.max(1, currentInterval * currentEase);
      break;
    case 4: // Easy
      nextInterval = currentInterval === 0 ? 4 : Math.max(1, currentInterval * currentEase * 1.3);
      nextEase = currentEase + 0.15;
      break;
    default:
      nextInterval = 1;
  }

  const nextDueAt = addDays(new Date(), nextInterval).getTime();

  return {
    nextInterval,
    nextEase,
    nextDueAt
  };
}
