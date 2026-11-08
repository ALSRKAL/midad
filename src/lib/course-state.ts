/**
 * Course state machine (BR-01, P04-T06).
 *
 * Central and pure: every transition the product allows is listed once. The builder can submit a
 * draft or a rejected course; publishing, rejecting, unlisting and archiving belong to the admin
 * phase and reuse this same table.
 */

export type CourseStatus =
  "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "UNLISTED" | "ARCHIVED";

export const COURSE_TRANSITIONS: Record<CourseStatus, readonly CourseStatus[]> = {
  DRAFT: ["PENDING_REVIEW"],
  // Admin decisions (P05-T02).
  PENDING_REVIEW: ["PUBLISHED", "REJECTED"],
  PUBLISHED: ["UNLISTED", "ARCHIVED"],
  REJECTED: ["DRAFT", "PENDING_REVIEW"],
  UNLISTED: ["PUBLISHED", "ARCHIVED"],
  ARCHIVED: [],
};

export function canTransition(from: CourseStatus, to: CourseStatus): boolean {
  return COURSE_TRANSITIONS[from].includes(to);
}

/** The builder may submit only from a draft or after a rejection (a fresh review round). */
export function canSubmitForReview(status: CourseStatus): boolean {
  return status === "DRAFT" || status === "REJECTED";
}
