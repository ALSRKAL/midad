import { pick } from "../media";

/**
 * The learner population.
 *
 * Names are drawn deterministically from Arabic first/family-name pools so the seed is reproducible
 * and the platform never contains obviously fake data ("Student 1", "Test User"). Fixed accounts used
 * by the E2E journeys are declared separately and documented in README § Test accounts.
 */

export type SeedStudent = {
  username: string;
  nameAr: string;
  nameEn: string;
  email: string;
  locale: "AR" | "EN";
  theme: "LIGHT" | "DARK" | "SYSTEM";
  /** How long ago the account was created, so dashboards have a real spread of dates. */
  joinedDaysAgo: number;
  /** Persona drives how much activity the seeder attaches to the account. */
  persona: "newcomer" | "active" | "browser" | "graduate";
};

/** [Arabic, English] pairs — they are not transliterations of each other, just paired names. */
const FIRST_NAMES: ReadonlyArray<readonly [string, string]> = [
  ["عبدالله", "Abdullah"],
  ["نورة", "Noura"],
  ["محمد", "Mohammed"],
  ["لمى", "Lama"],
  ["سلطان", "Sultan"],
  ["ريم", "Reem"],
  ["عمر", "Omar"],
  ["دانة", "Dana"],
  ["فهد", "Fahad"],
  ["جواهر", "Jawaher"],
  ["أحمد", "Ahmed"],
  ["هيا", "Haya"],
  ["تركي", "Turki"],
  ["شهد", "Shahad"],
  ["بندر", "Bandar"],
  ["أسماء", "Asma"],
  ["ماجد", "Majed"],
  ["رنا", "Rana"],
  ["سعود", "Saud"],
  ["غادة", "Ghada"],
  ["ياسر", "Yasser"],
  ["منال", "Manal"],
  ["طلال", "Talal"],
  ["ابتسام", "Ibtisam"],
  ["ناصر", "Nasser"],
  ["وفاء", "Wafaa"],
  ["سامي", "Sami"],
  ["أمل", "Amal"],
  ["زياد", "Ziyad"],
  ["لطيفة", "Latifa"],
  ["إبراهيم", "Ibrahim"],
  ["سلمى", "Salma"],
  ["مشعل", "Mishal"],
  ["عالية", "Alia"],
  ["راشد", "Rashed"],
  ["نادية", "Nadia"],
  ["حسن", "Hassan"],
  ["تهاني", "Tahani"],
  ["منصور", "Mansour"],
  ["هند", "Hind"],
];

const FAMILY_NAMES: ReadonlyArray<readonly [string, string]> = [
  ["العتيبي", "Alotaibi"],
  ["القحطاني", "Alqahtani"],
  ["الشمري", "Alshammari"],
  ["الدوسري", "Aldosari"],
  ["المطيري", "Almutairi"],
  ["الحربي", "Alharbi"],
  ["الزهراني", "Alzahrani"],
  ["الغامدي", "Alghamdi"],
  ["العسيري", "Alasiri"],
  ["السبيعي", "Alsubaie"],
  ["البقمي", "Albaqami"],
  ["الرشيدي", "Alrashidi"],
  ["الجهني", "Aljohani"],
  ["المالكي", "Almalki"],
  ["السهلي", "Alsuhaili"],
  ["الأنصاري", "Alansari"],
  ["القرني", "Alqarni"],
  ["الشهري", "Alshehri"],
  ["الخالدي", "Alkhalidi"],
  ["النعيمي", "Alnuaimi"],
  ["البلوي", "Albalawi"],
  ["العنزي", "Alenezi"],
  ["الصاعدي", "Alsaedi"],
  ["الحمدان", "Alhamdan"],
];

/** Latin username from the English pair, made unique with the index. */
function usernameOf(englishName: string, index: number): string {
  return `${englishName.toLowerCase().replace(/\s+/g, ".")}.${index + 1}`;
}

export function buildStudents(count: number): SeedStudent[] {
  const students: SeedStudent[] = [];

  for (let index = 0; index < count; index += 1) {
    const first = FIRST_NAMES[index % FIRST_NAMES.length];
    const family = FAMILY_NAMES[Math.floor(index / FIRST_NAMES.length) % FAMILY_NAMES.length];
    if (first === undefined || family === undefined) continue;

    const nameAr = `${first[0]} ${family[0]}`;
    const nameEn = `${first[1]} ${family[1]}`;
    const username = usernameOf(nameEn, index);

    // Personas: most learners are mid-course, some just registered, a few finished everything.
    const roll = pick(username, "persona", 0, 99);
    const persona: SeedStudent["persona"] =
      roll < 35 ? "active" : roll < 60 ? "browser" : roll < 85 ? "newcomer" : "graduate";

    students.push({
      username,
      nameAr,
      nameEn,
      email: `${username}@midad.test`,
      locale: pick(username, "locale", 0, 99) < 78 ? "AR" : "EN",
      theme:
        pick(username, "theme", 0, 99) < 55
          ? "SYSTEM"
          : pick(username, "theme2", 0, 1) === 0
            ? "LIGHT"
            : "DARK",
      joinedDaysAgo: pick(username, "joined", 3, 720),
      persona,
    });
  }

  return students;
}

/**
 * Accounts the test suite depends on. Passwords are all `Midad-Test-2026` and hashed with
 * Better Auth's own hasher, so they work with the real sign-in flow (README § Test accounts).
 */
export const fixedAccounts = {
  admin: {
    username: "admin",
    nameAr: "مشرف المنصة",
    nameEn: "Platform Admin",
    email: "admin@midad.test",
  },
  studentWithProgress: {
    username: "student.demo",
    nameAr: "ريم الدوسري",
    nameEn: "Reem Aldosari",
    email: "student.demo@midad.test",
  },
  brandNewStudent: {
    username: "student.new",
    nameAr: "بدر الشمري",
    nameEn: "Badr Alshammari",
    email: "student.new@midad.test",
  },
  bannedStudent: {
    username: "student.banned",
    nameAr: "سلمان الحربي",
    nameEn: "Salman Alharbi",
    email: "student.banned@midad.test",
  },
  pendingApplicant: {
    username: "applicant.pending",
    nameAr: "أفنان البقمي",
    nameEn: "Afnan Albaqami",
    email: "applicant@midad.test",
  },
} as const;

/** Shared password for every seeded account (test only; documented in the README). */
export const SEED_PASSWORD = "Midad-Test-2026";
