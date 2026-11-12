import { describe, expect, it } from "vitest";

import {
  canSubmitForReview,
  canTransition,
  COURSE_TRANSITIONS,
  type CourseStatus,
} from "@/lib/course-state";

/** BR-01: every transition is either listed or rejected; there is no implicit path. */

const ALL: CourseStatus[] = [
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "REJECTED",
  "UNLISTED",
  "ARCHIVED",
];

describe("COURSE_TRANSITIONS (BR-01)", () => {
  it("allows DRAFT → PENDING_REVIEW and nothing else from a draft", () => {
    expect(canTransition("DRAFT", "PENDING_REVIEW")).toBe(true);
    expect(canTransition("DRAFT", "PUBLISHED")).toBe(false);
    expect(canTransition("DRAFT", "ARCHIVED")).toBe(false);
  });

  it("allows REJECTED → DRAFT and REJECTED → PENDING_REVIEW", () => {
    expect(canTransition("REJECTED", "DRAFT")).toBe(true);
    expect(canTransition("REJECTED", "PENDING_REVIEW")).toBe(true);
    expect(canTransition("REJECTED", "PUBLISHED")).toBe(false);
  });

  it("allows PUBLISHED → UNLISTED | ARCHIVED only", () => {
    expect(canTransition("PUBLISHED", "UNLISTED")).toBe(true);
    expect(canTransition("PUBLISHED", "ARCHIVED")).toBe(true);
    expect(canTransition("PUBLISHED", "DRAFT")).toBe(false);
  });

  it("allows the admin decisions PENDING_REVIEW → PUBLISHED | REJECTED", () => {
    expect(canTransition("PENDING_REVIEW", "PUBLISHED")).toBe(true);
    expect(canTransition("PENDING_REVIEW", "REJECTED")).toBe(true);
    expect(canTransition("PENDING_REVIEW", "DRAFT")).toBe(false);
    expect(canTransition("PENDING_REVIEW", "ARCHIVED")).toBe(false);
  });

  it("treats ARCHIVED as terminal", () => {
    expect(COURSE_TRANSITIONS.ARCHIVED).toHaveLength(0);
    for (const target of ALL) {
      expect(canTransition("ARCHIVED", target)).toBe(false);
    }
  });
});

describe("canSubmitForReview", () => {
  it("is true for DRAFT and REJECTED", () => {
    expect(canSubmitForReview("DRAFT")).toBe(true);
    expect(canSubmitForReview("REJECTED")).toBe(true);
  });

  it("is false for every other status", () => {
    for (const status of ALL.filter((item) => item !== "DRAFT" && item !== "REJECTED")) {
      expect(canSubmitForReview(status), status).toBe(false);
    }
  });
});
