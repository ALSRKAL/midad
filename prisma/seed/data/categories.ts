import type { SeedCategory } from "../types";

/**
 * Eight catalogue categories, Arabic-first.
 * `slug` is stable: courses reference it, and the catalogue URLs are built from it (/categories/[slug]).
 */
export const categories: SeedCategory[] = [
  {
    slug: "programming",
    nameAr: "البرمجة وتطوير البرمجيات",
    nameEn: "Programming & Software Development",
    icon: "Code2",
    sortOrder: 1,
  },
  {
    slug: "design",
    nameAr: "التصميم وتجربة المستخدم",
    nameEn: "Design & UX",
    icon: "PenTool",
    sortOrder: 2,
  },
  {
    slug: "data",
    nameAr: "البيانات والذكاء الاصطناعي",
    nameEn: "Data & Artificial Intelligence",
    icon: "Database",
    sortOrder: 3,
  },
  {
    slug: "business",
    nameAr: "إدارة الأعمال وريادة المشاريع",
    nameEn: "Business & Entrepreneurship",
    icon: "Briefcase",
    sortOrder: 4,
  },
  {
    slug: "finance",
    nameAr: "المحاسبة والمالية",
    nameEn: "Accounting & Finance",
    icon: "Calculator",
    sortOrder: 5,
  },
  {
    slug: "languages",
    nameAr: "اللغات والترجمة",
    nameEn: "Languages & Translation",
    icon: "Languages",
    sortOrder: 6,
  },
  {
    slug: "marketing",
    nameAr: "التسويق والمحتوى الرقمي",
    nameEn: "Marketing & Digital Content",
    icon: "Megaphone",
    sortOrder: 7,
  },
  {
    slug: "education",
    nameAr: "التعليم والتدريب",
    nameEn: "Teaching & Training",
    icon: "GraduationCap",
    sortOrder: 8,
  },
];
