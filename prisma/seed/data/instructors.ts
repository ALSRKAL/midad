import type { SeedInstructor } from "../types";

/**
 * Ten instructors. `username` is the public profile handle (/instructors/[username]) and is the key
 * courses reference — keep it stable.
 *
 * `instructor.demo@midad.test` is the fixed test account used by the E2E journeys (README § Test accounts).
 */
export const instructors: SeedInstructor[] = [
  {
    username: "noor-almutairi",
    nameAr: "نور المطيري",
    nameEn: "Noor Almutairi",
    email: "instructor.demo@midad.test",
    headlineAr: "مهندسة برمجيات ومدرّبة على تطوير الويب الحديث",
    headlineEn: "Software engineer teaching modern web development",
    bioAr:
      "عملت ثماني سنوات في بناء واجهات ويب لمنتجات كبيرة، وبدأت التدريب لأنها رأت أن كثيرًا من المبتدئين يتعلمون الأدوات قبل المفاهيم. تشرح في دوراتها لماذا يُختار كل حل، لا كيف يُكتب فقط.",
    bioEn:
      "Eight years building web interfaces for large products. She teaches because too many beginners learn tools before concepts, so her courses explain why a solution is chosen, not just how to type it.",
    websiteUrl: "https://noor-almutairi.example",
    twitterUrl: "https://twitter.com/noor-almutairi",
    linkedinUrl: "https://linkedin.com/in/noor-almutairi",
  },
  {
    username: "khalid-alharbi",
    nameAr: "خالد الحربي",
    nameEn: "Khalid Alharbi",
    email: "khalid.alharbi@midad.test",
    headlineAr: "مهندس أنظمة وقواعد بيانات عالية الحمل",
    headlineEn: "Systems and high-load database engineer",
    bioAr:
      "أمضى أحد عشر عامًا في تشغيل أنظمة تخدم ملايين الطلبات اليومية. يركز في تدريبه على ما يفعله المقياس بالأداء فعليًا، من الاستعلام إلى النشر.",
    bioEn:
      "Eleven years operating systems that serve millions of daily requests. His teaching focuses on what scale actually does to performance, from the query to the deploy.",
    linkedinUrl: "https://linkedin.com/in/khalid-alharbi",
  },
  {
    username: "sara-alqahtani",
    nameAr: "سارة القحطاني",
    nameEn: "Sara Alqahtani",
    email: "sara.alqahtani@midad.test",
    headlineAr: "مصممة تجربة مستخدم لأدوات المؤسسات",
    headlineEn: "Product designer for enterprise tools",
    bioAr:
      "متخصصة في تصميم الأدوات المعقّدة: لوحات بيانات، صلاحيات، تدفقات إدارية. تؤمن أن الوضوح الشكلي جزء من المنطق، لا زينة بعده.",
    bioEn:
      "Specialises in complex tools: dashboards, permissions, admin flows. She treats visual clarity as part of the logic rather than decoration on top of it.",
    websiteUrl: "https://sara-alqahtani.example",
  },
  {
    username: "abdulrahman-alzahrani",
    nameAr: "عبدالرحمن الزهراني",
    nameEn: "Abdulrahman Alzahrani",
    email: "abdulrahman.alzahrani@midad.test",
    headlineAr: "عالم بيانات متخصص في النماذج اللغوية العربية",
    headlineEn: "Data scientist working on Arabic language models",
    bioAr:
      "يعمل على تحسين أداء النماذج اللغوية مع العربية خاصة، من التنظيف والتطبيع إلى تقييم الجودة. يقدّم في دوراته خطوات قابلة للتكرار لا نتائج مبهرة فقط.",
    bioEn:
      "Works on improving language models for Arabic in particular, from cleaning and normalization to quality evaluation. His courses give reproducible steps rather than impressive screenshots.",
    linkedinUrl: "https://linkedin.com/in/abdulrahman-alzahrani",
  },
  {
    username: "maryam-alotaibi",
    nameAr: "مريم العتيبي",
    nameEn: "Maryam Alotaibi",
    email: "maryam.alotaibi@midad.test",
    headlineAr: "مستشارة إدارة منتجات رقمية",
    headlineEn: "Digital product management consultant",
    bioAr:
      "ساعدت فرقًا كثيرة على الانتقال من قائمة مطالب بلا أولوية خطة إلى خطط لها أهداف قابلة للقياس. تركيزها على القرار، ومن يملكه، وكيف يُراجع.",
    bioEn:
      "Helped many teams move from an unordered backlog to plans with measurable goals. Her focus is the decision itself: who owns it and how it gets revisited.",
    websiteUrl: "https://maryam-alotaibi.example",
  },
  {
    username: "yousef-alrashidi",
    nameAr: "يوسف الرشيدي",
    nameEn: "Yousef Alrashidi",
    email: "yousef.alrashidi@midad.test",
    headlineAr: "محاسب قانوني ومدرّب معايير التقارير المالية",
    headlineEn: "Chartered accountant and financial reporting trainer",
    bioAr:
      "راجع دفاتر شركات صغيرة ومتوسطة لأربعة عشر عامًا. يشرح المعايير بأمثلة من دفاتر حقيقية مجهولة الهوية، ويبني من القيد إلى القوائم خطوة خطوة.",
    bioEn:
      "Fourteen years auditing small and mid-sized company books. He teaches standards through anonymised real ledgers, building from the journal entry to the statements step by step.",
  },
  {
    username: "hind-alshehri",
    nameAr: "هند الشهري",
    nameEn: "Hind Alshehri",
    email: "hind.alshehri@midad.test",
    headlineAr: "مدرّبة لغة إنجليزية أكاديمية ومهنية",
    headlineEn: "Academic and professional English trainer",
    bioAr:
      "درّست الكتابة الأكاديمية لطلاب الدراسات العليا تسع سنوات، وتعرف أن المشكلة غالبًا في البنية لا في المفردات. تركّز على التفكير قبل الصياغة.",
    bioEn:
      "Nine years teaching academic writing to graduate students. She knows the problem is usually structure rather than vocabulary, so she teaches thinking before phrasing.",
    websiteUrl: "https://hind-alshehri.example",
  },
  {
    username: "faisal-alduwais",
    nameAr: "فيصل الدويس",
    nameEn: "Faisal Alduwais",
    email: "faisal.alduwais@midad.test",
    headlineAr: "متخصص تسويق أداء وتحليلات رقمية",
    headlineEn: "Performance marketing and web analytics specialist",
    bioAr:
      "أدار ميزانيات إعلانية لأسواق عربية بلهجات مختلفة، وتعلّم أن الرسالة تسبق الميزانية. يدرّب على قياس القيمة لا جمع الأرقام.",
    bioEn:
      "Managed ad budgets across different Arabic dialect markets and learned that the message comes before the budget. He trains people to measure value rather than collect numbers.",
    linkedinUrl: "https://linkedin.com/in/faisal-alduwais",
  },
  {
    username: "nouf-alenezi",
    nameAr: "نوف العنزي",
    nameEn: "Nouf Alenezi",
    email: "nouf.alenezi@midad.test",
    headlineAr: "مصممة مناهج تقييم تعليمي",
    headlineEn: "Curriculum and assessment designer",
    bioAr:
      "بنَت مناهج تدريب مهني في خمس قطاعات، وتقيس أثر التدريب على الأداء في العمل لا على الدرجات. تصمم تقييمات تكشف الفهم لا الحفظ.",
    bioEn:
      "Built vocational curricula across five sectors and measures training by performance at work, not by test scores. She designs assessments that reveal understanding instead of recall.",
  },
  {
    username: "omar-bafail",
    nameAr: "عمر بافيل",
    nameEn: "Omar Bafail",
    email: "omar.bafail@midad.test",
    headlineAr: "مهندس أمن تطبيقات ومراجعة كود",
    headlineEn: "Application security engineer and code reviewer",
    bioAr:
      "يراجع كودًا إنتاجيًا يوميًا، ويكرر أن معظم الثغرات تأتي من افتراض لم يُختبر. يعرض في دوراته الثغرة، ثم كيف كانت ستُمنع بكتابة أسطر أقل.",
    bioEn:
      "Reviews production code daily and repeats that most vulnerabilities come from an untested assumption. His courses show the flaw, then how fewer lines of code would have prevented it.",
    linkedinUrl: "https://linkedin.com/in/omar-bafail",
  },
];

export const demoInstructorEmail = "instructor.demo@midad.test";
