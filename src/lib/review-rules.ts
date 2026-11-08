/**
 * Review rules (BR-18), pure.
 *
 * Only an active enrolment at or above the configured minimum progress may review; one review per
 * course; rating is 1–5. Aggregates are stored as rating ×100 in an integer column.
 */

export const REVIEW_MIN_PROGRESS_DEFAULT = 20;

export type ReviewEligibility =
  { allowed: true } | { allowed: false; reason: "ENROLLMENT_REQUIRED" | "PROGRESS_TOO_LOW" };

export function reviewEligibility(input: {
  enrolled: boolean;
  progressPct: number;
  minProgressPct: number;
}): ReviewEligibility {
  if (!input.enrolled) return { allowed: false, reason: "ENROLLMENT_REQUIRED" };
  if (input.progressPct < input.minProgressPct) {
    return { allowed: false, reason: "PROGRESS_TOO_LOW" };
  }
  return { allowed: true };
}

export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

export function averageRating(ratings: readonly number[]): { averageX100: number; count: number } {
  if (ratings.length === 0) return { averageX100: 0, count: 0 };
  if (ratings.some((rating) => !isValidRating(rating))) {
    throw new Error("ratings must be integers between 1 and 5");
  }
  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return {
    averageX100: Math.round((sum / ratings.length) * 100),
    count: ratings.length,
  };
}
