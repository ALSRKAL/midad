/**
 * Shapes for the seed data. Everything a seeded course/professional record needs is typed here so
 * the data files stay honest: a missing Arabic field is a compile error, not a silent fallback.
 */

export type SeedCategory = {
  slug: string;
  nameAr: string;
  nameEn: string;
  /** lucide-react icon name, resolved through the shared <Icon> component. */
  icon: string;
  sortOrder: number;
};

export type SeedInstructor = {
  username: string;
  nameAr: string;
  nameEn: string;
  email: string;
  headlineAr: string;
  headlineEn: string;
  bioAr: string;
  bioEn: string;
  websiteUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
};

export type SeedOption = {
  textAr: string;
  textEn: string;
  isCorrect: boolean;
};

export type SeedQuestion = {
  type: "SINGLE_CHOICE" | "MULTI_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  promptAr: string;
  promptEn: string;
  explanationAr?: string;
  explanationEn?: string;
  points?: number;
  options?: SeedOption[];
  /** SHORT_ANSWER only; matched case-insensitively after normalization. */
  acceptedAnswers?: string[];
};

export type SeedQuiz = {
  titleAr: string;
  titleEn: string;
  passPct?: number;
  maxAttempts?: number;
  timeLimitSec?: number;
  questions: SeedQuestion[];
};

export type SeedLesson = {
  type: "VIDEO" | "TEXT" | "FILE" | "QUIZ";
  titleAr: string;
  titleEn: string;
  isPreview?: boolean;
  /** VIDEO: seconds of generated footage. TEXT/FILE: expected reading time. */
  durationSec?: number;
  /** Sanitized HTML for TEXT lessons (≥ 200 characters, enforced by the seeder). */
  contentAr?: string;
  contentEn?: string;
  /** FILE lessons ship a generated PDF attachment. */
  attachmentAr?: string;
  attachmentEn?: string;
  quiz?: SeedQuiz;
};

export type SeedSection = {
  titleAr: string;
  titleEn: string;
  lessons: SeedLesson[];
};

export type SeedObjective = {
  textAr: string;
  textEn: string;
};

export type SeedCourse = {
  slug: string;
  /** Must match a `username` in prisma/seed/data/instructors.ts */
  instructorUsername: string;
  /** Must match a `slug` in prisma/seed/data/categories.ts */
  categorySlug: string;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  descriptionAr: string;
  descriptionEn: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
  /** Spoken language of the content, independent from the interface locale. */
  language: "AR" | "EN";
  /** 0 = free course. Otherwise the price in halalas. */
  priceCents: number;
  objectives: SeedObjective[];
  requirements: SeedObjective[];
  sections: SeedSection[];
};
