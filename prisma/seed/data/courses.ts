import type { SeedCourse } from "../types";

/** 30 seeded courses: five free entry points, the rest priced, spread across the eight categories. */
export const courses: SeedCourse[] = [
  {
    slug: "modern-react-app-development",
    instructorUsername: "noor-almutairi",
    categorySlug: "programming",
    titleAr: "تطبيقات React الحديثة: من المكوّن إلى النشر",
    titleEn: "Modern React Applications: From Component to Deployment",
    subtitleAr: "مسار عملي لبناء واجهة منتج حقيقي، مع إدارة الحالة والبيانات والاختبارات",
    subtitleEn: "A hands-on path to shipping a real product interface with state, data, and tests",
    descriptionAr:
      "تبدأ الدورة من سؤال يربك كثيرًا من المبتدئين: أين تسكن الحالة، ومتى تنتقل من حالة محلية إلى حالة مشتركة. نبني واجهة لوحة مهام صغيرة، ثم نضيف إليها التصفية والتحرير الفوري، ونقرّر عند كل خطوة أي جزء يستحق أن يصبح مكوّنًا مستقلًا وأي جزء يُترك داخل مكانه.\n\nفي الجزء الثاني ننتقل إلى جلب البيانات: كيف نتعامل مع حالات التحميل والفشل، وكيف نبني طبقة وصول تفصل النداءات عن مقاطع الواجهة حتى يسهل اختبارها. نختتم بجلسة عن الأداء ومراجعة قبل النشر، ونبني قائمة مراجعة ملموسة تغطي الاختبارات، وخطأ الشبكة، وسلوك الواجهة على الهاتف.",
    descriptionEn:
      "The course starts from the question that confuses most beginners: where does state live, and when does local state have to become shared state. We build a small task-board interface, then add filtering and inline editing, deciding at each step which piece earns its own component and which is better left where it sits.\n\nThe second part moves to data fetching: handling loading and failure states, and building a data-access layer that keeps network calls out of the view so they can be tested on their own. We close with performance and a pre-release review, ending with a concrete checklist covering tests, network failure, and phone-sized layouts.",
    level: "INTERMEDIATE",
    language: "AR",
    priceCents: 24900,
    objectives: [
      {
        textAr: "تفكّك واجهة معقّدة إلى مكوّنات ذات مسؤولية واحدة قبل كتابة أي كود.",
        textEn:
          "Break a complex interface into single-responsibility components before writing code.",
      },
      {
        textAr: "تقرّر أي حالة تبقى محلية وأيها يجب أن تُشارك بين المكوّنات.",
        textEn: "Decide which state stays local and which must be shared across components.",
      },
      {
        textAr: "تبني طبقة وصول للبيانات تعزل نداءات الشبكة عن مقاطع الواجهة.",
        textEn: "Build a data-access layer that isolates network calls from view code.",
      },
      {
        textAr: "تعالج حالات التحميل والفشل والبيانات الفارغة دون ترك المستخدم في فراغ.",
        textEn: "Handle loading, failure, and empty states without leaving the user stranded.",
      },
      {
        textAr: "تقيس تكلفة إعادة التصيير وتقلّلها عند الحاجة فقط.",
        textEn: "Measure re-render cost and reduce it only where it matters.",
      },
      {
        textAr: "تُجهّز قائمة مراجعة قبل النشر تغطي الاختبارات وسلوك الهاتف.",
        textEn: "Prepare a pre-release checklist covering tests and phone-sized behaviour.",
      },
    ],
    requirements: [
      {
        textAr: "معرفة أساسية بـ JavaScript: الدوال، المصفوفات، والكائنات.",
        textEn: "Basic JavaScript: functions, arrays, and objects.",
      },
      {
        textAr: "تعامل بسيط مع الطرفية وتثبيت الحزم عبر npm.",
        textEn: "Comfort with a terminal and installing packages with npm.",
      },
      {
        textAr: "جهاز يستطيع تشغيل مشروع Node محليًا.",
        textEn: "A machine able to run a Node project locally.",
      },
    ],
    sections: [
      {
        titleAr: "المكوّنات وإدارة الحالة",
        titleEn: "Components and State",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "ما الذي تغيّر فعلًا في React الحديث",
            titleEn: "What actually changed in modern React",
            isPreview: true,
            durationSec: 420,
          },
          {
            type: "VIDEO",
            titleAr: "تقسيم الواجهة إلى مكوّنات ذات مسؤولية واحدة",
            titleEn: "Splitting the UI into single-responsibility components",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "الحالة المحلية ومتى يكفي useState",
            titleEn: "Local state and when useState is enough",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "تمرير البيانات: الخصائص مقابل السياق",
            titleEn: "Passing data: props versus context",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: كيف يمرّ التصيير عبر شجرة المكوّنات",
            titleEn: "Reading: how rendering travels the component tree",
            durationSec: 360,
            contentAr:
              "<p>عند أي تغيّر في الحالة، يعيد React تصيير المكوّن الذي تغيّرت حالته ثم يتابع نزولًا إلى أبنائه. هذا يعني أن انفجار عدد مرات التصيير غالبًا سببه أن الحالة وُضعت أعلى من اللازم في الشجرة.</p><h3>أسئلة عملية قبل رفع الحالة</h3><ul><li>هل يقرأ هذه القيمة أكثر من مكوّن؟ إن كان الجواب لا، فأبقها محلية.</li><li>هل تتغيّر بوتيرة مختلفة عن بقية الشجرة؟ فصلها يوفّر عملًا.</li><li>هل يمكن اشتقاقها من قيمة أخرى؟ إذًا لا تخزّنها.</li></ul><p>القاعدة العملية: <strong>الحالة المشتقّة مشكلة تنتظر الحدوث</strong>. إذا كان بإمكانك حساب قيمة من أخرى، فاحسبها عند الحاجة بدل أن تحفظها وتحدّثها يدويًا.</p>",
            contentEn:
              "<p>When state changes, React re-renders the component that owns it, then walks down to its children. That is why most render storms come from state sitting higher in the tree than it needs to.</p><h3>Questions to ask before lifting state</h3><ul><li>Does more than one component read this value? If not, keep it local.</li><li>Does it change at a different rate than the rest of the tree? Separating it saves work.</li><li>Can it be derived from another value? Then do not store it.</li></ul><p>The working rule: <strong>derived state is a bug waiting to happen</strong>. If you can compute a value from another one, compute it on demand instead of storing and syncing it.</p>",
          },
        ],
      },
      {
        titleAr: "جلب البيانات وتنظيم الطبقات",
        titleEn: "Data Fetching and Layering",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "حالات التحميل والخطأ والبيانات الفارغة",
            titleEn: "Loading, error, and empty states",
            isPreview: true,
            durationSec: 480,
          },
          {
            type: "VIDEO",
            titleAr: "بناء طبقة وصول للبيانات قابلة للاختبار",
            titleEn: "Building a testable data-access layer",
            durationSec: 720,
          },
          {
            type: "VIDEO",
            titleAr: "تجنّب الطلبات المكرّرة والتخزين المؤقت",
            titleEn: "Avoiding duplicate requests and caching responses",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: اختيار طريقة إدارة الحالة المشتركة",
            titleEn: "Reading: choosing how to manage shared state",
            durationSec: 420,
            contentAr:
              "<p>لا تبدأ بمكتبة إدارة حالة. ابدأ بثلاث قيم تُقرأ في أماكن متباعدة، وراقب الألم. إن كان الألم في تمرير الخصائص عبر طبقات لا تهتم بها، فالسياق كافٍ. وإن كان في تناسق التحديثات عبر شاشات، فحينها فقط فكّر في مكتبة.</p><h3>معيار واحد للقرار</h3><p>اسأل: <em>كم مكانًا يجب أن ألمسه لإضافة حقل جديد؟</em> إن كان الجواب أكثر من ثلاثة، فالتنظيم الحالي سيكلّفك لاحقًا. سجّل هذا الرقم قبل وبعد أي إعادة هيكلة لتقيس الأثر بدل الشعور به.</p><p>تذكّر أن مكتبة إدارة الحالة لا تعالج مشكلة تصميم الطلب نفسه؛ إن كان الطلب كبيرًا أو بطيئًا فستنقله كما هو إلى مكان أنيق.</p>",
            contentEn:
              "<p>Do not start with a state library. Start with three values read in places far apart and watch the pain. If the pain is threading props through layers that do not care, context is enough. If it is keeping updates consistent across screens, only then reach for a library.</p><h3>One decision test</h3><p>Ask: <em>how many places must I touch to add a new field?</em> If the answer is more than three, the current layout will cost you later. Record that number before and after any refactor so you measure the change instead of feeling it.</p><p>Remember that a state library does not fix a badly shaped request; if the call is large or slow, it just moves it somewhere tidier.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الحالة وجلب البيانات",
            titleEn: "Quiz: state and data fetching",
            quiz: {
              titleAr: "اختبار: الحالة وجلب البيانات",
              titleEn: "Quiz: state and data fetching",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 900,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "متى يكون رفع الحالة إلى المكوّن الأب مبرَّرًا؟",
                  promptEn: "When is lifting state to the parent component justified?",
                  explanationAr:
                    "نرفع الحالة عندما تحتاجها أكثر من شجرة فرعية واحدة؛ غير ذلك تبقى محلية.",
                  explanationEn:
                    "Lift state when more than one subtree needs it; otherwise it stays local.",
                  options: [
                    {
                      textAr: "عندما يقرأها أكثر من مكوّن في شجرتين مختلفتين",
                      textEn: "When more than one component in two different subtrees reads it",
                      isCorrect: true,
                    },
                    {
                      textAr: "دائمًا، لأن الحالة المركزية أسهل في التتبع",
                      textEn: "Always, because central state is easier to trace",
                      isCorrect: false,
                    },
                    {
                      textAr: "عندما تكون القيمة نصًّا قصيرًا فقط",
                      textEn: "Only when the value is a short string",
                      isCorrect: false,
                    },
                    {
                      textAr: "عندما نريد أن تعمل الاختبارات أسرع",
                      textEn: "When we want tests to run faster",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يُعدّ حالة مشتقّة يُفضّل ألّا تُخزَّن؟",
                  promptEn: "Which of these are derived state that is better not stored?",
                  explanationAr:
                    "المجموع ونتيجة التصفية يُحسبان من بيانات موجودة، فلا داعي لتخزينهما وتحديثهما يدويًا.",
                  explanationEn:
                    "A total and a filtered list are computed from existing data, so storing and syncing them is unnecessary.",
                  options: [
                    {
                      textAr: "مجموع أسعار عناصر السلة",
                      textEn: "The total price of cart items",
                      isCorrect: true,
                    },
                    {
                      textAr: "قائمة العناصر بعد تطبيق مرشّح البحث",
                      textEn: "The item list after the search filter is applied",
                      isCorrect: true,
                    },
                    {
                      textAr: "معرّف المستخدم المسجّل حاليًا",
                      textEn: "The id of the currently signed-in user",
                      isCorrect: false,
                    },
                    {
                      textAr: "نصّ الحقل الذي يكتب فيه المستخدم",
                      textEn: "The text the user is typing in a field",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "تجنّب الطلبات المكرّرة لا يفيد إلا في التطبيقات الكبيرة جدًا.",
                  promptEn: "Avoiding duplicate requests only helps in very large applications.",
                  explanationAr:
                    "التكرار يضاعف الضغط على الخادم ويظهر وميضًا في الواجهة حتى في التطبيقات الصغيرة.",
                  explanationEn:
                    "Duplicates double server load and cause flicker even in small apps.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr:
                    "ما اسم الدالة التي نستخدمها لتنفيذ كود بعد تغيّر الحالة عند الاعتماد على حالة سابقة؟",
                  promptEn:
                    "Which function form do we use to run code based on the previous state value?",
                  explanationAr:
                    "الصيغة الدالّية للحالة تمنحك القيمة السابقة بأمان: setCount(function).",
                  explanationEn:
                    "The functional form of the setter hands you the previous value safely: setCount(function).",
                  acceptedAnswers: [
                    "updater",
                    "functional update",
                    "setState callback",
                    "previous state",
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما أفضل موضع لاستدعاء الشبكة في تصميم نظيف؟",
                  promptEn: "Where does the network call belong in a clean design?",
                  explanationAr:
                    "عزل النداء في طبقة وصول يجعل الواجهة تعرض حالات فقط، والاختبار لا يحتاج شبكة حقيقية.",
                  explanationEn:
                    "Isolating the call in a data layer lets the view render states only, and tests need no real network.",
                  options: [
                    {
                      textAr: "داخل طبقة وصول مستقلة عن الواجهة",
                      textEn: "Inside a data layer separate from the view",
                      isCorrect: true,
                    },
                    { textAr: "داخل ملف الـ CSS", textEn: "Inside the CSS file", isCorrect: false },
                    {
                      textAr: "مباشرة في نصّ كل مكوّن",
                      textEn: "Directly in the body of every component",
                      isCorrect: false,
                    },
                    {
                      textAr: "في ملف إعدادات الحزم",
                      textEn: "In the package configuration file",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "الجودة والنشر",
        titleEn: "Quality and Release",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "اختبارات المكوّنات: من الوحدة إلى التكامل",
            titleEn: "Component tests: from unit to integration",
            durationSec: 780,
          },
          {
            type: "VIDEO",
            titleAr: "تقليل إعادة التصيير حيث يظهر الأثر",
            titleEn: "Reducing re-renders where it shows",
            durationSec: 660,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: قائمة مراجعة قبل النشر",
            titleEn: "Reading: the pre-release checklist",
            durationSec: 300,
            contentAr:
              "<p>المراجعة قبل النشر ليست حفلًا للتذكير بتفاصيل يعرفها الجميع، بل قائمة قرارات صغيرة تُتخذ مسبقًا حين لا يكون هناك وقت للتفكير. اكتبها مرة واحدة ثم استخدمها في كل إصدار.</p><h3>بنود لا تُنسى</h3><ul><li>ماذا يرى المستخدم عند فشل الطلب؟ <code>error boundary</code> أم رسالة صامتة؟</li><li>هل تظهر أزرار الحفظ أثناء الإرسال بشكل يمنع النقر المزدوج؟</li><li>هل يعمل التخطيط عند عرض 320 بكسل وحدود النص الطويل؟</li></ul><p>أضف بندًا خاصًا بمشروعك: اللوحة الوحيدة التي تُنسى غالبًا هي شاشة <strong>البيانات الفارغة</strong>، فيصل المستخدم الأول إلى فراغ يوم الإطلاق.</p>",
            contentEn:
              "<p>A pre-release review is not a reminder of details everybody knows; it is a list of small decisions made in advance for when there is no time to think. Write it once, then reuse it every release.</p><h3>Lines people forget</h3><ul><li>What does the user see when a request fails? An <code>error boundary</code> or silence?</li><li>Are save buttons disabled while the request is in flight, so double clicks cannot happen?</li><li>Does the layout hold at 320 pixels wide and with overlong text?</li></ul><p>Add one item specific to your project: the screen most often forgotten is <strong>empty data</strong>, and the first real user lands on it on launch day.</p>",
          },
          {
            type: "FILE",
            titleAr: "قائمة مراجعة ما قبل النشر",
            titleEn: "Pre-release checklist",
            durationSec: 300,
            attachmentAr: "قائمة مراجعة ما قبل النشر: 24 بندًا",
            attachmentEn: "Pre-release checklist: 24 items",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الجودة والنشر",
            titleEn: "Quiz: quality and release",
            quiz: {
              titleAr: "اختبار: الجودة والنشر",
              titleEn: "Quiz: quality and release",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما الهدف الأساسي من وضع شبكة الحماية حول الأخطاء (error boundary)؟",
                  promptEn: "What is the main purpose of an error boundary?",
                  explanationAr: "شبكة الحماية تمنع خطأ مكوّن واحد من إفراغ الصفحة كلها.",
                  explanationEn:
                    "An error boundary stops one component's failure from blanking the whole page.",
                  options: [
                    {
                      textAr: "منع سقوط الصفحة كاملة عند فشل مكوّن واحد",
                      textEn: "Prevent the whole page from crashing when one component fails",
                      isCorrect: true,
                    },
                    {
                      textAr: "تسريع تحميل ملفات الصور",
                      textEn: "Speed up image file loading",
                      isCorrect: false,
                    },
                    {
                      textAr: "تنسيق الأكواد تلقائيًا",
                      textEn: "Format code automatically",
                      isCorrect: false,
                    },
                    {
                      textAr: "ترجمة الواجهة إلى لغات أخرى",
                      textEn: "Translate the interface into other languages",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "تعطيل زر الحفظ أثناء الإرسال يقلّل الطلبات المكرّرة.",
                  promptEn:
                    "Disabling the save button while submitting reduces duplicate requests.",
                  explanationAr:
                    "النقر المزدوج مسؤول عن طلبات مكرّرة كثيرة، والتعطيل المؤقت أسهل حل لها.",
                  explanationEn:
                    "Double clicks cause many duplicate requests, and a temporary disable is the simplest fix.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما اسم الشاشة التي يراها المستخدم قبل إدخال أي بيانات؟",
                  promptEn: "What do we call the screen a user sees before entering any data?",
                  explanationAr:
                    "شاشة البيانات الفارغة هي أول ما يراه المستخدم الجديد، وتُنسى كثيرًا.",
                  explanationEn:
                    "The empty state is the first thing a new user sees and is often forgotten.",
                  acceptedAnswers: ["empty state", "empty", "blank state"],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "أي قياس يخبرك أن تقليل إعادة التصيير نجح؟",
                  promptEn: "Which measurement tells you a render reduction worked?",
                  explanationAr: "عدد مرات التصيير المُلاحَظ فعليًا هو الدليل، لا الانطباع.",
                  explanationEn: "The observed render count is the evidence, not the feeling.",
                  options: [
                    {
                      textAr: "عدد مرات تصيير المكوّن قبل التعديل وبعده",
                      textEn: "The component render count before and after the change",
                      isCorrect: true,
                    },
                    {
                      textAr: "عدد الأسطر في الملف",
                      textEn: "The number of lines in the file",
                      isCorrect: false,
                    },
                    {
                      textAr: "لون الشريط الجانبي",
                      textEn: "The colour of the sidebar",
                      isCorrect: false,
                    },
                    {
                      textAr: "عدد الأعضاء في الفريق",
                      textEn: "The number of teammates",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يستحق بندًا في قائمة المراجعة قبل النشر؟",
                  promptEn: "Which of these deserve a line in the pre-release checklist?",
                  explanationAr: "سلوك الفشل وسلوك الشاشات الصغيرة قرارات تُتخذ قبل النشر لا بعده.",
                  explanationEn:
                    "Failure behaviour and small-screen behaviour are decisions made before release, not after.",
                  options: [
                    {
                      textAr: "سلوك الواجهة عند فشل الطلب",
                      textEn: "Interface behaviour when a request fails",
                      isCorrect: true,
                    },
                    {
                      textAr: "التخطيط على شاشة الهاتف",
                      textEn: "Layout on a phone screen",
                      isCorrect: true,
                    },
                    {
                      textAr: "اسم عامل التنسيق",
                      textEn: "The formatter's name",
                      isCorrect: false,
                    },
                    {
                      textAr: "خطوط الموقع التسويقي",
                      textEn: "The marketing site fonts",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "typescript-from-zero-to-shipping",
    instructorUsername: "noor-almutairi",
    categorySlug: "programming",
    titleAr: "TypeScript من الصفر إلى أول نشر",
    titleEn: "TypeScript From Zero to Your First Release",
    subtitleAr: "تعلّم النظام النوعي عبر إصلاح مشروع فيه أخطاء حقيقية، لا عبر تعريفات مجرّدة",
    subtitleEn:
      "Learn the type system by fixing a project with real errors, not abstract definitions",
    descriptionAr:
      "كثير من الدورات تشرح TypeScript كقائمة قواعد، فيحفظ المتعلّم الصياغة ولا يعرف متى يستخدمها. هنا نبدأ بمشروع فيه أخطاء فعلية: دالة تُعيد أحيانًا قيمة غائبة، وكائن حذفت منه خاصية، ووسيط اختياري يُعامل معاملة إلزامي. نصلح كل خطأ ونشرح ما الذي منعه النظام النوعي وما الذي لم يمنعه.\n\nثم نتدرّج إلى الأنواع العامة والعقد بين الوحدات: كيف تصف شكل بيانات قادمة من واجهة برمجية، وكيف تولّد الأنواع من المخطط بدل كتابتها يدويًا. في النهاية نُعدّ إعدادات صارمة للتحقّق النوعي في سلسلة التكامل، ونوضح متى يكون إسكات الخطأ مبررًا ومتى يخفي عيبًا حقيقيًا.",
    descriptionEn:
      "Many courses present TypeScript as a list of rules, so learners memorise syntax without knowing when to use it. We start instead from a project that already has bugs: a function that sometimes returns nothing, an object missing a property, and an optional argument treated as required. We fix each error and explain what the type system caught and what it did not.\n\nFrom there we move to generics and the contract between modules: describing the shape of data arriving from an API, and generating types from a schema instead of writing them by hand. We finish by turning on strict checking in CI, and by being honest about when silencing an error is justified and when it hides a real defect.",
    level: "BEGINNER",
    language: "AR",
    priceCents: 0,
    objectives: [
      {
        textAr: "تقرأ رسائل الأخطاء النوعية وتصلح سببها لا مظهرها.",
        textEn: "Read type errors and fix their cause rather than their appearance.",
      },
      {
        textAr: "تفرّق بين النوع الذي يصف قيمة والنوع الذي يصف عقدًا بين وحدتين.",
        textEn:
          "Tell the difference between a type describing a value and one describing a module contract.",
      },
      {
        textAr: "توصف أنواع البيانات القادمة من واجهة برمجية دون تكرار الكتابة.",
        textEn: "Describe API response types without duplicating definitions.",
      },
      {
        textAr: "تستخدم الأنواع العامة لبناء دوال تعمل مع أشكال بيانات مختلفة بأمان.",
        textEn: "Use generics to build functions that safely work across different data shapes.",
      },
      {
        textAr: "تضبط تحقّقًا نوعيًا صارمًا في سلسلة التكامل مع مراجعة تدريجية.",
        textEn: "Configure strict type checking in CI with a gradual adoption plan.",
      },
      {
        textAr: "تُبرّر كل إسكات لخطأ نوعي وتوثّقه في الكود.",
        textEn: "Justify every suppressed type error and document it in code.",
      },
    ],
    requirements: [
      {
        textAr: "معرفة عملية بـ JavaScript الأساسية.",
        textEn: "Working knowledge of basic JavaScript.",
      },
      {
        textAr: "محرّر أكواد يدعم فحص الأنواع أثناء الكتابة.",
        textEn: "An editor that type-checks while you type.",
      },
      {
        textAr: "لا حاجة إلى خبرة سابقة بـ TypeScript.",
        textEn: "No prior TypeScript experience needed.",
      },
    ],
    sections: [
      {
        titleAr: "الأساسيات عبر إصلاح مشروع",
        titleEn: "Fundamentals by Fixing a Project",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا نضيف نظامًا نوعيًا إلى JavaScript أصلًا",
            titleEn: "Why add a type system to JavaScript at all",
            isPreview: true,
            durationSec: 360,
          },
          {
            type: "VIDEO",
            titleAr: "الأنواع الأساسية والاستنتاج التلقائي",
            titleEn: "Primitive types and inference",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "قيمة قد تكون غائبة: التعامل مع undefined",
            titleEn: "Values that may be absent: handling undefined",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "الأصناف مقابل الأنواع: أيهما نختار",
            titleEn: "Classes versus types: which to choose",
            durationSec: 480,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: استنتاج النوع صديق إن لم يُساء استخدامه",
            titleEn: "Reading: inference is a friend when left alone",
            durationSec: 300,
            contentAr:
              '<p>أفضل كود TypeScript هو الذي تكتب فيه أقل عدد من التصريحات النوعية. كل تصريح تكتبه بيدك هو وعد تقطعه للمترجم، وإذا كان الوعد خاطئًا سيسكت المترجم عن خطأ حقيقي لاحقًا.</p><h3>متى نكتب النوع صراحة؟</h3><ul><li>عند حدود الوحدة: مدخلات الدالة ومخرجاتها.</li><li>عند البيانات القادمة من الخارج: واجهة برمجية أو ملف إعدادات.</li><li>عندما يكون الاستنتاج أوسع من المقصود.</li></ul><p>مثال شائع: <code>const status = "draft"</code> يُستنتج كنصّ عام، بينما <code>const status = "draft" as const</code> يحفظ القيمة الحرفية ويمنع تمرير أي نصّ آخر.</p>',
            contentEn:
              '<p>The best TypeScript writes the fewest annotations. Every annotation you type by hand is a promise to the compiler, and a wrong promise will silence a real error later.</p><h3>When to annotate explicitly</h3><ul><li>At module boundaries: a function\'s inputs and outputs.</li><li>For data from outside: an API or a config file.</li><li>When inference is wider than you intend.</li></ul><p>A common example: <code>const status = "draft"</code> is inferred as a general string, while <code>const status = "draft" as const</code> keeps the literal value and rejects any other string.</p>',
          },
        ],
      },
      {
        titleAr: "العقود والأنواع العامة",
        titleEn: "Contracts and Generics",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "وصف شكل بيانات واجهة برمجية",
            titleEn: "Describing an API response shape",
            isPreview: true,
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "الأنواع العامة: دوال تعمل مع أشكال متعددة",
            titleEn: "Generics: functions that work across shapes",
            durationSec: 720,
          },
          {
            type: "VIDEO",
            titleAr: "الاتحادات والتمييز الآمن بين الحالات",
            titleEn: "Unions and safe narrowing",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: توليد الأنواع من المخطط بدل كتابتها",
            titleEn: "Reading: generating types from a schema",
            durationSec: 360,
            contentAr:
              "<p>كتابة الأنواع يدويًا مقابل واجهة برمجية تعني أنك ستقضي وقتًا في إصلاح فروق صغيرة بين ما ظننته وما هو موجود. الحل هو أن يكون المخطط مصدر الحقيقة، وتُلَدّ الأنواع منه.</p><h3>خطوات عملية</h3><ul><li>احصل على وصف رسمي للواجهة: <code>openapi.json</code> أو مخططات الاستعلام.</li><li>شغّل مُولّدًا ينتج ملفًا واحدًا للأنواع.</li><li>أضف خطوة التوليد إلى سكربت البناء حتى لا تتقادم الأنواع.</li></ul><p>النتيجة أن أي تغيير في الخادم يظهر كخطأ نوعي في الطرفية قبل أن يكتشفه المستخدم.</p>",
            contentEn:
              "<p>Hand-writing types against an API means spending time fixing small differences between what you assumed and what exists. The fix is to make the schema the source of truth and generate types from it.</p><h3>Steps that work</h3><ul><li>Get a formal description: <code>openapi.json</code> or query schemas.</li><li>Run a generator that emits a single types file.</li><li>Add the generation step to your build script so types cannot go stale.</li></ul><p>The result: a server change surfaces as a type error in your terminal before a user ever finds it.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: العقود والأنواع العامة",
            titleEn: "Quiz: contracts and generics",
            quiz: {
              titleAr: "اختبار: العقود والأنواع العامة",
              titleEn: "Quiz: contracts and generics",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما أفضل وصف للنوع العام (generic)؟",
                  promptEn: "What best describes a generic type?",
                  explanationAr:
                    "النوع العام معامل يُحلّ عند الاستخدام، فيحفظ العلاقة بين المدخل والمخرج.",
                  explanationEn:
                    "A generic is a parameter resolved at use time, preserving the link between input and output.",
                  options: [
                    {
                      textAr: "معامل نوع يُحلّ عند الاستخدام ويحفظ العلاقة بين المدخل والمخرج",
                      textEn:
                        "A type parameter resolved at use time that preserves the input-output link",
                      isCorrect: true,
                    },
                    {
                      textAr: "نصّ يمكن تغييره أثناء التشغيل",
                      textEn: "A string that can change at runtime",
                      isCorrect: false,
                    },
                    {
                      textAr: "طريقة لتعطيل التحقّق النوعي",
                      textEn: "A way to disable type checking",
                      isCorrect: false,
                    },
                    {
                      textAr: "أداة لتنسيق الكود",
                      textEn: "A code formatting tool",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "كتابة المزيد من الأنواع يدويًا تجعل الكود أكثر أمانًا دائمًا.",
                  promptEn: "Writing more annotations by hand always makes code safer.",
                  explanationAr: "التصريح الخاطئ يخفي أخطاء حقيقية، فالمزيد ليس أفضل دائمًا.",
                  explanationEn:
                    "A wrong annotation hides real errors, so more is not always better.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي سبب مشروع لتوليد الأنواع من مخطط؟",
                  promptEn: "Which of these justify generating types from a schema?",
                  explanationAr: "توليد الأنواع يمنع التقادم ويقلّل الفروق اليدوية.",
                  explanationEn:
                    "Generated types prevent drift and reduce hand-written mismatches.",
                  options: [
                    {
                      textAr: "منع تقادم الأنواع بعد تغيّر الخادم",
                      textEn: "Preventing drift after a server change",
                      isCorrect: true,
                    },
                    {
                      textAr: "تقليل الفروق اليدوية بين الطرفين",
                      textEn: "Reducing manual mismatches between the two sides",
                      isCorrect: true,
                    },
                    {
                      textAr: "إخفاء أخطاء الشبكة",
                      textEn: "Hiding network errors",
                      isCorrect: false,
                    },
                    {
                      textAr: "تسريع قاعدة البيانات",
                      textEn: "Speeding up the database",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الكلمة المفتاحية التي تمنع توسيع النوع الحرفي إلى نصّ عام؟",
                  promptEn:
                    "Which keyword stops a literal type from widening into a general string?",
                  explanationAr: "as const يحفظ القيمة الحرفية ويمنع التوسيع.",
                  explanationEn: "as const keeps the literal value and prevents widening.",
                  acceptedAnswers: ["as const", "asconst", "const assertion", "as literal"],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "لماذا نكتب الأنواع صراحة عند حدود الوحدة؟",
                  promptEn: "Why annotate explicitly at module boundaries?",
                  explanationAr:
                    "الحدّ هو نقطة الاتفاق مع كود آخر، فوضوحه يمنع الالتباس عبر النظام.",
                  explanationEn:
                    "A boundary is the agreement point with other code, so clarity there prevents confusion across the system.",
                  options: [
                    {
                      textAr: "لأن الحدّ نقطة اتفاق مع كود آخر يجب أن تكون واضحة",
                      textEn:
                        "Because the boundary is an agreement point with other code that must be clear",
                      isCorrect: true,
                    },
                    {
                      textAr: "لأن المترجم يرفض الأنواع المُستنتجة",
                      textEn: "Because the compiler rejects inferred types",
                      isCorrect: false,
                    },
                    {
                      textAr: "لتقليل حجم الملف النهائي",
                      textEn: "To shrink the final bundle",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأن الأنواع الصريحة أسرع عند التشغيل",
                      textEn: "Because explicit types are faster at runtime",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "الصرامة والانطلاق",
        titleEn: "Strictness and Shipping",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "تشغيل الفحص الصارم على مشروع قائم",
            titleEn: "Turning on strict checks in an existing project",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "الأنواع على حواف النظام: التحقّق عند المدخل",
            titleEn: "Types at the edges: validating at the boundary",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "ترتيب الأولويات: أي ملفات نُشدّد عليها أولًا",
            titleEn: "Sequencing: which files to make strict first",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: إسكات الخطأ: متى يكون مبرَّرًا",
            titleEn: "Reading: silencing an error: when is it justified",
            durationSec: 300,
            contentAr:
              "<p>لكل مشروع لحظات يظهر فيها خطأ نوعي لا يبدو أن له حلًّا أنيقًا. قبل أن تكتب أي إسكات، اسأل سؤالًا واحدًا: <em>هل أعرف يقينًا ما الذي سيحدث عند التشغيل؟</em></p><h3>قاعدة عملية</h3><ul><li>إن كان الجواب نعم، فاكتب الإسكات مع تعليق يشرح السبب وشرطه.</li><li>إن كان الجواب لا، فالمشكلة في الفهم لا في النظام النوعي.</li><li>لا تُسكِت خطأً في ملف مشترك دون إبلاغ من يملكه.</li></ul><p>الإسكات الجيد مؤقّت ومحصور في سطر واحد؛ الإسكات السيّئ يبدأ بملف ويصبح عادة في المستودع كله.</p>",
            contentEn:
              "<p>Every project reaches a point where a type error seems to have no tidy fix. Before writing any suppression, ask one question: <em>do I know with certainty what happens at runtime?</em></p><h3>A working rule</h3><ul><li>If yes, write the suppression with a comment stating the reason and its condition.</li><li>If no, the gap is in your understanding, not in the type system.</li><li>Never silence an error in a shared file without telling its owner.</li></ul><p>Good suppression is temporary and confined to one line; bad suppression starts in one file and becomes a habit across the repository.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الصرامة والنشر",
            titleEn: "Quiz: strictness and shipping",
            quiz: {
              titleAr: "اختبار: الصرامة والنشر",
              titleEn: "Quiz: strictness and shipping",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما أفضل توقيت لتشغيل وضع الصرامة في مشروع قائم؟",
                  promptEn: "What is the best time to enable strict mode in an existing project?",
                  explanationAr: "التدريج على وحدات صغيرة يجعل الصرامة ممكنة دون إيقاف العمل.",
                  explanationEn:
                    "Rolling it out module by module keeps strict mode adoptable without stopping work.",
                  options: [
                    {
                      textAr: "تدريجيًا، وحدة بعد وحدة، مع إبقاء البناء أخضر",
                      textEn: "Gradually, module by module, keeping the build green",
                      isCorrect: true,
                    },
                    {
                      textAr: "مرة واحدة على كل الملفات وفي يوم إطلاق",
                      textEn: "All files at once on launch day",
                      isCorrect: false,
                    },
                    {
                      textAr: "بعد حذف كل الاختبارات",
                      textEn: "After deleting all tests",
                      isCorrect: false,
                    },
                    {
                      textAr: "بعد إيقاف سلسلة التكامل",
                      textEn: "After disabling CI",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "التحقّق النوعي يجعل التحقّق عند التشغيل غير ضروري.",
                  promptEn: "Static type checking makes runtime validation unnecessary.",
                  explanationAr:
                    "الأنواع تختفي عند التشغيل؛ بيانات المستخدم والشبكة تحتاج تحقّقًا فعليًا.",
                  explanationEn:
                    "Types vanish at runtime; user and network data still need real validation.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الذي يجب أن يرافق كل إسكات لخطأ نوعي؟",
                  promptEn: "What must accompany every suppressed type error?",
                  explanationAr: "التعليق يشرح السبب والشرط، فيمنع تحوّل الإسكات إلى عادة دائمة.",
                  explanationEn:
                    "A comment explaining the reason and condition prevents suppression becoming a permanent habit.",
                  acceptedAnswers: ["comment", "explanation", "note", "reason"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يحتاج تحقّقًا عند التشغيل رغم وجود الأنواع؟",
                  promptEn: "Which of these still need runtime validation despite having types?",
                  explanationAr: "بيانات المستخدم واستجابة الشبكة تأتي من خارج حدود برنامجك.",
                  explanationEn:
                    "User input and network responses come from outside your program's boundary.",
                  options: [
                    {
                      textAr: "مدخلات النماذج من المستخدم",
                      textEn: "Form input from the user",
                      isCorrect: true,
                    },
                    {
                      textAr: "استجابة واجهة برمجية خارجية",
                      textEn: "A response from an external API",
                      isCorrect: true,
                    },
                    {
                      textAr: "ثابت معرّف داخل الملف",
                      textEn: "A constant defined inside the file",
                      isCorrect: false,
                    },
                    {
                      textAr: "نوع دالة محلية",
                      textEn: "A local function's type",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "متى يكون إسكات الخطأ مبرَّرًا؟",
                  promptEn: "When is suppressing an error justified?",
                  explanationAr: "التبرير يبدأ من يقين بما سيحدث عند التشغيل، موثّقًا.",
                  explanationEn:
                    "The justification starts from certainty about runtime behaviour, documented.",
                  options: [
                    {
                      textAr: "عندما نعرف يقينًا سلوك التشغيل ونوثّق السبب",
                      textEn:
                        "When we know the runtime behaviour with certainty and document the reason",
                      isCorrect: true,
                    },
                    {
                      textAr: "عندما يكون الملف طويلًا",
                      textEn: "When the file is long",
                      isCorrect: false,
                    },
                    {
                      textAr: "عندما يقترب موعد التسليم",
                      textEn: "When a deadline is near",
                      isCorrect: false,
                    },
                    {
                      textAr: "عندما يطلب زميل ذلك",
                      textEn: "When a colleague asks",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "backend-apis-with-node-and-postgres",
    instructorUsername: "khalid-alharbi",
    categorySlug: "programming",
    titleAr: "بناء واجهات برمجية خلفية بـ Node وقواعد PostgreSQL",
    titleEn: "Building Backend APIs with Node and PostgreSQL",
    subtitleAr: "من مخطط قاعدة البيانات إلى واجهة موثّقة تتحمّل ضغطًا واقعيًا",
    subtitleEn: "From a database schema to a documented API that holds up under real load",
    descriptionAr:
      "نبني خدمة إدارة مخزون صغيرة من الصفر، لكن كل قرار يُتخذ لسبب مذكور. نبدأ بمخطط قاعدة بيانات بسيط ونراجع الفهارس التي يحتاجها فعلًا، ثم نكتب أول نقطة نهاية ونقيس زمن استجابتها قبل أن نضيف أي ميزة جديدة. الهدف أن تعرف بأرقامك أين يقضي الخادم وقته.\n\nفي النصف الثاني نعالج ما يفشل عادة في الإنتاج: الطلبات المتزامنة على نفس السجل، والمعاملات التي يجب أن تنجح كاملة أو لا تنجح، وصفحات النتائج الكبيرة. نختتم بالتوثيق والتحقّق من المدخلات، ونوضّح كيف تُراجع الفهارس والاستعلامات قبل أن تصبح مشكلة يشتكي منها المستخدمون.",
    descriptionEn:
      "We build a small inventory service from scratch, but every decision is made for a stated reason. We start from a simple schema and review only the indexes it truly needs, then write the first endpoint and measure its response time before adding any new feature. The goal is knowing, with your own numbers, where the server spends its time.\n\nThe second half tackles what usually fails in production: concurrent requests against the same row, transactions that must succeed whole or not at all, and large result pages. We close with documentation and input validation, and with how to review indexes and queries before they become something users complain about.",
    level: "INTERMEDIATE",
    language: "AR",
    priceCents: 29900,
    objectives: [
      {
        textAr: "تصمّم مخطط قاعدة بيانات وتراجع فهارسها وفق أنماط الاستعلام الفعلية.",
        textEn: "Design a database schema and review its indexes against real query patterns.",
      },
      {
        textAr: "تبني نقاط نهاية واضحة المسؤولية مع تحقّق من المدخلات.",
        textEn: "Build endpoints with clear responsibility and input validation.",
      },
      {
        textAr: "تعزل منطق قاعدة البيانات عن طبقة HTTP لتسهيل الاختبار.",
        textEn: "Isolate database logic from the HTTP layer for easier testing.",
      },
      {
        textAr: "تعالج التزامن والمعاملات دون سباقات على البيانات.",
        textEn: "Handle concurrency and transactions without data races.",
      },
      {
        textAr: "تقيس زمن الاستجابة وتحدّد الاستعلام البطيء بدل التخمين.",
        textEn: "Measure response time and identify the slow query instead of guessing.",
      },
      {
        textAr: "توثّق الواجهة البرمجية بوصف قابل للتنفيذ لا بملف نصّي منفصل.",
        textEn: "Document the API with a runnable description, not a separate text file.",
      },
    ],
    requirements: [
      {
        textAr: "معرفة بأساسيات JavaScript ووعد أو async/await.",
        textEn: "Knowledge of JavaScript basics plus promises or async/await.",
      },
      {
        textAr: "معرفة أساسية بـ SQL: الجداول والاستعلامات والانضمام.",
        textEn: "Basic SQL: tables, queries, and joins.",
      },
      {
        textAr: "قدرة على تشغيل PostgreSQL محليًا أو عبر حاوية.",
        textEn: "Ability to run PostgreSQL locally or in a container.",
      },
      {
        textAr: "تعامل مع الطرفية وبيئة تطوير جاهزة.",
        textEn: "Comfort with a terminal and a ready dev environment.",
      },
    ],
    sections: [
      {
        titleAr: "المخطط والاستعلامات",
        titleEn: "Schema and Queries",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "تصميم مخطط يخدم أسئلة العمل لا النموذج المثالي",
            titleEn: "Designing a schema that serves business questions",
            isPreview: true,
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "الفهارس: متى تنفع ومتى تبطئ الكتابة",
            titleEn: "Indexes: when they help and when they slow writes",
            durationSec: 720,
          },
          {
            type: "VIDEO",
            titleAr: "قراءة خطة التنفيذ واستخراج الفحص الكامل",
            titleEn: "Reading an execution plan and spotting a full scan",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "الانضمامات بدل الاستعلامات المتكررة",
            titleEn: "Joins instead of repeated queries",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: كيف تقرأ خطّة التنفيذ دون خبرة سابقة",
            titleEn: "Reading: how to read an execution plan with no prior experience",
            durationSec: 360,
            contentAr:
              "<p>خطّة التنفيذ ليست وثيقة سريّة؛ هي خطوات ينوي محرّك قواعد البيانات تنفيذها. ابحث فيها عن ثلاث كلمات أولًا: <code>Seq Scan</code> و<code>Index Scan</code> و<code>Nested Loop</code>، ثم قارن الجهد التقديري بما تراه.</p><h3>ثلاث علامات تحتاج انتباهك</h3><ul><li>فحص كامل لجدول كبير في استعلام يتكرّر على الصفحة الأولى.</li><li>عدد الصفوف المقدَّر يختلف اختلافًا كبيرًا عن الفعلي.</li><li>فرز على القرص بسبب قائمة نتائج ضخمة.</li></ul><p>ابدأ دائمًا بالاستعلام الأبطأ لا بالأصغر، فالتحسين جهة واحدة: الأثر على المستخدم.</p>",
            contentEn:
              "<p>An execution plan is not a secret document; it is the sequence of steps the database engine intends to take. Look first for three words: <code>Seq Scan</code>, <code>Index Scan</code>, and <code>Nested Loop</code>, then compare the estimated cost with what you observe.</p><h3>Three signals worth attention</h3><ul><li>A full scan of a large table in a query that runs on every first page load.</li><li>Estimated row counts far from the actual ones.</li><li>A disk sort caused by an oversized result list.</li></ul><p>Always start with the slowest query rather than the smallest; optimisation has one direction, and it is the effect on the user.</p>",
          },
        ],
      },
      {
        titleAr: "النقاط الطرفية والمنطق",
        titleEn: "Endpoints and Logic",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "بنية طبقة الخدمة وفصلها عن HTTP",
            titleEn: "Service-layer structure and separating it from HTTP",
            isPreview: true,
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "التحقّق من المدخلات ورسائل الخطأ",
            titleEn: "Input validation and error messages",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "المعاملات: كل العمليات تنجح أو لا شيء منها",
            titleEn: "Transactions: all steps succeed or none do",
            durationSec: 720,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: منع السباقات عند التحديث المتزامن",
            titleEn: "Reading: preventing races on concurrent updates",
            durationSec: 420,
            contentAr:
              "<p>قراءة قيمة، ثم حساب قيمة جديدة، ثم كتابتها: هذا النمط يبدو سليمًا ويسبّب فقدان تحديثات عند تزامن مستخدمين. الحل ليس قفل الجدول ولا انتظارًا طويلًا، بل جعل قاعدة البيانات تفصلك عند الكتابة.</p><h3>خياران شائعان</h3><ul><li>شرط على القيمة المقروءة: <code>UPDATE stock SET qty = qty - 1 WHERE id = 7 AND qty &gt;= 1</code>.</li><li>قفل السجل أثناء المعاملة: <code>SELECT ... FOR UPDATE</code> ثم التحديث.</li></ul><p>أول إشارة إلى أن لديك سباقًا هي أرقام لا تتطابق مع المنطق: مخزون سالب، أو خصم مُطبَّق مرتين. أضف قيدًا في قاعدة البيانات نفسها لتكون آخر خط دفاع.</p>",
            contentEn:
              "<p>Read a value, compute a new one, write it back: this pattern looks correct and loses updates when two users act at once. The fix is neither table locking nor long waits, but letting the database arbitrate at write time.</p><h3>Two common options</h3><ul><li>A condition on the read value: <code>UPDATE stock SET qty = qty - 1 WHERE id = 7 AND qty &gt;= 1</code>.</li><li>Locking the row inside a transaction: <code>SELECT ... FOR UPDATE</code> then update.</li></ul><p>The first sign of a race is numbers that contradict the logic: negative stock, or a discount applied twice. Add a database constraint so the last line of defence is the database itself.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: النقاط الطرفية والمعاملات",
            titleEn: "Quiz: endpoints and transactions",
            quiz: {
              titleAr: "اختبار: النقاط الطرفية والمعاملات",
              titleEn: "Quiz: endpoints and transactions",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 1200,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما أفضل وصف لمعاملة قاعدة البيانات؟",
                  promptEn: "What best describes a database transaction?",
                  explanationAr:
                    "المعاملة تجمّع العمليات في وحدة واحدة: إمّا تُنفَّذ كلها أو تُلغى كلها.",
                  explanationEn:
                    "A transaction groups operations into one unit: all applied or all rolled back.",
                  options: [
                    {
                      textAr: "وحدة عمل تُنفَّذ كلها أو تُلغى كلها",
                      textEn: "A unit of work that is fully applied or fully rolled back",
                      isCorrect: true,
                    },
                    {
                      textAr: "نسخة احتياطية دورية",
                      textEn: "A periodic backup",
                      isCorrect: false,
                    },
                    {
                      textAr: "طبقة عرض للبيانات",
                      textEn: "A data presentation layer",
                      isCorrect: false,
                    },
                    { textAr: "نوع من الفهارس", textEn: "A kind of index", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "قراءة قيمة ثم حسابها ثم كتابتها بأمان تام في وجود تزامن.",
                  promptEn:
                    "Reading a value, computing, and writing it is fully safe under concurrency.",
                  explanationAr: "هذا النمط يفقد التحديثات إلا إذا استخدمنا شرطًا أو قفلًا.",
                  explanationEn: "That pattern loses updates unless you add a condition or a lock.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يساعد على منع المخزون السالب؟",
                  promptEn: "Which of these help prevent negative stock?",
                  explanationAr:
                    "الشرط في جملة التحديث والقيد في قاعدة البيانات كلاهما يحمي من السالب.",
                  explanationEn:
                    "A condition in the update statement and a database constraint both guard against negatives.",
                  options: [
                    {
                      textAr: "شرط على الكمية المتبقية في جملة التحديث",
                      textEn: "A condition on remaining quantity in the update statement",
                      isCorrect: true,
                    },
                    {
                      textAr: "قيد في قاعدة البيانات يمنع القيم السالبة",
                      textEn: "A database constraint forbidding negative values",
                      isCorrect: true,
                    },
                    {
                      textAr: "تغيير خط الواجهة",
                      textEn: "Changing the interface font",
                      isCorrect: false,
                    },
                    {
                      textAr: "زيادة عدد أعمدة الجدول",
                      textEn: "Adding more table columns",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الكلمة في جملة SELECT التي تحجز السجل أثناء المعاملة؟",
                  promptEn: "Which clause in a SELECT locks the row inside a transaction?",
                  explanationAr: "FOR UPDATE يحجز الصفوف المقروءة حتى نهاية المعاملة.",
                  explanationEn: "FOR UPDATE holds the read rows until the transaction ends.",
                  acceptedAnswers: ["FOR UPDATE", "for update", "FORUPDATE"],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "لماذا نفصل منطق قاعدة البيانات عن طبقة HTTP؟",
                  promptEn: "Why separate database logic from the HTTP layer?",
                  explanationAr: "الفصل يجعل المنطق قابلًا للاختبار مباشرة دون خادم شبكة.",
                  explanationEn:
                    "Separation makes the logic directly testable without a network server.",
                  options: [
                    {
                      textAr: "ليصبح المنطق قابلًا للاختبار مباشرة دون خادم",
                      textEn: "So the logic is directly testable without a server",
                      isCorrect: true,
                    },
                    {
                      textAr: "لتصغير حجم قاعدة البيانات",
                      textEn: "To shrink the database size",
                      isCorrect: false,
                    },
                    {
                      textAr: "لتجنّب استخدام الفهارس",
                      textEn: "To avoid using indexes",
                      isCorrect: false,
                    },
                    {
                      textAr: "لإلغاء الحاجة إلى الاختبارات",
                      textEn: "To remove the need for tests",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "الأداء والتوثيق",
        titleEn: "Performance and Documentation",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "ترقيم الصفحات الكبيرة دون إبطاء الاستعلام",
            titleEn: "Paging large result sets without slowing the query",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "قياس زمن الاستجابة في البيئة القريبة من الإنتاج",
            titleEn: "Measuring response time in a production-like environment",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: توثيق قابل للتنفيذ لا ملف نصّي منفصل",
            titleEn: "Reading: runnable documentation instead of a separate text file",
            durationSec: 360,
            contentAr:
              "<p>الملف النصّي الذي يصف الواجهة البرمجية يتقادم من أول يوم يضيف فيه أحدهم حقلًا. الوصف القابل للتنفيذ يعيش داخل الكود، فيتغيّر معه تلقائيًا ولا يحتاج اجتماعًا لتحديثه.</p><h3>خطوات بناء وصف ينفع</h3><ul><li>اكتب وصف الفحص لكل نقطة نهاية بجانبها لا في ملف آخر.</li><li>ولّد صفحة توثيق من الوصف نفسه.</li><li>أضف اختبارًا يفشل عند تغيّر الاستجابة دون تحديث الوصف.</li></ul><p>النتيجة أن المتعاون الجديد يستطيع أن يقرأ، ثم يجرّب، ثم يثق؛ لأن ما قرأه هو ما نُفِّذ فعلًا.</p>",
            contentEn:
              "<p>A text file describing your API goes stale the first day someone adds a field. A runnable description lives inside the code, changes with it, and needs no meeting to update.</p><h3>Steps to a description that helps</h3><ul><li>Write the schema next to each endpoint, not in another file.</li><li>Generate the documentation page from that schema.</li><li>Add a test that fails when a response changes without the schema being updated.</li></ul><p>The result: a new collaborator can read, then try, then trust, because what they read is what actually ran.</p>",
          },
          {
            type: "FILE",
            titleAr: "دليل مراجعة الاستعلامات البطيئة",
            titleEn: "Slow-query review guide",
            durationSec: 300,
            attachmentAr: "دليل مراجعة الاستعلامات البطيئة",
            attachmentEn: "Slow-query review guide",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الأداء والتوثيق",
            titleEn: "Quiz: performance and documentation",
            quiz: {
              titleAr: "اختبار: الأداء والتوثيق",
              titleEn: "Quiz: performance and documentation",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما المشكلة في الترقيم بالانصراف (OFFSET) على صفحات كبيرة؟",
                  promptEn: "What is the problem with OFFSET paging on large result sets?",
                  explanationAr:
                    "المحرّك يقرأ ويتجاهل كل الصفوف السابقة، فيزداد الوقت كلما تعمّق المستخدم.",
                  explanationEn:
                    "The engine reads and discards all preceding rows, so time grows the deeper the user goes.",
                  options: [
                    {
                      textAr: "يزيد الوقت كلما تعمّق المستخدم لأنه يتجاهل صفوفًا كثيرة",
                      textEn:
                        "It grows slower the deeper the user goes because it discards many rows",
                      isCorrect: true,
                    },
                    {
                      textAr: "يمنع استخدام الفهارس مطلقًا",
                      textEn: "It forbids using indexes entirely",
                      isCorrect: false,
                    },
                    {
                      textAr: "يحذف الصفوف القديمة",
                      textEn: "It deletes old rows",
                      isCorrect: false,
                    },
                    {
                      textAr: "يغيّر ترتيب الأعمدة",
                      textEn: "It changes column order",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "التوثيق القابل للتنفيذ يتقادم تلقائيًا مع الكود.",
                  promptEn: "Runnable documentation stays in sync with the code automatically.",
                  explanationAr: "لأن الوصف يعيش داخل الكود ويولّد الصفحة، فأي تغيير يظهر فورًا.",
                  explanationEn:
                    "Because the schema lives in the code and generates the page, changes appear immediately.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr:
                    "ما اسم تقنية الترقيم التي تعتمد على آخر قيمة مُرتَّبة بدل العدد الذي نتجاوزه؟",
                  promptEn:
                    "Which paging technique uses the last ordered value instead of a count to skip?",
                  explanationAr: "الترقيم بالمؤشر يستخدم آخر قيمة مُرتَّبة كنقطة انطلاق.",
                  explanationEn: "Cursor paging uses the last ordered value as its starting point.",
                  acceptedAnswers: ["cursor", "cursor pagination", "keyset", "keyset pagination"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يظهر في اختبار يفشل عند تغيّر الاستجابة؟",
                  promptEn: "Which of these appear in a test that fails when a response changes?",
                  explanationAr: "مقارنة الاستجابة بالوصف الذي يحدّثه المطوّر تكشف التناقض.",
                  explanationEn:
                    "Comparing the response with the developer-maintained schema exposes the mismatch.",
                  options: [
                    {
                      textAr: "مقارنة أسماء الحقول وأنواعها",
                      textEn: "Comparing field names and types",
                      isCorrect: true,
                    },
                    {
                      textAr: "التأكد من تحديث ملف الوصف مع الاستجابة",
                      textEn: "Checking the schema file is updated with the response",
                      isCorrect: true,
                    },
                    { textAr: "قياس سرعة القرص", textEn: "Measuring disk speed", isCorrect: false },
                    {
                      textAr: "عدّ أسطر ملف الاختبار",
                      textEn: "Counting test file lines",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "بأي استعلام تبدأ التحسين؟",
                  promptEn: "Which query do you optimise first?",
                  explanationAr: "الأبطأ أولًا، لأن التحسين يُقاس بأثره على تجربة المستخدم.",
                  explanationEn:
                    "The slowest first, because optimisation is measured by its effect on user experience.",
                  options: [
                    {
                      textAr: "الأبطأ الذي يُنفَّذ عند كل تحميل صفحة",
                      textEn: "The slowest one that runs on every page load",
                      isCorrect: true,
                    },
                    { textAr: "الأقصر كتابةً", textEn: "The shortest to write", isCorrect: false },
                    {
                      textAr: "الأحدث تاريخ إنشاء",
                      textEn: "The most recently created",
                      isCorrect: false,
                    },
                    {
                      textAr: "الذي كتبه مدير الفريق",
                      textEn: "The one the team lead wrote",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "application-security-essentials",
    instructorUsername: "omar-bafail",
    categorySlug: "programming",
    titleAr: "أساسيات أمن التطبيقات للمطوّرين",
    titleEn: "Application Security Essentials for Developers",
    subtitleAr: "الثغرات الشائعة من داخل الكود، وكيف يُمنع كل صنف بأسطر أقل",
    subtitleEn:
      "Common vulnerabilities from inside the code, and how each class is prevented with fewer lines",
    descriptionAr:
      "هذه دورة عملية على مدخلات المستخدم. نأخذ نموذجًا برمجيًا بسيطًا، ثم نجرب عليه ثلاث هجمات معروفة: حقن استعلام، وتنفيذ نصّ من طرف ثالث في الصفحة، ورفع ملف مموّه. بدل أن نحفظ أسماء الثغرات، نرى أثرها ثم نصلحها ونقارن الفرق بين الترقيع والحماية الحقيقية.\n\nنتناول بعد ذلك ما لا يظهر في الاختبارات الوظيفية: أسرار مكتوبة في المستودع، وصلاحيات مانحة أكثر مما يلزم، ورسائل خطأ تكشف البنية الداخلية. في النهاية نبني قائمة فحص نراجعها قبل كل دمج، ونتعلّم كيف نختلف مع فريق المنتج دون أن نُخفي مخاطرة حقيقية.",
    descriptionEn:
      "This is a hands-on course about user input. We take a small feature, then attack it with three well-known techniques: query injection, executing third-party text inside the page, and a disguised file upload. Instead of memorising vulnerability names, we watch the impact, fix it, and compare patching with genuine prevention.\n\nWe then cover what functional tests never see: secrets committed to the repository, permissions granted more widely than needed, and error messages that reveal internal structure. We finish with a review checklist used before every merge, and with how to disagree with the product team without hiding a real risk.",
    level: "INTERMEDIATE",
    language: "AR",
    priceCents: 34900,
    objectives: [
      {
        textAr: "تشرح كيف يتحوّل مدخل المستخدم إلى تنفيذ غير مقصود.",
        textEn: "Explain how user input turns into unintended execution.",
      },
      {
        textAr: "تمنع حقن الاستعلامات عبر الاستعلامات المُعامَلة لا عبر التنقية اليدوية.",
        textEn: "Prevent query injection with parameterised queries rather than manual cleaning.",
      },
      {
        textAr: "تحمي الصفحات من تنفيذ نصّ غير موثوق عبر ترميز المخرجات.",
        textEn: "Protect pages from untrusted script execution by encoding output.",
      },
      {
        textAr: "تراجع الصلاحيات وتقلّلها وفق مبدأ أقل صلاحية.",
        textEn: "Review permissions and reduce them under least privilege.",
      },
      {
        textAr: "تكشف الأسرار المكتوبة في الكود وتعالج سببها.",
        textEn: "Detect secrets written into code and fix the underlying cause.",
      },
      {
        textAr: "تُجري مراجعة أمنية سريعة قبل الدمج في فرع الإصدار.",
        textEn: "Run a quick security review before merging to the release branch.",
      },
    ],
    requirements: [
      {
        textAr: "خبرة بكتابة كود خلفي بلغة واحدة على الأقل.",
        textEn: "Experience writing backend code in at least one language.",
      },
      {
        textAr: "معرفة أساسية ببروتوكول HTTP والجلسات.",
        textEn: "Basic knowledge of HTTP and sessions.",
      },
      {
        textAr: "بيئة تخزين محلية تدعم أرشفة رمز الفحص.",
        textEn: "A local setup able to archive scan output.",
      },
      { textAr: "لا حاجة إلى خبرة أمنية سابقة.", textEn: "No prior security experience needed." },
    ],
    sections: [
      {
        titleAr: "المدخلات غير الموثوقة",
        titleEn: "Untrusted Input",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "كل مدخل قادم من خارج البرنامج غير موثوق",
            titleEn: "Every input from outside your program is untrusted",
            isPreview: true,
            durationSec: 420,
          },
          {
            type: "VIDEO",
            titleAr: "حقن الاستعلامات ولماذا تصدّه المُعامَلات",
            titleEn: "Query injection and why parameters stop it",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "تنفيذ نصّ طرف ثالث وترميز المخرجات",
            titleEn: "Third-party script execution and output encoding",
            durationSec: 720,
          },
          {
            type: "VIDEO",
            titleAr: "رفع الملفات: التحقّق من المحتوى لا الامتداد",
            titleEn: "File uploads: verifying content, not the extension",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: التنقية اليدوية وهم يبدو مطمئنًا",
            titleEn: "Reading: manual sanitisation, a comfortable illusion",
            durationSec: 360,
            contentAr:
              "<p>طرح علامات الاقتباس من النصّ يبدو حلًّا، ويصمد حتى تأتي حالة لم يفكّر بها كاتبه. المشكلة أن المدخلات لا نهائية الحالات، والقوائم السوداء تتأخر دائمًا عن المُهاجم.</p><h3>المبدأ البديل</h3><ul><li>اجعل البيانات بيانات: استخدم المُعامَلات لتُعزل عن بنية الاستعلام.</li><li>اجعل المخرجات مخرجات: ارمِز النصّ عند العرض لا عند التخزين.</li><li>لا تبنِ لغة بلغة: لا تؤلّف جملة SQL أو HTML من نصوص خام.</li></ul><p>القاعدة الأخيرة مهمة: الترميز <strong>عند العرض</strong> يعني أن نفس البيانات تُعرض بأمان في سياق HTML وفي سياق آخر بترميز مختلف.</p>",
            contentEn:
              "<p>Stripping quote characters looks like a fix, and it holds until a case its author never considered arrives. The trouble is that inputs have endless forms, and blacklists always lag behind an attacker.</p><h3>The alternative principle</h3><ul><li>Keep data as data: use parameters so it is isolated from query structure.</li><li>Keep output as output: encode at render time, not at storage time.</li><li>Never build one language inside another: do not assemble SQL or HTML from raw strings.</li></ul><p>The last rule matters: encoding <strong>at render time</strong> means the same data can be shown safely in an HTML context and with different encoding elsewhere.</p>",
          },
        ],
      },
      {
        titleAr: "ما لا تكشفه الاختبارات الوظيفية",
        titleEn: "What Functional Tests Never See",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "مبدأ أقل صلاحية في الممارسة",
            titleEn: "Least privilege in practice",
            isPreview: true,
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "الأسرار في المستودع: كيف تدخل وكيف تخرج",
            titleEn: "Secrets in the repository: how they get in and how to remove them",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "رسائل الخطأ التي تسرّب البنية الداخلية",
            titleEn: "Error messages that leak internal structure",
            durationSec: 480,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: سلطة الجلسة مقابل سلطة الواجهة",
            titleEn: "Reading: session authority versus interface authority",
            durationSec: 360,
            contentAr:
              "<p>كثير من الثغرات ليست في تسجيل الدخول بل فيما بعده: مستخدم مسجّل يستطيع الوصول إلى سجل ليس له. إخفاء الزر في الواجهة لا يحمي شيئًا؛ الحماية في الخادم الذي يتحقّق من الملكية عند كل طلب.</p><h3>ثلاث قواعد</h3><ul><li>كل طلب يحدّد المالك من الجلسة لا من مدخل المستخدم.</li><li>التحقّق مرة واحدة في نقطة مركّزة، لا في كل نقطة نهاية بشكل مختلف.</li><li>اكتب اختبارًا يحاول الوصول إلى سجل غريب ويتوقّع الفشل.</li></ul><p>هذا الاختبار وحده يكشف فئة كاملة من العيوب التي تمرّ عادة إلى الإنتاج.</p>",
            contentEn:
              "<p>Many vulnerabilities are not in signing in but in what happens after: a signed-in user reaching a record that is not theirs. Hiding a button in the interface protects nothing; the protection is the server checking ownership on every request.</p><h3>Three rules</h3><ul><li>Every request derives the owner from the session, never from user input.</li><li>Check once in a central place, not differently in every endpoint.</li><li>Write a test that tries to reach someone else's record and expects failure.</li></ul><p>That single test exposes a whole class of defects that otherwise reach production.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: المدخلات والصلاحيات",
            titleEn: "Quiz: input and permissions",
            quiz: {
              titleAr: "اختبار: المدخلات والصلاحيات",
              titleEn: "Quiz: input and permissions",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 900,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما الطريقة الصحيحة لمنع حقن الاستعلامات؟",
                  promptEn: "What is the correct way to prevent query injection?",
                  explanationAr:
                    "المُعامَلات تعزل البيانات عن بنية الاستعلام، وهي الحد الفاصل الحقيقي.",
                  explanationEn:
                    "Parameters isolate data from query structure and are the real boundary.",
                  options: [
                    {
                      textAr: "استخدام استعلامات مُعامَلة تفصل البيانات عن البنية",
                      textEn: "Using parameterised queries that separate data from structure",
                      isCorrect: true,
                    },
                    {
                      textAr: "حذف علامات الاقتباس من المدخل",
                      textEn: "Removing quote characters from the input",
                      isCorrect: false,
                    },
                    {
                      textAr: "تشفير كامل قاعدة البيانات",
                      textEn: "Encrypting the whole database",
                      isCorrect: false,
                    },
                    {
                      textAr: "إخفاء رسائل الخطأ فقط",
                      textEn: "Only hiding error messages",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يُعدّ تسريبًا لبنية داخلية؟",
                  promptEn: "Which of these count as leaking internal structure?",
                  explanationAr: "أثر التتبّع واسم الجدول يكشفان تفاصيل تفيد المهاجم.",
                  explanationEn:
                    "A stack trace and a table name reveal details useful to an attacker.",
                  options: [
                    {
                      textAr: "عرض أثر التتبّع الكامل للمستخدم",
                      textEn: "Showing the full stack trace to the user",
                      isCorrect: true,
                    },
                    {
                      textAr: "ذكر اسم الجدول في رسالة خطأ",
                      textEn: "Mentioning a table name in an error message",
                      isCorrect: true,
                    },
                    {
                      textAr: "رسالة عامة: حدث خطأ غير متوقّع",
                      textEn: "A generic message: an unexpected error occurred",
                      isCorrect: false,
                    },
                    {
                      textAr: "رمز حالة HTTP 500 دون تفاصيل",
                      textEn: "An HTTP 500 status with no details",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "إخفاء زر في الواجهة يحمي من الوصول غير المصرّح به.",
                  promptEn:
                    "Hiding a button in the interface protects against unauthorised access.",
                  explanationAr: "الواجهة لا تحمي؛ الخادم هو من يتحقّق من الملكية.",
                  explanationEn: "The interface protects nothing; the server checks ownership.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما اسم المبدأ الذي يعني منح أقل صلاحية تكفي لإتمام العمل؟",
                  promptEn:
                    "What is the principle of granting only the permissions needed to do the job?",
                  explanationAr: "مبدأ أقل صلاحية يقلّل مساحة الضرر عند أي اختراق.",
                  explanationEn: "Least privilege reduces the blast radius of any compromise.",
                  acceptedAnswers: [
                    "least privilege",
                    "leastprivilege",
                    "least-privilege",
                    "minimum privilege",
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "أين يجب التحقّق من ملكية السجل؟",
                  promptEn: "Where must record ownership be verified?",
                  explanationAr: "في الخادم عند كل طلب، اعتمادًا على الجلسة لا على مدخل المستخدم.",
                  explanationEn:
                    "On the server, on every request, derived from the session rather than user input.",
                  options: [
                    {
                      textAr: "في الخادم عند كل طلب حسب الجلسة",
                      textEn: "On the server on every request, from the session",
                      isCorrect: true,
                    },
                    {
                      textAr: "في الواجهة عند تحميل الصفحة",
                      textEn: "In the interface on page load",
                      isCorrect: false,
                    },
                    { textAr: "في ملف الأنماط", textEn: "In the stylesheet", isCorrect: false },
                    { textAr: "في سجل النشر", textEn: "In the deployment log", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "المراجعة قبل الدمج",
        titleEn: "Review Before Merge",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "أنواع المدخلات وسياسة ملفاتها",
            titleEn: "Input types and their file policy",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "مراجعة أمنية في عشر دقائق لكل طلب دمج",
            titleEn: "A ten-minute security review per merge request",
            durationSec: 660,
          },
          {
            type: "FILE",
            titleAr: "قائمة مراجعة التغييرات ذات الأثر الأمني",
            titleEn: "Checklist for security-relevant changes",
            durationSec: 300,
            attachmentAr: "قائمة مراجعة التغييرات ذات الأثر الأمني",
            attachmentEn: "Checklist for security-relevant changes",
          },
          {
            type: "TEXT",
            titleAr: "قراءة: كيف نتحدّث عن المخاطرة دون تهويل",
            titleEn: "Reading: how to talk about risk without alarmism",
            durationSec: 300,
            contentAr:
              "<p>قولك «هذا خطر أمني» لا يحرّك فريقًا. قولك «هذا الطلب يسمح لمستخدم بتغيير طلب مستخدم آخر» يحرّكه، لأن الأول حكم والثاني وصف لسلوك مفهوم.</p><h3>صياغة عملية</h3><ul><li>اذكر السيناريو بخطوات يمكن تكرارها.</li><li>اذكر الأثر على المستخدم أو البيانات، لا على التقييم الأمني.</li><li>اقترح أصغر تغيير يزيل الأثر، ولو لم يكن الحل النهائي.</li></ul><p>بهذه الصياغة يناقش الفريق احتمال حدوث السيناريو، لا جدالًا حول من يعرف أكثر.</p>",
            contentEn:
              "<p>Saying «this is a security risk» moves no team. Saying «this request lets one user modify another user's order» does, because the first is a judgement and the second describes behaviour everyone understands.</p><h3>A practical phrasing</h3><ul><li>State the scenario in reproducible steps.</li><li>State the effect on users or data, not on a security score.</li><li>Propose the smallest change that removes the effect, even if it is not the final solution.</li></ul><p>With that phrasing the team discusses whether the scenario can happen instead of arguing about who knows more.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: المراجعة قبل الدمج",
            titleEn: "Quiz: review before merge",
            quiz: {
              titleAr: "اختبار: المراجعة قبل الدمج",
              titleEn: "Quiz: review before merge",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "كيف تُصاغ المخاطرة بشكل فعّال لفريق المنتج؟",
                  promptEn: "How do you phrase a risk so a product team acts on it?",
                  explanationAr: "وصف السيناريو والأثر يجعل الفريق يناقش الاحتمال لا الحكم.",
                  explanationEn:
                    "Describing the scenario and effect lets the team discuss likelihood, not judgement.",
                  options: [
                    {
                      textAr: "بوصف السيناريو بخطوات والأثر على المستخدم",
                      textEn: "By describing the scenario in steps and the effect on the user",
                      isCorrect: true,
                    },
                    {
                      textAr: "بذكر اسم ثغرة معروفة فقط",
                      textEn: "By naming a known vulnerability only",
                      isCorrect: false,
                    },
                    {
                      textAr: "بتهديد الفريق بتقرير إداري",
                      textEn: "By threatening the team with a management report",
                      isCorrect: false,
                    },
                    {
                      textAr: "بإرسال ملف طويل بلا سياق",
                      textEn: "By sending a long file with no context",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "يجب أن يكون اقتراح الإصلاح دائمًا الحل النهائي الكامل.",
                  promptEn: "A fix suggestion must always be the complete final solution.",
                  explanationAr: "أصغر تغيير يزيل الأثر يفيد أكثر، ويُبنى عليه لاحقًا.",
                  explanationEn:
                    "The smallest change that removes the effect helps most and can be built on later.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما نوع التحقّق الذي يعتمد على قائمة أنواع مسموح بها بدل قائمة ممنوعة؟",
                  promptEn:
                    "What kind of validation relies on an allow-list instead of a deny-list?",
                  explanationAr: "القائمة البيضاء تحدد ما يُقبل بدل مطاردة ما يُرفض.",
                  explanationEn:
                    "An allow-list defines what is accepted instead of chasing what to reject.",
                  acceptedAnswers: ["allowlist", "allow-list", "whitelist", "positive validation"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يُدرَج في مراجعة أمنية سريعة؟",
                  promptEn: "Which of these belong in a quick security review?",
                  explanationAr: "الملكية والأسرار بندان أساسيان في أي مراجعة قبل الدمج.",
                  explanationEn:
                    "Ownership and secrets are both essential lines in any pre-merge review.",
                  options: [
                    {
                      textAr: "التحقّق من ملكية السجل",
                      textEn: "Checking record ownership",
                      isCorrect: true,
                    },
                    {
                      textAr: "البحث عن أسرار مكتوبة في التغيير",
                      textEn: "Searching the change for written secrets",
                      isCorrect: true,
                    },
                    {
                      textAr: "تعداد أسطر الكود المضافة",
                      textEn: "Counting added lines of code",
                      isCorrect: false,
                    },
                    {
                      textAr: "مراجعة ألوان الواجهة",
                      textEn: "Reviewing interface colours",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "لماذا الترميز عند العرض أفضل من التنقية عند التخزين؟",
                  promptEn:
                    "Why is encoding at render time better than sanitising at storage time?",
                  explanationAr: "نفس البيانات قد تُعرض في سياقات مختلفة، ولكل سياق ترميزه الصحيح.",
                  explanationEn:
                    "The same data may render in different contexts, each with its own correct encoding.",
                  options: [
                    {
                      textAr: "لأن لكل سياق عرض ترميزًا مناسبًا مختلفًا",
                      textEn: "Because each rendering context needs its own encoding",
                      isCorrect: true,
                    },
                    {
                      textAr: "لأن التخزين أغلى من العرض",
                      textEn: "Because storage costs more than rendering",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأن العرض لا يحتاج تحقّقًا",
                      textEn: "Because rendering needs no validation",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأن التنقية تحذف بيانات مفيدة",
                      textEn: "Because sanitising deletes useful data",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "secure-code-review-practices",
    instructorUsername: "omar-bafail",
    categorySlug: "programming",
    titleAr: "ممارسات مراجعة الكود الآمنة",
    titleEn: "Secure Code Review Practices",
    subtitleAr: "مراجعة تُخرج عيوبًا حقيقية دون أن تتحوّل إلى خلافات شخصية",
    subtitleEn: "Reviews that surface real defects without turning into personal arguments",
    descriptionAr:
      "المراجعة الجيدة تبدأ من السؤال الصحيح، لا من قراءة الكود سطرًا سطرًا. في هذه الدورة نأخذ طلبات دمج حقيقية يبدو وصفها معقولًا، ومهمتك أن تكتشف ما لم يقله الوصف: تغيير في المصادقة، فحص صلاحية أُضيف متأخرًا، وإعادة هيكلة وسّعت استعلامًا دون أن ينتبه أحد. كل وحدة تنتهي بمراجعة جماعية نناقش فيها ما كان يستحق التعليق وما لم يكن.\n\nالوحدة الأخيرة تحوّل المراجعة إلى عادة متكررة: من أين تبدأ في فرق كبير، وكيف تصوغ ملاحظة تُصلَح بدل أن تُدافَع عنها، وكيف تسجّل القرارات القليلة التي ستحتاجها بعد ستة أشهر. الهدف مراجعة يتعلّم منها عضو جديد في الفريق، لا بوابة يمرّ منها الناس بصعوبة.",
    descriptionEn:
      "This course is built around diffs, not lectures. Each module hands you a real pull request whose description sounds reasonable, and your job is to find what the description does not say. We work through authentication changes, permission checks added after the fact, and a refactor that quietly widened a query.\n\nThe final section turns review into a repeatable habit: what to look at first in a large diff, how to phrase a comment that gets fixed rather than defended, and how to record the few decisions that will matter six months later. The goal is a review that a new team member can learn from, not a gate someone has to pass.",
    level: "ADVANCED",
    language: "EN",
    priceCents: 44900,
    objectives: [
      {
        textAr: "تقسّم فرقًا كبيرًا إلى أجزاء قابلة للمراجعة قبل قراءة سطر واحد.",
        textEn: "Split a large diff into reviewable parts before reading a single line.",
      },
      {
        textAr: "تكتشف التغييرات التي توسّع الصلاحيات ضمن إعادة هيكلة تبدو بريئة.",
        textEn: "Spot changes that widen permissions inside a refactor that looks innocent.",
      },
      {
        textAr: "تفرّق بين ملاحظة تحجب الدمج وأخرى تُسجَّل للمتابعة.",
        textEn: "Distinguish a comment that blocks a merge from one recorded for follow-up.",
      },
      {
        textAr: "تصوغ تعليقًا يجعل الكاتب يصلح المشكلة بنفسه.",
        textEn: "Phrase a comment that leads the author to fix the issue themselves.",
      },
      {
        textAr: "تحفظ القرارات المهمّة في مكان يجدها فيه المراجع القادم.",
        textEn: "Record key decisions where the next reviewer can find them.",
      },
      {
        textAr: "تقيس أثر المراجعة عبر عيوب كُشفت قبل الإنتاج لا بعدد التعليقات.",
        textEn: "Measure review value by defects caught pre-production, not by comment count.",
      },
    ],
    requirements: [
      {
        textAr: "خبرة عملية بمراجعة الكود أو كتابته في فريق.",
        textEn: "Practical experience reviewing or writing code on a team.",
      },
      {
        textAr: "إلمام بأنظمة التحكّم بالإصدارات وسير عمل الفروع.",
        textEn: "Familiarity with version control and branching workflows.",
      },
      {
        textAr: "معرفة أساسية بالمصادقة والصلاحيات.",
        textEn: "Basic knowledge of authentication and authorisation.",
      },
      {
        textAr: "مستوى إنجليزية يتيح قراءة الكود والملاحظات.",
        textEn: "English sufficient to read code and comments.",
      },
    ],
    sections: [
      {
        titleAr: "Reading a Diff With Intent",
        titleEn: "Reading a Diff With Intent",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "What the pull request description leaves out",
            titleEn: "What the pull request description leaves out",
            isPreview: true,
            durationSec: 480,
          },
          {
            type: "VIDEO",
            titleAr: "Ordering a large diff: entry points first",
            titleEn: "Ordering a large diff: entry points first",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "Permission checks added after the fact",
            titleEn: "Permission checks added after the fact",
            durationSec: 720,
          },
          {
            type: "VIDEO",
            titleAr: "The refactor that widened a query",
            titleEn: "The refactor that widened a query",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "Reading: the four questions before a single line",
            titleEn: "Reading: the four questions before a single line",
            durationSec: 360,
            contentAr:
              "<p>قبل أن تقرأ أي سطر، اطرح أربعة أسئلة على التغيير. من يصل إلى هذا الكود؟ ما البيانات التي يلمسها؟ ما الحالة التي يفترضها؟ وماذا لو لم تتحقّق؟ الإجابات تحدّد أين تنظر أولًا.</p><h3>لماذا هذا الخيار الأوّل</h3><ul><li>الأجزاء القريبة من الحدود تستحق قراءة أبطأ.</li><li>الكود الذي يعالج المدخلات يحمل معظم المخاطر.</li><li>التغييرات التي تبدو شكلية قد تغيّر سلوك التحقّق.</li></ul><p>استخدم هذه الأسئلة كخريطة قراءة لا كقائمة تفقّد: ستوجّهك إلى الأجزاء التي تستحق وقتك في فرق فيه ألف سطر.</p>",
            contentEn:
              "<p>Before you read a single line, ask four questions of the change. Who reaches this code? What data does it touch? What state does it assume? And what happens when that assumption fails? The answers decide where you look first.</p><h3>Why this is the first move</h3><ul><li>Parts near boundaries deserve slower reading.</li><li>Code that handles input carries most of the risk.</li><li>Changes that look cosmetic can alter validation behaviour.</li></ul><p>Use these questions as a reading map rather than a checklist: they point you to the parts worth your time in a thousand-line diff.</p>",
          },
        ],
      },
      {
        titleAr: "Comments That Get Fixed",
        titleEn: "Comments That Get Fixed",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "Blocking versus recording",
            titleEn: "Blocking versus recording",
            isPreview: true,
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "Phrasing so the author fixes it themselves",
            titleEn: "Phrasing so the author fixes it themselves",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "Separating style from substance",
            titleEn: "Separating style from substance",
            durationSec: 480,
          },
          {
            type: "TEXT",
            titleAr: "Reading: writing a comment the author will act on",
            titleEn: "Reading: writing a comment the author will act on",
            durationSec: 360,
            contentAr:
              "<p>A comment that says «this is wrong» asks the author to guess. A comment that says what you tried, what you saw, and what you expected hands them the answer without handing them the blame.</p><h3>Three parts that work</h3><ul><li>The observation, with the concrete input that triggered it.</li><li>The effect, described in terms of behaviour rather than severity.</li><li>The smallest change you would accept, offered as a question.</li></ul><p>Skill here is not politeness. A clearly scoped comment gets fixed on the first reply; a vague one starts a thread that ends with the change merged anyway.</p>",
            contentEn:
              "<p>A comment that says «this is wrong» asks the author to guess. A comment that says what you tried, what you saw, and what you expected hands them the answer without handing them the blame.</p><h3>Three parts that work</h3><ul><li>The observation, with the concrete input that triggered it.</li><li>The effect, described in terms of behaviour rather than severity.</li><li>The smallest change you would accept, offered as a question.</li></ul><p>Skill here is not politeness. A clearly scoped comment gets fixed on the first reply; a vague one starts a thread that ends with the change merged anyway.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "Quiz: review decisions",
            titleEn: "Quiz: review decisions",
            quiz: {
              titleAr: "Quiz: review decisions",
              titleEn: "Quiz: review decisions",
              passPct: 80,
              maxAttempts: 3,
              timeLimitSec: 1200,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "What does it mean to separate blocking comments from recording ones?",
                  promptEn: "What does it mean to separate blocking comments from recording ones?",
                  explanationAr:
                    "Blocking comments stop a merge; recording comments are logged for later, and confusing the two loses trust.",
                  explanationEn:
                    "Blocking comments stop a merge; recording comments are logged for later, and confusing the two loses trust.",
                  options: [
                    {
                      textAr: "Blocking stops the merge; recording is logged for later",
                      textEn: "Blocking stops the merge; recording is logged for later",
                      isCorrect: true,
                    },
                    {
                      textAr: "Blocking is for style; recording is for security",
                      textEn: "Blocking is for style; recording is for security",
                      isCorrect: false,
                    },
                    {
                      textAr: "Both always stop the merge",
                      textEn: "Both always stop the merge",
                      isCorrect: false,
                    },
                    {
                      textAr: "Neither is ever written down",
                      textEn: "Neither is ever written down",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "A refactor that only moves code can still change security behaviour.",
                  promptEn: "A refactor that only moves code can still change security behaviour.",
                  explanationAr:
                    "Ordering and scoping changes can widen what a query or a check covers.",
                  explanationEn:
                    "Ordering and scoping changes can widen what a query or a check covers.",
                  options: [
                    { textAr: "True", textEn: "True", isCorrect: true },
                    { textAr: "False", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr:
                    "Name the practice of writing down decisions where later readers can find them.",
                  promptEn:
                    "Name the practice of writing down decisions where later readers can find them.",
                  explanationAr:
                    "A decision record keeps the reasoning next to the code for the next reviewer.",
                  explanationEn:
                    "A decision record keeps the reasoning next to the code for the next reviewer.",
                  acceptedAnswers: [
                    "adr",
                    "decision record",
                    "architecture decision record",
                    "design note",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "Which parts of a diff deserve the slowest reading?",
                  promptEn: "Which parts of a diff deserve the slowest reading?",
                  explanationAr: "Input handling and boundary code carry the most risk.",
                  explanationEn: "Input handling and boundary code carry the most risk.",
                  options: [
                    {
                      textAr: "Code that validates input",
                      textEn: "Code that validates input",
                      isCorrect: true,
                    },
                    {
                      textAr: "Code at a module or trust boundary",
                      textEn: "Code at a module or trust boundary",
                      isCorrect: true,
                    },
                    {
                      textAr: "A renamed local variable",
                      textEn: "A renamed local variable",
                      isCorrect: false,
                    },
                    {
                      textAr: "Trailing whitespace removal",
                      textEn: "Trailing whitespace removal",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "How should review value ultimately be measured?",
                  promptEn: "How should review value ultimately be measured?",
                  explanationAr:
                    "Defects caught before production matter more than comment volume.",
                  explanationEn:
                    "Defects caught before production matter more than comment volume.",
                  options: [
                    {
                      textAr: "By defects caught before production",
                      textEn: "By defects caught before production",
                      isCorrect: true,
                    },
                    {
                      textAr: "By number of comments per pull request",
                      textEn: "By number of comments per pull request",
                      isCorrect: false,
                    },
                    {
                      textAr: "By review duration in minutes",
                      textEn: "By review duration in minutes",
                      isCorrect: false,
                    },
                    {
                      textAr: "By lines of code changed",
                      textEn: "By lines of code changed",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "Making Review a Habit",
        titleEn: "Making Review a Habit",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "A ten-minute first pass on any change",
            titleEn: "A ten-minute first pass on any change",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "Recording decisions that outlive the thread",
            titleEn: "Recording decisions that outlive the thread",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "Reading: the review log that earns its keep",
            titleEn: "Reading: the review log that earns its keep",
            durationSec: 300,
            contentAr:
              "<p>Most teams keep review notes nobody reads again. A log earns its keep when it answers a question a future engineer will actually ask: why is this endpoint public, and what constraint made that acceptable?</p><h3>What to record</h3><ul><li>The decision, in one sentence.</li><li>The alternative you rejected and why.</li><li>The condition that would make you revisit it.</li></ul><p>Skip the rest. A log of three lines per important decision gets read; a log of a page per change does not. The third line is the one that saves you later, because it turns a forgotten choice into a visible assumption.</p>",
            contentEn:
              "<p>Most teams keep review notes nobody reads again. A log earns its keep when it answers a question a future engineer will actually ask: why is this endpoint public, and what constraint made that acceptable?</p><h3>What to record</h3><ul><li>The decision, in one sentence.</li><li>The alternative you rejected and why.</li><li>The condition that would make you revisit it.</li></ul><p>Skip the rest. A log of three lines per important decision gets read; a log of a page per change does not. The third line is the one that saves you later, because it turns a forgotten choice into a visible assumption.</p>",
          },
          {
            type: "FILE",
            titleAr: "Review checklist for security-relevant changes",
            titleEn: "Review checklist for security-relevant changes",
            durationSec: 300,
            attachmentAr: "قائمة مراجعة التغييرات ذات الأثر الأمني",
            attachmentEn: "Checklist for security-relevant changes",
          },
          {
            type: "QUIZ",
            titleAr: "Quiz: habits and records",
            titleEn: "Quiz: habits and records",
            quiz: {
              titleAr: "Quiz: habits and records",
              titleEn: "Quiz: habits and records",
              passPct: 80,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "What is the most valuable line in a decision record?",
                  promptEn: "What is the most valuable line in a decision record?",
                  explanationAr:
                    "The revisit condition turns a forgotten choice into a visible assumption.",
                  explanationEn:
                    "The revisit condition turns a forgotten choice into a visible assumption.",
                  options: [
                    {
                      textAr: "The condition that would make you revisit the decision",
                      textEn: "The condition that would make you revisit the decision",
                      isCorrect: true,
                    },
                    {
                      textAr: "The date the record was written",
                      textEn: "The date the record was written",
                      isCorrect: false,
                    },
                    {
                      textAr: "The names of everyone who commented",
                      textEn: "The names of everyone who commented",
                      isCorrect: false,
                    },
                    {
                      textAr: "The number of files changed",
                      textEn: "The number of files changed",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "A short decision log is more likely to be read than a long one.",
                  promptEn: "A short decision log is more likely to be read than a long one.",
                  explanationAr: "Brevity keeps the log alive; a long one gets abandoned.",
                  explanationEn: "Brevity keeps the log alive; a long one gets abandoned.",
                  options: [
                    { textAr: "True", textEn: "True", isCorrect: true },
                    { textAr: "False", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "Which pass should you do first on any change, before deep reading?",
                  promptEn: "Which pass should you do first on any change, before deep reading?",
                  explanationAr:
                    "The first pass locates boundaries and input handling to focus the deeper one.",
                  explanationEn:
                    "The first pass locates boundaries and input handling to focus the deeper one.",
                  acceptedAnswers: ["first pass", "orientation pass", "triage", "map"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "Which of these keep a review log useful?",
                  promptEn: "Which of these keep a review log useful?",
                  explanationAr:
                    "One sentence per decision and the rejected alternative keep it readable and honest.",
                  explanationEn:
                    "One sentence per decision and the rejected alternative keep it readable and honest.",
                  options: [
                    {
                      textAr: "One sentence per decision",
                      textEn: "One sentence per decision",
                      isCorrect: true,
                    },
                    {
                      textAr: "Naming the rejected alternative",
                      textEn: "Naming the rejected alternative",
                      isCorrect: true,
                    },
                    {
                      textAr: "Copying the whole discussion thread",
                      textEn: "Copying the whole discussion thread",
                      isCorrect: false,
                    },
                    {
                      textAr: "Recording every variable rename",
                      textEn: "Recording every variable rename",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "Why record who can reach a public endpoint?",
                  promptEn: "Why record who can reach a public endpoint?",
                  explanationAr:
                    "Public access is a decision with a reason, and the reason is easy to forget.",
                  explanationEn:
                    "Public access is a decision with a reason, and the reason is easy to forget.",
                  options: [
                    {
                      textAr: "Because public access is a deliberate decision easy to forget",
                      textEn: "Because public access is a deliberate decision easy to forget",
                      isCorrect: true,
                    },
                    {
                      textAr: "Because public endpoints are always unsafe",
                      textEn: "Because public endpoints are always unsafe",
                      isCorrect: false,
                    },
                    {
                      textAr: "Because it changes the database schema",
                      textEn: "Because it changes the database schema",
                      isCorrect: false,
                    },
                    {
                      textAr: "Because reviewers cannot read code",
                      textEn: "Because reviewers cannot read code",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "ux-for-admin-dashboards",
    instructorUsername: "sara-alqahtani",
    categorySlug: "design",
    titleAr: "تصميم تجربة لوحات الإدارة المعقّدة",
    titleEn: "Designing Complex Admin Dashboards",
    subtitleAr: "كيف تُصمَّم شاشة يمتلئها الأرقام والصلاحيات دون أن يتوه المستخدم",
    subtitleEn: "How to design a screen full of numbers and permissions without losing the user",
    descriptionAr:
      "لوحات الإدارة ليست شاشة عرض، بل أداة عمل يومية. نبدأ بجلسة مع مستخدم حقيقي يصف مهمّته: يعالج طلبًا متأخرًا، ثم يعدّل صلاحية، ثم يعود. نحوّل هذه الجلسة إلى جدول أولويات، ثم نرسم التخطيط بحيث تعكس الكتلة الأولى المهمّة لا الأسهل في التنفيذ.\n\nنناقش بعد ذلك الصلاحيات: كيف تُعرض الأدوار بحيث يفهم المستخدم أثر كل دور دون قراءة دليل، وكيف تُصاغ الحالات الفارغة وحالات الخطأ. نختتم بمراجعة تباين وتباعد على بيانات طويلة حقيقية، لا على بيانات نموذجية قصيرة تخفي المشكلة.",
    descriptionEn:
      "An admin dashboard is not a display surface; it is a daily tool. We begin with a real user session describing their task: handling a late order, then editing a permission, then coming back. We turn that session into a prioritisation table, then draw the layout so the first block reflects what matters rather than what was easiest to build.\n\nWe then work on permissions: presenting roles so a user understands each one's effect without reading documentation, and writing empty and error states that guide instead of apologising. We close with a contrast and spacing review against real long data, not tidy sample rows that hide the problem.",
    level: "INTERMEDIATE",
    language: "AR",
    priceCents: 27900,
    objectives: [
      {
        textAr: "تحوّل جلسة مستخدم إلى جدول أولويات يقود التخطيط.",
        textEn: "Turn a user session into a prioritisation table that drives layout.",
      },
      {
        textAr: "ترتّب الكتل وفق تكرار المهمّة لا وفق سهولة البناء.",
        textEn: "Order blocks by task frequency rather than build effort.",
      },
      {
        textAr: "تصمّم عرضًا للأدوار يوضّح أثر كل دور بلا دليل مطبوع.",
        textEn: "Design a role display that explains each role's effect without a manual.",
      },
      {
        textAr: "تكتب حالات فارغة وخطأ توجّه المستخدم إلى خطوته التالية.",
        textEn: "Write empty and error states that point the user to their next step.",
      },
      {
        textAr: "تراجع التباين والتباعد على بيانات طويلة حقيقية.",
        textEn: "Review contrast and spacing against real long data.",
      },
      {
        textAr: "تشرح قراراتك الشكلية بمعيار قابل للنقاش لا بالذوق.",
        textEn: "Explain visual decisions with a discussable standard rather than taste.",
      },
    ],
    requirements: [
      {
        textAr: "معرفة بأداة تصميم واجهات واحدة على الأقل.",
        textEn: "Familiarity with at least one interface design tool.",
      },
      {
        textAr: "فهم أساسي لمفاهيم الأدوار والصلاحيات.",
        textEn: "Basic understanding of roles and permissions.",
      },
      {
        textAr: "مهارات حوارية لمقابلة مستخدم ومناقشته.",
        textEn: "Conversation skills for interviewing a user and discussing trade-offs.",
      },
      { textAr: "لا حاجة إلى خبرة برمجية.", textEn: "No programming experience needed." },
    ],
    sections: [
      {
        titleAr: "من الجلسة إلى التخطيط",
        titleEn: "From Session to Layout",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "مقابلة مستخدم إداري: أسئلة تكشف المهمّة لا الرأي",
            titleEn: "Interviewing an admin user: questions that reveal the task",
            isPreview: true,
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "جدول الأولويات: التكرار مقابل الأثر",
            titleEn: "The priority table: frequency versus impact",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "تخطيط الكتل وفق مسار المهمّة",
            titleEn: "Laying out blocks along the task path",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "التنقّل الجانبي: متى يصبح عبئًا",
            titleEn: "Side navigation: when it becomes a burden",
            durationSec: 480,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: لماذا تكفي ثلاث كتل في الصفحة الأولى",
            titleEn: "Reading: why three blocks on the first screen are enough",
            durationSec: 360,
            contentAr:
              "<p>الشاشة التي تعرض كل شيء تعرض لا شيء. عند إضافة كل مقياس متاح، يخسر المستخدم القدرة على تحديد أين ينظر أولًا. ثلاث كتل مرتّبة بحسب تكرار المهمّة أكثر فائدة من اثنتي عشرة كتلة مرتّبة بحسب سهولة البرمجة.</p><h3>معيار الترتيب</h3><ul><li>كم مرة تُنجَز هذه المهمّة في الأسبوع؟</li><li>هل تؤجَّل إن لم تُنجَز اليوم؟</li><li>هل تحتاج بيانات من كتلة أخرى قبلها؟</li></ul><p>الكتلة الأولى يجب أن تكفي وحدها لإتمام المهمّة الأكثر تكرارًا، وكل كتلة تليها تُبرّر وجودها بسؤال واحد على الأقل من هذه الأسئلة.</p>",
            contentEn:
              "<p>A screen that shows everything shows nothing. Adding every available metric costs the user the ability to know where to look first. Three blocks ordered by task frequency beat twelve ordered by build convenience.</p><h3>The ordering test</h3><ul><li>How often is this task completed each week?</li><li>Does it suffer if not done today?</li><li>Does it depend on data from another block first?</li></ul><p>The first block must be enough on its own to complete the most frequent task, and every block after it justifies itself by answering at least one of these questions.</p>",
          },
        ],
      },
      {
        titleAr: "الصلاحيات والحالات",
        titleEn: "Permissions and States",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "عرض الأدوار بحيث يُفهم أثرها فورًا",
            titleEn: "Showing roles so their effect is understood at once",
            isPreview: true,
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "الحالة الفارغة: من تعليمات إلى خطوة تالية",
            titleEn: "Empty state: from instructions to a next step",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "رسائل الخطأ التي لا تلوم المستخدم",
            titleEn: "Error messages that do not blame the user",
            durationSec: 480,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: ورقة الصلاحيات كمخطّط لا كجدول",
            titleEn: "Reading: the permission sheet as a map, not a table",
            durationSec: 420,
            contentAr:
              "<p>جدول يضم عشرة أدوار وثلاثين صلاحية يبدو شاملًا ويُقرأ مرة واحدة. الأسلوب الأنفع أن نبدأ من عمل المستخدم لا من الأذونات: ماذا يريد أن يفعل، ثم ما الذي يحتاجه لذلك.</p><h3>ترتيب يعمل</h3><ul><li>اعرض الأدوار كمجموعات مهام لها وصف قصير.</li><li>أظهر ما يميّز الدور عن الأقرب إليه، لا كل ما يملكه.</li><li>اجعل الفرق بين دورين قابلًا للمقارنة جنبًا إلى جنب.</li></ul><p>هكذا يفهم المستخدم أن دور «مشرف طلبات» لا يرى المدفوعات، لأن الفرق معروض لا مخفي في خلية.</p>",
            contentEn:
              "<p>A table of ten roles and thirty permissions looks thorough and gets read once. The more useful approach starts from the task, not the permissions: what does the user want to do, and what does that need?</p><h3>An order that works</h3><ul><li>Show roles as task groups with a short description.</li><li>Show what distinguishes a role from its nearest neighbour, not everything it owns.</li><li>Make the difference between two roles comparable side by side.</li></ul><p>Now the user understands that an orders supervisor cannot see payments, because the difference is shown rather than buried in a cell.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: التخطيط والصلاحيات",
            titleEn: "Quiz: layout and permissions",
            quiz: {
              titleAr: "اختبار: التخطيط والصلاحيات",
              titleEn: "Quiz: layout and permissions",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 900,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "على أي أساس تُرتَّب كتل لوحة الإدارة؟",
                  promptEn: "On what basis should admin dashboard blocks be ordered?",
                  explanationAr: "تكرار المهمّة هو المعيار الذي يخدم المستخدم، لا سهولة البناء.",
                  explanationEn:
                    "Task frequency is the standard that serves the user, not build convenience.",
                  options: [
                    {
                      textAr: "تكرار إنجاز المهمّة وأثر تأجيلها",
                      textEn: "Task frequency and the cost of deferring it",
                      isCorrect: true,
                    },
                    {
                      textAr: "سهولة برمجة كل كتلة",
                      textEn: "How easy each block is to build",
                      isCorrect: false,
                    },
                    {
                      textAr: "الحجم البصري للنصّ",
                      textEn: "The visual size of the text",
                      isCorrect: false,
                    },
                    {
                      textAr: "ترتيب أضافه مدير المشروع",
                      textEn: "An order the project manager added",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "عرض كل الصلاحيات لكل دور هو أسلوب العرض الأوضح.",
                  promptEn: "Showing every permission for every role is the clearest presentation.",
                  explanationAr: "إظهار الفرق عن الدور الأقرب أوضح من سرد كل الصلاحيات.",
                  explanationEn:
                    "Showing the difference from the nearest role is clearer than listing everything.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما اسم الحالة التي تظهر للمستخدم قبل إدخال أي بيانات؟",
                  promptEn: "What is the state shown before a user has entered any data?",
                  explanationAr: "الحالة الفارغة يجب أن تقدّم خطوة تالية لا اعتذارًا.",
                  explanationEn: "The empty state should offer a next step, not an apology.",
                  acceptedAnswers: ["empty state", "empty", "blank state"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يشير إلى عبء في التنقّل الجانبي؟",
                  promptEn: "Which of these indicate side-navigation overload?",
                  explanationAr:
                    "قائمة طويلة بلا تجميع وإغلاق دائم للقائمة كلاهما يكلف المستخدم خطوات.",
                  explanationEn:
                    "A long ungrouped list and a sidebar that is always collapsed both cost the user steps.",
                  options: [
                    {
                      textAr: "قائمة طويلة بلا تجميع منطقي",
                      textEn: "A long list with no logical grouping",
                      isCorrect: true,
                    },
                    {
                      textAr: "قائمة تُغلق دائمًا وتحتاج فتحًا في كل مرة",
                      textEn: "A menu that is always collapsed and must be reopened",
                      isCorrect: true,
                    },
                    {
                      textAr: "تجميع العناصر حسب المهمّة",
                      textEn: "Grouping items by task",
                      isCorrect: false,
                    },
                    {
                      textAr: "إظهار القسم النشط بوضوح",
                      textEn: "Showing the active section clearly",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "عند اختبار التخطيط، على أي بيانات نجرّب؟",
                  promptEn: "When testing a layout, which data should you use?",
                  explanationAr:
                    "البيانات الطويلة الحقيقية تكشف الانهيارات التي تخفيها البيانات النموذجية.",
                  explanationEn: "Real long data exposes the breaks that sample data hides.",
                  options: [
                    {
                      textAr: "بيانات طويلة حقيقية بما فيها القيم الشاذة",
                      textEn: "Real long data including outlier values",
                      isCorrect: true,
                    },
                    {
                      textAr: "نصوص قصيرة متساوية الطول",
                      textEn: "Short, equal-length text",
                      isCorrect: false,
                    },
                    { textAr: "أسماء من حرف واحد", textEn: "One-letter names", isCorrect: false },
                    {
                      textAr: "أرقام صحيحة صغيرة",
                      textEn: "Small whole numbers",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "المراجعة البصرية",
        titleEn: "Visual Review",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "التباين والتباعد على بيانات حقيقية",
            titleEn: "Contrast and spacing against real data",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "الجداول: كثافة الصفّ وقراءة الأرقام",
            titleEn: "Tables: row density and reading numbers",
            durationSec: 660,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: كيف تناقش قرارًا شكليًا بمعيار",
            titleEn: "Reading: discussing a visual decision with a standard",
            durationSec: 300,
            contentAr:
              "<p>«هذا أجمل» تُنهي النقاش ولا تحلّه. المعيار القابل للنقاش يشير إلى وظيفة: هل يجد المستخدم الزرّ في أقلّ من ثانيتين؟ هل يميّز القيم الخطأ دون قراءة كل صفّ؟</p><h3>ثلاثة أسئلة بديلة</h3><ul><li>هل يقلّ عدد الحركات المطلوبة لإتمام المهمّة؟</li><li>هل يظهر الخطأ قبل أن يرسل المستخدم الطلب؟</li><li>هل يبقى المعنى واضحًا عند تكبير الخطّ؟</li></ul><p>هذه الأسئلة تنقل النقاش من الذوق إلى الأثر، ويمكن قياس كل واحد منها بملاحظة سلوك لا برأي.</p>",
            contentEn:
              "<p>«This looks nicer» ends the discussion instead of resolving it. A discussable standard points at a function: can the user find the button in under two seconds? Can they spot wrong values without reading every row?</p><h3>Three alternative questions</h3><ul><li>Does it reduce the moves needed to finish the task?</li><li>Does it surface the error before the user submits?</li><li>Does the meaning survive larger text?</li></ul><p>These questions move the conversation from taste to effect, and each can be checked by observing behaviour rather than asserting an opinion.</p>",
          },
          {
            type: "FILE",
            titleAr: "ورقة مراجعة التباين والتباعد",
            titleEn: "Contrast and spacing review sheet",
            durationSec: 300,
            attachmentAr: "ورقة مراجعة التباين والتباعد",
            attachmentEn: "Contrast and spacing review sheet",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: المراجعة البصرية",
            titleEn: "Quiz: visual review",
            quiz: {
              titleAr: "اختبار: المراجعة البصرية",
              titleEn: "Quiz: visual review",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما المعيار الأفضل لنقاش قرار شكلي؟",
                  promptEn: "What is the better standard for discussing a visual decision?",
                  explanationAr: "المعيار الوظيفي قابل للقياس والملاحظة، بخلاف الذوق.",
                  explanationEn:
                    "A functional standard can be measured and observed, unlike taste.",
                  options: [
                    {
                      textAr: "هل يقلّل عدد الحركات لإتمام المهمّة؟",
                      textEn: "Does it reduce the moves needed to finish the task?",
                      isCorrect: true,
                    },
                    {
                      textAr: "هل يبدو أجمل من البديل؟",
                      textEn: "Does it look nicer than the alternative?",
                      isCorrect: false,
                    },
                    {
                      textAr: "هل وافقه أكبر عدد من الناس؟",
                      textEn: "Did the most people agree with it?",
                      isCorrect: false,
                    },
                    {
                      textAr: "هل استخدم أحدث صيحة تصميمية؟",
                      textEn: "Did it use the latest design trend?",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "مقياس التباين يجب أن يُفحص عند تكبير الخطّ أيضًا.",
                  promptEn: "Contrast should also be checked when text is enlarged.",
                  explanationAr: "تكبير الخطّ يغيّر التباين الفعلي ويجب أن يبقى المعنى واضحًا.",
                  explanationEn:
                    "Enlarging text changes effective contrast, and the meaning must remain clear.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الذي يجب أن يميّزه المستخدم في جدول أرقام دون قراءة كل صفّ؟",
                  promptEn:
                    "What should a user be able to spot in a numbers table without reading every row?",
                  explanationAr: "القيم الخارجة عن المتوقّع يجب أن تبرز بصريًا.",
                  explanationEn: "Values outside the expected range should stand out visually.",
                  acceptedAnswers: ["outliers", "outlier", "wrong values", "anomalies"],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "متى تظهر رسالة الخطأ في النموذج المثالي؟",
                  promptEn: "When does an error message appear in an ideal form?",
                  explanationAr: "إظهار الخطأ قبل الإرسال يوفر على المستخدم دورة كاملة.",
                  explanationEn:
                    "Showing the error before submission saves the user a whole round trip.",
                  options: [
                    {
                      textAr: "قبل أن يرسل المستخدم الطلب",
                      textEn: "Before the user submits the request",
                      isCorrect: true,
                    },
                    {
                      textAr: "بعد إعادة تحميل الصفحة",
                      textEn: "After the page reloads",
                      isCorrect: false,
                    },
                    {
                      textAr: "في بريد إلكتروني لاحق",
                      textEn: "In a later email",
                      isCorrect: false,
                    },
                    {
                      textAr: "في سجل الخادم فقط",
                      textEn: "Only in the server log",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يخدم كثافة صفوف الجدول؟",
                  promptEn: "Which of these help with table row density?",
                  explanationAr: "ارتفاع صفّ مناسب ومحاذاة الأرقام تحسّنان القراءة السريعة.",
                  explanationEn:
                    "Sensible row height and aligned numbers both improve fast reading.",
                  options: [
                    {
                      textAr: "ارتفاع صفّ يكفي للمس على الهاتف",
                      textEn: "A row height that is tappable on phones",
                      isCorrect: true,
                    },
                    {
                      textAr: "محاذاة الأرقام لتسهيل المقارنة",
                      textEn: "Aligning numbers to ease comparison",
                      isCorrect: true,
                    },
                    {
                      textAr: "تصغير الخطّ لتوفير مساحة",
                      textEn: "Shrinking the font to save space",
                      isCorrect: false,
                    },
                    {
                      textAr: "إخفاء رؤوس الأعمدة",
                      textEn: "Hiding column headers",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "design-systems-in-figma",
    instructorUsername: "sara-alqahtani",
    categorySlug: "design",
    titleAr: "أنظمة التصميم في Figma: من الفوضى إلى مكتبة يعتمد عليها فريق",
    titleEn: "Design Systems in Figma: From Scattered Files to a Library a Team Trusts",
    subtitleAr: "بناء متغيّرات ومكوّنات قابلة للتوسّع دون أن تتحوّل المكتبة إلى عبء صيانة",
    subtitleEn:
      "Building variables and components that scale without the library becoming a maintenance burden",
    descriptionAr:
      "تبدأ الدورة من مشكلة يعرفها كل فريق: كل مصمّم يبني زرًّا بطريقته، ثم يُطلب تغيير اللون فيُعدَّل في ستة ملفات. نبني معًا مكتبة صغيرة: متغيّرات للألوان والمسافات، ثم مكوّنات لها خصائص واضحة، ثم نتعمّد كسر المكتبة لنرى كيف نتصرّف حين لا يغطّي المكوّن حالة نادرة.\n\nنغطّي أيضًا الجانب الذي يُنسى: كيف يُسمّى الشيء، ومن يملك القرار، وكيف تُنشر نسخة جديدة على الفريق دون أن تتعطّل أعمال قائمة. الهدف مكتبة يفهمها مصمّم جديد في يوم واحد، لا مكتبة يفهمها صاحبها وحده.",
    descriptionEn:
      "The course starts from a problem every team knows: each designer builds a button their own way, then a colour change request means editing six files. Together we build a small library: variables for colour and spacing, components with clear properties, and then we deliberately break the library to see what happens when a component does not cover a rare case.\n\nWe also cover the overlooked half: how things get named, who owns the decision, and how a new version reaches the team without stalling work in flight. The aim is a library a new designer understands in a day, not one only its author understands.",
    level: "BEGINNER",
    language: "AR",
    priceCents: 18900,
    objectives: [
      {
        textAr: "تبني مجموعة متغيّرات للألوان والمسافات والحدود.",
        textEn: "Build a variable set for colour, spacing, and borders.",
      },
      {
        textAr: "تصمّم مكوّنًا بخصائص واضحة بدل نسخ متعدّدة منه.",
        textEn: "Design a component with clear properties instead of multiple copies.",
      },
      {
        textAr: "تسمّي العناصر بنظام يجده غيرك بسرعة.",
        textEn: "Name elements with a system so others find them quickly.",
      },
      {
        textAr: "تعالج الحالة التي لا يغطّيها المكوّن دون كسر المكتبة.",
        textEn: "Handle a case the component does not cover without breaking the library.",
      },
      {
        textAr: "تنشر نسخة جديدة من المكتبة على الفريق بأمان.",
        textEn: "Publish a new library version to the team safely.",
      },
      {
        textAr: "تحدّد من يملك قرار التغيير وكيف يُراجَع.",
        textEn: "Define who owns a change decision and how it is reviewed.",
      },
    ],
    requirements: [
      {
        textAr: "حساب Figma ومعرفة أساسية بالأدوات.",
        textEn: "A Figma account and basic familiarity with its tools.",
      },
      {
        textAr: "لا حاجة إلى خبرة سابقة بأنظمة التصميم.",
        textEn: "No prior experience with design systems needed.",
      },
      {
        textAr: "مشروع واجهة صغير للتطبيق عليه.",
        textEn: "A small interface project to apply the work to.",
      },
    ],
    sections: [
      {
        titleAr: "الأساس: المتغيّرات والرموز",
        titleEn: "Foundations: Variables and Tokens",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا تنهار المكتبات: نسخ متعدّدة لنفس العنصر",
            titleEn: "Why libraries collapse: many copies of one element",
            isPreview: true,
            durationSec: 420,
          },
          {
            type: "VIDEO",
            titleAr: "المتغيّرات: لون واحد بمعانٍ متعدّدة",
            titleEn: "Variables: one colour with several meanings",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "المسافات والمقياس: شبكة يفهمها الجميع",
            titleEn: "Spacing and scale: a grid everyone understands",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "الوضع الليلي عبر المتغيّرات لا عبر نسخ",
            titleEn: "Dark mode through variables, not copies",
            durationSec: 660,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: الفرق بين اللون والمعنى",
            titleEn: "Reading: the difference between a colour and a meaning",
            durationSec: 300,
            contentAr:
              "<p>أكثر خطأ يهدم نظام تصميم مبكّرًا هو تسمية المتغيّرات بأسماء ألوانها. حين تُسمّى «أزرق 500» ثم يقرّر الفريق أن الأساسي أخضر، تحتاج إلى تغيير الأسماء كلها، وهو أكبر من تغيير القيمة.</p><h3>تسمية بالمعنى</h3><ul><li>اسم الطبقة الدنيا يصف اللون: هوية التمييز.</li><li>اسم الطبقة الوسطى يصف الدور: خلفية أساسية، نصّ ثانوي.</li><li>اسم الطبقة العليا يصف السياق: تحذير، نجاح.</li></ul><p>بهذا الترتيب يبقى التغيير في طبقة واحدة، وترى الفريق يستبدل قيمة واحدة بدل ستين موضعًا.</p>",
            contentEn:
              "<p>The mistake that wrecks an early design system is naming variables after their colours. Name one «blue 500», then the team decides the primary is green, and now you must rename every variable, which is bigger than changing the value.</p><h3>Naming by meaning</h3><ul><li>The lowest layer describes the colour: brand accent.</li><li>The middle layer describes the role: base background, secondary text.</li><li>The top layer describes the context: warning, success.</li></ul><p>With this order the change stays in one layer, and you watch the team swap a single value instead of sixty places.</p>",
          },
        ],
      },
      {
        titleAr: "المكوّنات وخصائصها",
        titleEn: "Components and Their Properties",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "خصائص المكوّن بدل نسخ متعدّدة",
            titleEn: "Component properties instead of multiple copies",
            isPreview: true,
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "الحالات: الافتراضية والتحويم والتعطيل",
            titleEn: "States: default, hover, and disabled",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "تركيب المكوّنات دون تداخل مربك",
            titleEn: "Composing components without confusing nesting",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: ماذا نفعل حين لا يغطّي المكوّن حالة",
            titleEn: "Reading: what to do when a component misses a case",
            durationSec: 360,
            contentAr:
              "<p>الحالة النادرة ليست عيبًا في المكتبة؛ هي دعوة لسؤال: هل هذه الحالة استثناء حقيقي أم وظيفة ناقصة؟ الفرق يحدّد مسار العمل بالكامل.</p><h3>خياران فقط</h3><ul><li>إن تكرّرت الحالة في شاشتين، فهي وظيفة ناقصة: وسّع المكوّن بخصيصة جديدة.</li><li>إن ظهرت مرة واحدة ولا تتوقّع تكرارها، فابنِ بديلًا محليًا وسمّه بوضوح خارج المكتبة.</li></ul><p>ما لا يجب فعله هو تعديل المكتبة لحالة واحدة نادرة: يصبح المكوّن مثقَلًا بخصائص يستخدمها أحد، ويخسر الجميع وضوحه.</p>",
            contentEn:
              "<p>A rare case is not a flaw in the library; it is an invitation to ask: is this a genuine exception or a missing feature? The difference decides the whole workflow.</p><h3>Only two options</h3><ul><li>If the case recurs across two screens, it is a missing feature: extend the component with a new property.</li><li>If it appears once and is unlikely to repeat, build a local variant named clearly, outside the library.</li></ul><p>What you must not do is edit the library for a single rare case: the component becomes heavy with properties one person uses, and everyone loses clarity.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: المتغيّرات والمكوّنات",
            titleEn: "Quiz: variables and components",
            quiz: {
              titleAr: "اختبار: المتغيّرات والمكوّنات",
              titleEn: "Quiz: variables and components",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 900,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "لماذا نسمّي المتغيّر بمعناه لا بلونه؟",
                  promptEn: "Why name a variable by its meaning rather than its colour?",
                  explanationAr: "الاسم بالمعنى يسمح بتغيير القيمة دون إعادة تسمية كل شيء.",
                  explanationEn:
                    "A meaning-based name lets the value change without renaming everything.",
                  options: [
                    {
                      textAr: "لنغيّر القيمة دون إعادة تسمية المواضع",
                      textEn: "So the value can change without renaming every usage",
                      isCorrect: true,
                    },
                    {
                      textAr: "لأن الأسماء الطويلة أسهل في القراءة",
                      textEn: "Because longer names are easier to read",
                      isCorrect: false,
                    },
                    {
                      textAr: "لتقليل عدد المكوّنات",
                      textEn: "To reduce the number of components",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأن Figma لا يقبل أسماء ألوان",
                      textEn: "Because Figma rejects colour names",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "يجب توسيع المكوّن في المكتبة لكل حالة نادرة تظهر مرة واحدة.",
                  promptEn:
                    "A library component should be extended for every rare case that appears once.",
                  explanationAr: "الحالة الواحدة النادرة تُعالج ببديل محلي لا بإثقال المكتبة.",
                  explanationEn:
                    "A single rare case is handled with a local variant, not by weighing down the library.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الاسم العام للقيم التي تحدد الألوان والمسافات في نظام التصميم؟",
                  promptEn:
                    "What is the general name for the values defining a system's colours and spacing?",
                  explanationAr: "المتغيّرات أو الرموز تحمل هذه القيم وتُشار إليها بالاسم.",
                  explanationEn:
                    "Variables or tokens hold these values and are referenced by name.",
                  acceptedAnswers: ["variables", "tokens", "design tokens", "variable tokens"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يُعدّ سببًا لإضافة خصيصة إلى مكوّن؟",
                  promptEn: "Which of these justify adding a property to a component?",
                  explanationAr: "التكرار في أكثر من شاشة واستخدام حقيقي يبرّران التوسيع.",
                  explanationEn:
                    "Recurrence across screens and real usage both justify an extension.",
                  options: [
                    {
                      textAr: "ظهور الحالة في شاشتين مختلفتين",
                      textEn: "The case appearing on two different screens",
                      isCorrect: true,
                    },
                    {
                      textAr: "استخدام يبرّر تعقيدًا إضافيًا محسوبًا",
                      textEn: "Usage that justifies a calculated added complexity",
                      isCorrect: true,
                    },
                    {
                      textAr: "رغبة مصمّم واحد في التجربة",
                      textEn: "One designer wanting to experiment",
                      isCorrect: false,
                    },
                    {
                      textAr: "طلب مدير بلا سيناريو",
                      textEn: "A manager's request with no scenario",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "كيف نتعامل مع الوضع الليلي في نظام قائم على المتغيّرات؟",
                  promptEn: "How is dark mode handled in a variable-based system?",
                  explanationAr:
                    "الوضع الليلي مجموعة قيم بديلة للمتغيّرات نفسها، لا نسخة ثانية من المكوّنات.",
                  explanationEn:
                    "Dark mode is an alternate value set for the same variables, not a second copy of components.",
                  options: [
                    {
                      textAr: "بنسخة بديلة من قيم المتغيّرات نفسها",
                      textEn: "With an alternate value set for the same variables",
                      isCorrect: true,
                    },
                    {
                      textAr: "بتصميم كل مكوّن مرتين",
                      textEn: "By designing every component twice",
                      isCorrect: false,
                    },
                    {
                      textAr: "بإضافة طبقة شفافة سوداء",
                      textEn: "By adding a transparent black overlay",
                      isCorrect: false,
                    },
                    {
                      textAr: "بحذف الألوان الداكنة",
                      textEn: "By deleting dark colours",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "النشر والحكم",
        titleEn: "Publishing and Governance",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "نشر نسخة جديدة دون تعطيل عمل قائم",
            titleEn: "Publishing a new version without stalling work in flight",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "من يملك قرار تغيير المكتبة",
            titleEn: "Who owns a library change decision",
            durationSec: 480,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: التسمية التي تكسب الجميع",
            titleEn: "Reading: naming that earns everyone's time",
            durationSec: 300,
            contentAr:
              "<p>اسم سيء يكلّف الفريق دقائق كل يوم، واسم جيد يوفّرها. لا تحتاج نظام تسمية معقّدًا؛ تحتاج ثلاثة قرارات متّفق عليها تُكتب في مكان يراه الجميع.</p><h3>ثلاثة قرارات تكفي</h3><ul><li>لغة واحدة للأسماء: إنجليزية دائمًا أو عربية دائمًا، لا خلطًا.</li><li>ترتيب ثابت للأجزاء: النوع ثم الدور ثم الحالة.</li><li>قائمة كلمات ممنوعة: أسماء عامة مثل «جديد» و«مؤقت».</li></ul><p>هذه القرارات الصغيرة تُغني عن إعادة تنظيم المكتبة لاحقًا، وهي أسهل من أي أداة.</p>",
            contentEn:
              "<p>A poor name costs the team minutes every day; a good one returns them. You do not need an elaborate naming scheme; you need three agreed decisions written where everyone sees them.</p><h3>Three decisions are enough</h3><ul><li>One naming language: always English or always Arabic, never mixed.</li><li>A fixed part order: type, then role, then state.</li><li>A banned-word list: generic names like «new» and «temp».</li></ul><p>These small decisions spare you reorganising the library later, and they are easier than any tool.</p>",
          },
          {
            type: "FILE",
            titleAr: "قواعد تسمية مكوّنات المكتبة",
            titleEn: "Library component naming rules",
            durationSec: 300,
            attachmentAr: "قواعد تسمية مكوّنات المكتبة",
            attachmentEn: "Library component naming rules",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: النشر والحكم",
            titleEn: "Quiz: publishing and governance",
            quiz: {
              titleAr: "اختبار: النشر والحكم",
              titleEn: "Quiz: publishing and governance",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما أخطر خطأ في التسمية؟",
                  promptEn: "What is the most damaging naming mistake?",
                  explanationAr: "الأسماء العامة لا تخبر القارئ بشيء وتنتشر بسرعة.",
                  explanationEn: "Generic names tell the reader nothing and spread quickly.",
                  options: [
                    {
                      textAr: "استخدام أسماء عامة مثل «جديد» و«مؤقت»",
                      textEn: "Using generic names like «new» and «temp»",
                      isCorrect: true,
                    },
                    {
                      textAr: "استخدام اللغة الإنجليزية",
                      textEn: "Using English",
                      isCorrect: false,
                    },
                    { textAr: "استخدام ثلاث كلمات", textEn: "Using three words", isCorrect: false },
                    {
                      textAr: "استخدام أرقام في النهاية",
                      textEn: "Using numbers at the end",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "خلط العربية والإنجليزية في أسماء المكوّنات مقبول إن فهمه الفريق.",
                  promptEn:
                    "Mixing Arabic and English in component names is fine if the team understands it.",
                  explanationAr: "الخلط يبطئ البحث والنظام الموحّد أفضل.",
                  explanationEn:
                    "Mixing slows searching, and a single consistent language works better.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الذي يجب أن يُكتب عن قرارات التسمية ليعرفها الجميع؟",
                  promptEn: "Where should naming decisions be written so everyone knows them?",
                  explanationAr: "القرارات المكتوبة في مكان مرئي تُغني عن التذكير الشفهي.",
                  explanationEn: "Decisions written somewhere visible replace verbal reminders.",
                  acceptedAnswers: ["documentation", "docs", "guideline", "written rules"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يجعل نشر نسخة جديدة آمنًا؟",
                  promptEn: "Which of these make publishing a new version safe?",
                  explanationAr: "إشعار الفريق وترتيب التغييرات الكبيرة يجعلان الانتقال ممكنًا.",
                  explanationEn:
                    "Notifying the team and sequencing large changes keep the transition possible.",
                  options: [
                    {
                      textAr: "إبلاغ الفريق قبل التغيير الكبير",
                      textEn: "Notifying the team before a large change",
                      isCorrect: true,
                    },
                    {
                      textAr: "ترتيب التغييرات على مراحل صغيرة",
                      textEn: "Sequencing changes in small stages",
                      isCorrect: true,
                    },
                    {
                      textAr: "تغيير كل شيء دفعة واحدة ليلًا",
                      textEn: "Changing everything at once overnight",
                      isCorrect: false,
                    },
                    {
                      textAr: "إخفاء التغيير حتى يُكتشف",
                      textEn: "Hiding the change until it is noticed",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما أفضل ترتيب لأجزاء اسم المكوّن؟",
                  promptEn: "What is the best order for a component name's parts?",
                  explanationAr: "ترتيب ثابت من النوع إلى الدور إلى الحالة يسهّل البحث والتصفية.",
                  explanationEn:
                    "A fixed order from type to role to state makes searching and filtering easy.",
                  options: [
                    {
                      textAr: "النوع ثم الدور ثم الحالة",
                      textEn: "Type, then role, then state",
                      isCorrect: true,
                    },
                    {
                      textAr: "الحالة ثم النوع ثم الدور",
                      textEn: "State, then type, then role",
                      isCorrect: false,
                    },
                    {
                      textAr: "اسم المصمّم ثم التاريخ",
                      textEn: "The designer's name, then the date",
                      isCorrect: false,
                    },
                    {
                      textAr: "رقم عشوائي ثم النوع",
                      textEn: "A random number, then the type",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "accessibility-and-inclusive-design",
    instructorUsername: "sara-alqahtani",
    categorySlug: "design",
    titleAr: "إمكانية الوصول والتصميم الشامل",
    titleEn: "Accessibility and Inclusive Design",
    subtitleAr: "تصميم يعمل بلوحة المفاتيح وقارئ الشاشة، ومعايير تُقاس لا تُدّعى",
    subtitleEn:
      "Designs that work with a keyboard and a screen reader, checked against measurable criteria",
    descriptionAr:
      "كثيرًا ما تُعامَل إمكانية الوصول كقائمة تحقق في نهاية المشروع، ولهذا تكون أغلى ما ندفعه وأقلّه أثرًا. هنا نعمل بالعكس: نبني نموذجًا وجدول بيانات، ثم نضعه أمام لوحة مفاتيح وقارئ شاشة وشاشة مكبّرة، ونصلح ما ينكسر. كل إصلاح يُربط بالمعيار الذي يحققه حتى تستطيع الدفاع عنه في المراجعة.\n\nنغطي أيضًا ما تتجاوزه الفرق عادة: ترتيب التركيز، وإعلان رسائل الخطأ، واللون حين يكون الإشارة الوحيدة، والحركة حين لا يمكن إيقافها. ننتهي بتحويل بعض هذه الفحوص إلى اختبارات آلية، فتصبح إمكانية الوصول مُتحقَّقًا منها مع كل تغيير لا تدقيقًا سنويًا.",
    descriptionEn:
      "Accessibility is often treated as a final checklist, which is why it costs the most and fixes the least. We work the other way: build a form and a data table, then put them under a keyboard, a screen reader, and a zoomed viewport, and fix what breaks. Each fix comes with the standard it satisfies so you can defend the change in review.\n\nThe course also covers the parts teams skip: focus order, error announcements, colour that is not the only signal, and motion that can be turned off. We finish by turning a handful of these checks into automated tests, so accessibility is verified on every change rather than audited once a year.",
    level: "ALL_LEVELS",
    language: "EN",
    priceCents: 19900,
    objectives: [
      {
        textAr: "تتنقّل في الواجهة بلوحة المفاتيح وحدها وتكتشف العقبات.",
        textEn: "Navigate an interface with the keyboard alone and find the blockers.",
      },
      {
        textAr: "تضبط ترتيب التركيز وإدارة التركيز عند الحوارات.",
        textEn: "Set focus order and manage focus inside dialogs.",
      },
      {
        textAr: "تكتب نصًّا بديلًا ورسائل خطأ يعلنها قارئ الشاشة بشكل مفيد.",
        textEn: "Write alt text and error messages a screen reader announces usefully.",
      },
      {
        textAr: "تتخلّى عن اللون كإشارة وحيدة للحالة.",
        textEn: "Stop relying on colour as the only signal of state.",
      },
      {
        textAr: "تحترم تقليل الحركة عند طلب المستخدم ذلك.",
        textEn: "Honour reduced-motion when the user asks for it.",
      },
      {
        textAr: "تحوّل فحوصًا يدوية إلى اختبارات آلية في سلسلة التكامل.",
        textEn: "Turn manual checks into automated tests in CI.",
      },
    ],
    requirements: [
      { textAr: "معرفة بأساسيات HTML و CSS.", textEn: "Familiarity with HTML and CSS basics." },
      {
        textAr: "قدرة على تشغيل مشروع واجهة محليًا.",
        textEn: "Ability to run a frontend project locally.",
      },
      {
        textAr: "لا حاجة إلى خبرة سابقة بإمكانية الوصول.",
        textEn: "No prior accessibility experience needed.",
      },
      {
        textAr: "رغبة في استخدام لوحة المفاتيح أثناء العمل.",
        textEn: "Willingness to work with the keyboard throughout.",
      },
    ],
    sections: [
      {
        titleAr: "Keyboard and Focus",
        titleEn: "Keyboard and Focus",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "Why the keyboard first",
            titleEn: "Why the keyboard first",
            isPreview: true,
            durationSec: 480,
          },
          {
            type: "VIDEO",
            titleAr: "Focus order that follows the task",
            titleEn: "Focus order that follows the task",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "Managing focus inside a dialog",
            titleEn: "Managing focus inside a dialog",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "Skip links and landmarks that save keystrokes",
            titleEn: "Skip links and landmarks that save keystrokes",
            durationSec: 420,
          },
          {
            type: "TEXT",
            titleAr: "Reading: the invisible focus trap",
            titleEn: "Reading: the invisible focus trap",
            durationSec: 300,
            contentAr:
              "<p>The most common accessibility defect is not a missing label; it is a control that cannot be reached without a mouse. It hides in custom dropdowns, modal windows, and anything built from a plain element that was never meant to be interactive.</p><h3>What to check in order</h3><ul><li>Can every control be reached with Tab, and only real controls?</li><li>Does Tab order follow the visual task rather than the DOM accident?</li><li>When a dialog opens, does focus move inside it, and return when it closes?</li></ul><p>Fix these three before touching colour or contrast. They keep entire task flows usable, and they are cheap once you make them a habit rather than a project.</p>",
            contentEn:
              "<p>The most common accessibility defect is not a missing label; it is a control that cannot be reached without a mouse. It hides in custom dropdowns, modal windows, and anything built from a plain element that was never meant to be interactive.</p><h3>What to check in order</h3><ul><li>Can every control be reached with Tab, and only real controls?</li><li>Does Tab order follow the visual task rather than the DOM accident?</li><li>When a dialog opens, does focus move inside it, and return when it closes?</li></ul><p>Fix these three before touching colour or contrast. They keep entire task flows usable, and they are cheap once you make them a habit rather than a project.</p>",
          },
        ],
      },
      {
        titleAr: "Announcing and Signalling",
        titleEn: "Announcing and Signalling",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "Alt text that describes the job, not the file",
            titleEn: "Alt text that describes the job, not the file",
            isPreview: true,
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "Errors announced at the right moment",
            titleEn: "Errors announced at the right moment",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "Colour is never the only signal",
            titleEn: "Colour is never the only signal",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "Reading: writing a message a screen reader can use",
            titleEn: "Reading: writing a message a screen reader can use",
            durationSec: 360,
            contentAr:
              "<p>An error message designed for the eye often fails the ear. «Invalid input» read aloud gives no location and no fix. A useful message names the field, states what is wrong, and says what the user can do next.</p><h3>Three parts of a useful message</h3><ul><li>The field, by its visible label.</li><li>The rule that was broken, in plain words.</li><li>The action, phrased as a step rather than a complaint.</li></ul><p>Then wire it up so the message is announced when it appears and associated with the field, not merely near it. Position on screen means nothing to a screen reader.</p>",
            contentEn:
              "<p>An error message designed for the eye often fails the ear. «Invalid input» read aloud gives no location and no fix. A useful message names the field, states what is wrong, and says what the user can do next.</p><h3>Three parts of a useful message</h3><ul><li>The field, by its visible label.</li><li>The rule that was broken, in plain words.</li><li>The action, phrased as a step rather than a complaint.</li></ul><p>Then wire it up so the message is announced when it appears and associated with the field, not merely near it. Position on screen means nothing to a screen reader.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "Quiz: announcing and signalling",
            titleEn: "Quiz: announcing and signalling",
            quiz: {
              titleAr: "Quiz: announcing and signalling",
              titleEn: "Quiz: announcing and signalling",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 900,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "What makes an error message usable by a screen reader?",
                  promptEn: "What makes an error message usable by a screen reader?",
                  explanationAr: "Naming the field and the fix gives the user something to act on.",
                  explanationEn: "Naming the field and the fix gives the user something to act on.",
                  options: [
                    {
                      textAr: "It names the field, the rule, and the next step",
                      textEn: "It names the field, the rule, and the next step",
                      isCorrect: true,
                    },
                    {
                      textAr: "It is short and red",
                      textEn: "It is short and red",
                      isCorrect: false,
                    },
                    {
                      textAr: "It appears far from the field",
                      textEn: "It appears far from the field",
                      isCorrect: false,
                    },
                    {
                      textAr: "It is written in caps",
                      textEn: "It is written in caps",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr:
                    "A message placed visually next to a field is automatically associated with it.",
                  promptEn:
                    "A message placed visually next to a field is automatically associated with it.",
                  explanationAr:
                    "Visual proximity is not a programmatic association; it must be linked explicitly.",
                  explanationEn:
                    "Visual proximity is not a programmatic association; it must be linked explicitly.",
                  options: [
                    { textAr: "True", textEn: "True", isCorrect: false },
                    { textAr: "False", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "Which user preference should disable large motion?",
                  promptEn: "Which user preference should disable large motion?",
                  explanationAr:
                    "The reduced-motion preference signals the user wants less or no animation.",
                  explanationEn:
                    "The reduced-motion preference signals the user wants less or no animation.",
                  acceptedAnswers: [
                    "reduced motion",
                    "prefers-reduced-motion",
                    "reduce motion",
                    "reduced-motion",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "Which signals can back up a colour-coded status?",
                  promptEn: "Which signals can back up a colour-coded status?",
                  explanationAr:
                    "Text and an icon shape give a non-colour cue that everyone can read.",
                  explanationEn:
                    "Text and an icon shape give a non-colour cue that everyone can read.",
                  options: [
                    { textAr: "A text label", textEn: "A text label", isCorrect: true },
                    {
                      textAr: "A distinct icon shape",
                      textEn: "A distinct icon shape",
                      isCorrect: true,
                    },
                    {
                      textAr: "A slightly different shade of the same hue only",
                      textEn: "A slightly different shade of the same hue only",
                      isCorrect: false,
                    },
                    {
                      textAr: "A subtle drop shadow only",
                      textEn: "A subtle drop shadow only",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "When does focus move into a dialog?",
                  promptEn: "When does focus move into a dialog?",
                  explanationAr: "Focus moves in when the dialog opens and returns when it closes.",
                  explanationEn: "Focus moves in when the dialog opens and returns when it closes.",
                  options: [
                    {
                      textAr: "When the dialog opens, and back when it closes",
                      textEn: "When the dialog opens, and back when it closes",
                      isCorrect: true,
                    },
                    {
                      textAr: "Only when the user clicks inside",
                      textEn: "Only when the user clicks inside",
                      isCorrect: false,
                    },
                    {
                      textAr: "Never; focus stays behind it",
                      textEn: "Never; focus stays behind it",
                      isCorrect: false,
                    },
                    {
                      textAr: "Only after the first keystroke",
                      textEn: "Only after the first keystroke",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "Verifying Accessibility",
        titleEn: "Verifying Accessibility",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "Automated checks and their blind spots",
            titleEn: "Automated checks and their blind spots",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "Zoom, reflow, and long translated strings",
            titleEn: "Zoom, reflow, and long translated strings",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "Reading: what automation cannot tell you",
            titleEn: "Reading: what automation cannot tell you",
            durationSec: 300,
            contentAr:
              "<p>Automated tools catch perhaps a third of real problems, and that third is worth catching because it never regresses silently. The danger is treating a green run as proof of accessibility.</p><h3>A practical split</h3><ul><li>Automate: names, contrasts, focus order, and duplicate ids.</li><li>Test by hand: keyboard-only task completion, screen-reader announcements, and zoomed reflow.</li><li>Test with people: the cases neither method predicts.</li></ul><p>Keep the automated set small and stable so it stays green, then spend the saved time on the hand tests that find the defects users actually hit.</p>",
            contentEn:
              "<p>Automated tools catch perhaps a third of real problems, and that third is worth catching because it never regresses silently. The danger is treating a green run as proof of accessibility.</p><h3>A practical split</h3><ul><li>Automate: names, contrasts, focus order, and duplicate ids.</li><li>Test by hand: keyboard-only task completion, screen-reader announcements, and zoomed reflow.</li><li>Test with people: the cases neither method predicts.</li></ul><p>Keep the automated set small and stable so it stays green, then spend the saved time on the hand tests that find the defects users actually hit.</p>",
          },
          {
            type: "FILE",
            titleAr: "Accessibility review worksheet",
            titleEn: "Accessibility review worksheet",
            durationSec: 300,
            attachmentAr: "ورقة عمل مراجعة إمكانية الوصول",
            attachmentEn: "Accessibility review worksheet",
          },
          {
            type: "QUIZ",
            titleAr: "Quiz: verifying accessibility",
            titleEn: "Quiz: verifying accessibility",
            quiz: {
              titleAr: "Quiz: verifying accessibility",
              titleEn: "Quiz: verifying accessibility",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "What is the main risk of relying on automated accessibility tools?",
                  promptEn: "What is the main risk of relying on automated accessibility tools?",
                  explanationAr:
                    "Automation misses most real user barriers, so a green run is not proof.",
                  explanationEn:
                    "Automation misses most real user barriers, so a green run is not proof.",
                  options: [
                    {
                      textAr: "Treating a passing run as proof of accessibility",
                      textEn: "Treating a passing run as proof of accessibility",
                      isCorrect: true,
                    },
                    {
                      textAr: "They slow down the build",
                      textEn: "They slow down the build",
                      isCorrect: false,
                    },
                    {
                      textAr: "They cannot check contrasts",
                      textEn: "They cannot check contrasts",
                      isCorrect: false,
                    },
                    {
                      textAr: "They require a licence",
                      textEn: "They require a licence",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "Testing keyboard-only task completion is worth doing by hand.",
                  promptEn: "Testing keyboard-only task completion is worth doing by hand.",
                  explanationAr: "Many blockers only appear when a mouse is removed.",
                  explanationEn: "Many blockers only appear when a mouse is removed.",
                  options: [
                    { textAr: "True", textEn: "True", isCorrect: true },
                    { textAr: "False", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "Which automatic check most reliably prevents silent regressions?",
                  promptEn: "Which automatic check most reliably prevents silent regressions?",
                  explanationAr:
                    "Accessible names regress silently and are easy to assert automatically.",
                  explanationEn:
                    "Accessible names regress silently and are easy to assert automatically.",
                  acceptedAnswers: ["accessible names", "names", "labels", "alt text"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "Which situations should be tested with a zoomed viewport?",
                  promptEn: "Which situations should be tested with a zoomed viewport?",
                  explanationAr:
                    "Reflow and long translated strings break layouts that look fine at 100%.",
                  explanationEn:
                    "Reflow and long translated strings break layouts that look fine at 100%.",
                  options: [
                    {
                      textAr: "Text zoomed to 200 per cent",
                      textEn: "Text zoomed to 200 per cent",
                      isCorrect: true,
                    },
                    {
                      textAr: "Long translated strings",
                      textEn: "Long translated strings",
                      isCorrect: true,
                    },
                    {
                      textAr: "A default desktop window at 100 per cent",
                      textEn: "A default desktop window at 100 per cent",
                      isCorrect: false,
                    },
                    {
                      textAr: "A screenshot in a slide deck",
                      textEn: "A screenshot in a slide deck",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "What should the automated accessibility set be?",
                  promptEn: "What should the automated accessibility set be?",
                  explanationAr: "Small and stable keeps it green and useful over time.",
                  explanationEn: "Small and stable keeps it green and useful over time.",
                  options: [
                    {
                      textAr: "Small and stable, run on every change",
                      textEn: "Small and stable, run on every change",
                      isCorrect: true,
                    },
                    {
                      textAr: "Exhaustive, run once a year",
                      textEn: "Exhaustive, run once a year",
                      isCorrect: false,
                    },
                    {
                      textAr: "Removed after launch",
                      textEn: "Removed after launch",
                      isCorrect: false,
                    },
                    {
                      textAr: "Only run on the homepage",
                      textEn: "Only run on the homepage",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "frontend-design-foundations",
    instructorUsername: "noor-almutairi",
    categorySlug: "design",
    titleAr: "أساسيات تصميم الواجهات الأمامية للمطوّرين",
    titleEn: "Frontend Design Foundations for Developers",
    subtitleAr: "مبادئ التخطيط والطبقات والحركة التي تجعل واجهتك تبدو مقصودة",
    subtitleEn: "Layout, layering, and motion principles that make your interface look intentional",
    descriptionAr:
      "كثير من المطوّرين يستطيعون بناء تخطيط يعمل، لكنهم يقفون عاجزين أمام شاشة تبدو غير مقصودة رغم عدم وجود خطأ فيها. نعالج الفرق عبر قرارات قابلة للتنفيذ: كيف تُختار المسافات من مقياس ثابت، وكيف تُرتَّب الطبقات بحيث يعرف المستخدم ما يمكن النقر عليه، وكيف تُستخدم الحركة للإشارة لا للتزيين.\n\nنبنينا في نهاية الدورة ثلاث شاشات حقيقية: نموذج إدخال، وبطاقة منتج، وشاشة تفاصيل. سنقارن بين نسخة متسرّعة ونسخة مصقولة، ونقيس الفرق بمعايير يمكن تبريرها في المراجعة، لا بعبارة «هذا أجمل».",
    descriptionEn:
      "Many developers can build a layout that works, then freeze in front of a screen that feels unintentional even though nothing is broken. We close that gap with executable decisions: how spacing comes from a fixed scale, how layering tells the user what is clickable, and how motion signals rather than decorates.\n\nBy the end you build three real screens: an input form, a product card, and a detail view. We compare a rushed version with a polished one and measure the difference against standards you can defend in review, not the sentence «this looks nicer».",
    level: "BEGINNER",
    language: "AR",
    priceCents: 15900,
    objectives: [
      {
        textAr: "تبني مقياس مسافات ثابتًا وتستخدمه في كل الشاشات.",
        textEn: "Build a fixed spacing scale and use it across every screen.",
      },
      {
        textAr: "ترتّب الطبقات بحيث يبدو التفاعل واضحًا قبل النقر.",
        textEn: "Order layers so interactivity is obvious before a click.",
      },
      {
        textAr: "تصمّم نموذج إدخال يوجّه المستخدم عند الخطأ قبل الإرسال.",
        textEn: "Design an input form that guides the user on error before submitting.",
      },
      {
        textAr: "تستخدم الحركة بمدة وهدف واضحين لا كزينة.",
        textEn: "Use motion with a clear duration and purpose, not as decoration.",
      },
      {
        textAr: "تختار أنواع الخطوط والأحجام وفق قابلية القراءة.",
        textEn: "Choose type sizes and families for readability.",
      },
      {
        textAr: "تبرّر القرار الشكلي بمعيار وظيفي في المراجعة.",
        textEn: "Justify a visual decision with a functional standard in review.",
      },
    ],
    requirements: [
      { textAr: "معرفة بـ HTML و CSS الأساسية.", textEn: "Knowledge of basic HTML and CSS." },
      {
        textAr: "قدرة على فتح مشروع واجهة محليًا ومعاينته.",
        textEn: "Ability to open and preview a frontend project locally.",
      },
      { textAr: "لا حاجة إلى خبرة تصميم سابقة.", textEn: "No prior design experience needed." },
    ],
    sections: [
      {
        titleAr: "المسافات والطبقات",
        titleEn: "Space and Layering",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا تبدو بعض الواجهات غير مقصودة",
            titleEn: "Why some interfaces feel unintentional",
            isPreview: true,
            durationSec: 420,
          },
          {
            type: "VIDEO",
            titleAr: "مقياس المسافات: كيف تختار أرقامك",
            titleEn: "The spacing scale: how to pick your numbers",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "المحاذاة والتباعد الداخلي",
            titleEn: "Alignment and inner padding",
            durationSec: 480,
          },
          {
            type: "VIDEO",
            titleAr: "الطبقات والظل والحدود: ما يمكن النقر عليه",
            titleEn: "Layers, shadow, and borders: what is clickable",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: كيف تختار مقياس مسافات لا تشكّ فيه",
            titleEn: "Reading: choosing a spacing scale you stop doubting",
            durationSec: 300,
            contentAr:
              "<p>القرار الذي يجعل التخطيط يبدو مصقولا ليس قيمة المسافة نفسها، بل ثباتها. حين تختار 8 و16 و24 بانتظام، يتعلّم عين المستخدم الإيقاع بسرعة ويشعر أن الشاشة مرتّبة دون أن يعرف السبب.</p><h3>كيف تبدأ</h3><ul><li>اختر أساسًا واحدًا، وغالبًا 4 أو 8 بكسل.</li><li>اضرب الأساس في 2 و3 و4 لتبني درجًا قصيرًا.</li><li>امنع نفسك من كتابة قيمة خارج الدرج.</li></ul><p>عندما تحتاج إلى قيمة بين درجتين، فالمشكلة غالبًا في التخطيط لا في المقياس: أعد ترتيب الكتل بدل إضافة رقم جديد.</p>",
            contentEn:
              "<p>The decision that makes a layout look polished is not the spacing value itself but its consistency. Choose 8, 16, and 24 regularly, and the user's eye learns the rhythm quickly and reads the screen as tidy without knowing why.</p><h3>How to start</h3><ul><li>Pick one base, usually 4 or 8 pixels.</li><li>Multiply by 2, 3, and 4 to build a short ladder.</li><li>Forbid yourself from writing a value outside the ladder.</li></ul><p>When you need a value between two rungs, the trouble is usually the layout, not the scale: reorder the blocks instead of adding a new number.</p>",
          },
        ],
      },
      {
        titleAr: "النماذج والتفاعل",
        titleEn: "Forms and Interaction",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "تخطيط النماذج وتسمية الحقول",
            titleEn: "Form layout and labelling fields",
            isPreview: true,
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "التغذية الراجعة عند الإدخال",
            titleEn: "Feedback while typing",
            durationSec: 480,
          },
          {
            type: "VIDEO",
            titleAr: "حالات الزرّ: من الافتراضي إلى التعطيل",
            titleEn: "Button states: from default to disabled",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: الحركة التي تشرح لا التي تُلاحَظ",
            titleEn: "Reading: motion that explains rather than decorates",
            durationSec: 360,
            contentAr:
              "<p>الحركة الجيدة تُلاحَظ غيابها لا وجودها. وظيفتها أن تخبر المستخدم من أين أتى العنصر وإلى أين ذهب، لا أن تلفت الانتباه إلى نفسها. لذلك ابدأ من السؤال: ما المعلومة التي سأوصّلها، ثم اختر أقصر حركة توصّلها.</p><h3>ثلاث قواعد عملية</h3><ul><li>المدّة أقصر مما تتوقّع: بين 120 و 200 مللي ثانية لمعظم الانتقالات.</li><li>حرّك شيئًا واحدًا في المرة، لا كل عناصر الشاشة.</li><li>احترم طلب تقليل الحركة وأبطل الانتقال الكبير.</li></ul><p>الحركة التي تخبر المستخدم أن اللوحة انزلقت من اليمين توفّر عليه سؤالًا، أما الحركة التي ترقص بلا سبب فتستهلك انتباهه.</p>",
            contentEn:
              "<p>Good motion is noticed by its absence, not its presence. Its job is to tell the user where an element came from and went, not to draw attention to itself. So start from the question: what information am I passing on, then pick the shortest movement that passes it.</p><h3>Three practical rules</h3><ul><li>Shorter than you expect: 120 to 200 milliseconds for most transitions.</li><li>Move one thing at a time, not every element on screen.</li><li>Honour reduced-motion and cancel the large transition.</li></ul><p>Motion that tells the user a panel slid in from the right saves them a question; motion that dances for no reason spends their attention.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: المسافات والتفاعل",
            titleEn: "Quiz: space and interaction",
            quiz: {
              titleAr: "اختبار: المسافات والتفاعل",
              titleEn: "Quiz: space and interaction",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما أهمّ ما يجعل التخطيط يبدو مصقولًا؟",
                  promptEn: "What most makes a layout look polished?",
                  explanationAr: "الثبات في المسافات هو ما تلتقطه العين كإيقاع مرتّب.",
                  explanationEn: "Consistency in spacing is what the eye reads as a tidy rhythm.",
                  options: [
                    {
                      textAr: "ثبات المسافات على مقياس واحد",
                      textEn: "Consistency of spacing on one scale",
                      isCorrect: true,
                    },
                    {
                      textAr: "استخدام أكبر عدد من الألوان",
                      textEn: "Using as many colours as possible",
                      isCorrect: false,
                    },
                    {
                      textAr: "إضافة ظل لكل عنصر",
                      textEn: "Adding a shadow to every element",
                      isCorrect: false,
                    },
                    {
                      textAr: "تصغير الخطّ لأقصى حدّ",
                      textEn: "Shrinking the font to the minimum",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "مدّة الانتقال المناسبة عادة أطول مما يتوقّع المبتدئ.",
                  promptEn: "A good transition duration is usually longer than a beginner expects.",
                  explanationAr: "الانتقالات الجيدة قصيرة، بين 120 و 200 مللي ثانية.",
                  explanationEn: "Good transitions are short, between 120 and 200 milliseconds.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الإعداد الذي يطلب من المتصفّح تقليل الحركة؟",
                  promptEn: "Which setting asks the browser to reduce motion?",
                  explanationAr: "طلب تقليل الحركة يُحترم عبر وسيط الاستعلام المناسب.",
                  explanationEn:
                    "A reduced-motion request is honoured through the matching media query.",
                  acceptedAnswers: ["prefers-reduced-motion", "reduced motion", "reduce motion"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يوصل للمستخدم أن العنصر قابل للنقر؟",
                  promptEn: "Which of these tell the user an element is clickable?",
                  explanationAr: "تغيّر المؤشّر وتغيّر المظهر عند التحويم إشارتان مباشرتان.",
                  explanationEn: "A cursor change and a visible hover change are direct cues.",
                  options: [
                    {
                      textAr: "تغيّر شكل المؤشّر عند المرور",
                      textEn: "The cursor changing on hover",
                      isCorrect: true,
                    },
                    {
                      textAr: "تغيّر واضح في المظهر عند التحويم",
                      textEn: "A clear appearance change on hover",
                      isCorrect: true,
                    },
                    {
                      textAr: "وجود العنصر في أعلى الصفحة",
                      textEn: "The element being near the top of the page",
                      isCorrect: false,
                    },
                    {
                      textAr: "استخدام خطّ عريض فقط",
                      textEn: "Using a bold font only",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ماذا نفعل إن احتجنا مسافة بين درجتين في المقياس؟",
                  promptEn: "What should you do if you need a spacing value between two rungs?",
                  explanationAr:
                    "الحاجة لقيمة وسيطة غالبًا إشارة إلى مشكلة تخطيط، فالأفضل إعادة ترتيب الكتل.",
                  explanationEn:
                    "Needing an in-between value often signals a layout problem, so reordering blocks is better.",
                  options: [
                    {
                      textAr: "نعيد ترتيب الكتل بدل إضافة رقم جديد",
                      textEn: "Reorder the blocks instead of adding a new number",
                      isCorrect: true,
                    },
                    {
                      textAr: "نضيف قيمة عشوائية جديدة للمقياس",
                      textEn: "Add a new random value to the scale",
                      isCorrect: false,
                    },
                    {
                      textAr: "نحذف المسافات كلها",
                      textEn: "Delete all spacing",
                      isCorrect: false,
                    },
                    {
                      textAr: "نكسر المقياس دائما",
                      textEn: "Always break the scale",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "الأنواع والإنهاء",
        titleEn: "Type and Polish",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "أنواع الخطوط وأحجام النصّ",
            titleEn: "Type families and text sizes",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "التناسق البصري: الوزن والتباين",
            titleEn: "Visual hierarchy: weight and contrast",
            durationSec: 660,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: كيف تصقل شاشة في ثلاثين دقيقة",
            titleEn: "Reading: polishing a screen in thirty minutes",
            durationSec: 300,
            contentAr:
              "<p>الصقل ليس إعادة تصميم؛ هو ترتيب أولويات النظر. إذا كان لديك نصف ساعة لتحسين شاشة، فلا تبدأ بالألوان. ابدأ بما يشعر به كل مستخدم في أول ثانيتين.</p><h3>الترتيب الأنفع</h3><ul><li>وحّد المسافات على المقياس، فالفرق يبدو فوريًا.</li><li>ارفع تباين النصّ الثانوي إن كان باهتًا.</li><li>قلّل عدد الأوزان الخطّية إلى اثنين.</li><li>اجعل حالة التركيز واضحة قبل كل شيء آخر.</li></ul><p>هذه الخطوات تُحسّن الانطباع والاستخدام معًا، وتستطيع تبرير كل واحدة منها أمام أي مراجع.</p>",
            contentEn:
              "<p>Polish is not a redesign; it is ordering what the eye sees first. With half an hour to improve a screen, do not start with colour. Start with what every user feels in the first two seconds.</p><h3>The most useful order</h3><ul><li>Unify spacing to the scale; the difference shows immediately.</li><li>Raise the contrast of secondary text if it is faint.</li><li>Cut font weights down to two.</li><li>Make the focus state obvious before anything else.</li></ul><p>These steps improve both impression and usability, and you can defend every one of them to any reviewer.</p>",
          },
          {
            type: "FILE",
            titleAr: "ورقة صقل الشاشة",
            titleEn: "Screen polish worksheet",
            durationSec: 300,
            attachmentAr: "ورقة صقل الشاشة",
            attachmentEn: "Screen polish worksheet",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الأنواع والإنهاء",
            titleEn: "Quiz: type and polish",
            quiz: {
              titleAr: "اختبار: الأنواع والإنهاء",
              titleEn: "Quiz: type and polish",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "بأي خطوة تبدأ صقل الشاشة؟",
                  promptEn: "Which step starts polishing a screen?",
                  explanationAr: "توحيد المسافات يظهر أثره فورًا ويكلّف أقل.",
                  explanationEn:
                    "Unifying spacing shows its effect immediately for the least effort.",
                  options: [
                    {
                      textAr: "توحيد المسافات على مقياس واحد",
                      textEn: "Unifying spacing on one scale",
                      isCorrect: true,
                    },
                    {
                      textAr: "تغيير كل الألوان",
                      textEn: "Changing every colour",
                      isCorrect: false,
                    },
                    { textAr: "إضافة حركات", textEn: "Adding animations", isCorrect: false },
                    {
                      textAr: "تصغير كل الأحجام",
                      textEn: "Shrinking every size",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "الصقل يعني إعادة تصميم الشاشة من جديد.",
                  promptEn: "Polishing means redesigning the screen from scratch.",
                  explanationAr: "الصقل ترتيب للأولويات البصرية لا إعادة تصميم.",
                  explanationEn: "Polish is ordering visual priorities, not a redesign.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr:
                    "ما الحالة التي يجب أن تكون أوضح من أي شيء آخر لسهولة التنقّل بلوحة المفاتيح؟",
                  promptEn: "Which state must be clearest of all for keyboard navigation?",
                  explanationAr: "حالة التركيز هي ما يعرف به مستخدم لوحة المفاتيح مكانه.",
                  explanationEn: "The focus state is how a keyboard user knows where they are.",
                  acceptedAnswers: ["focus", "focus state", "focus ring", "focused"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يحسّن الانطباع والاستخدام معًا؟",
                  promptEn: "Which of these improve impression and usability together?",
                  explanationAr: "تباين النصّ الثانوي ووضوح التركيز يخدمان القراءة والتنقّل.",
                  explanationEn:
                    "Secondary-text contrast and clear focus both serve reading and navigation.",
                  options: [
                    {
                      textAr: "رفع تباين النصّ الثانوي الباهت",
                      textEn: "Raising the contrast of faint secondary text",
                      isCorrect: true,
                    },
                    {
                      textAr: "جعل حالة التركيز واضحة",
                      textEn: "Making the focus state obvious",
                      isCorrect: true,
                    },
                    {
                      textAr: "إضافة زخارف متحرّكة",
                      textEn: "Adding animated flourishes",
                      isCorrect: false,
                    },
                    { textAr: "إخفاء الحدود كلها", textEn: "Hiding all borders", isCorrect: false },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "كم وزنًا خطّيًا يكفي عادة في شاشة واحدة؟",
                  promptEn: "How many font weights are usually enough on one screen?",
                  explanationAr: "وزنان يكفيان للتفريق بين العنوان والنصّ، وأكثر من ذلك يشوّش.",
                  explanationEn:
                    "Two weights separate heading from body; more than that adds noise.",
                  options: [
                    { textAr: "وزنان", textEn: "Two", isCorrect: true },
                    { textAr: "خمسة", textEn: "Five", isCorrect: false },
                    { textAr: "سبعة", textEn: "Seven", isCorrect: false },
                    { textAr: "وزن واحد فقط دائمًا", textEn: "Always just one", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "python-for-data-analysis",
    instructorUsername: "abdulrahman-alzahrani",
    categorySlug: "data",
    titleAr: "تحليل البيانات بـ Python للمبتدئين",
    titleEn: "Data Analysis with Python for Beginners",
    subtitleAr: "من ملف جدول فوضوي إلى إجابة تقرير يمكن الدفاع عنها",
    subtitleEn: "From a messy spreadsheet to a defensible finding",
    descriptionAr:
      "نبدأ من ملف جدول حقيقي فيه أعمدة بأسماء عربية وإنجليزية مختلطة، وتواريخ بصيغتين، وخلايا فارغة بمعانٍ مختلفة. قبل أي تحليل، نتعلّم كيف نفحص البيانات ونحوّلها إلى شكل نستطيع الوثوق به، لأن أكثر النتائج الخاطئة تأتي من قراءة بيانات لم تُنظَّف لا من خطأ في المعادلة.\n\nثم ننتقل إلى التحليل نفسه: تجميع، ومقارنة مجموعات، ورسم بياني يجيب على سؤال محدّد بدل أن يعرض كل الأرقام. في النهاية نكتب دفترًا واحدًا يمكن لأي شخص تشغيله من أوله إلى آخره والحصول على النتيجة نفسها، ونذكّر أن التحليل الجيد قابل للتكرار قبل أن يكون مبهرًا.",
    descriptionEn:
      "We start from a real spreadsheet with mixed Arabic and English column names, two date formats, and blank cells that mean different things. Before any analysis we learn to inspect the data and reshape it into something trustworthy, because more wrong findings come from reading un-cleaned data than from a bad formula.\n\nThen we move to the analysis itself: grouping, comparing groups, and a chart that answers one question instead of displaying every number. We finish with a single notebook anyone can run from top to bottom and get the same result, remembering that reproducible analysis matters before it is impressive.",
    level: "BEGINNER",
    language: "AR",
    priceCents: 0,
    objectives: [
      {
        textAr: "تفحص ملف بيانات وتكتشف مشكلاته قبل التحليل.",
        textEn: "Inspect a dataset and find its problems before analysing.",
      },
      {
        textAr: "تنظّف الأعمدة والأنواع والتواريخ بشكل قابل للتكرار.",
        textEn: "Clean columns, types, and dates in a reproducible way.",
      },
      {
        textAr: "تجمّع البيانات وتقارن مجموعات بأسلوب يخدم سؤالًا محدّدًا.",
        textEn: "Group data and compare groups in a way that serves a specific question.",
      },
      {
        textAr: "ترسم مخططًا يجيب على السؤال بدل عرض كل الأرقام.",
        textEn: "Draw a chart that answers the question rather than showing every number.",
      },
      {
        textAr: "تكتب دفترًا يعيد أي شخص تشغيله ويحصل على النتيجة نفسها.",
        textEn: "Write a notebook anyone can rerun for the same result.",
      },
      {
        textAr: "تميّز بين الارتباط والسببية في تقريرك.",
        textEn: "Distinguish correlation from causation in your report.",
      },
    ],
    requirements: [
      {
        textAr: "لا حاجة إلى خبرة برمجية سابقة.",
        textEn: "No prior programming experience needed.",
      },
      {
        textAr: "جهاز يستطيع تشغيل بيئة Python أو دفتر سحابي.",
        textEn: "A machine able to run a Python environment or a cloud notebook.",
      },
      {
        textAr: "معرفة بجداول البيانات على مستوى المستخدم.",
        textEn: "Spreadsheet familiarity at a user level.",
      },
    ],
    sections: [
      {
        titleAr: "فحص البيانات وتنظيفها",
        titleEn: "Inspecting and Cleaning Data",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا نبدأ بالفحص لا بالتحليل",
            titleEn: "Why we start with inspection, not analysis",
            isPreview: true,
            durationSec: 420,
          },
          {
            type: "VIDEO",
            titleAr: "قراءة الملف وتفقد الأشكال والأعمدة",
            titleEn: "Reading the file and checking shapes and columns",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "الخلايا الفارغة والقيم الشاذة",
            titleEn: "Blank cells and outlier values",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "التواريخ والأرقام: تحويل الأنواع",
            titleEn: "Dates and numbers: converting types",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: القرار المخفي في كل تنظيف",
            titleEn: "Reading: the hidden decision in every clean-up",
            durationSec: 360,
            contentAr:
              "<p>لا يوجد تنظيف محايد. حين تحذف الصفوف الفارغة تقرّر أن غيابها لا يحمل معلومة، وحين تستبدل القيمة المتوسّطة بالفراغ تفترض أن الغياب عشوائي. كل خطوة تنظيف قرار يجب أن يُسجَّل.</p><h3>سجل قرارات صغير</h3><ul><li>ماذا حذفت ولماذا كان الحذف مبرَّرًا؟</li><li>ماذا استبدلت وما الافتراض الذي بنيت عليه؟</li><li>ماذا تركت كما هو عن قصد رغم غرابته؟</li></ul><p>هذا السجل يجعل تحليلك قابلًا للمراجعة، ويحميك عندما يسألك أحدهم: من أين جاء هذا الرقم؟</p>",
            contentEn:
              "<p>No clean-up is neutral. When you drop blank rows you decide their absence carries no information; when you fill blanks with the mean you assume the gap is random. Every cleaning step is a decision that should be recorded.</p><h3>A small decision log</h3><ul><li>What did you drop, and why was dropping justified?</li><li>What did you fill, and what assumption was that based on?</li><li>What did you deliberately leave untouched despite looking odd?</li></ul><p>That log makes your analysis reviewable and protects you when someone asks: where did this number come from?</p>",
          },
        ],
      },
      {
        titleAr: "التجميع والمقارنة",
        titleEn: "Grouping and Comparing",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "التجميع وسؤال العمل الصحيح",
            titleEn: "Grouping and asking the right business question",
            isPreview: true,
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "مقارنة مجموعتين دون خدعة المتوسّط",
            titleEn: "Comparing two groups without the average trap",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "المخطط الذي يجيب على سؤال واحد",
            titleEn: "The chart that answers one question",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: المتوسّط يكذب حين يكون التوزيع ملتوياً",
            titleEn: "Reading: the average lies when the distribution is skewed",
            durationSec: 300,
            contentAr:
              "<p>متوسّط عائدات صفحة قد يكون مرتفعًا بينما معظم الزيارات لا تشتري شيئًا. السبب أن قيمة كبيرة واحدة تسحب المتوسّط نحوها، فيبدو الوضع أفضل مما هو عليه.</p><h3>ثلاثة فحوص سريعة</h3><ul><li>ارسم التوزيع قبل أن تحسب أي متوسّط.</li><li>قارن الوسيط بالمتوسّط؛ الفرق الكبير إشارة إلى التواء.</li><li>اذكر عدد القيم الشاذة وأثرها على النتيجة.</li></ul><p>هذه الفحوص تستغرق دقائق وتنقذ تقريرًا كاملاً من استنتاج مبنيّ على رقم مضلّل.</p>",
            contentEn:
              "<p>The average return of a page can look high while most visits buy nothing. One large value pulls the average toward it, so the situation looks better than it is.</p><h3>Three quick checks</h3><ul><li>Plot the distribution before computing any average.</li><li>Compare the median with the mean; a large gap signals skew.</li><li>State the count of outliers and their effect on the result.</li></ul><p>These checks take minutes and save an entire report from a conclusion built on a misleading number.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: التنظيف والتحليل",
            titleEn: "Quiz: cleaning and analysis",
            quiz: {
              titleAr: "اختبار: التنظيف والتحليل",
              titleEn: "Quiz: cleaning and analysis",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 900,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما أول خطوة عند استلام ملف بيانات جديد؟",
                  promptEn: "What is the first step on receiving a new dataset?",
                  explanationAr: "الفحص يكشف المشكلات قبل أن تفسد التحليل.",
                  explanationEn: "Inspection reveals problems before they spoil the analysis.",
                  options: [
                    {
                      textAr: "فحص الشكل والأنواع والقيم الفارغة",
                      textEn: "Inspecting shape, types, and blank values",
                      isCorrect: true,
                    },
                    {
                      textAr: "حساب المتوسّطات مباشرة",
                      textEn: "Computing averages immediately",
                      isCorrect: false,
                    },
                    { textAr: "حذف كل الملف", textEn: "Deleting the whole file", isCorrect: false },
                    { textAr: "رسم كل الأعمدة", textEn: "Plotting every column", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "استبدال الفراغ بالمتوسّط قرار محايد لا يحتاج توثيقًا.",
                  promptEn: "Filling blanks with the mean is a neutral decision needing no record.",
                  explanationAr: "كل خطوة تنظيف قرار يحمل افتراضًا يجب تسجيله.",
                  explanationEn:
                    "Every cleaning step is a decision carrying an assumption that must be recorded.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما المقياس الذي يقاوم القيم الشاذة أكثر من المتوسّط؟",
                  promptEn: "Which measure resists outliers more than the mean?",
                  explanationAr: "الوسيط يتأثّر بالقيم الشاذة أقل من المتوسّط.",
                  explanationEn: "The median is less affected by outliers than the mean.",
                  acceptedAnswers: ["median", "وسيط", "the median"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يجعل التحليل قابلًا للتكرار؟",
                  promptEn: "Which of these make an analysis reproducible?",
                  explanationAr: "الدفتر الذي يعمل من أوله إلى آخره وسجل القرارات يحفظان النتيجة.",
                  explanationEn:
                    "A notebook that runs top to bottom plus a decision log preserve the result.",
                  options: [
                    {
                      textAr: "دفتر يعمل بالكامل بلا خطوات يدوية",
                      textEn: "A notebook that runs fully with no manual steps",
                      isCorrect: true,
                    },
                    {
                      textAr: "سجل قرارات التنظيف",
                      textEn: "A record of cleaning decisions",
                      isCorrect: true,
                    },
                    { textAr: "حفظ الصور فقط", textEn: "Saving only the images", isCorrect: false },
                    {
                      textAr: "نسخ الأرقام في ملف نصّي",
                      textEn: "Copying the numbers into a text file",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "متى نرسم التوزيع؟",
                  promptEn: "When do we plot the distribution?",
                  explanationAr: "التوزيع يُرسم قبل حساب أي متوسّط لتفادي الالتواء.",
                  explanationEn:
                    "The distribution is plotted before computing any average to avoid skew surprises.",
                  options: [
                    {
                      textAr: "قبل حساب أي متوسّط",
                      textEn: "Before computing any average",
                      isCorrect: true,
                    },
                    {
                      textAr: "بعد تسليم التقرير",
                      textEn: "After submitting the report",
                      isCorrect: false,
                    },
                    {
                      textAr: "فقط للأعمدة النصّية",
                      textEn: "Only for text columns",
                      isCorrect: false,
                    },
                    {
                      textAr: "عندما يطلب المدير فقط",
                      textEn: "Only when the manager asks",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "الإبلاغ بالنتائج",
        titleEn: "Reporting Results",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "من نتيجة إلى توصية قابلة للتنفيذ",
            titleEn: "From a result to an actionable recommendation",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "الارتباط والسببية في تقرير واحد",
            titleEn: "Correlation and causation in one report",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: كيف يُكتب سطر نتيجة لا يُساء فهمه",
            titleEn: "Reading: writing a finding that cannot be misread",
            durationSec: 300,
            contentAr:
              "<p>السطر الجيد يبدأ بالنتيجة لا بالطريقة. القارئ يريد أن يعرف ما وجدته قبل أن يعرف كيف. تفصيل الطريقة يأتي بعده لمن يريد التحقّق، لا في المقدّمة.</p><h3>بنية سطر نتيجة</h3><ul><li>النتيجة في جملة واحدة قابلة للنقل.</li><li>الفترة والقطاع الذي تنطبق عليه.</li><li>الحدّ الذي يجب فهمه: ما لا يخبرنا به هذا الرقم.</li></ul><p>البند الثالث هو ما يميّز تحليلًا ناضجًا: أن تقول بوضوح ما لا تستطيع بياناتك إثباته، فتحمي القرار من مبالغة مبنيّة على صدفة.</p>",
            contentEn:
              "<p>A good line starts with the finding, not the method. The reader wants to know what you found before how you found it. Method detail follows for those who want to check, not in the opening.</p><h3>The shape of a finding</h3><ul><li>The finding in one quotable sentence.</li><li>The period and segment it applies to.</li><li>The limit to understand: what this number does not tell us.</li></ul><p>That third part is what separates a mature analysis: stating clearly what your data cannot prove, protecting a decision from an exaggeration built on coincidence.</p>",
          },
          {
            type: "FILE",
            titleAr: "قالب تقرير تحليل قصير",
            titleEn: "Short analysis report template",
            durationSec: 300,
            attachmentAr: "قالب تقرير تحليل قصير",
            attachmentEn: "Short analysis report template",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الإبلاغ بالنتائج",
            titleEn: "Quiz: reporting results",
            quiz: {
              titleAr: "اختبار: الإبلاغ بالنتائج",
              titleEn: "Quiz: reporting results",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "بماذا يبدأ سطر النتيجة الجيد؟",
                  promptEn: "How does a good finding begin?",
                  explanationAr: "القارئ يريد النتيجة أولًا ثم الطريقة.",
                  explanationEn: "The reader wants the finding first, then the method.",
                  options: [
                    {
                      textAr: "بالنتيجة في جملة قابلة للنقل",
                      textEn: "With the finding in one quotable sentence",
                      isCorrect: true,
                    },
                    {
                      textAr: "بوصف خطوات التنظيف",
                      textEn: "With a description of the cleaning steps",
                      isCorrect: false,
                    },
                    {
                      textAr: "بقائمة المكتبات المستخدمة",
                      textEn: "With a list of libraries used",
                      isCorrect: false,
                    },
                    { textAr: "باسم المحلّل", textEn: "With the analyst's name", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "ذكر ما لا تستطيع البيانات إثباته يقوّي التحليل.",
                  promptEn: "Stating what the data cannot prove strengthens the analysis.",
                  explanationAr: "تحديد الحدود يحمي القرار من مبالغة مبنية على صدفة.",
                  explanationEn:
                    "Stating limits protects the decision from exaggeration built on coincidence.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما نوع العلاقة التي لا تثبت السببية وحدها؟",
                  promptEn: "Which kind of relationship alone does not prove causation?",
                  explanationAr: "الارتباط وحده لا يثبت أن أحدهما سبب الآخر.",
                  explanationEn: "Correlation alone does not prove one causes the other.",
                  acceptedAnswers: ["correlation", "ارتباط", "correlation only"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يخدم توصية قابلة للتنفيذ؟",
                  promptEn: "Which of these serve an actionable recommendation?",
                  explanationAr: "تحديد الفترة والقطاع يجعل التوصية قابلة للتطبيق.",
                  explanationEn:
                    "Specifying the period and segment makes a recommendation applicable.",
                  options: [
                    {
                      textAr: "تحديد الفترة والقطاع",
                      textEn: "Specifying the period and segment",
                      isCorrect: true,
                    },
                    {
                      textAr: "ربط النتيجة بقرار ممكن",
                      textEn: "Linking the finding to a possible decision",
                      isCorrect: true,
                    },
                    {
                      textAr: "إخفاء حجم العيّنة",
                      textEn: "Hiding the sample size",
                      isCorrect: false,
                    },
                    {
                      textAr: "عرض كل الأرقام المتاحة",
                      textEn: "Showing every available number",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما الغرض الأساسي من سجل قرارات التنظيف؟",
                  promptEn: "What is the main purpose of a cleaning decision log?",
                  explanationAr: "السجل يجعل التحليل قابلًا للمراجعة ويجيب عن مصدر الأرقام.",
                  explanationEn:
                    "The log makes the analysis reviewable and answers where numbers came from.",
                  options: [
                    {
                      textAr: "جعل التحليل قابلًا للمراجعة وشرح مصدر الأرقام",
                      textEn:
                        "Making the analysis reviewable and explaining where numbers came from",
                      isCorrect: true,
                    },
                    {
                      textAr: "تسريع تشغيل الدفتر",
                      textEn: "Speeding up notebook execution",
                      isCorrect: false,
                    },
                    { textAr: "تقليل حجم الملف", textEn: "Reducing file size", isCorrect: false },
                    {
                      textAr: "إرضاء المراجع الشكلي",
                      textEn: "Satisfying a cosmetic reviewer",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "arabic-nlp-with-transformers",
    instructorUsername: "abdulrahman-alzahrani",
    categorySlug: "data",
    titleAr: "معالجة اللغة العربية بالنماذج المحوّلة",
    titleEn: "Arabic Natural Language Processing with Transformers",
    subtitleAr: "من تطبيع النصّ العربي إلى تقييم نموذج يفهم الفصحى واللهجات",
    subtitleEn:
      "From Arabic text normalisation to evaluating a model that handles standard and dialectal text",
    descriptionAr:
      "العربية تحدٍّ خاص في معالجة اللغة: تشكيل اختياري، وهمزات بأشكال متعدّدة، وتطويل، ولهجات تختلف مفرداتها بين منطقة وأخرى. نبني خطًّا كاملًا للتنظيف والتطبيع، ثم نقرّر بحذر ما نحتفظ به وما نحذفه لأن حذف التشكيل قد يحوّل كلمتين مختلفتين إلى واحدة.\n\nثم نضبط نموذجًا محوّلًا جاهزًا على مهمّة تصنيف، ونراجع أخطاءه على عيّنات صغيرة قبل أن نوسّع البيانات. نختتم ببناء مجموعة تقييم عادلة تمثّل الفصحى واللهجة معًا، لأن نموذجًا يتفوّق على الفصحى قد يخسر كثيرًا على نصّ مكتوب كما ينطقه الناس فعلًا.",
    descriptionEn:
      "Arabic is a particular challenge in language processing: optional diacritics, multiple forms of the hamza, elongation, and dialects whose vocabulary shifts between regions. We build a full cleaning and normalisation pipeline, then decide carefully what to keep and what to remove, because stripping diacritics can merge two different words into one.\n\nWe then fine-tune an existing transformer on a classification task and review its errors on small samples before scaling the data. We finish by building a fair evaluation set that represents both standard and dialectal text, since a model that wins on standard Arabic can lose badly on text written the way people actually speak.",
    level: "ADVANCED",
    language: "AR",
    priceCents: 46900,
    objectives: [
      {
        textAr: "تبني خطّ تنظيف وتطبيع للنصّ العربي مع توثيق كل خطوة.",
        textEn:
          "Build an Arabic text cleaning and normalisation pipeline with every step documented.",
      },
      {
        textAr: "تقرّر بحذر ما يُحذف من النصّ وما يُحفظ وتشرح الأثر.",
        textEn: "Decide carefully what to strip from text and what to keep, explaining the impact.",
      },
      {
        textAr: "تضبط نموذجًا محوّلًا جاهزًا على مهمّة تصنيف عربية.",
        textEn: "Fine-tune a pretrained transformer on an Arabic classification task.",
      },
      {
        textAr: "تحلّل أخطاء النموذج على عيّنات صغيرة قبل توسيع البيانات.",
        textEn: "Analyse model errors on small samples before expanding the data.",
      },
      {
        textAr: "تبني مجموعة تقييم تتوازن بين الفصحى واللهجة.",
        textEn: "Build an evaluation set balanced between standard and dialectal Arabic.",
      },
      {
        textAr: "تنشر تقييمًا يذكر حدوده بدل رقم دقّة وحيد.",
        textEn: "Report an evaluation that states its limits instead of a single accuracy number.",
      },
    ],
    requirements: [
      {
        textAr: "خبرة عملية بـ Python ومكتبات تعلّم الآلة.",
        textEn: "Hands-on Python plus machine-learning libraries.",
      },
      {
        textAr: "فهم أساسي لكيفية عمل النماذج المحوّلة.",
        textEn: "Basic understanding of how transformer models work.",
      },
      { textAr: "تمكّن جيد من اللغة العربية الفصحى.", textEn: "Solid command of standard Arabic." },
      {
        textAr: "بيئة تدريب تدعم تسريع المعالج الرسومي.",
        textEn: "A training environment supporting GPU acceleration.",
      },
    ],
    sections: [
      {
        titleAr: "النصّ العربي قبل النمذجة",
        titleEn: "Arabic Text Before Modelling",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا يخسر النموذج على العربية تحديدًا",
            titleEn: "Why models lose on Arabic in particular",
            isPreview: true,
            durationSec: 480,
          },
          {
            type: "VIDEO",
            titleAr: "التطبيع: الهمزات والتطويل والتشكيل",
            titleEn: "Normalisation: hamzas, elongation, and diacritics",
            durationSec: 720,
          },
          {
            type: "VIDEO",
            titleAr: "التقطيع: ما الضرر في تقطيع الكلمة العربية",
            titleEn: "Tokenisation: what breaks Arabic word splitting",
            durationSec: 720,
          },
          {
            type: "VIDEO",
            titleAr: "الفصحى واللهجة: أين يظهر الفرق في البيانات",
            titleEn: "Standard and dialect: where the difference shows",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: ما يُحذف من النصّ العربي وما يُحفظ",
            titleEn: "Reading: what to strip from Arabic text and what to keep",
            durationSec: 420,
            contentAr:
              "<p>كل عملية تطبيع تقايض معلومة مقابل ثبات. توحيد الهمزات يجمع صورًا متعدّدة للكلمة نفسها، لكنه أيضًا يجمع كلمات كانت مختلفة، فيضيع تمييز ربما كان مهمًّا لمهمّتك.</p><h3>قائمة قرارات عملية</h3><ul><li>احذف التطويل: لا يحمل معنى لغويًا ويزيد الضجيج.</li><li>وحّد صور الهمزة إن كانت مهمّتك لا تعتمد على الإملاء الدقيق.</li><li>احذر حذف التشكيل في مهمّات تحتاج التمييز بين كلمتين متشابهتين رسمًا.</li></ul><p>القاعدة: اختر التطبيع من المهمّة إلى النصّ، لا العكس. اكتب المهمّة أولًا ثم قرّر.</p>",
            contentEn:
              "<p>Every normalisation step trades information for consistency. Unifying hamza forms merges several spellings of one word, but it also merges words that were different, losing a distinction your task may need.</p><h3>A practical decision list</h3><ul><li>Remove elongation: it carries no linguistic meaning and adds noise.</li><li>Unify hamza forms if your task does not depend on exact spelling.</li><li>Be careful removing diacritics in tasks needing to tell apart words that look alike unvocalised.</li></ul><p>The rule: choose normalisation from the task to the text, not the reverse. Write the task first, then decide.</p>",
          },
        ],
      },
      {
        titleAr: "الضبط والتقييم",
        titleEn: "Fine-tuning and Evaluation",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "ضبط نموذج جاهز على مهمّة تصنيف",
            titleEn: "Fine-tuning a pretrained model on classification",
            isPreview: true,
            durationSec: 780,
          },
          {
            type: "VIDEO",
            titleAr: "قراءة الأخطاء قبل توسيع البيانات",
            titleEn: "Reading errors before scaling the data",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "بناء مجموعة تقييم عادلة",
            titleEn: "Building a fair evaluation set",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: رقم دقّة واحد لا يكفي",
            titleEn: "Reading: one accuracy number is not enough",
            durationSec: 360,
            contentAr:
              "<p>دقّة ٩٠ بالمئة تبدو جيدة حتى تعرف أن ٩٠ بالمئة من بياناتك من صنف واحد. الرقم وحده لا يخبرك شيئًا؛ ما يخبرك هو تفصيل الأداء على كل صنف وعلى كل نوع نصّ.</p><h3>ما يجب أن تجرّده</h3><ul><li>نتيجة لكل صنف على حدة، لترى الصنف المهمَل.</li><li>نتيجة لكل مصدر أو لهجة في بياناتك.</li><li>أخطاء مصنّفة يدويًا على عيّنة صغيرة.</li></ul><p>ثم اكتب حدًّا واحدًا على الأقل: «هذا التقييم لا يمثّل النصّ غير المشكول» أو ما يشابهه، فيعرف القارئ متى لا يثق بالرقم.</p>",
            contentEn:
              "<p>Ninety per cent accuracy looks good until you learn that ninety per cent of your data is one class. The number alone tells you nothing; what tells you something is the breakdown per class and per text type.</p><h3>What to break down</h3><ul><li>A score per class, to expose the neglected one.</li><li>A score per source or dialect in your data.</li><li>Manually categorised errors on a small sample.</li></ul><p>Then write at least one limit: «this evaluation does not represent unvocalised text» or the like, so the reader knows when not to trust the number.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: التطبيع والتقييم",
            titleEn: "Quiz: normalisation and evaluation",
            quiz: {
              titleAr: "اختبار: التطبيع والتقييم",
              titleEn: "Quiz: normalisation and evaluation",
              passPct: 80,
              maxAttempts: 3,
              timeLimitSec: 1500,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "من أين نبدأ قرار التطبيع؟",
                  promptEn: "Where does the normalisation decision start?",
                  explanationAr: "المهمّة تحدّد ما نحتاج حفظه من النصّ، فمنها نقرّر.",
                  explanationEn:
                    "The task determines what we must preserve from the text, so we decide from it.",
                  options: [
                    {
                      textAr: "من المهمّة ثم النصّ",
                      textEn: "From the task, then the text",
                      isCorrect: true,
                    },
                    {
                      textAr: "من النصّ ثم المهمّة",
                      textEn: "From the text, then the task",
                      isCorrect: false,
                    },
                    {
                      textAr: "من حجم البيانات",
                      textEn: "From the dataset size",
                      isCorrect: false,
                    },
                    { textAr: "من سرعة النموذج", textEn: "From the model speed", isCorrect: false },
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يمثّل معلومة قد نخسرها عند التطبيع؟",
                  promptEn: "Which of these represent information normalisation might discard?",
                  explanationAr: "التشكيل واختلاف الهمزة قد يميّزان كلمتين، وحذفهما يخسر التمييز.",
                  explanationEn:
                    "Diacritics and hamza differences can distinguish two words; removing them loses that.",
                  options: [
                    {
                      textAr: "التشكيل الذي يميّز كلمتين",
                      textEn: "Diacritics that tell two words apart",
                      isCorrect: true,
                    },
                    {
                      textAr: "صور الهمزة التي تفرّق بين معنيين",
                      textEn: "Hamza forms separating two meanings",
                      isCorrect: true,
                    },
                    {
                      textAr: "المسافات الزائدة بين الكلمات",
                      textEn: "Extra spaces between words",
                      isCorrect: false,
                    },
                    { textAr: "التطويل المكرّر", textEn: "Repeated elongation", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "دقّة عالية على الفصحى تضمن أداءً جيدًا على النصّ اللهجي.",
                  promptEn:
                    "High accuracy on standard Arabic guarantees good performance on dialectal text.",
                  explanationAr: "مفردات اللهجة تختلف، فقد يخسر النموذج أداءه عليها.",
                  explanationEn:
                    "Dialectal vocabulary differs, so the model can lose accuracy on it.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما اسم القيمة التي تكشف إهمال صنف واحد في التقييم؟",
                  promptEn: "What is the per-class score that reveals a neglected class?",
                  explanationAr: "تفصيل الأداء لكل صنف يكشف الصنف المهمَل الذي يخفيه المتوسّط.",
                  explanationEn:
                    "A per-class breakdown exposes the neglected class hidden by the average.",
                  acceptedAnswers: [
                    "per-class score",
                    "class breakdown",
                    "per class accuracy",
                    "class recall",
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "متى نقرأ أخطاء النموذج يدويًا؟",
                  promptEn: "When do we read model errors by hand?",
                  explanationAr: "قراءة الأخطاء على عيّنة صغيرة تسبق توسيع البيانات لتوجّه الجمع.",
                  explanationEn:
                    "Reading errors on a small sample precedes scaling data to guide collection.",
                  options: [
                    {
                      textAr: "على عيّنة صغيرة قبل توسيع البيانات",
                      textEn: "On a small sample before scaling the data",
                      isCorrect: true,
                    },
                    { textAr: "بعد النشر فقط", textEn: "Only after deployment", isCorrect: false },
                    { textAr: "لا حاجة لقراءتها أبدًا", textEn: "Never needed", isCorrect: false },
                    {
                      textAr: "بعد زيادة عدد الطبقات",
                      textEn: "After adding more layers",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "من التجربة إلى الخدمة",
        titleEn: "From Experiment to Service",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "تثبيت الإصدارات وإعادة إنتاج النتيجة",
            titleEn: "Pinning versions and reproducing the result",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "مراقبة الأداء بعد النشر",
            titleEn: "Monitoring performance after deployment",
            durationSec: 600,
          },
          {
            type: "FILE",
            titleAr: "ورقة مراقبة انحدار النموذج",
            titleEn: "Model decay monitoring sheet",
            durationSec: 300,
            attachmentAr: "ورقة مراقبة انحدار النموذج",
            attachmentEn: "Model decay monitoring sheet",
          },
          {
            type: "TEXT",
            titleAr: "قراءة: حين يتغيّر النصّ القادم مع الزمن",
            titleEn: "Reading: when incoming text changes over time",
            durationSec: 360,
            contentAr:
              "<p>النموذج الذي يعمل اليوم قد يتراجع بعد شهور دون أن يتغيّر سطر واحد من كوده. السبب أن النصّ القادم يتغيّر: مفردات جديدة، وأسلوب كتابة مختلف، وقد تظهر لهجة لم تكن في بيانات التدريب.</p><h3>ثلاث مراقبات بسيطة</h3><ul><li>احفظ عيّنة عشوائية دورية من النصّ القادم للمقارنة لاحقًا.</li><li>قِس توزيع أطوال النصّ ومفرداته الجديدة.</li><li>أعد تشغيل التقييم على العيّنة نفسها كل فترة وقارن.</li></ul><p>هذه المراقبات تكشف الانحدار مبكرًا، فتصبح معالجة المشكلة إضافة بيانات لا إعادة بناء كامل.</p>",
            contentEn:
              "<p>A model that works today can decay months later without a single line of its code changing. The reason is that incoming text changes: new vocabulary, a different writing style, perhaps a dialect that was absent from the training data.</p><h3>Three simple monitors</h3><ul><li>Save a periodic random sample of incoming text for later comparison.</li><li>Measure the distribution of text lengths and new vocabulary.</li><li>Re-run the evaluation on the same sample regularly and compare.</li></ul><p>These monitors catch decay early, turning the fix into added data rather than a full rebuild.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: من التجربة إلى الخدمة",
            titleEn: "Quiz: from experiment to service",
            quiz: {
              titleAr: "اختبار: من التجربة إلى الخدمة",
              titleEn: "Quiz: from experiment to service",
              passPct: 80,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "لماذا قد يتراجع أداء النموذج دون تغيير الكود؟",
                  promptEn: "Why can model performance decay without a code change?",
                  explanationAr: "تغيّر النصّ القادم يُبعد البيانات عن ما تدرّب عليه النموذج.",
                  explanationEn:
                    "Changing incoming text drifts away from what the model trained on.",
                  options: [
                    {
                      textAr: "لأن النصّ القادم يتغيّر مع الزمن",
                      textEn: "Because the incoming text changes over time",
                      isCorrect: true,
                    },
                    {
                      textAr: "لأن الملفات تتلف تلقائيًا",
                      textEn: "Because files corrupt automatically",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأن المعالج يبطؤ",
                      textEn: "Because the processor slows",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأن النموذج ينسى",
                      textEn: "Because the model forgets",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "حفظ عيّنة دورية من النصّ القادم يساعد في كشف الانحدار.",
                  promptEn: "Saving a periodic sample of incoming text helps detect decay.",
                  explanationAr: "العيّنة المحفوظة تسمح بمقارنة الأداء عبر الزمن.",
                  explanationEn: "A saved sample allows comparing performance over time.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الإجراء الذي يضمن إعادة إنتاج نتيجة النموذج لاحقًا؟",
                  promptEn: "What action guarantees reproducing a model's result later?",
                  explanationAr: "تثبيت إصدارات المكتبات يضمن أن البيئة نفسها تُنتج النتيجة نفسها.",
                  explanationEn:
                    "Pinning library versions guarantees the same environment produces the same result.",
                  acceptedAnswers: [
                    "pinning versions",
                    "pin versions",
                    "version pinning",
                    "lock the versions",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي مؤشّر على تغيّر توزيع النصّ القادم؟",
                  promptEn: "Which of these indicate a shift in incoming text distribution?",
                  explanationAr: "تغيّر أطوال النصّ وظهور مفردات جديدة يشيران إلى انزياح التوزيع.",
                  explanationEn:
                    "Changing text lengths and new vocabulary both signal distribution shift.",
                  options: [
                    {
                      textAr: "ظهور مفردات لم تكن في التدريب",
                      textEn: "Vocabulary absent from training appearing",
                      isCorrect: true,
                    },
                    {
                      textAr: "تغيّر واضح في توزيع أطوال النصّ",
                      textEn: "A clear shift in text-length distribution",
                      isCorrect: true,
                    },
                    {
                      textAr: "بقاء عدد الصفوف ثابتًا",
                      textEn: "The row count staying constant",
                      isCorrect: false,
                    },
                    {
                      textAr: "استخدام اللغة نفسها",
                      textEn: "Using the same language",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما أفضل استجابة لاكتشاف انحدار النموذج؟",
                  promptEn: "What is the best response to detecting model decay?",
                  explanationAr:
                    "إضافة بيانات تمثّل النصّ الجديد أسرع وأنفع من إعادة البناء الكامل.",
                  explanationEn:
                    "Adding data representing the new text is faster and better than a full rebuild.",
                  options: [
                    {
                      textAr: "إضافة بيانات تمثّل النصّ الجديد",
                      textEn: "Adding data representing the new text",
                      isCorrect: true,
                    },
                    {
                      textAr: "إعادة كتابة النموذج من الصفر",
                      textEn: "Rewriting the model from scratch",
                      isCorrect: false,
                    },
                    { textAr: "إخفاء المؤشّرات", textEn: "Hiding the monitors", isCorrect: false },
                    {
                      textAr: "إيقاف الخدمة",
                      textEn: "Shutting the service down",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "sql-analytics-for-product-teams",
    instructorUsername: "abdulrahman-alzahrani",
    categorySlug: "data",
    titleAr: "تحليلات SQL لفرق المنتج",
    titleEn: "SQL Analytics for Product Teams",
    subtitleAr: "أسئلة المنتج التي تُجاب باستعلام واحد واضح وتقرير لا يُساء فهمه",
    subtitleEn:
      "Product questions answered with one clear query and a report that cannot be misread",
    descriptionAr:
      "أسئلة فرق المنتج تُطرح بلغة عادية: كم مستخدمًا عاد هذا الأسبوع، وأين يتوقفون، وهل أفاد التغيير فعلًا. هذه الدورة تترجم تلك الأسئلة إلى استعلامات يُمكن الوثوق بها، وتبدأ من التعريفات لا من الصياغة. نخصص وقتًا حقيقيًا لسؤال ما الذي يُحتسب «مستخدمًا نشطًا»، لأن معظم الخلافات حول رقم ما هي خلافات حول تعريف.\n\nثم نمرّ على الأنماط التي تغطي معظم تحليلات المنتج: الأفواج، والاحتفاظ، وقُمع التحويل، ومقارنات A/B البسيطة. مع كل نمط ننظر إلى الفخّ الذي يخفيه، من عدّ الأحداث بدل المستخدمين إلى قُمع يستبعد الخطوة التي يُقاس عليها. تنتهي الدورة بمجموعة استعلامات قابلة للتعديل، وبعادة تدوين التعريف بجانب الرقم.",
    descriptionEn:
      "Product teams ask questions in plain language: how many users came back this week, where do they drop off, and did the change help. This course translates those questions into SQL you can trust, starting from the definitions rather than the syntax. We spend real time on what counts as an active user, because most disagreements about a number are disagreements about a definition.\n\nWe then work through the patterns that cover most product analytics: cohorts, retention, funnels, and simple A/B comparisons. For each we look at the trap it hides, from counting events instead of users to a funnel that quietly excludes the step being measured. You leave with a set of queries you can adapt, and a habit of writing the definition next to the number.",
    level: "INTERMEDIATE",
    language: "EN",
    priceCents: 29900,
    objectives: [
      {
        textAr: "تحوّل سؤال منتج إلى تعريف قابل للقياس قبل كتابة الاستعلام.",
        textEn: "Turn a product question into a measurable definition before writing the query.",
      },
      {
        textAr: "تبني استعلام تجميع يجيب على سؤال واحد بوضوح.",
        textEn: "Build an aggregate query that answers one question clearly.",
      },
      {
        textAr: "تحسب الأفواج والاحتفاظ دون الوقوع في عدّ الأحداث.",
        textEn: "Compute cohorts and retention without falling into counting events.",
      },
      {
        textAr: "تبني قمعًا وتحسب نسبة التحويل بين خطواته.",
        textEn: "Build a funnel and compute the conversion rate between its steps.",
      },
      {
        textAr: "تقارن مجموعتين وتذكر الفرق الذي لا يكفي لاعتباره أثرًا.",
        textEn: "Compare two groups and state the difference too small to call an effect.",
      },
      {
        textAr: "تنشر تعريفات المقاييس بجانب الأرقام.",
        textEn: "Publish metric definitions next to the numbers.",
      },
    ],
    requirements: [
      {
        textAr: "معرفة عملية بـ SQL: الانضمام والتجميع.",
        textEn: "Working SQL knowledge: joins and grouping.",
      },
      {
        textAr: "وصول إلى قاعدة بيانات تحليلية للتجربة.",
        textEn: "Access to an analytics database for practice.",
      },
      {
        textAr: "إلمام بمفاهيم المنتج الأساسية كالمستخدم النشط.",
        textEn: "Familiarity with core product concepts like an active user.",
      },
      {
        textAr: "مستوى إنجليزية يتيح قراءة مخطّطات الجداول.",
        textEn: "English sufficient to read table schemas.",
      },
    ],
    sections: [
      {
        titleAr: "Definitions Before Queries",
        titleEn: "Definitions Before Queries",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "Why the argument is about the definition",
            titleEn: "Why the argument is about the definition",
            isPreview: true,
            durationSec: 480,
          },
          {
            type: "VIDEO",
            titleAr: "Counting users, sessions, and events",
            titleEn: "Counting users, sessions, and events",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "Time windows and time zones",
            titleEn: "Time windows and time zones",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "Aggregation that answers one question",
            titleEn: "Aggregation that answers one question",
            durationSec: 660,
          },
          {
            type: "TEXT",
            titleAr: "Reading: the definition belongs next to the number",
            titleEn: "Reading: the definition belongs next to the number",
            durationSec: 300,
            contentAr:
              "<p>Two dashboards disagree, and the team spends a meeting on it. Almost always the queries are both correct; the definitions differ. One counts a user who opened the app, the other a user who completed a meaningful action.</p><h3>Write the definition where the number lives</h3><ul><li>State the qualifying action, not the label.</li><li>State the window, including its boundaries.</li><li>State who is excluded, and why.</li></ul><p>A metric with a written definition ends arguments before they start, and lets a new analyst reproduce the number in an afternoon instead of a week.</p>",
            contentEn:
              "<p>Two dashboards disagree, and the team spends a meeting on it. Almost always the queries are both correct; the definitions differ. One counts a user who opened the app, the other a user who completed a meaningful action.</p><h3>Write the definition where the number lives</h3><ul><li>State the qualifying action, not the label.</li><li>State the window, including its boundaries.</li><li>State who is excluded, and why.</li></ul><p>A metric with a written definition ends arguments before they start, and lets a new analyst reproduce the number in an afternoon instead of a week.</p>",
          },
        ],
      },
      {
        titleAr: "Cohorts, Funnels, and Tests",
        titleEn: "Cohorts, Funnels, and Tests",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "Cohorts and retention that hold up",
            titleEn: "Cohorts and retention that hold up",
            isPreview: true,
            durationSec: 720,
          },
          {
            type: "VIDEO",
            titleAr: "Funnels and the step everyone forgets",
            titleEn: "Funnels and the step everyone forgets",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "Comparing two groups without fooling yourself",
            titleEn: "Comparing two groups without fooling yourself",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "Reading: counting events instead of users",
            titleEn: "Reading: counting events instead of users",
            durationSec: 360,
            contentAr:
              "<p>An engagement metric that counts events rises when a few power users hammer the app, even while most users leave. The number is not wrong; it answers a different question than the one being asked.</p><h3>Which question are you answering?</h3><ul><li>How much activity? Count events.</li><li>How many people were active? Count distinct users.</li><li>How many people came back? Count users in a later window who were present earlier.</li></ul><p>Decide which one the decision needs, then write the query. Choosing the metric after seeing the chart is how teams end up defending a number they did not intend to measure.</p>",
            contentEn:
              "<p>An engagement metric that counts events rises when a few power users hammer the app, even while most users leave. The number is not wrong; it answers a different question than the one being asked.</p><h3>Which question are you answering?</h3><ul><li>How much activity? Count events.</li><li>How many people were active? Count distinct users.</li><li>How many people came back? Count users in a later window who were present earlier.</li></ul><p>Decide which one the decision needs, then write the query. Choosing the metric after seeing the chart is how teams end up defending a number they did not intend to measure.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "Quiz: cohorts, funnels, and tests",
            titleEn: "Quiz: cohorts, funnels, and tests",
            quiz: {
              titleAr: "Quiz: cohorts, funnels, and tests",
              titleEn: "Quiz: cohorts, funnels, and tests",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 1200,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "What is the most common cause of two dashboards disagreeing?",
                  promptEn: "What is the most common cause of two dashboards disagreeing?",
                  explanationAr: "Usually both queries are right and the definitions differ.",
                  explanationEn: "Usually both queries are right and the definitions differ.",
                  options: [
                    {
                      textAr: "Different definitions of the same metric",
                      textEn: "Different definitions of the same metric",
                      isCorrect: true,
                    },
                    {
                      textAr: "A database bug in one of them",
                      textEn: "A database bug in one of them",
                      isCorrect: false,
                    },
                    {
                      textAr: "Different screen sizes",
                      textEn: "Different screen sizes",
                      isCorrect: false,
                    },
                    { textAr: "Slow queries", textEn: "Slow queries", isCorrect: false },
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "Which questions does counting events NOT answer?",
                  promptEn: "Which questions does counting events NOT answer?",
                  explanationAr: "Event counts do not tell you how many distinct people acted.",
                  explanationEn: "Event counts do not tell you how many distinct people acted.",
                  options: [
                    {
                      textAr: "How many distinct users were active?",
                      textEn: "How many distinct users were active?",
                      isCorrect: true,
                    },
                    {
                      textAr: "How many people returned later?",
                      textEn: "How many people returned later?",
                      isCorrect: true,
                    },
                    {
                      textAr: "How much total activity occurred?",
                      textEn: "How much total activity occurred?",
                      isCorrect: false,
                    },
                    {
                      textAr: "How many taps were recorded?",
                      textEn: "How many taps were recorded?",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr:
                    "A funnel should include every step the user must complete, even the ones easy to forget.",
                  promptEn:
                    "A funnel should include every step the user must complete, even the ones easy to forget.",
                  explanationAr: "Omitting a step inflates conversion and hides the real drop-off.",
                  explanationEn: "Omitting a step inflates conversion and hides the real drop-off.",
                  options: [
                    { textAr: "True", textEn: "True", isCorrect: true },
                    { textAr: "False", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "What is a group of users who share a starting period called?",
                  promptEn: "What is a group of users who share a starting period called?",
                  explanationAr:
                    "A cohort groups users by when they started, which is what retention needs.",
                  explanationEn:
                    "A cohort groups users by when they started, which is what retention needs.",
                  acceptedAnswers: ["cohort", "a cohort", "user cohort"],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "When should a metric definition be written?",
                  promptEn: "When should a metric definition be written?",
                  explanationAr:
                    "Choosing the metric after seeing the chart leads to defending an unintended number.",
                  explanationEn:
                    "Choosing the metric after seeing the chart leads to defending an unintended number.",
                  options: [
                    {
                      textAr: "Before writing the query, from the decision",
                      textEn: "Before writing the query, from the decision",
                      isCorrect: true,
                    },
                    {
                      textAr: "After seeing which number looks better",
                      textEn: "After seeing which number looks better",
                      isCorrect: false,
                    },
                    {
                      textAr: "Only in the annual report",
                      textEn: "Only in the annual report",
                      isCorrect: false,
                    },
                    {
                      textAr: "Never; the number speaks for itself",
                      textEn: "Never; the number speaks for itself",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "Reporting to the Team",
        titleEn: "Reporting to the Team",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "Presenting a number with its limit",
            titleEn: "Presenting a number with its limit",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "Keeping queries readable a year later",
            titleEn: "Keeping queries readable a year later",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "Reading: the query that explains itself",
            titleEn: "Reading: the query that explains itself",
            durationSec: 300,
            contentAr:
              "<p>A query read once and never reused is cheap. A query another analyst must modify in six months is a document, and documents need a beginning: the question it answers, and the definition it assumes, written at the top.</p><h3>Three lines that save hours</h3><ul><li>The question, in one sentence.</li><li>The definition of each calculated metric.</li><li>The known limitation, so nobody rebuilds it hoping to fix it.</li></ul><p>These lines cost a minute now and spare an hour of archaeology later, when the only person who understood the query has changed teams.</p>",
            contentEn:
              "<p>A query read once and never reused is cheap. A query another analyst must modify in six months is a document, and documents need a beginning: the question it answers, and the definition it assumes, written at the top.</p><h3>Three lines that save hours</h3><ul><li>The question, in one sentence.</li><li>The definition of each calculated metric.</li><li>The known limitation, so nobody rebuilds it hoping to fix it.</li></ul><p>These lines cost a minute now and spare an hour of archaeology later, when the only person who understood the query has changed teams.</p>",
          },
          {
            type: "FILE",
            titleAr: "Product metric definition sheet",
            titleEn: "Product metric definition sheet",
            durationSec: 300,
            attachmentAr: "ورقة تعريف مقاييس المنتج",
            attachmentEn: "Product metric definition sheet",
          },
          {
            type: "QUIZ",
            titleAr: "Quiz: reporting to the team",
            titleEn: "Quiz: reporting to the team",
            quiz: {
              titleAr: "Quiz: reporting to the team",
              titleEn: "Quiz: reporting to the team",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "Why write the question at the top of a query?",
                  promptEn: "Why write the question at the top of a query?",
                  explanationAr:
                    "It tells the next analyst what the query is for, not just what it does.",
                  explanationEn:
                    "It tells the next analyst what the query is for, not just what it does.",
                  options: [
                    {
                      textAr: "So the next analyst knows what it is for",
                      textEn: "So the next analyst knows what it is for",
                      isCorrect: true,
                    },
                    { textAr: "So it runs faster", textEn: "So it runs faster", isCorrect: false },
                    {
                      textAr: "So it uses fewer joins",
                      textEn: "So it uses fewer joins",
                      isCorrect: false,
                    },
                    {
                      textAr: "So it passes linting",
                      textEn: "So it passes linting",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr:
                    "Noting the known limitation of a query can stop someone rebuilding it needlessly.",
                  promptEn:
                    "Noting the known limitation of a query can stop someone rebuilding it needlessly.",
                  explanationAr: "Documented limits prevent a rebuild that cannot fix them.",
                  explanationEn: "Documented limits prevent a rebuild that cannot fix them.",
                  options: [
                    { textAr: "True", textEn: "True", isCorrect: true },
                    { textAr: "False", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "What should each calculated metric in a query carry?",
                  promptEn: "What should each calculated metric in a query carry?",
                  explanationAr:
                    "A definition next to each metric lets others reproduce the number.",
                  explanationEn:
                    "A definition next to each metric lets others reproduce the number.",
                  acceptedAnswers: [
                    "a definition",
                    "definition",
                    "its definition",
                    "definition comment",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "Which details make a report trustworthy?",
                  promptEn: "Which details make a report trustworthy?",
                  explanationAr:
                    "Stating the window and who is excluded removes the common ambiguities.",
                  explanationEn:
                    "Stating the window and who is excluded removes the common ambiguities.",
                  options: [
                    {
                      textAr: "The time window, with boundaries",
                      textEn: "The time window, with boundaries",
                      isCorrect: true,
                    },
                    {
                      textAr: "Who is excluded from the count",
                      textEn: "Who is excluded from the count",
                      isCorrect: true,
                    },
                    {
                      textAr: "The colour of the chart",
                      textEn: "The colour of the chart",
                      isCorrect: false,
                    },
                    {
                      textAr: "The number of rows scanned",
                      textEn: "The number of rows scanned",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "What makes a comparison between two groups weak?",
                  promptEn: "What makes a comparison between two groups weak?",
                  explanationAr: "A difference within normal noise cannot be called an effect.",
                  explanationEn: "A difference within normal noise cannot be called an effect.",
                  options: [
                    {
                      textAr: "A difference too small to stand out from noise",
                      textEn: "A difference too small to stand out from noise",
                      isCorrect: true,
                    },
                    {
                      textAr: "Writing the definition down",
                      textEn: "Writing the definition down",
                      isCorrect: false,
                    },
                    {
                      textAr: "Using distinct user counts",
                      textEn: "Using distinct user counts",
                      isCorrect: false,
                    },
                    {
                      textAr: "Naming the columns clearly",
                      textEn: "Naming the columns clearly",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "data-pipelines-and-orchestration",
    instructorUsername: "khalid-alharbi",
    categorySlug: "data",
    titleAr: "خطوط البيانات والتنسيق بين مهامّها",
    titleEn: "Data Pipelines and Orchestration",
    subtitleAr: "خطّ يعمل عند الفشل الجزئي، ويُعاد تشغيله بأمان دون تكرار بيانات",
    subtitleEn:
      "A pipeline that survives partial failure and can be rerun safely without duplicating data",
    descriptionAr:
      "الخطّ الذي يعمل مرة واحدة ليس خطًّا، بل تجربة. نبدأ من خطّ بسيط ينقل بيانات من مصدر إلى مستودع، ثم نُدخل عليه الفشل عن قصد: مهمّة تُقطع في المنتصف، ومصدر يتأخّر عن موعده، وملف يصل نصفه ثم يُستبدل. لكل حالة نبني ردًّا محدّدًا لا أملًا في أن تعمل في المرة القادمة.\n\nنتناول بعد ذلك إعادة التشغيل بأمان: كيف نجعل المهمّة قابلة للتكرار دون أن تُضاعف الصفوف، وكيف نراقب التأخّر الحقيقي لا وقت التشغيل وحده. نختتم بتخطيط الاعتماديات وتنبيهات قليلة تنبّه على ما يستحق، لا على كل شيء.",
    descriptionEn:
      "A pipeline that runs once is not a pipeline but an experiment. We start from a simple job moving data from a source into a warehouse, then break it on purpose: a task killed halfway, a source that arrives late, and a file that lands half-written and is replaced. For each case we build a specific answer instead of hoping it works next time.\n\nWe then cover safe reruns: making a task repeatable without duplicating rows, and monitoring true lateness rather than runtime alone. We close with dependency scheduling and a small set of alerts that fire on what matters rather than on everything.",
    level: "ADVANCED",
    language: "AR",
    priceCents: 39900,
    objectives: [
      {
        textAr: "تصمّم خطّ بيانات بمهامّ واضحة الاعتماديات.",
        textEn: "Design a data pipeline with tasks whose dependencies are explicit.",
      },
      {
        textAr: "تجعل إعادة التشغيل آمنة دون تكرار الصفوف.",
        textEn: "Make reruns safe without duplicating rows.",
      },
      {
        textAr: "تعالج الملفات الناقصة أو المستبدلة أثناء النقل.",
        textEn: "Handle files that are incomplete or replaced during transfer.",
      },
      {
        textAr: "تقيس التأخّر الحقيقي لا زمن التنفيذ فقط.",
        textEn: "Measure true lateness rather than execution time alone.",
      },
      {
        textAr: "تضبط تنبيهات قليلة تكشف الأعطال ذات الأثر.",
        textEn: "Configure a few alerts that surface the failures that matter.",
      },
      {
        textAr: "توثّق عقد كل مهمّة: ما تتوقّعه وما تُنتجه.",
        textEn: "Document each task's contract: what it expects and what it produces.",
      },
    ],
    requirements: [
      {
        textAr: "خبرة بـ SQL ومعالجة بيانات على نطاق غير صغير.",
        textEn: "Experience with SQL and data processing beyond toy scale.",
      },
      {
        textAr: "معرفة بأداة تنسيق واحدة كالجدولة أو المخطّطات.",
        textEn: "Familiarity with one orchestration tool such as a scheduler or DAG runner.",
      },
      {
        textAr: "فهم أساسي لأنظمة الملفات وأدوات النقل.",
        textEn: "Basic understanding of file systems and transfer tools.",
      },
      {
        textAr: "مستوى تقني يتيح قراءة سجلات الأعطال.",
        textEn: "Technical level sufficient to read failure logs.",
      },
    ],
    sections: [
      {
        titleAr: "الخطّ والفشل الجزئي",
        titleEn: "The Pipeline and Partial Failure",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا يعمل الخطّ مرة ويفشل في الإنتاج",
            titleEn: "Why a pipeline works once and fails in production",
            isPreview: true,
            durationSec: 480,
          },
          {
            type: "VIDEO",
            titleAr: "تحديد عقد كل مهمّة: مدخلات ومخرجات",
            titleEn: "Defining each task's contract: inputs and outputs",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "الملف الناقص والمستبدل أثناء النقل",
            titleEn: "Files incomplete or replaced during transfer",
            durationSec: 720,
          },
          {
            type: "VIDEO",
            titleAr: "المصدر المتأخّر: كيف نتصفّ دون تعطيل الخطّ كله",
            titleEn: "A late source: how to act without stalling the whole pipeline",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: عقد المهمّة يمنع نصف الأعطال",
            titleEn: "Reading: a task contract prevents half the failures",
            durationSec: 360,
            contentAr:
              "<p>معظم أعطال الخطوط ليست في الكود بل في الافتراض: مهمّة تفترض أن جدولًا سيوجد، ومهمّة أخرى تفترض أن صفًّا واحدًا سيأتي لكل مستخدم. حين نكتب العقد صراحة، تظهر الافتراضات ويمكن مناقشتها.</p><h3>ثلاثة أسطر لكل مهمّة</h3><ul><li>ما تتوقّعه: الجداول والأعمدة ونطاق التواريخ.</li><li>ما تضمنه: الشكل والوحدة ومستوى التجميع.</li><li>ما لا تتعامل معه: الحالات التي تُترك لمهمّة أخرى.</li></ul><p>السطر الثالث يمنع أشهر خلاف: مهمّتان كلتاهما تفترض أن الأخرى تنظّف البيانات، فتتجاوزها كلتاهما.</p>",
            contentEn:
              "<p>Most pipeline failures are not in the code but in the assumption: one task assumes a table will exist, another assumes exactly one row per user. When you write the contract explicitly, assumptions become visible and discussable.</p><h3>Three lines per task</h3><ul><li>What it expects: tables, columns, and date range.</li><li>What it guarantees: shape, unit, and level of aggregation.</li><li>What it does not handle: cases left to another task.</li></ul><p>That third line prevents the most common dispute: two tasks each assuming the other cleans the data, so neither does.</p>",
          },
        ],
      },
      {
        titleAr: "إعادة التشغيل بأمان",
        titleEn: "Safe Reruns",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا تُضاعف الصفوف عند إعادة التشغيل",
            titleEn: "Why rows duplicate on a rerun",
            isPreview: true,
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "الكتابة الاستبدالية بدل الإضافة العمياء",
            titleEn: "Replacing writes instead of blind appends",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "مفاتيح التفرّد التي تحمي من التكرار",
            titleEn: "Unique keys that protect against duplicates",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: كيف تصمّم مهمّة قابلة للتكرار",
            titleEn: "Reading: how to design a repeatable task",
            durationSec: 420,
            contentAr:
              "<p>المهمّة القابلة للتكرار تعطي النتيجة نفسها إن شُغّلت مرة أو خمسًا. هذا ليس ترفًا، بل شرط أساسي للعمل عند منتصف الليل حين تُعيد تشغيل خطّ فشل جزئيًا ولا تعرف أي نصف اكتمل.</p><h3>ثلاث تقنيات</h3><ul><li>اكتب على قسم محدّد من الهدف بدل الإضافة إليه.</li><li>اجعل المفتاح فريدًا في القسم نفسه، ليمنع التكرار عند الإعادة.</li><li>سجّل وقت المعالجة في عمود، لتُعيد النطاق نفسه عند الحاجة.</li></ul><p>الاتّفاق في التصميم على قسم الكتابة يوفّر على الفريق ساعات تشخيص في كل حادثة، ويجعل تصحيح المهمّة أسرع من إعادة بناء الخطّ.</p>",
            contentEn:
              "<p>A repeatable task gives the same result whether run once or five times. That is not a luxury; it is a precondition for working at midnight, when you rerun a partially failed pipeline and do not know which half completed.</p><h3>Three techniques</h3><ul><li>Write to a defined partition of the target instead of appending to it.</li><li>Make the key unique within that partition, so a rerun cannot duplicate.</li><li>Record processing time in a column, so you can reprocess the same range when needed.</li></ul><p>Agreeing on the write partition saves the team hours of diagnosis per incident and makes fixing a task faster than rebuilding the pipeline.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الفشل وإعادة التشغيل",
            titleEn: "Quiz: failure and reruns",
            quiz: {
              titleAr: "اختبار: الفشل وإعادة التشغيل",
              titleEn: "Quiz: failure and reruns",
              passPct: 80,
              maxAttempts: 3,
              timeLimitSec: 1500,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما أول سبب لتضاعف الصفوف عند إعادة تشغيل مهمّة؟",
                  promptEn: "What is the first cause of duplicated rows on a task rerun?",
                  explanationAr:
                    "الإضافة العمياء تزيد الصفوف في كل تشغيل، بخلاف الكتابة الاستبدالية.",
                  explanationEn: "Blind appends add rows on every run, unlike replacing writes.",
                  options: [
                    {
                      textAr: "الإضافة العمياء إلى الهدف في كل تشغيل",
                      textEn: "Blindly appending to the target on every run",
                      isCorrect: true,
                    },
                    { textAr: "قلة عدد الأعمدة", textEn: "Too few columns", isCorrect: false },
                    { textAr: "بطء الشبكة", textEn: "Slow network", isCorrect: false },
                    { textAr: "زيادة عدد المهامّ", textEn: "More tasks", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "المهمّة القابلة للتكرار تعطي النتيجة نفسها عند تشغيلها أكثر من مرة.",
                  promptEn: "A repeatable task gives the same result when run more than once.",
                  explanationAr: "هذا تعريف التكرار الآمن وهو شرط للعمل في الحوادث.",
                  explanationEn:
                    "That is the definition of a safe rerun and a precondition for incident work.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما نوع القيد الذي يمنع تكرار الصفّ في القسم نفسه؟",
                  promptEn:
                    "Which kind of constraint prevents a row repeating within the same partition?",
                  explanationAr: "مفتاح التفرّد يمنع إدخال الصفّ مرتين في القسم نفسه.",
                  explanationEn:
                    "A unique key prevents inserting the same row twice in that partition.",
                  acceptedAnswers: [
                    "unique key",
                    "unique constraint",
                    "uniqueness",
                    "unique index",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يجعل إعادة التشغيل آمنة؟",
                  promptEn: "Which of these make a rerun safe?",
                  explanationAr: "الكتابة على قسم محدّد وتسجيل وقت المعالجة يجعلان الإعادة محسوبة.",
                  explanationEn:
                    "Writing to a defined partition and recording processed time make reruns deliberate.",
                  options: [
                    {
                      textAr: "الكتابة على قسم محدّد من الهدف",
                      textEn: "Writing to a defined partition of the target",
                      isCorrect: true,
                    },
                    {
                      textAr: "تسجيل وقت المعالجة لتمكين إعادة نطاق محدّد",
                      textEn: "Recording processed time to rerun a specific range",
                      isCorrect: true,
                    },
                    {
                      textAr: "حذف الهدف بالكامل عند كل فشل",
                      textEn: "Deleting the whole target on every failure",
                      isCorrect: false,
                    },
                    {
                      textAr: "تشغيل المهمّة يدويًا دون سجل",
                      textEn: "Running the task manually with no log",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما الذي يكشفه عقد المهمّة؟",
                  promptEn: "What does a task contract reveal?",
                  explanationAr: "العقد يوضّح الافتراضات التي غالبًا ما تسبب الأعطال.",
                  explanationEn:
                    "The contract exposes the assumptions that most often cause failures.",
                  options: [
                    {
                      textAr: "الافتراضات التي تفترضها المهمّة عن مدخلاتها",
                      textEn: "The assumptions the task makes about its inputs",
                      isCorrect: true,
                    },
                    {
                      textAr: "سرعة المعالج المطلوبة",
                      textEn: "The processor speed required",
                      isCorrect: false,
                    },
                    {
                      textAr: "مكان تخزين السجلات",
                      textEn: "Where logs are stored",
                      isCorrect: false,
                    },
                    {
                      textAr: "لون واجهة المراقبة",
                      textEn: "The colour of the monitoring interface",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "المراقبة والتخطيط",
        titleEn: "Monitoring and Scheduling",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "قياس التأخّر الحقيقي لا زمن التنفيذ",
            titleEn: "Measuring true lateness, not execution time",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "تنبيهات قليلة تنبّه على ما يستحق",
            titleEn: "A few alerts that fire on what matters",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: الفرق بين البطء والفشل",
            titleEn: "Reading: the difference between slow and failed",
            durationSec: 300,
            contentAr:
              "<p>مهمّة تنتهي بنجاح لكنها تستغرق ثلاث ساعات بدل عشرين دقيقة أخطر من مهمّة تفشل بسرعة، لأن الفشل السريع يوقظ أحدهم بينما التأخّر الصامت يجعل كل ما بعده يقرأ بيانات قديمة.</p><h3>ثلاث مقاييس</h3><ul><li>زمن التنفيذ: مقدّمة يسهل قياسها ولا تكفي.</li><li>حداثة البيانات: متى وصل آخر صفّ، وهو ما يهمّ المستهلك.</li><li>الاكتمال: هل وصل العدد المتوقّع من الصفوف؟</li></ul><p>راقب الحداثة والاكتمال معًا؛ الأول يكشف البطء والثاني يكشف النقص الذي ينتهي بنجاح كاذب.</p>",
            contentEn:
              "<p>A task that succeeds but takes three hours instead of twenty minutes is more dangerous than one that fails fast, because a fast failure wakes someone while silent lateness leaves everything downstream reading stale data.</p><h3>Three measures</h3><ul><li>Runtime: the easy one to measure and the least useful alone.</li><li>Data freshness: when the last row arrived, which is what consumers care about.</li><li>Completeness: did the expected number of rows arrive?</li></ul><p>Monitor freshness and completeness together; the first catches slowness and the second catches the shortfall that ends in a false success.</p>",
          },
          {
            type: "FILE",
            titleAr: "قائمة مراجعة تشغيل الخطّ",
            titleEn: "Pipeline run review sheet",
            durationSec: 300,
            attachmentAr: "قائمة مراجعة تشغيل الخطّ",
            attachmentEn: "Pipeline run review sheet",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: المراقبة والتخطيط",
            titleEn: "Quiz: monitoring and scheduling",
            quiz: {
              titleAr: "اختبار: المراقبة والتخطيط",
              titleEn: "Quiz: monitoring and scheduling",
              passPct: 80,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "لماذا قد يكون البطء أخطر من الفشل السريع؟",
                  promptEn: "Why can slowness be more dangerous than a fast failure?",
                  explanationAr: "التأخّر الصامت يجعل ما بعده يقرأ بيانات قديمة دون أن ينتبه أحد.",
                  explanationEn:
                    "Silent lateness leaves everything downstream reading stale data unnoticed.",
                  options: [
                    {
                      textAr: "لأنه صامت فيقرأ ما بعده بيانات قديمة",
                      textEn: "Because it is silent, leaving downstream steps reading stale data",
                      isCorrect: true,
                    },
                    {
                      textAr: "لأنه يستهلك مساحة أكبر",
                      textEn: "Because it uses more space",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأنه يتطلّب كودًا أكثر",
                      textEn: "Because it needs more code",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأنه يمنع الكتابة",
                      textEn: "Because it blocks writes",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يقيس ما يهمّ مستهلك البيانات؟",
                  promptEn: "Which of these measure what a data consumer cares about?",
                  explanationAr: "الحداثة والاكتمال يخبران المستهلك هل البيانات صالحة للاستخدام.",
                  explanationEn:
                    "Freshness and completeness tell the consumer whether the data is usable.",
                  options: [
                    {
                      textAr: "حداثة البيانات: وقت وصول آخر صفّ",
                      textEn: "Data freshness: when the last row arrived",
                      isCorrect: true,
                    },
                    {
                      textAr: "الاكتمال: هل وصل العدد المتوقّع",
                      textEn: "Completeness: whether the expected count arrived",
                      isCorrect: true,
                    },
                    {
                      textAr: "لون سجل التنفيذ",
                      textEn: "The colour of the run log",
                      isCorrect: false,
                    },
                    {
                      textAr: "عدد أسطر الكود",
                      textEn: "The number of code lines",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "زمن التنفيذ وحده مقياس كافٍ لصحّة الخطّ.",
                  promptEn: "Runtime alone is a sufficient measure of pipeline health.",
                  explanationAr: "التنفيذ قد ينجح بسرعة وينتج بيانات ناقصة.",
                  explanationEn: "A run can finish quickly and still produce incomplete data.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما اسم المقياس الذي يكشف نجاحًا كاذبًا بسبب نقص الصفوف؟",
                  promptEn: "Which measure reveals a false success caused by missing rows?",
                  explanationAr: "فحص الاكتمال يكشف النقص الذي يمرّ بنجاح شكلي.",
                  explanationEn:
                    "A completeness check reveals the shortfall that passes as formal success.",
                  acceptedAnswers: [
                    "completeness",
                    "completeness check",
                    "row count",
                    "row count check",
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "كيف نضبط التنبيهات؟",
                  promptEn: "How should alerts be configured?",
                  explanationAr:
                    "قليل من التنبيهات التي تكشف الأعطال ذات الأثر يحافظ على انتباه الفريق.",
                  explanationEn: "A few alerts on failures that matter keep the team's attention.",
                  options: [
                    {
                      textAr: "عدد قليل يكشف الأعطال ذات الأثر",
                      textEn: "A small number exposing the failures that matter",
                      isCorrect: true,
                    },
                    {
                      textAr: "تنبيه لكل خطوة في الخطّ",
                      textEn: "One alert for every step",
                      isCorrect: false,
                    },
                    { textAr: "لا تنبيهات إطلاقًا", textEn: "No alerts at all", isCorrect: false },
                    {
                      textAr: "تنبيه مرة واحدة سنويًا",
                      textEn: "One alert per year",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "product-management-fundamentals",
    instructorUsername: "maryam-alotaibi",
    categorySlug: "business",
    titleAr: "أساسيات إدارة المنتج",
    titleEn: "Product Management Fundamentals",
    subtitleAr: "من فكرة مبعثرة إلى قرار مكتوب يعرف صاحبه كيف يُراجَع",
    subtitleEn:
      "From scattered ideas to a written decision whose owner knows how it gets revisited",
    descriptionAr:
      "إدارة المنتج ليست ترتيب قائمة مطالب، بل اتّخاذ قرارات صغيرة كثيرة ثم تحمّل نتائجها. نبدأ من حالة غامضة: شكوى عميل وشريحة بيانات وتحسّن يقترحه مطوّر. نتعلم كيف نكتب المشكلة قبل الحلّ، وكيف نميّز بين طلب يذكره عميل وحاجة تقف وراءه.\n\nثم نتدرّب على كتابة وثيقة قرار قصيرة: ما الذي نفعل، وما الذي نرفضه ولماذا، وكيف سنعرف بعد شهر أن القرار كان صحيحًا. الهدف ليس إتقان قالب، بل أن يصبح قرارك قابلًا للمراجعة بدل أن يكون ذوقًا شخصيًا مدفوعًا بضغط الوقت.",
    descriptionEn:
      "Product management is not ordering a backlog; it is making many small decisions and owning their consequences. We start from a murky situation: one customer complaint, one slice of data, and one improvement a developer suggests. We learn to write the problem before the solution, and to tell a request a customer mentions apart from the need behind it.\n\nWe then practise writing a short decision document: what we will do, what we refuse and why, and how we will know in a month whether the choice was right. The goal is not to master a template but to make your decision reviewable rather than a personal preference pushed by time pressure.",
    level: "BEGINNER",
    language: "AR",
    priceCents: 0,
    objectives: [
      {
        textAr: "تكتب المشكلة بدقة قبل أن تقترح أي حل.",
        textEn: "Write the problem precisely before proposing any solution.",
      },
      {
        textAr: "تفرّق بين طلب العميل والحاجة التي تقف وراءه.",
        textEn: "Tell a customer's request apart from the need behind it.",
      },
      {
        textAr: "تصوغ وثيقة قرار قصيرة تشمل ما ترفضه ولماذا.",
        textEn: "Write a short decision document including what you refuse and why.",
      },
      {
        textAr: "تحدّد كيفية معرفة نجاح القرار بعد فترة.",
        textEn: "Define how you will know the decision succeeded after a period.",
      },
      {
        textAr: "ترتّب المطالب وفق أثر متوقّع لا وفق صوت أعلى.",
        textEn: "Order requests by expected impact rather than the loudest voice.",
      },
      {
        textAr: "تقدّم قرارك لمن يخالفك دون أن تتحوّل المناقشة إلى خلاف شخصي.",
        textEn: "Present your decision to a dissenter without the discussion turning personal.",
      },
    ],
    requirements: [
      {
        textAr: "رغبة في العمل على منتج قائم أو متخيّل.",
        textEn: "Willingness to work on an existing or imagined product.",
      },
      {
        textAr: "لا حاجة إلى خبرة إدارية سابقة.",
        textEn: "No prior management experience needed.",
      },
      {
        textAr: "قدرة على قراءة أرقام أساسية ومقارنتها.",
        textEn: "Ability to read and compare basic numbers.",
      },
    ],
    sections: [
      {
        titleAr: "المشكلة قبل الحلّ",
        titleEn: "The Problem Before the Solution",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا نقفز إلى الحلّ بسرعة",
            titleEn: "Why we jump to the solution too fast",
            isPreview: true,
            durationSec: 420,
          },
          {
            type: "VIDEO",
            titleAr: "كتابة المشكلة في جملة قابلة للاختبار",
            titleEn: "Writing the problem in a testable sentence",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "الطلب والحاجة: كيف تفرّق بينهما",
            titleEn: "Request and need: telling them apart",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "من يملك المشكلة فعلًا",
            titleEn: "Who actually owns the problem",
            durationSec: 480,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: جملة مشكلة لا يمكن الجدال فيها",
            titleEn: "Reading: a problem statement nobody can argue with",
            durationSec: 300,
            contentAr:
              "<p>الجملة الغامضة «التجربة سيئة» لا يمكن العمل عليها، لأن كل شخص سيفهمها بطريقة. الجملة الجيدة تصف سلوكًا يمكن ملاحظته: من يقوم بماذا، وأين يتوقّف، وما الذي يخسره نتيجة ذلك.</p><h3>ثلاثة عناصر</h3><ul><li>الفاعل: من يواجه المشكلة بالتحديد؟</li><li>السلوك: ماذا يفعل الآن وما الخطوة التي تفشل؟</li><li>الخسارة: ما الثمن الملموس لهذا الفشل؟</li></ul><p>هذه الصيغة تجعل النقاش حول الوقائع لا حول الأذواق، وتكشف سريعًا إن كانت المشكلة حقيقية أم افتراضًا في رأس أحدهم.</p>",
            contentEn:
              "<p>The vague sentence «the experience is bad» cannot be worked on, because everyone reads it differently. A good sentence describes observable behaviour: who does what, where they stop, and what they lose as a result.</p><h3>Three elements</h3><ul><li>The actor: who exactly faces the problem?</li><li>The behaviour: what do they do now, and which step fails?</li><li>The loss: what is the concrete cost of that failure?</li></ul><p>This shape moves the discussion to facts rather than tastes, and quickly reveals whether the problem is real or an assumption in someone's head.</p>",
          },
        ],
      },
      {
        titleAr: "الترتيب والقرار",
        titleEn: "Ordering and Deciding",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "ترتيب المطالب بأثر متوقّع لا بصوت أعلى",
            titleEn: "Ordering by expected impact, not the loudest voice",
            isPreview: true,
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "ما نرفضه: القرار الذي لا يُكتب",
            titleEn: "What we refuse: the decision left unwritten",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "كيف نعرف بعد شهر أن القرار كان صحيحًا",
            titleEn: "How we know in a month whether the choice was right",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: الرفض المكتوب يوفر تكرار النقاش",
            titleEn: "Reading: a written refusal saves the debate from repeating",
            durationSec: 360,
            contentAr:
              "<p>أكثر ما يستهلك وقت الفريق هو إعادة نقاش قرارات سبق أن اتُّخذت. السبب أن الرفض كان شفهيًا، فعاد بعد شهرين كأنه جديد. كتابة الرفض توثّق السبب لا القرار فقط.</p><h3>ما يُكتب في الرفض</h3><ul><li>ما الذي رفضناه بالتحديد.</li><li>تحت أي شرط سنعيد النظر فيه.</li><li>ما البديل الذي اخترناه بدلًا منه.</li></ul><p>البند الثاني هو الأهم: الرفض بلا شرط مراجعة يصبح رفضًا أبديًا، وربما كانت الظروف قد تغيّرت تمامًا.</p>",
            contentEn:
              "<p>What consumes a team's time most is re-arguing decisions already made. The reason is that the refusal was verbal, so it returns two months later as if it were new. Writing the refusal records the reason, not just the decision.</p><h3>What a refusal contains</h3><ul><li>What exactly we refused.</li><li>The condition under which we would revisit it.</li><li>The alternative we chose instead.</li></ul><p>The second line matters most: a refusal with no revisit condition becomes permanent, and the circumstances may have changed entirely.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: المشكلة والقرار",
            titleEn: "Quiz: problem and decision",
            quiz: {
              titleAr: "اختبار: المشكلة والقرار",
              titleEn: "Quiz: problem and decision",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 900,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما الذي يجعل جملة المشكلة قابلة للعمل؟",
                  promptEn: "What makes a problem statement workable?",
                  explanationAr: "وصف الفاعل والسلوك والخسارة يجعلها قابلة للملاحظة.",
                  explanationEn: "Describing the actor, behaviour, and loss makes it observable.",
                  options: [
                    {
                      textAr: "تحديد الفاعل والسلوك والخسارة",
                      textEn: "Naming the actor, the behaviour, and the loss",
                      isCorrect: true,
                    },
                    {
                      textAr: "استخدام كلمات قوية ومؤثّرة",
                      textEn: "Using strong, emotional words",
                      isCorrect: false,
                    },
                    { textAr: "أن تكون قصيرة جدًا", textEn: "Being very short", isCorrect: false },
                    {
                      textAr: "أن تذكر الحلّ مباشرة",
                      textEn: "Mentioning the solution immediately",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "الرفض المكتوب يجب أن يتضمّن شرطًا لإعادة النظر فيه.",
                  promptEn: "A written refusal should include a condition for revisiting it.",
                  explanationAr: "بلا شرط مراجعة يصبح الرفض أبديًا وقد تتغيّر الظروف.",
                  explanationEn:
                    "Without a revisit condition a refusal becomes permanent while circumstances may change.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الذي يجب أن يسبق اقتراح أي حلّ؟",
                  promptEn: "What must come before proposing any solution?",
                  explanationAr: "كتابة المشكلة أولًا تمنع بناء حلّ لمشكلة غير موجودة.",
                  explanationEn:
                    "Writing the problem first prevents building a solution to a non-problem.",
                  acceptedAnswers: ["problem statement", "the problem", "writing the problem"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يجعل ترتيب المطالب قابلًا للدفاع؟",
                  promptEn: "Which of these make an ordering defensible?",
                  explanationAr: "الأثر المتوقّع وتكرار المشكلة معياران يمكن مناقشتهما.",
                  explanationEn: "Expected impact and repeated occurrence can both be discussed.",
                  options: [
                    {
                      textAr: "تقدير الأثر المتوقّع",
                      textEn: "Estimating expected impact",
                      isCorrect: true,
                    },
                    {
                      textAr: "قياس تكرار المشكلة",
                      textEn: "Measuring how often the problem occurs",
                      isCorrect: true,
                    },
                    {
                      textAr: "علوّ صوت من يطالب",
                      textEn: "How loud the requester is",
                      isCorrect: false,
                    },
                    {
                      textAr: "مناسبة الطلب لذوقك",
                      textEn: "Whether the request suits your taste",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "كيف تعرف بعد شهر أن القرار كان صحيحًا؟",
                  promptEn: "How do you know a month later that the decision was right?",
                  explanationAr: "تحديد مؤشّر مسبقًا هو ما يجعل الحكم ممكنًا لا الانطباع.",
                  explanationEn:
                    "Defining an indicator in advance is what makes judgement possible rather than impression.",
                  options: [
                    {
                      textAr: "بتحديد مؤشّر متّفق عليه مسبقًا",
                      textEn: "By defining an agreed indicator in advance",
                      isCorrect: true,
                    },
                    {
                      textAr: "بشعور الفريق بالرضا",
                      textEn: "By the team feeling pleased",
                      isCorrect: false,
                    },
                    {
                      textAr: "بعدد الاجتماعات",
                      textEn: "By the number of meetings",
                      isCorrect: false,
                    },
                    {
                      textAr: "بسؤال مدير المنتج فقط",
                      textEn: "By asking the product manager only",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "التواصل والمراجعة",
        titleEn: "Communicating and Reviewing",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "تقديم قرار لمن يخالفك",
            titleEn: "Presenting a decision to a dissenter",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "مراجعة القرار بعد التنفيذ",
            titleEn: "Reviewing a decision after it ships",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: كيف تُقدّم قرارًا دون أن تدافع عن نفسك",
            titleEn: "Reading: presenting a decision without defending yourself",
            durationSec: 300,
            contentAr:
              "<p>حين يعترض أحدهم على قرارك، فإن دفاعك عن نفسك يغلق النقاش ويجعل الطرفين يتبادلان الحجج بلا نتيجة. الأجدى أن تفصل القرار عن شخصك وتدعو إلى اختبار الفكرة.</p><h3>ثلاث حركات</h3><ul><li>اذكر الفرضية بوضوح: نفترض أن كذا سيؤدي إلى كذا.</li><li>اقترح الاختبار الأصغر الذي يكشف الخلاف بسرعة.</li><li>اتّفق سلفًا على ما سيغيّر الرأي.</li></ul><p>الحركة الثالثة هي الأصعب والأهم: الاتّفاق على ما سيغيّر رأيك يحوّل النقاش من موقف إلى تجربة قابلة للحسم.</p>",
            contentEn:
              "<p>When someone objects to your decision, defending yourself closes the discussion and leaves both sides trading arguments without a result. Better to separate the decision from yourself and call for a test of the idea.</p><h3>Three moves</h3><ul><li>State the hypothesis plainly: we assume this will lead to that.</li><li>Propose the smallest test that settles the disagreement quickly.</li><li>Agree in advance on what would change your mind.</li></ul><p>The third is hardest and most important: agreeing on what would change your mind turns the discussion from a stance into a test that can be settled.</p>",
          },
          {
            type: "FILE",
            titleAr: "قالب وثيقة قرار منتج",
            titleEn: "Product decision document template",
            durationSec: 300,
            attachmentAr: "قالب وثيقة قرار منتج",
            attachmentEn: "Product decision document template",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: التواصل والمراجعة",
            titleEn: "Quiz: communicating and reviewing",
            quiz: {
              titleAr: "اختبار: التواصل والمراجعة",
              titleEn: "Quiz: communicating and reviewing",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما أفضل ردّ على اعتراض على قرارك؟",
                  promptEn: "What is the best response to an objection to your decision?",
                  explanationAr: "اقتراح اختبار صغير يحوّل النقاش إلى تجربة قابلة للحسم.",
                  explanationEn:
                    "Proposing a small test turns the debate into a settleable experiment.",
                  options: [
                    {
                      textAr: "اقتراح اختبار صغير يكشف الخلاف",
                      textEn: "Proposing a small test that exposes the disagreement",
                      isCorrect: true,
                    },
                    {
                      textAr: "تكرار الحجّة بصوت أعلى",
                      textEn: "Repeating the argument louder",
                      isCorrect: false,
                    },
                    {
                      textAr: "اللجوء إلى المدير فورًا",
                      textEn: "Escalating to the manager immediately",
                      isCorrect: false,
                    },
                    {
                      textAr: "سحب القرار تجنّبًا للخلاف",
                      textEn: "Withdrawing the decision to avoid conflict",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "الاتّفاق مسبقًا على ما سيغيّر رأيك يقوّي النقاش.",
                  promptEn:
                    "Agreeing in advance on what would change your mind strengthens the discussion.",
                  explanationAr: "الشرط المسبق يحوّل النقاش من موقف إلى اختبار قابل للحسم.",
                  explanationEn:
                    "A prior condition turns the debate from a stance into a settleable test.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الذي يفصل القرار عن شخصك في النقاش؟",
                  promptEn: "What separates the decision from you personally in a discussion?",
                  explanationAr: "صياغة الفرضية بوضوح تجعل الفكرة موضع النقاش لا صاحبها.",
                  explanationEn:
                    "Stating the hypothesis plainly makes the idea the subject, not its author.",
                  acceptedAnswers: ["hypothesis", "stating the hypothesis", "the assumption"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يجعل مراجعة القرار مفيدة؟",
                  promptEn: "Which of these make a decision review useful?",
                  explanationAr:
                    "مقارنة النتيجة بالمؤشّر المحدّد سلفًا وقبول النتيجة المخالفة أساس المراجعة.",
                  explanationEn:
                    "Comparing the outcome with the pre-set indicator, and accepting an unfavourable result, are the basis of review.",
                  options: [
                    {
                      textAr: "مقارنة النتيجة بالمؤشّر المحدّد سلفًا",
                      textEn: "Comparing the outcome with the pre-set indicator",
                      isCorrect: true,
                    },
                    {
                      textAr: "قبول النتيجة حتى إن خالفت التوقّع",
                      textEn: "Accepting the result even when it defies expectation",
                      isCorrect: true,
                    },
                    {
                      textAr: "تجاهل النتيجة إن كانت سلبية",
                      textEn: "Ignoring a negative result",
                      isCorrect: false,
                    },
                    {
                      textAr: "الاكتفاء بالرأي الجماعي",
                      textEn: "Relying on group opinion alone",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "لماذا نكتب الرفض بدل أن نكتفي بقوله؟",
                  promptEn: "Why write a refusal instead of just saying it?",
                  explanationAr: "الرفض المكتوب يمنع إعادة النقاش نفسه بعد أشهر.",
                  explanationEn:
                    "A written refusal prevents the same debate returning months later.",
                  options: [
                    {
                      textAr: "لمنع إعادة النقاش نفسه لاحقًا",
                      textEn: "To prevent the same debate returning later",
                      isCorrect: true,
                    },
                    {
                      textAr: "لإثبات أننا على حقّ",
                      textEn: "To prove we were right",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأن الكتابة شرط قانوني",
                      textEn: "Because writing is a legal requirement",
                      isCorrect: false,
                    },
                    {
                      textAr: "لتقليل عدد الوثائق",
                      textEn: "To reduce the number of documents",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "roadmap-planning-and-prioritisation",
    instructorUsername: "maryam-alotaibi",
    categorySlug: "business",
    titleAr: "تخطيط خارطة الطريق وترتيب الأولويات",
    titleEn: "Roadmap Planning and Prioritisation",
    subtitleAr: "خطّة تفصل بين ما نلتزم به وما نستكشفه، وتحتفظ بحقّها في التغيير",
    subtitleEn: "A plan that separates commitment from exploration and keeps its right to change",
    descriptionAr:
      "معظم خرائط الطريق تفشل لسبب واحد: تُكتب كوعود بتواريخ تعجز الفرق عن الوفاء بها. نبني خارطة تفصل بوضوح بين ما التزمنا به وما نستكشفه، فتحمي العلاقة مع الأطراف الأخرى وتحفظ مرونة الفريق.\n\nنتدرّب على ثلاث أدوات عمل: تقدير الجهد بما نعرفه لا بما نتمنّاه، وربط كل بند بهدف قابل للقياس، وخطة استجابة حين يتغيّر أحد الافتراضات الأساسية. نختتم بجلسة مراجعة شهرية تستغرق نصف ساعة وتعطي قرارًا، لا تقريرًا يقرأه أحد مرة واحدة.",
    descriptionEn:
      "Most roadmaps fail for one reason: they are written as promises with dates teams cannot keep. We build a roadmap that clearly separates what we committed to from what we are exploring, protecting the relationship with other parties while keeping the team's flexibility.\n\nWe practise three working tools: estimating effort from what we know rather than what we hope, tying every item to a measurable goal, and a response plan for when a core assumption changes. We close with a half-hour monthly review that produces a decision rather than a report someone reads once.",
    level: "INTERMEDIATE",
    language: "AR",
    priceCents: 22900,
    objectives: [
      {
        textAr: "تفصل في الخارطة بين الالتزام والاستكشاف بوضوح.",
        textEn: "Separate commitment from exploration clearly on the roadmap.",
      },
      {
        textAr: "تربط كل بند بهدف قابل للقياس لا بمجرد رغبة.",
        textEn: "Tie every item to a measurable goal rather than a wish.",
      },
      {
        textAr: "تقدّر الجهد بما تعرفه من بيانات لا بالتفاؤل.",
        textEn: "Estimate effort from known data rather than optimism.",
      },
      {
        textAr: "تكتب خطة استجابة لتغيّر افتراض أساسي.",
        textEn: "Write a response plan for a changed core assumption.",
      },
      {
        textAr: "تُدير مراجعة شهرية قصيرة تُنتج قرارًا.",
        textEn: "Run a short monthly review that produces a decision.",
      },
      {
        textAr: "تشرح للفرق الأخرى ما لم نلتزم به دون أن تبدو متهرّبًا.",
        textEn: "Explain to other teams what we have not committed to without seeming evasive.",
      },
    ],
    requirements: [
      {
        textAr: "معرفة أساسية بأدوات إدارة المطالب.",
        textEn: "Basic familiarity with a backlog tool.",
      },
      {
        textAr: "خبرة العمل في فريق يخطّط لدورة تطوير واحدة على الأقل.",
        textEn: "Experience in a team planning at least one development cycle.",
      },
      {
        textAr: "إلمام بمفاهيم الأهداف القابلة للقياس.",
        textEn: "Familiarity with measurable goal concepts.",
      },
    ],
    sections: [
      {
        titleAr: "الفصل بين الالتزام والاستكشاف",
        titleEn: "Separating Commitment From Exploration",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا تتلف خرائط الطريق بالتواريخ",
            titleEn: "Why dates wreck roadmaps",
            isPreview: true,
            durationSec: 480,
          },
          {
            type: "VIDEO",
            titleAr: "ما نلتزم به وما نستكشفه",
            titleEn: "What we commit to and what we explore",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "ربط البند بهدف قابل للقياس",
            titleEn: "Tying an item to a measurable goal",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "التواصل مع الفرق الأخرى دون وعود زائفة",
            titleEn: "Communicating with other teams without false promises",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: الالتزام لغة يجب استخدامها بدقة",
            titleEn: "Reading: commitment is a language to use precisely",
            durationSec: 300,
            contentAr:
              "<p>كلمة «سنفعل» في اجتماع تعني أشياء مختلفة لكل من يسمعها. للمبيعات تعني موعدًا، وللهندسة تعني نيّة. الفرق بين النيّتين يتحوّل إلى أزمة ثقة بعد شهرين.</p><h3>ثلاث عبارات متمايزة</h3><ul><li>«نلتزم بهذا في هذه الدورة» وما يترتّب عليه من تأجيل غيره.</li><li>«نستكشف هذا الآن» مع بيان ما سنتعلمه.</li><li>«لا نعمل عليه ولن نعمل قريبًا» مع سبب واضح.</li></ul><p>استخدم العبارة الصحيحة حتى لو كانت أقل إرضاءً؛ الوضوح المبكر أرخص من إصلاح توقّع خاطئ لاحقًا.</p>",
            contentEn:
              "<p>The word «we will» in a meeting means different things to everyone nearby. To sales it means a date; to engineering it means an intention. The gap between the two becomes a trust crisis two months later.</p><h3>Three distinct phrases</h3><ul><li>«We commit to this in this cycle», with the consequence of what it delays.</li><li>«We are exploring this now», stating what we will learn.</li><li>«We are not working on it and will not soon», with a clear reason.</li></ul><p>Use the accurate phrase even when it is less pleasing; early clarity is cheaper than repairing a wrong expectation later.</p>",
          },
        ],
      },
      {
        titleAr: "التقدير والمراجعة",
        titleEn: "Estimation and Review",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "التقدير من بيانات سابقة لا من حماس",
            titleEn: "Estimating from past data rather than enthusiasm",
            isPreview: true,
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "الشكّ في التقدير: كيف نتعامل معه",
            titleEn: "Handling uncertainty in estimates",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "خطة الاستجابة لتغيّر افتراض",
            titleEn: "A response plan for a changed assumption",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: العدد الذي نضربه في كل تقدير",
            titleEn: "Reading: the multiplier behind every estimate",
            durationSec: 360,
            contentAr:
              "<p>كل تقدير عمل جيد يعرف الفارق بين العمل نفسه وانتظار مراجعة، وتوضّح متطلّبات، وإصلاح عطل عاجل. هذا ليس تفاؤلًا ناقصًا؛ هو جزء من العمل نفسه ويجب أن يُذكر.</p><h3>كيف نُظهره بدل أن نخفيه</h3><ul><li>اقسم التقدير إلى عمل مباشر وعمل انتظار.</li><li>اذكر الوقود المُعطِّل: هل نعتمد على فريق آخر؟</li><li>راجع التقدير السابق وقارنه بالزمن الحقيقي.</li></ul><p>الفارق بين التقدير والواقع هو بياناتك الأفضل للدورة القادمة، فأبقِه في مكان تجده فيه.</p>",
            contentEn:
              "<p>Every good work estimate knows the difference between the work itself and waiting for a review, clarifying requirements, and fixing an urgent defect. That is not missing optimism; it is part of the work and must be stated.</p><h3>How to surface it instead of hiding it</h3><ul><li>Split the estimate into direct work and waiting work.</li><li>Name the blocking dependency: are we waiting on another team?</li><li>Review the last estimate against actual time.</li></ul><p>The gap between estimate and reality is your best data for the next cycle, so keep it where you can find it.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الفصل والتقدير",
            titleEn: "Quiz: separation and estimation",
            quiz: {
              titleAr: "اختبار: الفصل والتقدير",
              titleEn: "Quiz: separation and estimation",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 900,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما الذي يمنع خارطة الطريق من التحوّل إلى وعود كاذبة؟",
                  promptEn: "What keeps a roadmap from becoming false promises?",
                  explanationAr:
                    "الفصل بين الالتزام والاستكشاف يوضّح ما هو مضمون وما هو قيد الدراسة.",
                  explanationEn:
                    "Separating commitment from exploration clarifies what is certain and what is under study.",
                  options: [
                    {
                      textAr: "الفصل الواضح بين الالتزام والاستكشاف",
                      textEn: "Clearly separating commitment from exploration",
                      isCorrect: true,
                    },
                    {
                      textAr: "إضافة تواريخ دقيقة لكل بند",
                      textEn: "Adding precise dates to every item",
                      isCorrect: false,
                    },
                    {
                      textAr: "إخفاء البنود غير المؤكّدة",
                      textEn: "Hiding uncertain items",
                      isCorrect: false,
                    },
                    { textAr: "زيادة عدد البنود", textEn: "Adding more items", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "قول «لا نعمل على هذا» بوضوح مقبول إن ذكرنا السبب.",
                  promptEn:
                    "Saying clearly «we are not working on this» is acceptable when the reason is given.",
                  explanationAr: "الوضوح المبكر أرخص من إصلاح توقّع خاطئ لاحقًا.",
                  explanationEn:
                    "Early clarity is cheaper than repairing a wrong expectation later.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما نوع العمل الذي يجب ذكره في التقدير غير العمل المباشر؟",
                  promptEn: "What kind of work besides direct work must appear in an estimate?",
                  explanationAr: "عمل الانتظار والاعتماد على فريق آخر جزء من التقدير الحقيقي.",
                  explanationEn:
                    "Waiting work and dependencies on another team are part of an honest estimate.",
                  acceptedAnswers: [
                    "waiting work",
                    "waiting",
                    "dependency waiting",
                    "blocked time",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يجعل التقدير أدقّ في الدورة القادمة؟",
                  promptEn: "Which of these make the next cycle's estimate more accurate?",
                  explanationAr: "مقارنة التقدير بالواقع وقسم العمل يدرّبان الفريق على التقدير.",
                  explanationEn:
                    "Comparing estimate with reality and splitting the work train the team to estimate.",
                  options: [
                    {
                      textAr: "مقارنة التقدير السابق بالزمن الحقيقي",
                      textEn: "Comparing the last estimate with actual time",
                      isCorrect: true,
                    },
                    {
                      textAr: "قسم التقدير إلى عمل مباشر وانتظار",
                      textEn: "Splitting into direct work and waiting",
                      isCorrect: true,
                    },
                    {
                      textAr: "تجاهل الأعطال العاجلة",
                      textEn: "Ignoring urgent defects",
                      isCorrect: false,
                    },
                    {
                      textAr: "الاعتماد على التمنّي",
                      textEn: "Relying on wishful thinking",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "كيف يرتبط كل بند في الخارطة؟",
                  promptEn: "How should each roadmap item be linked?",
                  explanationAr: "ربط البند بهدف قابل للقياس يجعله قابلًا للحكم عليه.",
                  explanationEn: "Linking an item to a measurable goal makes it judgeable.",
                  options: [
                    { textAr: "بهدف قابل للقياس", textEn: "To a measurable goal", isCorrect: true },
                    { textAr: "برقم عشوائي", textEn: "To a random number", isCorrect: false },
                    {
                      textAr: "باسم من طلبه",
                      textEn: "To the name of the requester",
                      isCorrect: false,
                    },
                    { textAr: "بلا ارتباط", textEn: "To nothing", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "المراجعة والاستجابة",
        titleEn: "Review and Response",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "مراجعة شهرية في نصف ساعة",
            titleEn: "A monthly review in half an hour",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "ماذا نفعل حين يتغيّر افتراض أساسي",
            titleEn: "What to do when a core assumption changes",
            durationSec: 660,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: الاجتماع الذي ينتهي بقرار",
            titleEn: "Reading: the meeting that ends in a decision",
            durationSec: 300,
            contentAr:
              "<p>معظم اجتماعات المراجعة تنتهي بشعور عام بالاطّلاع بلا قرار. السبب أن الجدول يعرض الأعمال لا الأسئلة. الاجتماع الجيد يبدأ من سؤال واحد: ما الذي تغيّر عمّا توقّعناه؟</p><h3>جدول من ثلاثة أسئلة</h3><ul><li>ما الذي تغيّر عمّا توقّعناه؟</li><li>ما الذي يجب أن نقرّره بناءً على ذلك؟</li><li>من ينفّذ القرار ومتى نراجعه؟</li></ul><p>بهذا الجدول يكون الناتج قرارًا مسؤولًا عنه شخص، لا وثيقة تُقرأ مرة واحدة وتُنسى.</p>",
            contentEn:
              "<p>Most review meetings end with a general sense of being informed and no decision. The reason is that the agenda presents work rather than questions. A good meeting starts from one question: what changed from what we expected?</p><h3>A three-question agenda</h3><ul><li>What changed from what we expected?</li><li>What must we decide because of it?</li><li>Who executes the decision and when do we review it?</li></ul><p>With this agenda the output is a decision someone owns, not a document read once and forgotten.</p>",
          },
          {
            type: "FILE",
            titleAr: "قالب مراجعة خارطة الطريق",
            titleEn: "Roadmap review template",
            durationSec: 300,
            attachmentAr: "قالب مراجعة خارطة الطريق",
            attachmentEn: "Roadmap review template",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: المراجعة والاستجابة",
            titleEn: "Quiz: review and response",
            quiz: {
              titleAr: "اختبار: المراجعة والاستجابة",
              titleEn: "Quiz: review and response",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "بأي سؤال تبدأ مراجعة فعّالة؟",
                  promptEn: "Which question starts an effective review?",
                  explanationAr: "السؤال عن التغيّر يوجّه الاجتماع إلى القرار لا العرض.",
                  explanationEn:
                    "Asking what changed steers the meeting toward a decision rather than a briefing.",
                  options: [
                    {
                      textAr: "ما الذي تغيّر عمّا توقّعناه؟",
                      textEn: "What changed from what we expected?",
                      isCorrect: true,
                    },
                    {
                      textAr: "من أنجز أكثر مهامّ؟",
                      textEn: "Who completed the most tasks?",
                      isCorrect: false,
                    },
                    {
                      textAr: "كم بندًا أنجزنا؟",
                      textEn: "How many items did we finish?",
                      isCorrect: false,
                    },
                    { textAr: "هل الجميع بخير؟", textEn: "Is everyone fine?", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "الاجتماع الجيد ينتهي بقرار مسؤول عنه شخص محدّد.",
                  promptEn: "A good meeting ends with a decision someone owns.",
                  explanationAr: "القرار بلا مالك يُنسى، والماء لا يجري.",
                  explanationEn: "A decision with no owner is forgotten, and nothing moves.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الذي يجب أن نكتبه في خطة الاستجابة لتغيّر افتراض؟",
                  promptEn: "What should a response plan for a changed assumption state?",
                  explanationAr: "خطة الاستجابة تحدّد ما سنفعله عند تغيّر الافتراض الأساسي.",
                  explanationEn:
                    "A response plan defines what we will do when the core assumption changes.",
                  acceptedAnswers: ["the response", "response plan", "the action", "the plan"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يجعل جدول المراجعة عمليًا؟",
                  promptEn: "Which of these make a review agenda practical?",
                  explanationAr: "السؤال عن التغيّر والقرار والمالك يجعل الجدول ينتج نتيجة.",
                  explanationEn:
                    "Asking about change, decision, and owner makes the agenda produce an outcome.",
                  options: [
                    {
                      textAr: "سؤال عن ما تغيّر",
                      textEn: "A question about what changed",
                      isCorrect: true,
                    },
                    {
                      textAr: "سؤال عن القرار ومن يملكه",
                      textEn: "A question about the decision and its owner",
                      isCorrect: true,
                    },
                    {
                      textAr: "عرض كل المهامّ المنجزة بالتفصيل",
                      textEn: "Listing every completed task in detail",
                      isCorrect: false,
                    },
                    {
                      textAr: "قراءة التقرير بصوت عالٍ",
                      textEn: "Reading the report aloud",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "لماذا نذكر ما نرفضه في الخارطة؟",
                  promptEn: "Why name what we refuse on the roadmap?",
                  explanationAr: "الرفض الواضح يمنع توقّعات خاطئة ويحمي العلاقة مع الفرق.",
                  explanationEn:
                    "A clear refusal prevents wrong expectations and protects the relationship with teams.",
                  options: [
                    {
                      textAr: "لمنع توقّعات خاطئة وحماية العلاقة",
                      textEn: "To prevent wrong expectations and protect the relationship",
                      isCorrect: true,
                    },
                    {
                      textAr: "لتقليل عدد البنود",
                      textEn: "To reduce the number of items",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأنه يُطلب قانونيًا",
                      textEn: "Because it is legally required",
                      isCorrect: false,
                    },
                    {
                      textAr: "لإخفاء العمل الحقيقي",
                      textEn: "To hide the real work",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "running-effective-one-on-ones",
    instructorUsername: "maryam-alotaibi",
    categorySlug: "business",
    titleAr: "إدارة اللقاءات الفردية بفاعلية",
    titleEn: "Running Effective One-on-Ones",
    subtitleAr: "لقاء دوري قصير يبني الثقة ويحلّ مشكلات قبل أن تتحوّل إلى استقالة",
    subtitleEn:
      "A short recurring conversation that builds trust and catches problems before they become resignations",
    descriptionAr:
      "اللقاء الفردي أكثر الاجتماعات سوء استخدامًا في معظم الشركات: يصبح تحديث حالة، أو أسوأ، حديثًا لا يحدث إلا حين تنكسر الأمور. نعيد بناءه حول غرض واحد: فهم كيف تسير العمل فعليًا لشخص واحد، بينما المشكلة ما زالت صغيرة.\n\nنغطي الميكانيكا العملية التي تحدد نجاح الحديث: من يملك الأجندة، وكيف تصوغ سؤالًا يُخرج أكثر من «بخير»، وكيف تدوّن ملاحظات تبني عليها لاحقًا، وكيف تتعامل مع المواضيع الصعبة كمسار مهني متوقف أو خلاف مع زميل. الهدف لقاء لا تُلغيه حتى في أسبوع مزدحم، لأنه يوفّر وقتًا بدل أن يستهلكه.",
    descriptionEn:
      "The one-on-one is the most misused meeting in most companies. It becomes a status update, or worse, a chat that happens only when something breaks. We rebuild it around one purpose: understanding how work is really going for one person, while the problem is still small.\n\nWe cover the practical mechanics that decide whether the conversation works: who owns the agenda, how to ask questions that get more than «fine», how to take notes you can build on later, and how to handle the hard topics like a stalled career or a conflict with a teammate. The aim is a meeting you would not cancel even in a busy week, because it saves time rather than spending it.",
    level: "ALL_LEVELS",
    language: "EN",
    priceCents: 13900,
    objectives: [
      {
        textAr: "تحدّد غرضًا واحدًا للقاء وتصوغ أجندة يديرها الطرف الآخر.",
        textEn:
          "Define a single purpose for the meeting and shape an agenda the other person drives.",
      },
      {
        textAr: "تصوغ أسئلة تُخرج أكثر من إجابة سطحية.",
        textEn: "Phrase questions that draw more than a surface answer.",
      },
      {
        textAr: "تدوّن ملاحظات تبني عليها في اللقاء التالي.",
        textEn: "Take notes you can build on in the next meeting.",
      },
      {
        textAr: "تعالج موضوعًا صعبًا كتوقّف التقدّم الوظيفي دون توتير.",
        textEn: "Handle a hard topic like a stalled career without creating tension.",
      },
      {
        textAr: "تتابع الالتزامات المتفق عليها في لقاءات لاحقة.",
        textEn: "Follow up agreed commitments in later meetings.",
      },
      {
        textAr: "تقيس فاعلية اللقاء بأثره لا بالانطباع.",
        textEn: "Measure the meeting's value by its effect rather than the impression.",
      },
    ],
    requirements: [
      {
        textAr: "مسؤولية إدارة شخص واحد أو أكثر.",
        textEn: "Responsibility for managing one or more people.",
      },
      {
        textAr: "استعداد لتخصيص وقت ثابت دوريًا.",
        textEn: "Willingness to set aside fixed recurring time.",
      },
      {
        textAr: "مستوى إنجليزية يتيح حوارًا مهنيًا.",
        textEn: "English sufficient for a professional conversation.",
      },
    ],
    sections: [
      {
        titleAr: "Purpose and Agenda",
        titleEn: "Purpose and Agenda",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "Why status updates kill the one-on-one",
            titleEn: "Why status updates kill the one-on-one",
            isPreview: true,
            durationSec: 420,
          },
          {
            type: "VIDEO",
            titleAr: "One purpose: how work is really going",
            titleEn: "One purpose: how work is really going",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "Who owns the agenda",
            titleEn: "Who owns the agenda",
            durationSec: 480,
          },
          {
            type: "VIDEO",
            titleAr: "A rhythm you will not cancel",
            titleEn: "A rhythm you will not cancel",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "Reading: questions that get more than «fine»",
            titleEn: "Reading: questions that get more than «fine»",
            durationSec: 300,
            contentAr:
              "<p>«How is it going?» invites «fine» and nothing else. The question is too broad to answer, so the honest answer costs more effort than a polite one. Ask something a person can answer in a sentence.</p><h3>Questions that open a real answer</h3><ul><li>What part of your week did you find hardest, and why?</li><li>What did you expect to be easier than it turned out?</li><li>If you could change one thing about how we work, what would it be?</li></ul><p>Notice these ask about a specific moment rather than a whole mood. A specific question respects the other person's effort and usually gets an honest answer.</p>",
            contentEn:
              "<p>«How is it going?» invites «fine» and nothing else. The question is too broad to answer, so the honest answer costs more effort than a polite one. Ask something a person can answer in a sentence.</p><h3>Questions that open a real answer</h3><ul><li>What part of your week did you find hardest, and why?</li><li>What did you expect to be easier than it turned out?</li><li>If you could change one thing about how we work, what would it be?</li></ul><p>Notice these ask about a specific moment rather than a whole mood. A specific question respects the other person's effort and usually gets an honest answer.</p>",
          },
        ],
      },
      {
        titleAr: "Notes and Hard Topics",
        titleEn: "Notes and Hard Topics",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "Notes you will actually reuse",
            titleEn: "Notes you will actually reuse",
            isPreview: true,
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "Following up on commitments",
            titleEn: "Following up on commitments",
            durationSec: 480,
          },
          {
            type: "VIDEO",
            titleAr: "When the topic is a stalled career",
            titleEn: "When the topic is a stalled career",
            durationSec: 660,
          },
          {
            type: "TEXT",
            titleAr: "Reading: the follow-up is the meeting",
            titleEn: "Reading: the follow-up is the meeting",
            durationSec: 360,
            contentAr:
              "<p>A one-on-one without follow-up teaches the other person that talking changes nothing. Once that lesson lands, the meetings become polite and empty, and real problems go somewhere else.</p><h3>What makes follow-up real</h3><ul><li>One or two commitments at most, each with an owner and a date.</li><li>Their item opened first in the next meeting.</li><li>A short note of what was decided, visible to them.</li></ul><p>Notice the first commitment is often yours. When the manager carries an action, the meeting stops feeling like a review and starts feeling like support.</p>",
            contentEn:
              "<p>A one-on-one without follow-up teaches the other person that talking changes nothing. Once that lesson lands, the meetings become polite and empty, and real problems go somewhere else.</p><h3>What makes follow-up real</h3><ul><li>One or two commitments at most, each with an owner and a date.</li><li>Their item opened first in the next meeting.</li><li>A short note of what was decided, visible to them.</li></ul><p>Notice the first commitment is often yours. When the manager carries an action, the meeting stops feeling like a review and starts feeling like support.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "Quiz: notes and hard topics",
            titleEn: "Quiz: notes and hard topics",
            quiz: {
              titleAr: "Quiz: notes and hard topics",
              titleEn: "Quiz: notes and hard topics",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 900,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "Why do broad questions get shallow answers?",
                  promptEn: "Why do broad questions get shallow answers?",
                  explanationAr:
                    "The question is too big to answer, so a polite short answer costs less.",
                  explanationEn:
                    "The question is too big to answer, so a polite short answer costs less.",
                  options: [
                    {
                      textAr: "They cost more effort than a polite short answer",
                      textEn: "They cost more effort than a polite short answer",
                      isCorrect: true,
                    },
                    {
                      textAr: "People do not like their manager",
                      textEn: "People do not like their manager",
                      isCorrect: false,
                    },
                    {
                      textAr: "They are grammatically wrong",
                      textEn: "They are grammatically wrong",
                      isCorrect: false,
                    },
                    {
                      textAr: "They take too long to say",
                      textEn: "They take too long to say",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "Follow-up should start with the other person's item from last time.",
                  promptEn: "Follow-up should start with the other person's item from last time.",
                  explanationAr:
                    "Opening their item first shows the conversation changes something.",
                  explanationEn:
                    "Opening their item first shows the conversation changes something.",
                  options: [
                    { textAr: "True", textEn: "True", isCorrect: true },
                    { textAr: "False", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "How many commitments should a single one-on-one usually produce?",
                  promptEn: "How many commitments should a single one-on-one usually produce?",
                  explanationAr: "One or two commitments can actually be followed up.",
                  explanationEn: "One or two commitments can actually be followed up.",
                  acceptedAnswers: ["one or two", "one to two", "two", "1-2"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "Which signs show a one-on-one has become empty?",
                  promptEn: "Which signs show a one-on-one has become empty?",
                  explanationAr:
                    "Cancelling often and hearing only good news both signal a meeting that changes nothing.",
                  explanationEn:
                    "Often cancelling and hearing only good news both signal a meeting that changes nothing.",
                  options: [
                    {
                      textAr: "It is cancelled whenever the week gets busy",
                      textEn: "It is cancelled whenever the week gets busy",
                      isCorrect: true,
                    },
                    {
                      textAr: "Only good news is ever shared",
                      textEn: "Only good news is ever shared",
                      isCorrect: true,
                    },
                    {
                      textAr: "The agenda is owned by the other person",
                      textEn: "The agenda is owned by the other person",
                      isCorrect: false,
                    },
                    {
                      textAr: "Actions are recorded and reviewed",
                      textEn: "Actions are recorded and reviewed",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "What makes a stalled-career conversation usable?",
                  promptEn: "What makes a stalled-career conversation usable?",
                  explanationAr:
                    "Naming concrete next steps with dates makes the topic actionable rather than a vague promise.",
                  explanationEn:
                    "Naming concrete next steps with dates makes the topic actionable rather than a vague promise.",
                  options: [
                    {
                      textAr: "Concrete next steps with dates",
                      textEn: "Concrete next steps with dates",
                      isCorrect: true,
                    },
                    {
                      textAr: "A promise to look into it someday",
                      textEn: "A promise to look into it someday",
                      isCorrect: false,
                    },
                    {
                      textAr: "Changing the subject",
                      textEn: "Changing the subject",
                      isCorrect: false,
                    },
                    {
                      textAr: "Comparing them to a teammate",
                      textEn: "Comparing them to a teammate",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "Measuring the Value",
        titleEn: "Measuring the Value",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "Measuring value, not attendance",
            titleEn: "Measuring value, not attendance",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "When to change the format",
            titleEn: "When to change the format",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "Reading: what a good one-on-one prevents",
            titleEn: "Reading: what a good one-on-one prevents",
            durationSec: 300,
            contentAr:
              "<p>You cannot easily measure a conversation that prevented something, which is why attendance and duration are used instead. Those measure whether the meeting happened, not whether it helped.</p><h3>Better signals</h3><ul><li>Problems surface here before they reach a project review.</li><li>The other person raises a concern once, and it is handled.</li><li>Actions from the meeting get closed.</li></ul><p>These are the outcomes a one-on-one exists to produce. If none of them ever happen, the meeting has become a ritual, and the fix is to change its purpose rather than its duration.</p>",
            contentEn:
              "<p>You cannot easily measure a conversation that prevented something, which is why attendance and duration are used instead. Those measure whether the meeting happened, not whether it helped.</p><h3>Better signals</h3><ul><li>Problems surface here before they reach a project review.</li><li>The other person raises a concern once, and it is handled.</li><li>Actions from the meeting get closed.</li></ul><p>These are the outcomes a one-on-one exists to produce. If none of them ever happen, the meeting has become a ritual, and the fix is to change its purpose rather than its duration.</p>",
          },
          {
            type: "FILE",
            titleAr: "One-on-one notes template",
            titleEn: "One-on-one notes template",
            durationSec: 300,
            attachmentAr: "قالب ملاحظات اللقاء الفردي",
            attachmentEn: "One-on-one notes template",
          },
          {
            type: "QUIZ",
            titleAr: "Quiz: measuring the value",
            titleEn: "Quiz: measuring the value",
            quiz: {
              titleAr: "Quiz: measuring the value",
              titleEn: "Quiz: measuring the value",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "Why are attendance and duration poor measures?",
                  promptEn: "Why are attendance and duration poor measures?",
                  explanationAr: "They record that the meeting happened, not whether it helped.",
                  explanationEn: "They record that the meeting happened, not whether it helped.",
                  options: [
                    {
                      textAr: "They record the meeting happened, not that it helped",
                      textEn: "They record the meeting happened, not that it helped",
                      isCorrect: true,
                    },
                    {
                      textAr: "They are hard to collect",
                      textEn: "They are hard to collect",
                      isCorrect: false,
                    },
                    {
                      textAr: "They need special software",
                      textEn: "They need special software",
                      isCorrect: false,
                    },
                    {
                      textAr: "They are confidential",
                      textEn: "They are confidential",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr:
                    "If a one-on-one produces no outcomes, the fix may be to change its purpose.",
                  promptEn:
                    "If a one-on-one produces no outcomes, the fix may be to change its purpose.",
                  explanationAr:
                    "A meeting that produces nothing has become a ritual; its purpose needs revisiting.",
                  explanationEn:
                    "A meeting that produces nothing has become a ritual; its purpose needs revisiting.",
                  options: [
                    { textAr: "True", textEn: "True", isCorrect: true },
                    { textAr: "False", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "Which signal shows problems surface here early?",
                  promptEn: "Which signal shows problems surface here early?",
                  explanationAr:
                    "Problems appearing in the one-on-one before the project review is the healthy sign.",
                  explanationEn:
                    "Problems appearing in the one-on-one before the project review is the healthy sign.",
                  acceptedAnswers: [
                    "problems surface early",
                    "early problems",
                    "surfacing early",
                    "problems before reviews",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "Which outcomes show a one-on-one is working?",
                  promptEn: "Which outcomes show a one-on-one is working?",
                  explanationAr:
                    "Handled concerns and closed actions are the real outcomes of the meeting.",
                  explanationEn:
                    "Handled concerns and closed actions are the real outcomes of the meeting.",
                  options: [
                    {
                      textAr: "A concern is raised once and handled",
                      textEn: "A concern is raised once and handled",
                      isCorrect: true,
                    },
                    {
                      textAr: "Actions from the meeting get closed",
                      textEn: "Actions from the meeting get closed",
                      isCorrect: true,
                    },
                    {
                      textAr: "The meeting always runs the full hour",
                      textEn: "The meeting always runs the full hour",
                      isCorrect: false,
                    },
                    {
                      textAr: "Only the manager speaks",
                      textEn: "Only the manager speaks",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "Who should speak most in a one-on-one?",
                  promptEn: "Who should speak most in a one-on-one?",
                  explanationAr: "The person whose work it is should do most of the talking.",
                  explanationEn: "The person whose work it is should do most of the talking.",
                  options: [
                    {
                      textAr: "The person whose work it is",
                      textEn: "The person whose work it is",
                      isCorrect: true,
                    },
                    {
                      textAr: "The manager, to share information",
                      textEn: "The manager, to share information",
                      isCorrect: false,
                    },
                    {
                      textAr: "Whoever talks fastest",
                      textEn: "Whoever talks fastest",
                      isCorrect: false,
                    },
                    {
                      textAr: "Nobody; it should be silent",
                      textEn: "Nobody; it should be silent",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "ecommerce-operations-basics",
    instructorUsername: "faisal-alduwais",
    categorySlug: "business",
    titleAr: "أساسيات تشغيل المتاجر الإلكترونية",
    titleEn: "E-commerce Operations Basics",
    subtitleAr: "من صفحة منتج إلى طلب مُسلَّم دون أخطاء في المخزون أو الشحن",
    subtitleEn: "From a product page to a delivered order without stock or shipping mistakes",
    descriptionAr:
      "المتجر الإلكتروني ليس صفحة جميلة، بل سلسلة عمليات: منتج، ومخزون، وطلب، ودفع، وشحن، وخدمة بعد البيع. نتبع طلبًا واحدًا من لحظة إضافته إلى السلة حتى وصوله، ونضع عند كل خطوة ما يمكن أن يخطئ وكيف نكتشفه مبكرًا.\n\nنعالج أيضًا ما يكلف المتاجر الصغيرة أكثر من غيره: بيانات منتجات ناقصة، ومخزون غير مطابق، وسياسة إرجاع غامضة تولّد نزاعات. نختتم بقائمة مؤشّرات قليلة يتابعها المشغّل يوميًا، لا لوحة بيانات ضخمة لا يفتحها أحد.",
    descriptionEn:
      "An online store is not a pretty page but a chain of operations: product, stock, order, payment, shipping, and after-sales service. We follow one order from the moment it is added to the cart until it arrives, and at every step note what can go wrong and how to catch it early.\n\nWe also cover what costs small stores most: incomplete product data, mismatched inventory, and a vague return policy that breeds disputes. We finish with a short list of daily indicators an operator actually checks, rather than a large dashboard nobody opens.",
    level: "BEGINNER",
    language: "AR",
    priceCents: 17900,
    objectives: [
      {
        textAr: "ترسم سلسلة تشغيل الطلب من الإضافة حتى التسليم.",
        textEn: "Map the order chain from adding to delivery.",
      },
      {
        textAr: "تضع بيانات منتج كاملة تمنع أسئلة العملاء المتكرّرة.",
        textEn: "Set complete product data that prevents repeated customer questions.",
      },
      {
        textAr: "تراجع المخزون وتقلّل الطلبات غير القابلة للتنفيذ.",
        textEn: "Review inventory and reduce unfillable orders.",
      },
      {
        textAr: "تكتب سياسة إرجاع واضحة تقلّل النزاعات.",
        textEn: "Write a clear return policy that reduces disputes.",
      },
      {
        textAr: "تتابع قائمة مؤشّرات يومية قصيرة.",
        textEn: "Track a short list of daily indicators.",
      },
      {
        textAr: "تحدّد نقطة الفشل الأكثر تكلفة أولًا.",
        textEn: "Identify the most costly failure point first.",
      },
    ],
    requirements: [
      {
        textAr: "لا حاجة إلى خبرة تقنية أو برمجية.",
        textEn: "No technical or programming experience needed.",
      },
      {
        textAr: "مصلحة في تشغيل متجر أو منتج ملموس.",
        textEn: "Interest in running a store or a concrete product.",
      },
      { textAr: "أساسيات استخدام أدوات الجداول.", textEn: "Basic spreadsheet tool usage." },
    ],
    sections: [
      {
        titleAr: "سلسلة الطلب",
        titleEn: "The Order Chain",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "المتجر كسلسلة عمليات لا كصفحة",
            titleEn: "The store as a chain of operations, not a page",
            isPreview: true,
            durationSec: 420,
          },
          {
            type: "VIDEO",
            titleAr: "من الإضافة إلى السلة حتى الدفع",
            titleEn: "From adding to cart to checkout",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "الشحن والتتبّع: ما يتوقّعه العميل",
            titleEn: "Shipping and tracking: what the customer expects",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "خدمة ما بعد البيع والاستبدال",
            titleEn: "After-sales service and exchanges",
            durationSec: 480,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: كيف ترسم سلسلة الطلب على ورقة",
            titleEn: "Reading: mapping the order chain on one page",
            durationSec: 300,
            contentAr:
              "<p>قبل شراء أي أداة، ارسم سلسلة الطلب على ورقة. الهدف ليس وثيقة رسمية، بل أن ترى بنفسك أين تنتظر البيانات وأين يمكن أن يضيع الطلب.</p><h3>ما يُرسم</h3><ul><li>كل خطوة يمرّ بها الطلب بالترتيب.</li><li>ما الذي يجب أن يكون صحيحًا قبل الانتقال للخطوة التالية.</li><li>من يعالج الخطوة إن فشلت، ومتى ننبّهه.</li></ul><p>هذا الرسم البسيط يكشف غالبًا أن أخطر نقطة ليست الشحن، بل بيانات المنتج قبل الطلب نفسه.</p>",
            contentEn:
              "<p>Before buying any tool, draw the order chain on a page. The goal is not a formal document but to see for yourself where data waits and where an order can get lost.</p><h3>What to draw</h3><ul><li>Every step an order passes, in order.</li><li>What must be correct before moving to the next step.</li><li>Who handles the step if it fails, and when we alert them.</li></ul><p>This simple drawing often reveals that the riskiest point is not shipping but product data before the order itself.</p>",
          },
        ],
      },
      {
        titleAr: "البيانات والمخزون",
        titleEn: "Data and Inventory",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "بيانات المنتج التي تمنع الأسئلة",
            titleEn: "Product data that prevents questions",
            isPreview: true,
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "المخزون: مطابقة الأرقام مع الواقع",
            titleEn: "Inventory: matching numbers with reality",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "الطلب غير القابل للتنفيذ وكيف نمنعه",
            titleEn: "Unfillable orders and how to prevent them",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: سياسة الإرجاع التي تقلّل النزاعات",
            titleEn: "Reading: the return policy that reduces disputes",
            durationSec: 360,
            contentAr:
              "<p>سياسة الإرجاع الغامضة تبدو مفيدة في المبيعات وتكلّف ضعفها في النزاعات. الوضوح المبكر يقلّل عدد الطلبات الملغاة أسوأ من فقدان عميل غاضب.</p><h3>ما يجب أن تجيب عنه السياسة</h3><ul><li>المدة بالأيام ومن يتحمّل تكلفة الإرجاع.</li><li>حالة المنتج المقبولة عند الإرجاع.</li><li>الاستثناءات المحدّدة، لا عبارة «حالات خاصة».</li></ul><p>ابدأ من أكثر نزاع تكرّر عندك، واكتب السياسة لتجيب عليه بوضوح. السياسة التي تحلّ الشكوى الأكثر شيوعًا توفّر وقتًا أكثر من أي بند آخر.</p>",
            contentEn:
              "<p>A vague return policy looks helpful at the point of sale and costs twice as much in disputes. Early clarity reduces the number of worst-case cancellations and angry customers.</p><h3>What the policy must answer</h3><ul><li>The window in days and who pays for the return.</li><li>The acceptable condition of the product on return.</li><li>Specific exceptions, not the phrase «special cases».</li></ul><p>Start from your most frequent dispute and write the policy to answer it clearly. A policy solving the commonest complaint saves more time than any other clause.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: البيانات والمخزون",
            titleEn: "Quiz: data and inventory",
            quiz: {
              titleAr: "اختبار: البيانات والمخزون",
              titleEn: "Quiz: data and inventory",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 900,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما الذي يكشفه رسم سلسلة الطلب غالبًا؟",
                  promptEn: "What does mapping the order chain often reveal?",
                  explanationAr: "أخطر نقطة كثيرًا ما تكون بيانات المنتج لا الشحن.",
                  explanationEn: "The riskiest point is often product data rather than shipping.",
                  options: [
                    {
                      textAr: "أن أخطر نقطة قد تكون بيانات المنتج",
                      textEn: "That the riskiest point may be product data",
                      isCorrect: true,
                    },
                    {
                      textAr: "أن الشحن هو الخطر الوحيد",
                      textEn: "That shipping is the only risk",
                      isCorrect: false,
                    },
                    {
                      textAr: "أن الدفع غير مهمّ",
                      textEn: "That payment does not matter",
                      isCorrect: false,
                    },
                    {
                      textAr: "أن العميل لا يقرأ شيئًا",
                      textEn: "That the customer reads nothing",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "السياسة الغامضة للإرجاع تقلّل النزاعات.",
                  promptEn: "A vague return policy reduces disputes.",
                  explanationAr: "الغموض يولّد نزاعات، والوضوح هو ما يقلّلها.",
                  explanationEn: "Vagueness breeds disputes; clarity reduces them.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما نوع الطلب الذي يحدث عندما لا يطابق المخزون الواقع؟",
                  promptEn: "What kind of order happens when inventory does not match reality?",
                  explanationAr:
                    "الطلب غير القابل للتنفيذ ينشأ من مخزون غير مطابق ويسبب إلغاء وإحراجًا.",
                  explanationEn:
                    "An unfillable order arises from mismatched inventory, causing cancellations and embarrassment.",
                  acceptedAnswers: [
                    "unfillable order",
                    "unfillable",
                    "cancelled order",
                    "oversell",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يقلّل أسئلة العملاء المتكرّرة؟",
                  promptEn: "Which of these reduce repeated customer questions?",
                  explanationAr: "المقاسات والصور الواضحة ووصف المواد تقلّل الأسئلة قبل الشراء.",
                  explanationEn:
                    "Sizes, clear images, and material descriptions cut pre-purchase questions.",
                  options: [
                    {
                      textAr: "ذكر المقاسات بوضوح",
                      textEn: "Stating sizes clearly",
                      isCorrect: true,
                    },
                    {
                      textAr: "صور حقيقية للمنتج لا صور مستعارة",
                      textEn: "Real product photos rather than stock images",
                      isCorrect: true,
                    },
                    {
                      textAr: "إخفاء تفاصيل المواد",
                      textEn: "Hiding material details",
                      isCorrect: false,
                    },
                    {
                      textAr: "ترك الوصف فارغًا",
                      textEn: "Leaving the description empty",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "من أين نبدأ كتابة سياسة الإرجاع؟",
                  promptEn: "Where does writing the return policy start?",
                  explanationAr: "البدء من أكثر نزاع تكرارًا يجعل السياسة تحلّ المشكلة الفعلية.",
                  explanationEn:
                    "Starting from the most frequent dispute makes the policy solve the real problem.",
                  options: [
                    {
                      textAr: "من أكثر نزاع تكرّر عندنا",
                      textEn: "From our most frequent dispute",
                      isCorrect: true,
                    },
                    {
                      textAr: "من سياسة منافس",
                      textEn: "From a competitor's policy",
                      isCorrect: false,
                    },
                    {
                      textAr: "من قالب جاهز عام",
                      textEn: "From a generic template",
                      isCorrect: false,
                    },
                    {
                      textAr: "من اقتراح المحاسب",
                      textEn: "From the accountant's suggestion",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "المؤشّرات والتحسين",
        titleEn: "Indicators and Improvement",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "قائمة مؤشّرات يومية قصيرة",
            titleEn: "A short daily indicator list",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "من الشكوى إلى تحسين في الأسبوع نفسه",
            titleEn: "From complaint to fix in the same week",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: المؤشّر الذي يتغيّر فعلاً هذا الأسبوع",
            titleEn: "Reading: the indicator that can actually change this week",
            durationSec: 300,
            contentAr:
              "<p>لوحة مؤشّرات ضخمة تُفتح مرة وتُنسى. الأفضل أربعة أو خمسة مؤشّرات يستطيع مشغّل واحد التأثير فيها خلال أسبوع، فيصبح المتابعة عملًا لا عرضًا.</p><h3>اختيار المؤشّرات</h3><ul><li>هل أستطيع تحسين هذا الرقم بنفسي؟</li><li>هل يتغيّر خلال أيام لا أشهر؟</li><li>هل يتّخذ أحد قرارًا إن ساء؟</li></ul><p>إن كان الجواب لا على أي سؤال، فالمؤشّر زينة. ابدأ بالقليل الذي يستجيب لك، ثم أضف غيره إن أثبت فائدته.</p>",
            contentEn:
              "<p>A large dashboard is opened once and forgotten. Four or five indicators one operator can influence within a week turn monitoring into work rather than a display.</p><h3>Choosing indicators</h3><ul><li>Can I improve this number myself?</li><li>Does it move within days rather than months?</li><li>Will someone decide differently if it worsens?</li></ul><p>If any answer is no, the indicator is decoration. Start with the few that respond to you, then add others once they prove useful.</p>",
          },
          {
            type: "FILE",
            titleAr: "قائمة مؤشّرات التشغيل اليومية",
            titleEn: "Daily operations indicator list",
            durationSec: 300,
            attachmentAr: "قائمة مؤشّرات التشغيل اليومية",
            attachmentEn: "Daily operations indicator list",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: المؤشّرات والتحسين",
            titleEn: "Quiz: indicators and improvement",
            quiz: {
              titleAr: "اختبار: المؤشّرات والتحسين",
              titleEn: "Quiz: indicators and improvement",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما شرط المؤشّر الجيد؟",
                  promptEn: "What is the condition for a good indicator?",
                  explanationAr: "المؤشّر الجيد يستطيع المشغّل التأثير فيه ويتغيّر سريعًا.",
                  explanationEn:
                    "A good indicator is one the operator can influence and that moves quickly.",
                  options: [
                    {
                      textAr: "أن أستطيع تحسينه وأن يتغيّر خلال أيام",
                      textEn: "That I can improve it and it moves within days",
                      isCorrect: true,
                    },
                    {
                      textAr: "أن يكون معقّدًا ليبهر الفريق",
                      textEn: "That it is complex enough to impress",
                      isCorrect: false,
                    },
                    {
                      textAr: "أن يتغيّر مرة سنويًا",
                      textEn: "That it changes once a year",
                      isCorrect: false,
                    },
                    {
                      textAr: "أن يقيس عدد الزيارات فقط",
                      textEn: "That it measures visits only",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "مؤشّر لا يتّخذ أحد قرارًا إن ساء هو زينة.",
                  promptEn: "An indicator nobody acts on when it worsens is decoration.",
                  explanationAr: "المؤشّر الذي لا يقود قرارًا لا قيمة تشغيلية له.",
                  explanationEn: "An indicator that drives no decision has no operational value.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما أفضل مرجع لكتابة سياسة الإرجاع؟",
                  promptEn: "What is the best reference for writing a return policy?",
                  explanationAr: "أكثر نزاع تكرارًا هو أفضل مرجع لتحسين السياسة.",
                  explanationEn:
                    "The most frequent dispute is the best reference for improving the policy.",
                  acceptedAnswers: [
                    "most frequent dispute",
                    "the commonest dispute",
                    "top dispute",
                    "commonest complaint",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يمنع الطلبات غير القابلة للتنفيذ؟",
                  promptEn: "Which of these prevent unfillable orders?",
                  explanationAr:
                    "مطابقة الأرقام دوريًا وإيقاف البيع عند النفاد يمنعان الإفراط في البيع.",
                  explanationEn:
                    "Periodic reconciliation and pausing sales at zero prevent overselling.",
                  options: [
                    {
                      textAr: "مطابقة أرقام المخزون مع الواقع دوريًا",
                      textEn: "Reconciling inventory numbers with reality periodically",
                      isCorrect: true,
                    },
                    {
                      textAr: "إيقاف البيع تلقائيًا عند نفاد الكمية",
                      textEn: "Automatically pausing sales when stock hits zero",
                      isCorrect: true,
                    },
                    {
                      textAr: "الاعتماد على ذاكرة الموظّف",
                      textEn: "Relying on the employee's memory",
                      isCorrect: false,
                    },
                    {
                      textAr: "إخفاء الكميات من الواجهة",
                      textEn: "Hiding quantities from the interface",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "لماذا نبدأ بقائمة مؤشّرات قصيرة؟",
                  promptEn: "Why start with a short indicator list?",
                  explanationAr: "القليل الذي يستجيب لك يثبت فائدته قبل إضافة غيره.",
                  explanationEn:
                    "The few that respond to you prove their value before adding more.",
                  options: [
                    {
                      textAr: "لأن القليل القابل للتأثير يثبت قيمته",
                      textEn: "Because the few you can influence prove their worth",
                      isCorrect: true,
                    },
                    {
                      textAr: "لأن الجداول الطويلة ممنوعة",
                      textEn: "Because long tables are forbidden",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأن الأرقام الكثيرة خاطئة دائمًا",
                      textEn: "Because many numbers are always wrong",
                      isCorrect: false,
                    },
                    {
                      textAr: "لتوفير مساحة الشاشة",
                      textEn: "To save screen space",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "financial-accounting-from-entries-to-statements",
    instructorUsername: "yousef-alrashidi",
    categorySlug: "finance",
    titleAr: "المحاسبة المالية: من القيد إلى القوائم",
    titleEn: "Financial Accounting: From Journal Entry to Statements",
    subtitleAr: "بناء القوائم خطوة خطوة من دفاتر حقيقية مبسّطة، لا من حفظ معادلة",
    subtitleEn:
      "Building the statements step by step from simplified real ledgers, not by memorising an equation",
    descriptionAr:
      "نبدأ من دفاتر شركة صغيرة مبسّطة وحقيقية الشكل: فواتير بيع وشراء، ومصروفات، ورواتب، ومخزون أول وآخر الفترة. نسجّل القيود ونرى كيف ينتقل كل قيد إلى ميزان المراجعة، ثم إلى قائمة الدخل والميزانية. الهدف أن تفهم لماذا يتوازن الميزان لا أن تحفظ أن التوازن شرط.\n\nنتناول بعد ذلك التسويات التي يغفلها المبتدئون: المصروف المستحق، والإيراد غير المحصّل، والإهلاك، والمخزون في نهاية الفترة. في النهاية تُعدّ قوائم كاملة من نفس الدفاتر وتخضع لميزان مراجعة متوازن، مع ملاحظات تفسّر كل رقم اختلف عن الجواب المتوقّع.",
    descriptionEn:
      "We start from a simplified but realistically shaped ledger for a small company: sales and purchase invoices, expenses, payroll, and opening and closing inventory. We record the entries and watch each one travel to the trial balance, then to the income statement and the balance sheet. The goal is to understand why the balance balances, not to memorise that it must.\n\nWe then cover the adjustments beginners miss: accrued expenses, uncollected revenue, depreciation, and closing inventory. By the end you produce complete statements from the same ledger that pass a balanced trial balance, with notes explaining every figure that differed from the expected answer.",
    level: "BEGINNER",
    language: "AR",
    priceCents: 24900,
    objectives: [
      {
        textAr: "تسجّل القيود المحاسبية الأساسية من مستندات حقيقية الشكل.",
        textEn: "Record basic journal entries from realistically shaped documents.",
      },
      {
        textAr: "تنقل القيود إلى ميزان مراجعة وتكتشف عدم التوازن.",
        textEn: "Carry entries to a trial balance and detect an imbalance.",
      },
      {
        textAr: "تُعدّ قائمة الدخل والميزانية من نفس الدفاتر.",
        textEn: "Produce the income statement and balance sheet from the same ledger.",
      },
      {
        textAr: "تضيف تسويات الفترة: الاستحقاق والإهلاك والمخزون.",
        textEn: "Add period adjustments: accruals, depreciation, and inventory.",
      },
      {
        textAr: "تفسّر الفرق بين الربح والتدفق النقدي.",
        textEn: "Explain the difference between profit and cash flow.",
      },
      {
        textAr: "تشرح لكل رقم مصدره بدل الاعتماد على قالب جاهز.",
        textEn: "Explain each figure's source instead of relying on a ready template.",
      },
    ],
    requirements: [
      {
        textAr: "لا حاجة إلى خبرة محاسبية سابقة.",
        textEn: "No prior accounting experience needed.",
      },
      { textAr: "أساسيات استخدام جداول البيانات.", textEn: "Basic spreadsheet usage." },
      {
        textAr: "قدرة على قراءة أرقام ومقارنتها بدقة.",
        textEn: "Ability to read and compare numbers carefully.",
      },
    ],
    sections: [
      {
        titleAr: "القيود وميزان المراجعة",
        titleEn: "Entries and the Trial Balance",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا القيد المزدوج يفسّر كل شيء بعده",
            titleEn: "Why double entry explains everything after it",
            isPreview: true,
            durationSec: 480,
          },
          {
            type: "VIDEO",
            titleAr: "الدائن والمدين في حالات عملية",
            titleEn: "Debit and credit in practical cases",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "من الفاتورة إلى القيد",
            titleEn: "From invoice to entry",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "ميزان المراجعة وكشف الخلل",
            titleEn: "The trial balance and finding a break",
            durationSec: 660,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: التوازن شرط لا هدف",
            titleEn: "Reading: balance is a condition, not a goal",
            durationSec: 360,
            contentAr:
              "<p>ميزان مراجعة متوازن لا يعني أن دفاترك صحيحة. تعني فقط أن مجموع المدين يساوي مجموع الدائن، وهو أمر يتحقّق حتى لو سجّلت مصروفًا في الحساب الخطأ مادامت الأرقام متساوية.</p><h3>أخطاء لا يكشفها التوازن</h3><ul><li>تسجيل المصروف في حساب أصل بالخطأ.</li><li>تبديل المدين بالدائن في حسابين في نفس القيد.</li><li>إغفال قيد بالكامل عند إدخال كل الأرقام مرتين متساويتين.</li></ul><p>لهذا نراجع الحسابات لا الميزان وحده: التوازن خطوة أولى، والصحة تأتي من مطابقة كل حساب لمستنداته.</p>",
            contentEn:
              "<p>A balanced trial balance does not mean your books are correct. It only means total debits equal total credits, which holds even if you posted an expense to the wrong account, as long as the amounts match.</p><h3>Errors the balance will not catch</h3><ul><li>Recording an expense in an asset account by mistake.</li><li>Swapping debit and credit across two accounts in one entry.</li><li>Omitting an entry entirely while entering all amounts twice.</li></ul><p>So we review the accounts, not the balance alone: the balance is step one, and correctness comes from reconciling each account to its documents.</p>",
          },
        ],
      },
      {
        titleAr: "القوائم والتسويات",
        titleEn: "Statements and Adjustments",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "قائمة الدخل من أرصدة الحسابات",
            titleEn: "The income statement from account balances",
            isPreview: true,
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "الميزانية وتصنيف الأصول والخصوم",
            titleEn: "The balance sheet and classifying assets and liabilities",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "الإهلاك والمصروف المستحق",
            titleEn: "Depreciation and accrued expenses",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: لماذا الربح لا يعني وجود نقد",
            titleEn: "Reading: why profit does not mean cash",
            durationSec: 360,
            contentAr:
              "<p>شركة تبيع بالأجل وتسجّل ربحًا قد تكون بلا نقد لتدفع رواتبها. الربح يقيس الفرق بين الإيراد والمصروف في الفترة، أما النقد فيقيس ما دخل الحساب فعلًا.</p><h3>ثلاثة أسباب للتفرّق</h3><ul><li>مبيعات بالأجل لم تُحصَّل بعد.</li><li>مشتريات مخزون كبيرة لم تُبع في الفترة.</li><li>مصروفات إهلاك لا تستهلك نقدًا في الفترة.</li></ul><p>حين تشرح هذا الفرق لصاحب عمل صغير، تتغيّر أسئلته من «كم ربحنا؟» إلى «متى يدخل النقد؟»، وهذا هو السؤال الذي ينقذ الشركة فعلًا.</p>",
            contentEn:
              "<p>A company that sells on credit and records a profit can still run out of cash to pay wages. Profit measures the gap between revenue and expense in a period; cash measures what actually entered the account.</p><h3>Three reasons they diverge</h3><ul><li>Credit sales not yet collected.</li><li>Large inventory purchases not yet sold in the period.</li><li>Depreciation expense that consumes no cash this period.</li></ul><p>When you explain this gap to a small business owner, their questions move from «how much did we earn?» to «when does the cash arrive?» — the question that actually saves the company.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: القيود والقوائم",
            titleEn: "Quiz: entries and statements",
            quiz: {
              titleAr: "اختبار: القيود والقوائم",
              titleEn: "Quiz: entries and statements",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 1200,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ماذا يعني ميزان مراجعة متوازن؟",
                  promptEn: "What does a balanced trial balance mean?",
                  explanationAr: "يعني تساوي المدين والدائن، لا صحّة الحسابات بالضرورة.",
                  explanationEn:
                    "It means debits equal credits, not necessarily that the books are correct.",
                  options: [
                    {
                      textAr: "أن مجموع المدين يساوي مجموع الدائن",
                      textEn: "That total debits equal total credits",
                      isCorrect: true,
                    },
                    {
                      textAr: "أن كل قيد صحيح تمامًا",
                      textEn: "That every entry is perfectly correct",
                      isCorrect: false,
                    },
                    {
                      textAr: "أن الشركة رابحة",
                      textEn: "That the company is profitable",
                      isCorrect: false,
                    },
                    {
                      textAr: "أن النقد متوفّر في الحساب",
                      textEn: "That cash is available in the account",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "الربح المحقّق يعني دائمًا وجود نقد كافٍ للالتزامات.",
                  promptEn: "Recorded profit always means enough cash for obligations.",
                  explanationAr: "المبيعات بالأجل والمخزون قد تُظهر ربحًا دون نقد متوفّر.",
                  explanationEn:
                    "Credit sales and inventory can show profit without available cash.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما اسم المصروف الذي يوزّع تكلفة أصل على فترات؟",
                  promptEn: "What is the expense that spreads an asset's cost over periods?",
                  explanationAr: "الإهلاك يوزّع تكلفة الأصل على عمره الإنتاجي.",
                  explanationEn: "Depreciation spreads an asset's cost over its useful life.",
                  acceptedAnswers: ["depreciation", "إهلاك", "the depreciation"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يلي يمكن أن يسبّب خلافًا بين الربح والنقد؟",
                  promptEn: "Which of these can cause a gap between profit and cash?",
                  explanationAr: "المبيعات بالأجل والإهلاك يفصلان الربح عن حركة النقد.",
                  explanationEn:
                    "Credit sales and depreciation separate profit from cash movement.",
                  options: [
                    {
                      textAr: "مبيعات بالأجل لم تُحصَّل",
                      textEn: "Credit sales not yet collected",
                      isCorrect: true,
                    },
                    {
                      textAr: "مصروف إهلاك لا يستهلك نقدًا",
                      textEn: "Depreciation expense consuming no cash",
                      isCorrect: true,
                    },
                    {
                      textAr: "تحصيل نقدي من عميل",
                      textEn: "A cash collection from a customer",
                      isCorrect: false,
                    },
                    {
                      textAr: "وديعة بنكية في نهاية الفترة",
                      textEn: "A bank deposit at period end",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "لماذا نراجع الحسابات لا الميزان وحده؟",
                  promptEn: "Why review the accounts rather than the balance alone?",
                  explanationAr:
                    "التوازن يتحقّق حتى مع أخطاء التصنيف، فالمطابقة مع المستندات هي الحكم.",
                  explanationEn:
                    "The balance holds even with classification errors, so reconciling to documents is the real test.",
                  options: [
                    {
                      textAr: "لأن أخطاء التصنيف لا تكشفها الميزانية",
                      textEn: "Because classification errors are invisible in the balance",
                      isCorrect: true,
                    },
                    {
                      textAr: "لأن الميزانية غير قانونية",
                      textEn: "Because the balance is not legal",
                      isCorrect: false,
                    },
                    { textAr: "لأنها أسرع", textEn: "Because it is faster", isCorrect: false },
                    {
                      textAr: "لأن الحسابات لا تُقرأ",
                      textEn: "Because accounts are unreadable",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "الإقفال والمراجعة",
        titleEn: "Closing and Reviewing",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "إقفال الفترة والرصيد الافتتاحي",
            titleEn: "Closing the period and the opening balance",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "مراجعة الأرصدة قبل التسليم",
            titleEn: "Reviewing balances before handover",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: خمس دقائق توفّر أسبوعًا",
            titleEn: "Reading: five minutes that save a week",
            durationSec: 300,
            contentAr:
              "<p>قبل إقفال الفترة، نفّذ مراجعة سريعة على ثلاثة بنود فقط: النقد في البنك، وأرصدة العملاء، والمخزون. أكثر الأخطاء المكلفة تظهر في واحد منها.</p><h3>ثلاث مطابقات</h3><ul><li>طابق رصيد البنك مع كشف الحساب.</li><li>راجع أرصدة العملاء مقابل الفواتير غير المسدّدة.</li><li>طابق قيمة المخزون مع الجرد الفعلي.</li></ul><p>هذه المطابقات تكشف خطأً قبل أن ينتقل إلى القوائم ويصبح تصحيحه متأخرًا ومربكًا، وكلما كانت المطابقة أسرع كان التصحيح أرخص.</p>",
            contentEn:
              "<p>Before closing the period, run a quick review of three items only: cash at bank, customer balances, and inventory. The costliest errors appear in one of them.</p><h3>Three reconciliations</h3><ul><li>Reconcile the bank balance with the statement.</li><li>Check customer balances against unpaid invoices.</li><li>Match inventory value with the physical count.</li></ul><p>These reconciliations catch an error before it travels into the statements and becomes late and messy to fix.</p>",
          },
          {
            type: "FILE",
            titleAr: "ورقة مطابقة أرصدة إقفال الفترة",
            titleEn: "Period-close balance reconciliation sheet",
            durationSec: 300,
            attachmentAr: "ورقة مطابقة أرصدة إقفال الفترة",
            attachmentEn: "Period-close balance reconciliation sheet",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الإقفال والمراجعة",
            titleEn: "Quiz: closing and reviewing",
            quiz: {
              titleAr: "اختبار: الإقفال والمراجعة",
              titleEn: "Quiz: closing and reviewing",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "أي بند من الثلاثة يُراجع أولًا قبل الإقفال؟",
                  promptEn: "Which of the three items is reviewed before closing?",
                  explanationAr:
                    "النقد في البنك والعملاء والمخزون هي البنود التي تظهر فيها أكثر الأخطاء.",
                  explanationEn:
                    "Cash at bank, customers, and inventory are where most errors appear.",
                  options: [
                    {
                      textAr: "النقد في البنك والعملاء والمخزون",
                      textEn: "Cash at bank, customers, and inventory",
                      isCorrect: true,
                    },
                    {
                      textAr: "عدد الموظّفين",
                      textEn: "The number of employees",
                      isCorrect: false,
                    },
                    { textAr: "أسعار الصرف فقط", textEn: "Exchange rates only", isCorrect: false },
                    {
                      textAr: "اسم المورد الرئيسي",
                      textEn: "The main supplier's name",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "مطابقة المخزون مع الجرد الفعلي يمكن أن تكشف خطأً قبل القوائم.",
                  promptEn:
                    "Matching inventory with a physical count can catch an error before the statements.",
                  explanationAr: "المطابقة تكشف الفرق مبكرًا فيسهل إصلاحه.",
                  explanationEn:
                    "Reconciliation catches the difference early, making it easier to fix.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الرصيد الذي يحمل أرصدة الفترة السابقة إلى الفترة الجديدة؟",
                  promptEn: "Which balance carries prior-period balances into the new period?",
                  explanationAr: "الرصيد الافتتاحي ينقل الأرصدة إلى الفترة الجديدة.",
                  explanationEn: "The opening balance carries balances into the new period.",
                  acceptedAnswers: [
                    "opening balance",
                    "opening",
                    "الرصيد الافتتاحي",
                    "beginning balance",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يخصّ مراجعة ما قبل الإقفال؟",
                  promptEn: "Which of these belong to a pre-close review?",
                  explanationAr: "مطابقة البنك وأرصدة العملاء بنود مباشرة في مراجعة الإقفال.",
                  explanationEn:
                    "Bank and customer reconciliations are direct items in a close review.",
                  options: [
                    {
                      textAr: "مطابقة رصيد البنك مع كشف الحساب",
                      textEn: "Reconciling the bank balance with the statement",
                      isCorrect: true,
                    },
                    {
                      textAr: "مراجعة أرصدة العملاء غير المسدّدة",
                      textEn: "Reviewing unpaid customer balances",
                      isCorrect: true,
                    },
                    {
                      textAr: "تغيير شعار الشركة",
                      textEn: "Changing the company logo",
                      isCorrect: false,
                    },
                    {
                      textAr: "إعادة تصميم الفاتورة",
                      textEn: "Redesigning the invoice",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "لماذا تصبح الأخطاء مربكة إن وصلت للقوائم؟",
                  promptEn: "Why do errors become messy once they reach the statements?",
                  explanationAr: "تصحيحها متأخر يتطلّب تعديل فترات وأرصدة سابقة.",
                  explanationEn: "Fixing them late requires adjusting prior periods and balances.",
                  options: [
                    {
                      textAr: "لأن تصحيحها يتطلّب تعديل فترات سابقة",
                      textEn: "Because fixing them requires adjusting prior periods",
                      isCorrect: true,
                    },
                    {
                      textAr: "لأن القوائم لا تُقرأ",
                      textEn: "Because statements are not read",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأنها تصبح سرّية",
                      textEn: "Because they become confidential",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأن الأرقام تختفي",
                      textEn: "Because the numbers vanish",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "ifrs-for-small-businesses",
    instructorUsername: "yousef-alrashidi",
    categorySlug: "finance",
    titleAr: "معايير التقارير المالية للشركات الصغيرة",
    titleEn: "Financial Reporting Standards for Small Businesses",
    subtitleAr: "تطبيق المعايير على دفاتر صغيرة دون تعقيد لا يخدم القرار",
    subtitleEn:
      "Applying the standards to small ledgers without complexity that serves no decision",
    descriptionAr:
      "الشركات الصغيرة تحتاج تطبيقًا مبسّطًا للمعايير لا نسخة مصغّرة من كل تعقيدات الشركات الكبيرة. نأخذ حالات واقعية: متى يُعترف بالإيراد، وكيف تُعامَل المخزونات، ومتى يكفي الإفصاح المختصر. لكل حالة نناقش الخيار الأنسب لحجم الشركة وأثره على القوائم.\n\nثم نتناول الفروق التي تربك أصحاب الأعمال: الإيراد مقابل التحصيل، وتصنيف الالتزام طويل الأجل، ومعالجة عقود الإيجار. نختتم بإعداد مجموعة إفصاحات لشركة صغيرة حقيقية الحجم، مع شرح لكل بند قرار فيه تقليل تعقيد دون خسارة معلومة مهمّة.",
    descriptionEn:
      "Small companies need a simplified application of the standards, not a miniature copy of every large-company complexity. We take realistic cases: when revenue is recognised, how inventories are treated, and when a short disclosure is enough. For each we discuss the option that suits the company's size and its effect on the statements.\n\nWe then cover the differences that confuse owners: revenue versus collection, classifying long-term liabilities, and treating lease contracts. We finish by preparing a disclosure set for a realistically sized small company, explaining each item as a decision that reduces complexity without losing a material fact.",
    level: "INTERMEDIATE",
    language: "AR",
    priceCents: 32900,
    objectives: [
      {
        textAr: "تحدّد وقت الاعتراف بالإيراد في حالات بيع متنوعة.",
        textEn: "Determine the timing of revenue recognition across varied sales cases.",
      },
      {
        textAr: "تعالج المخزون بطريقة متّسقة مع سجلات الشركة.",
        textEn: "Treat inventory consistently with the company's records.",
      },
      {
        textAr: "تصنّف الخصوم قصيرة وطويلة الأجل بشكل صحيح.",
        textEn: "Classify short-term and long-term liabilities correctly.",
      },
      {
        textAr: "تعالج عقود الإيجار في دفاتر الشركة الصغيرة.",
        textEn: "Treat lease contracts in a small company's books.",
      },
      {
        textAr: "تُعدّ إفصاحات مختصرة كافية دون إغراق القارئ.",
        textEn: "Prepare short disclosures sufficient without overwhelming the reader.",
      },
      {
        textAr: "تبرّر كل اختيار مبسّط بمبدأ لا بتوفير الوقت فقط.",
        textEn: "Justify each simplification by principle, not merely by saving time.",
      },
    ],
    requirements: [
      {
        textAr: "فهم أساسي للقيود والقوائم المالية.",
        textEn: "Basic understanding of journal entries and financial statements.",
      },
      {
        textAr: "خبرة عملية بدفاتر شركة صغيرة أو متوسطة.",
        textEn: "Practical experience with small or mid-sized company books.",
      },
      {
        textAr: "قدرة على قراءة نصّ معياري بالعربية.",
        textEn: "Ability to read standard text in Arabic.",
      },
    ],
    sections: [
      {
        titleAr: "الاعتراف والقياس",
        titleEn: "Recognition and Measurement",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "متى يُعترف بالإيراد فعلًا",
            titleEn: "When revenue is actually recognised",
            isPreview: true,
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "الإيراد مقابل التحصيل",
            titleEn: "Revenue versus collection",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "المخزون: التكلفة والقيمة",
            titleEn: "Inventory: cost and value",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "الأصول الثابتة والإهلاك",
            titleEn: "Fixed assets and depreciation",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: الإيراد ليس لحظة دفع العميل",
            titleEn: "Reading: revenue is not the moment the customer pays",
            durationSec: 360,
            contentAr:
              "<p>صاحب العمل الصغير يربط الإيراد بالمال الذي وصل، وهذا مفهوم في إدارة النقد لكنه خاطئ في القوائم. الإيراد يُعترف عند انتقال المنفعة، لا عند وصول الدفعة.</p><h3>حالتان متكرّرتان</h3><ul><li>بيع سلعة تُسلَّم الشهر القادم: الإيراد عند التسليم لا عند الفاتورة.</li><li>خدمة سنوية تُدفع مقدّمًا: الإيراد يوزّع على فترة تقديم الخدمة.</li></ul><p>الفصل بين تاريخ الدفع وتاريخ الاستحقاق هو ما يجعل القوائم تعكس الأداء، ويحتاج شرحًا واضحًا لصاحب العمل حتى لا يظنّ أن المحاسب «يؤجّل الربح».</p>",
            contentEn:
              "<p>A small business owner ties revenue to cash received, which makes sense for cash management but is wrong on the statements. Revenue is recognised when the benefit transfers, not when the payment arrives.</p><h3>Two recurring cases</h3><ul><li>Selling goods delivered next month: revenue on delivery, not on invoice.</li><li>An annual service paid upfront: revenue spread over the service period.</li></ul><p>Separating payment date from accrual date is what makes the statements reflect performance, and it needs a clear explanation so an owner does not think the accountant is «postponing profit».</p>",
          },
        ],
      },
      {
        titleAr: "التصنيف والإيجار",
        titleEn: "Classification and Leases",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "تصنيف الخصوم قصيرة وطويلة الأجل",
            titleEn: "Classifying short-term and long-term liabilities",
            isPreview: true,
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "عقود الإيجار في دفاتر الشركة الصغيرة",
            titleEn: "Lease contracts in a small company's books",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "المخصّصات والالتزامات المحتملة",
            titleEn: "Provisions and contingent liabilities",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: الإفصاح المختصر حين يكفي",
            titleEn: "Reading: short disclosure when it is enough",
            durationSec: 360,
            contentAr:
              "<p>الإفصاح ليس إطالة. الهدف أن يفهم القارئ ما يحتاج معرفته ليتّخذ قرارًا، لا أن يمرّ على صفحات لا تغيّر حكمًا. الإفصاح الجيد يجيب عن سؤال القارئ قبل أن يطرحه.</p><h3>ثلاثة اختبارات لبند إفصاح</h3><ul><li>هل يغيّر هذا البند تقييم القارئ للشركة؟</li><li>هل يغيّر قراره في التعامل معها؟</li><li>هل يوضّح رقمًا في القوائم قد يُفهَم خطأً؟</li></ul><p>إن كان الجواب لا على الأسئلة الثلاثة، فالبند غالبًا تفصيل لا يخدم قرارًا، وحذفه يجعل الإفصاحات أنفع لا أنقص.</p>",
            contentEn:
              "<p>Disclosure is not about length. The goal is for the reader to understand what they need to form a view, not to wade through pages that change no judgement. Good disclosure answers the reader's question before they ask it.</p><h3>Three tests for a disclosure item</h3><ul><li>Does this item change the reader's assessment of the company?</li><li>Does it change their decision to deal with it?</li><li>Does it clarify a figure in the statements that could be misread?</li></ul><p>If all three answers are no, the item is usually detail serving no decision, and removing it makes the disclosures more useful, not less.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الاعتراف والتصنيف",
            titleEn: "Quiz: recognition and classification",
            quiz: {
              titleAr: "اختبار: الاعتراف والتصنيف",
              titleEn: "Quiz: recognition and classification",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 1200,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "متى يُعترف بالإيراد في بيع سلعة تُسلَّم لاحقًا؟",
                  promptEn: "When is revenue recognised on goods delivered later?",
                  explanationAr: "الإيراد يُعترف عند انتقال المنفعة، أي عند التسليم.",
                  explanationEn:
                    "Revenue is recognised when the benefit transfers, that is, on delivery.",
                  options: [
                    {
                      textAr: "عند التسليم لا عند تاريخ الفاتورة",
                      textEn: "On delivery, not on the invoice date",
                      isCorrect: true,
                    },
                    {
                      textAr: "عند استلام الدفعة",
                      textEn: "When the payment is received",
                      isCorrect: false,
                    },
                    {
                      textAr: "عند توقيع العقد",
                      textEn: "When the contract is signed",
                      isCorrect: false,
                    },
                    {
                      textAr: "في نهاية السنة دائمًا",
                      textEn: "Always at year end",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "الإفصاح الجيد يعني إطالة التقارير.",
                  promptEn: "Good disclosure means longer reports.",
                  explanationAr: "الإفصاح الجيد يجيب عن سؤال القارئ ولا يطيل بلا فائدة.",
                  explanationEn:
                    "Good disclosure answers the reader's question without needless length.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما نوع الالتزام الذي قد يتحقّق أو لا يتحقّق حسب حدث مستقبلي؟",
                  promptEn: "What kind of liability depends on a future event?",
                  explanationAr: "الالتزام المحتمل يعتمد على حدث مستقبلي غير مؤكّد.",
                  explanationEn: "A contingent liability depends on an uncertain future event.",
                  acceptedAnswers: [
                    "contingent liability",
                    "contingency",
                    "contigent liability",
                    "contingent",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي الأسئلة تكشف بند إفصاح لا يخدم قرارًا؟",
                  promptEn: "Which questions reveal a disclosure item serving no decision?",
                  explanationAr:
                    "إن لم يغيّر التقييم أو القرار ولم يوضّح رقمًا فهو غالبًا تفصيل زائد.",
                  explanationEn:
                    "If it changes no assessment or decision and clarifies no figure, it is usually excess detail.",
                  options: [
                    {
                      textAr: "هل يغيّر تقييم القارئ للشركة؟",
                      textEn: "Does it change the reader's view of the company?",
                      isCorrect: true,
                    },
                    {
                      textAr: "هل يغيّر قراره في التعامل معها؟",
                      textEn: "Does it change their decision to deal with it?",
                      isCorrect: true,
                    },
                    {
                      textAr: "هل هو مكتوب بخطّ صغير؟",
                      textEn: "Is it written in a small font?",
                      isCorrect: false,
                    },
                    {
                      textAr: "هل يزيد عدد الصفحات؟",
                      textEn: "Does it add pages?",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما الفرق الأساسي بين الإيراد والتحصيل؟",
                  promptEn: "What is the core difference between revenue and collection?",
                  explanationAr: "الإيراد يرتبط بانتقال المنفعة، والتحصيل بوصول النقد.",
                  explanationEn:
                    "Revenue relates to transferring the benefit, collection to receiving cash.",
                  options: [
                    {
                      textAr: "الإيراد يرتبط بانتقال المنفعة والتحصيل بوصول النقد",
                      textEn:
                        "Revenue relates to the benefit transferring, collection to receiving cash",
                      isCorrect: true,
                    },
                    {
                      textAr: "لا فرق بينهما إطلاقًا",
                      textEn: "There is no difference at all",
                      isCorrect: false,
                    },
                    {
                      textAr: "التحصيل يسبق الإيراد دائمًا",
                      textEn: "Collection always precedes revenue",
                      isCorrect: false,
                    },
                    {
                      textAr: "الإيراد مبلغ نقدي فقط",
                      textEn: "Revenue is a cash amount only",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "الإفصاح والإعداد",
        titleEn: "Disclosure and Preparation",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "إعداد مجموعة إفصاحات مختصرة",
            titleEn: "Preparing a short disclosure set",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "مراجعة السياسات المحاسبية للاتّساق",
            titleEn: "Reviewing accounting policies for consistency",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: تغيير السياسة ليس قرارًا سريعًا",
            titleEn: "Reading: changing a policy is not a quick decision",
            durationSec: 300,
            contentAr:
              "<p>تغيير طريقة تقييم المخزون أو الإهلاك ليس خطوة محاسبية صغيرة؛ إنه يغيّر الأرقام عبر السنوات ويصعّب المقارنة. لهذا نطلب سببًا يخدم القرار لا يخدم الرقم وحده.</p><h3>ثلاثة أسئلة قبل التغيير</h3><ul><li>ما الذي يتغيّر في القوائم وعلى أي سنوات؟</li><li>هل يمكن المقارنة بعد التغيير أم ستحتاج إعادة عرض؟</li><li>هل الأثر مادي بما يبرّر التغيير؟</li></ul><p>بهذه الأسئلة يتحوّل قرار السياسة من تفصيل تقني إلى قرار يفهمه صاحب العمل ويشارك فيه.</p>",
            contentEn:
              "<p>Changing the inventory or depreciation method is not a small accounting step; it changes figures across years and makes comparison harder. So we require a reason that serves a decision, not just a number.</p><h3>Three questions before changing</h3><ul><li>What changes in the statements, and in which years?</li><li>Is comparison still possible, or will a restatement be needed?</li><li>Is the effect material enough to justify the change?</li></ul><p>With these questions, a policy decision turns from a technical detail into a choice the owner understands and shares in.</p>",
          },
          {
            type: "FILE",
            titleAr: "قائمة إفصاحات الشركات الصغيرة",
            titleEn: "Small-business disclosure checklist",
            durationSec: 300,
            attachmentAr: "قائمة إفصاحات الشركات الصغيرة",
            attachmentEn: "Small-business disclosure checklist",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الإفصاح والإعداد",
            titleEn: "Quiz: disclosure and preparation",
            quiz: {
              titleAr: "اختبار: الإفصاح والإعداد",
              titleEn: "Quiz: disclosure and preparation",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "لماذا تغيير السياسة المحاسبية ليس خطوة صغيرة؟",
                  promptEn: "Why is changing an accounting policy not a small step?",
                  explanationAr: "التغيير يؤثّر على أرقام سنوات متعدّدة ويصعّب المقارنة.",
                  explanationEn:
                    "The change affects figures across several years and makes comparison harder.",
                  options: [
                    {
                      textAr: "لأنه يؤثّر على سنوات متعدّدة ويصعّب المقارنة",
                      textEn: "Because it affects several years and makes comparison harder",
                      isCorrect: true,
                    },
                    {
                      textAr: "لأنه مكلف ماليًا مباشرة",
                      textEn: "Because it costs money directly",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأنه يحتاج موافقة البنك",
                      textEn: "Because it needs bank approval",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأنه يغيّر عدد الموظّفين",
                      textEn: "Because it changes headcount",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "الأثر المادي شرط لتبرير تغيير السياسة المحاسبية.",
                  promptEn: "Materiality is a condition for justifying a policy change.",
                  explanationAr: "إن كان الأثر غير مادي فلا مبرّر لتغيير يصعّب المقارنة.",
                  explanationEn:
                    "If the effect is immaterial, there is no case for a change that hinders comparison.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الذي قد نحتاجه لعرض السنوات السابقة عند تغيير السياسة؟",
                  promptEn: "What may be needed to present prior years when a policy changes?",
                  explanationAr: "إعادة العرض تجعل الأرقام قابلة للمقارنة بعد التغيير.",
                  explanationEn: "A restatement makes figures comparable after the change.",
                  acceptedAnswers: ["restatement", "re-presentation", "restating", "recast"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يساعد على اختيار الخيار المبسّط المناسب؟",
                  promptEn: "Which of these help choose the right simplified option?",
                  explanationAr: "مقارنة الخيارات بأثرها على القوائم وحجم الشركة يوجّه الاختيار.",
                  explanationEn:
                    "Comparing options by their effect on the statements and the company's size guides the choice.",
                  options: [
                    {
                      textAr: "مقارنة أثر كل خيار على القوائم",
                      textEn: "Comparing each option's effect on the statements",
                      isCorrect: true,
                    },
                    {
                      textAr: "مراعاة حجم الشركة وتعقيدها",
                      textEn: "Considering the company's size and complexity",
                      isCorrect: true,
                    },
                    {
                      textAr: "اختيار الأصعب لأنه أدقّ",
                      textEn: "Choosing the hardest because it is most precise",
                      isCorrect: false,
                    },
                    { textAr: "تجاهل القارئ", textEn: "Ignoring the reader", isCorrect: false },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما الغرض من السياسات المحاسبية المعلنة؟",
                  promptEn: "What is the purpose of stated accounting policies?",
                  explanationAr:
                    "السياسات تشرح الأساس الذي بُنيت عليه الأرقام فيسهل فهمها ومقارنتها.",
                  explanationEn:
                    "Policies explain the basis behind the figures so they can be understood and compared.",
                  options: [
                    {
                      textAr: "شرح الأساس الذي بُنيت عليه الأرقام",
                      textEn: "Explaining the basis behind the figures",
                      isCorrect: true,
                    },
                    { textAr: "زيادة عدد الصفحات", textEn: "Adding more pages", isCorrect: false },
                    {
                      textAr: "إرضاء الجهة الضريبية فقط",
                      textEn: "Satisfying the tax authority only",
                      isCorrect: false,
                    },
                    {
                      textAr: "إخفاء الافتراضات",
                      textEn: "Hiding the assumptions",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "financial-analysis-and-ratios",
    instructorUsername: "yousef-alrashidi",
    categorySlug: "finance",
    titleAr: "التحليل المالي والنسب",
    titleEn: "Financial Analysis and Ratios",
    subtitleAr: "قراءة القوائم كناقد: أين المشكلة فعلًا وما الذي لا تكشفه الأرقام",
    subtitleEn:
      "Reading statements as a critic: where the problem really is and what the numbers hide",
    descriptionAr:
      "حساب النسب سهل؛ معرفة أيّها يستحقّ النظر وسبب حركته هو العمل الحقيقي. نأخذ قوائم شركتين في القطاع نفسه ونقارن: الربحية، والهيكل، والقدرة على السداد، وكفاءة تشغيل الأصول، ونربط كل نسبة بعامل من العمليات يفكّها.\n\nنتناول بعد ذلك حدود التحليل: النسب المحسوبة من بيانات ربعية، وأثر اختلاف السياسات على المقارنة، والحالات التي يخفي فيها المتوسّط مشكلة كبيرة في صنف واحد. نختتم بكتابة تعليق تحليلي قصير يحدّد ثلاث نقاط فقط ويقول بوضوح ما لا تستطيع القوائم إخبارنا به.",
    descriptionEn:
      "Computing ratios is easy; knowing which ones deserve attention and why they moved is the real work. We take two companies in the same sector and compare profitability, structure, solvency, and how well assets are used, tying each ratio back to an operating factor that explains it.\n\nWe then cover the limits of analysis: ratios computed from quarterly data, the effect of differing policies on comparison, and cases where an average hides a large problem in one line. We finish by writing a short analytical note that names three points only and states clearly what the statements cannot tell us.",
    level: "ADVANCED",
    language: "AR",
    priceCents: 39900,
    objectives: [
      {
        textAr: "تحسب نسب الربحية والهيكل والسيولة وتربطها بالعمليات.",
        textEn:
          "Compute profitability, structure, and liquidity ratios and tie them to operations.",
      },
      {
        textAr: "تقارن شركتين مع مراعاة اختلاف السياسات.",
        textEn: "Compare two companies accounting for differing policies.",
      },
      {
        textAr: "تكتشف ما يخفيه المتوسّط في بند واحد.",
        textEn: "Detect what an average hides in a single line.",
      },
      {
        textAr: "تشرح حركة النسبة بحدث تشغيلي لا بتفسير عام.",
        textEn: "Explain a ratio's movement by an operating event, not a generic reason.",
      },
      {
        textAr: "تحدّد حدود التحليل من البيانات المتاحة.",
        textEn: "State the limits of the analysis given the available data.",
      },
      {
        textAr: "تكتب ملاحظة تحليلية من ثلاث نقاط تقود قرارًا.",
        textEn: "Write a three-point analytical note that drives a decision.",
      },
    ],
    requirements: [
      {
        textAr: "معرفة جيدة بالقوائم المالية الأساسية.",
        textEn: "Good knowledge of the core financial statements.",
      },
      {
        textAr: "خبرة بجداول البيانات في تحليل الأرقام.",
        textEn: "Spreadsheet experience in analysing numbers.",
      },
      {
        textAr: "فهم أساسي لمفاهيم التمويل والتشغيل.",
        textEn: "Basic understanding of financing and operations concepts.",
      },
    ],
    sections: [
      {
        titleAr: "النسب وأصلها",
        titleEn: "Ratios and Where They Come From",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "أي نسبة تجيب عن أي سؤال",
            titleEn: "Which ratio answers which question",
            isPreview: true,
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "نسب الربحية وحدودها",
            titleEn: "Profitability ratios and their limits",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "السيولة مقابل القدرة على السداد",
            titleEn: "Liquidity versus solvency",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "كفاءة استخدام الأصول",
            titleEn: "Efficiency in using assets",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: النسبة بلا سياق رقم بلا معنى",
            titleEn: "Reading: a ratio without context is a number with no meaning",
            durationSec: 360,
            contentAr:
              "<p>هامش ربح ٥ بالمئة قد يكون ممتازًا في قطاع ومنهارًا في آخر. النسبة تُقرأ دائمًا مقابل: تاريخ الشركة نفسها، ومنافس في القطاع، والتوقّع الذي كان معلنًا.</p><h3>ثلاث مقارنات</h3><ul><li>مع الزمن: هل تتحسّن أم تتدهّور وبأي وتيرة؟</li><li>مع القطاع: هل الفرق طبيعي أم شاذّ؟</li><li>مع التوقّع: هل تحقّق ما وعدت به الإدارة؟</li></ul><p>النسبة التي تتحرّك في اتجاه عكس التوقّع أسرع إشارة إلى مشكلة أو إلى فرصة لم يلحظها أحد بعد.</p>",
            contentEn:
              "<p>A five per cent margin can be excellent in one sector and disastrous in another. A ratio is always read against the company's own history, a sector peer, and the expectation that was stated.</p><h3>Three comparisons</h3><ul><li>Over time: is it improving or deteriorating, and how fast?</li><li>Against the sector: is the difference normal or an outlier?</li><li>Against the expectation: did management deliver what it promised?</li></ul><p>A ratio moving opposite to expectation is the earliest signal of a problem, or of an opportunity nobody has noticed yet.</p>",
          },
        ],
      },
      {
        titleAr: "التفسير وحدوده",
        titleEn: "Interpretation and Its Limits",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "ربط النسبة بحدث تشغيلي",
            titleEn: "Tying a ratio to an operating event",
            isPreview: true,
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "أثر اختلاف السياسات على المقارنة",
            titleEn: "How differing policies affect comparison",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "ما يخفيه المتوسّط في بند واحد",
            titleEn: "What an average hides in one line",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: حين تكذب النسبة الصحيحة",
            titleEn: "Reading: when a correct ratio misleads",
            durationSec: 360,
            contentAr:
              "<p>قد تتحسّن نسبة سيولة لأن الشركة باعت مخزونها بخصم لحاجة نقدية عاجلة. الرقم صحيح، والاتّجاه إيجابي شكليًا، والتفسير خاطئ تمامًا. لهذا لا نقرأ نسبة معزولة.</p><h3>ثلاث علامات تحذير</h3><ul><li>تحسّن نسبة يخالف أرقامًا أخرى في الاتجاه.</li><li>انخفاض المخزون مع ارتفاع مبيعات بالأجل.</li><li>تحسّن هامش مع زيادة الاعتماد على مورد واحد.</li></ul><p>هذه العلامات لا تُثبت وجود مشكلة، لكنها تستدعي سؤالًا قبل أن يُبنى على الرقم قرارٌ مهمّ.</p>",
            contentEn:
              "<p>A liquidity ratio can improve because the company sold inventory at a discount to meet an urgent cash need. The number is correct, the trend looks positive, and the explanation is entirely wrong. That is why we never read a ratio in isolation.</p><h3>Three warning signs</h3><ul><li>An improving ratio contradicting other numbers' direction.</li><li>Falling inventory while credit sales rise.</li><li>An improving margin alongside growing reliance on one supplier.</li></ul><p>These signs do not prove a problem, but they demand a question before an important decision is built on the number.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: التفسير وحدوده",
            titleEn: "Quiz: interpretation and its limits",
            quiz: {
              titleAr: "اختبار: التفسير وحدوده",
              titleEn: "Quiz: interpretation and its limits",
              passPct: 80,
              maxAttempts: 3,
              timeLimitSec: 1500,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما الذي يربط حركة النسبة بمعناها؟",
                  promptEn: "What connects a ratio's movement to its meaning?",
                  explanationAr: "ربط النسبة بحدث تشغيلي يحوّل الرقم إلى معلومة مفيدة.",
                  explanationEn:
                    "Tying the ratio to an operating event turns the number into useful information.",
                  options: [
                    {
                      textAr: "ربطها بحدث تشغيلي ملموس",
                      textEn: "Tying it to a concrete operating event",
                      isCorrect: true,
                    },
                    {
                      textAr: "مقارنتها برقم آخر فقط",
                      textEn: "Comparing it with one other number only",
                      isCorrect: false,
                    },
                    {
                      textAr: "كتابتها بدقّة عشرية عالية",
                      textEn: "Writing it with many decimal places",
                      isCorrect: false,
                    },
                    {
                      textAr: "حفظ تعريفها",
                      textEn: "Memorising its definition",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "قد تتحسّن نسبة سيولة لأسباب سلبية.",
                  promptEn: "A liquidity ratio can improve for negative reasons.",
                  explanationAr: "بيع المخزون بخصم لسدّ حاجة نقدية يحسّن النسبة شكليًا.",
                  explanationEn:
                    "Selling inventory at a discount to cover a cash need improves the ratio cosmetically.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الذي يجب أن نذكره عن التحليل إلى جانب النتائج؟",
                  promptEn: "What must we state alongside the analysis results?",
                  explanationAr: "حدود التحليل تبيّن ما لا تستطيع البيانات إخبارنا به.",
                  explanationEn: "The limits of the analysis show what the data cannot tell us.",
                  acceptedAnswers: ["limits", "the limits", "limitations", "caveats"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يعدّ علامة تحذير عند قراءة نسبة؟",
                  promptEn: "Which of these are warning signs when reading a ratio?",
                  explanationAr:
                    "تحسّن يخالف بقية الأرقام أو يحمل اعتمادًا متزايدًا يستدعي سؤالًا.",
                  explanationEn:
                    "An improvement contradicting other numbers or hiding growing reliance demands a question.",
                  options: [
                    {
                      textAr: "تحسّن نسبة يخالف اتجاه أرقام أخرى",
                      textEn: "An improving ratio contradicting other numbers' direction",
                      isCorrect: true,
                    },
                    {
                      textAr: "انخفاض المخزون مع ارتفاع البيع بالأجل",
                      textEn: "Falling inventory with rising credit sales",
                      isCorrect: true,
                    },
                    {
                      textAr: "تحسّن الهامش بلا تغيّر آخر",
                      textEn: "An improving margin with no other change",
                      isCorrect: false,
                    },
                    {
                      textAr: "ثبات النسبة عبر الفترات",
                      textEn: "A ratio staying stable across periods",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "لماذا لا تقرأ نسبة معزولة؟",
                  promptEn: "Why not read a ratio in isolation?",
                  explanationAr: "النسبة تحتاج سياقًا ومقارنة وإلّا فهي رقم لا معنى له.",
                  explanationEn:
                    "A ratio needs context and comparison, otherwise it is a meaningless number.",
                  options: [
                    {
                      textAr: "لأنها تحتاج سياقًا ومقارنة لتدلّ على شيء",
                      textEn: "Because it needs context and comparison to mean anything",
                      isCorrect: true,
                    },
                    {
                      textAr: "لأنها غالبًا خاطئة حسابيًا",
                      textEn: "Because it is usually miscalculated",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأنها سرّية",
                      textEn: "Because it is confidential",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأن الأرقام لا تُقرأ",
                      textEn: "Because numbers are unreadable",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "الملاحظة التحليلية",
        titleEn: "The Analytical Note",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "ملاحظة من ثلاث نقاط تقود قرارًا",
            titleEn: "A three-point note that drives a decision",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "تقدير ما لا تكشفه القوائم",
            titleEn: "Estimating what the statements do not reveal",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: كيف يُكتب تحليل لا يُقرأ مرة واحدة",
            titleEn: "Reading: writing an analysis that gets read more than once",
            durationSec: 300,
            contentAr:
              "<p>التحليل الطويل يُقرأ سريعًا ويُنسى. الأفضل أن تحدّد ثلاث نقاط تقود قرارًا، وتضع كل واحدة في جملة أولى، ثم تدعمها برقم واحد وسبب واحد.</p><h3>بنية قابلة للاستخدام</h3><ul><li>النقطة الأولى في جملة قابلة للنقل.</li><li>رقم واحد يدعمها من القوائم.</li><li>سبب تشغيلي واحد يفسّر الرقم.</li></ul><p>ثم اختم بجملة صريحة عن حدود تحليلك. القارئ يثق أكثر بمحلّل يقول بوضوح ما لا يعرفه، لا بمحلّل يتنكّر لكل غموض.</p>",
            contentEn:
              "<p>A long analysis is skimmed and forgotten. Better to name three points that drive a decision, put each in a leading sentence, and support it with one number and one reason.</p><h3>A usable structure</h3><ul><li>The first point in a quotable sentence.</li><li>One number from the statements supporting it.</li><li>One operating reason explaining the number.</li></ul><p>Then close with a plain sentence about the limits of your analysis. A reader trusts an analyst who states what they do not know more than one who conceals every ambiguity.</p>",
          },
          {
            type: "FILE",
            titleAr: "قالب الملاحظة التحليلية",
            titleEn: "Analytical note template",
            durationSec: 300,
            attachmentAr: "قالب الملاحظة التحليلية",
            attachmentEn: "Analytical note template",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الملاحظة التحليلية",
            titleEn: "Quiz: the analytical note",
            quiz: {
              titleAr: "اختبار: الملاحظة التحليلية",
              titleEn: "Quiz: the analytical note",
              passPct: 80,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "كم نقطة ينبغي أن تحمل الملاحظة التحليلية؟",
                  promptEn: "How many points should an analytical note carry?",
                  explanationAr: "ثلاث نقاط تقود قرارًا تُقرأ وتُستخدم، بخلاف العشرين.",
                  explanationEn:
                    "Three points that drive a decision get read and used, unlike twenty.",
                  options: [
                    {
                      textAr: "ثلاث نقاط تقود قرارًا",
                      textEn: "Three points that drive a decision",
                      isCorrect: true,
                    },
                    {
                      textAr: "عشرون نقطة شاملة",
                      textEn: "Twenty comprehensive points",
                      isCorrect: false,
                    },
                    { textAr: "نقطة واحدة دائمًا", textEn: "Always one point", isCorrect: false },
                    { textAr: "عدد عشوائي", textEn: "A random number", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "ذكر حدود التحليل يزيد ثقة القارئ.",
                  promptEn: "Stating the limits of the analysis increases the reader's trust.",
                  explanationAr: "الصراحة بشأن ما لا نعرفه تبني الثقة أكثر من التنكّر للغموض.",
                  explanationEn:
                    "Honesty about what we do not know builds more trust than concealing ambiguity.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الذي يدعم كل نقطة في الملاحظة إلى جانب الرقم؟",
                  promptEn: "What supports each point in the note besides the number?",
                  explanationAr: "سبب تشغيلي واحد يفسّر الرقم ويربطه بالواقع.",
                  explanationEn: "One operating reason explains and grounds the number.",
                  acceptedAnswers: ["operating reason", "a reason", "operating cause", "cause"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يجعل الملاحظة قابلة للاستخدام؟",
                  promptEn: "Which of these make a note usable?",
                  explanationAr:
                    "الجملة الأولى القابلة للنقل ورقم واحد داعم يسهّلان القراءة والاستخدام.",
                  explanationEn:
                    "A quotable first sentence and one supporting number make it easy to read and use.",
                  options: [
                    {
                      textAr: "جملة أولى قابلة للنقل",
                      textEn: "A quotable first sentence",
                      isCorrect: true,
                    },
                    {
                      textAr: "رقم واحد يدعم كل نقطة",
                      textEn: "One number supporting each point",
                      isCorrect: true,
                    },
                    {
                      textAr: "جدول ضخم بكل النسب",
                      textEn: "A huge table of every ratio",
                      isCorrect: false,
                    },
                    { textAr: "إخفاء الحدود", textEn: "Hiding the limits", isCorrect: false },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ماذا نضع بعد النقاط الثلاث؟",
                  promptEn: "What goes after the three points?",
                  explanationAr: "جملة صريحة عن حدود التحليل تكمل الملاحظة.",
                  explanationEn:
                    "A plain sentence about the limits of the analysis completes the note.",
                  options: [
                    {
                      textAr: "جملة صريحة عن حدود التحليل",
                      textEn: "A plain sentence about the limits of the analysis",
                      isCorrect: true,
                    },
                    {
                      textAr: "قائمة بكل الحسابات الوسيطة",
                      textEn: "A list of every intermediate calculation",
                      isCorrect: false,
                    },
                    {
                      textAr: "تعريفات النسب جميعها",
                      textEn: "Definitions of every ratio",
                      isCorrect: false,
                    },
                    { textAr: "لا شيء بعدها", textEn: "Nothing after them", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "academic-writing-in-english",
    instructorUsername: "hind-alshehri",
    categorySlug: "languages",
    titleAr: "الكتابة الأكاديمية بالإنجليزية",
    titleEn: "Academic Writing in English",
    subtitleAr: "بناء حجّة واضحة قبل تحسين الجُمل، للباحثين الذين يكتبون بالإنجليزية كلغة ثانية",
    subtitleEn:
      "Building a clear argument before polishing sentences, for researchers writing in a second language",
    descriptionAr:
      "معظم مشكلات الكتابة الأكاديمية بنيوية لا نحوية. الفقرة التي تُقرأ بصعوبة غالبًا تحتوي دعوى بلا دليل، أو دليلًا لا يخدم الدعوى. نبدأ من ملخص بحثك أنت، ونعيد بناءه حول جملة واحدة تقول ما الذي يدّعيه البحث، ثم نرتّب كل فقرة بحيث يعرف القارئ لماذا تأتي الجملة التالية.\n\nبعد ذلك نعمل على الحركات التي يبحث عنها المحكّمون: تحديد موقع مساهمتك من الأعمال السابقة، وتلطيف الدعوى بالدرجة المناسبة، وعرض النتائج دون مبالغة. الوحدة الأخيرة جولة تحرير كاملة تقتصّ فيها وتعيد الترتيب وتكتب من جديد من أجل الوضوح، مع الحفاظ على الدقة التي يتوقعها مجالك.",
    descriptionEn:
      "Most problems in academic writing are structural, not grammatical. A paragraph that reads badly often contains a claim with no support, or support that does not match the claim. We start from your own abstract and rebuild it around one sentence that says what the paper argues, then structure each paragraph so the reader knows why the next sentence follows.\n\nWe then work on the moves that examiners and reviewers look for: positioning your contribution against existing work, hedging a claim appropriately, and reporting results without overstating them. The final module is a full edit pass where you cut, reorder, and rewrite for clarity while keeping the precision your field expects.",
    level: "INTERMEDIATE",
    language: "EN",
    priceCents: 25900,
    objectives: [
      {
        textAr: "تحدّد حجّة البحث في جملة واحدة واضحة.",
        textEn: "State the paper's argument in one clear sentence.",
      },
      {
        textAr: "تبني فقرة تعرف وظيفتها داخل الحجّة.",
        textEn: "Build a paragraph whose function in the argument is clear.",
      },
      {
        textAr: "تحدّد موقع مساهمتك من الأعمال السابقة دون مبالغة.",
        textEn: "Position your contribution against prior work without overclaiming.",
      },
      {
        textAr: "تستخدم صيغ التحفّظ المناسبة لقوة الدليل.",
        textEn: "Use hedging that matches the strength of your evidence.",
      },
      {
        textAr: "تحرّر نصًّا كاملًا بالحذف وإعادة الترتيب لا بالتجميل.",
        textEn: "Edit a full text by cutting and reordering rather than decorating.",
      },
      {
        textAr: "تكتب ملخّصًا يوضّح المشكلة والطريقة والنتيجة.",
        textEn: "Write an abstract stating the problem, method, and finding.",
      },
    ],
    requirements: [
      {
        textAr: "مستوى إنجليزية يتيح كتابة فقرة متكاملة.",
        textEn: "English sufficient to write a complete paragraph.",
      },
      {
        textAr: "مسوّدة نصّ أكاديمي أو بحثية قصيرة.",
        textEn: "A draft of a short academic or research text.",
      },
      { textAr: "تعامل مع أداة معالجة نصوص.", textEn: "Comfort with a word processor." },
    ],
    sections: [
      {
        titleAr: "Argument Before Sentences",
        titleEn: "Argument Before Sentences",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "Why good sentences cannot fix a missing argument",
            titleEn: "Why good sentences cannot fix a missing argument",
            isPreview: true,
            durationSec: 480,
          },
          {
            type: "VIDEO",
            titleAr: "Finding the one sentence your paper argues",
            titleEn: "Finding the one sentence your paper argues",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "Paragraph function: claim, support, link",
            titleEn: "Paragraph function: claim, support, link",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "Topic sentences that do real work",
            titleEn: "Topic sentences that do real work",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "Reading: the paragraph that knows its job",
            titleEn: "Reading: the paragraph that knows its job",
            durationSec: 300,
            contentAr:
              "<p>A paragraph is not a container for sentences on a theme. It is a unit of reasoning that makes one move: it claims, supports, or connects. When a paragraph tries to do three moves at once, the reader loses the thread and blames the writing.</p><h3>A test you can run on any paragraph</h3><ul><li>Can you state its job in one word: claim, support, or connect?</li><li>Does its first sentence announce that job?</li><li>Does every later sentence serve only that job?</li></ul><p>If a sentence serves a different job, it belongs in another paragraph. Moving it usually improves both paragraphs at once, which is why reordering beats rewriting.</p>",
            contentEn:
              "<p>A paragraph is not a container for sentences on a theme. It is a unit of reasoning that makes one move: it claims, supports, or connects. When a paragraph tries to do three moves at once, the reader loses the thread and blames the writing.</p><h3>A test you can run on any paragraph</h3><ul><li>Can you state its job in one word: claim, support, or connect?</li><li>Does its first sentence announce that job?</li><li>Does every later sentence serve only that job?</li></ul><p>If a sentence serves a different job, it belongs in another paragraph. Moving it usually improves both paragraphs at once, which is why reordering beats rewriting.</p>",
          },
        ],
      },
      {
        titleAr: "Positioning and Hedging",
        titleEn: "Positioning and Hedging",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "Positioning your contribution",
            titleEn: "Positioning your contribution",
            isPreview: true,
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "Hedging that matches the evidence",
            titleEn: "Hedging that matches the evidence",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "Reporting results without overstating",
            titleEn: "Reporting results without overstating",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "Reading: hedging is precision, not weakness",
            titleEn: "Reading: hedging is precision, not weakness",
            durationSec: 360,
            contentAr:
              "<p>Writers often avoid hedging because it feels like admitting uncertainty. In academic writing the opposite is true: a claim stated more strongly than the evidence supports is the weakness, and reviewers read it as inexperience.</p><h3>Match the verb to the evidence</h3><ul><li>Strong evidence, narrow claim: «the results show».</li><li>Consistent pattern, limited sample: «the data suggest».</li><li>Reasonable inference: «this may indicate».</li></ul><p>The rule is not to hedge everything, which makes the text unreadable. It is to hedge exactly the part your data cannot carry, and state the rest directly.</p>",
            contentEn:
              "<p>Writers often avoid hedging because it feels like admitting uncertainty. In academic writing the opposite is true: a claim stated more strongly than the evidence supports is the weakness, and reviewers read it as inexperience.</p><h3>Match the verb to the evidence</h3><ul><li>Strong evidence, narrow claim: «the results show».</li><li>Consistent pattern, limited sample: «the data suggest».</li><li>Reasonable inference: «this may indicate».</li></ul><p>The rule is not to hedge everything, which makes the text unreadable. It is to hedge exactly the part your data cannot carry, and state the rest directly.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "Quiz: argument and positioning",
            titleEn: "Quiz: argument and positioning",
            quiz: {
              titleAr: "Quiz: argument and positioning",
              titleEn: "Quiz: argument and positioning",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 1200,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "What is the main problem with a paragraph doing three jobs?",
                  promptEn: "What is the main problem with a paragraph doing three jobs?",
                  explanationAr:
                    "The reader cannot follow which move is being made, so the reasoning blurs.",
                  explanationEn:
                    "The reader cannot follow which move is being made, so the reasoning blurs.",
                  options: [
                    {
                      textAr: "The reader loses the thread of the reasoning",
                      textEn: "The reader loses the thread of the reasoning",
                      isCorrect: true,
                    },
                    {
                      textAr: "It becomes too short",
                      textEn: "It becomes too short",
                      isCorrect: false,
                    },
                    {
                      textAr: "It uses too many verbs",
                      textEn: "It uses too many verbs",
                      isCorrect: false,
                    },
                    {
                      textAr: "It needs a citation",
                      textEn: "It needs a citation",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "Hedging every claim makes academic text stronger.",
                  promptEn: "Hedging every claim makes academic text stronger.",
                  explanationAr:
                    "Hedging everything makes the text unreadable; hedge only what the data cannot carry.",
                  explanationEn:
                    "Hedging everything makes the text unreadable; hedge only what the data cannot carry.",
                  options: [
                    { textAr: "True", textEn: "True", isCorrect: false },
                    { textAr: "False", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr:
                    "Which move does a paragraph make when it introduces support for a claim?",
                  promptEn:
                    "Which move does a paragraph make when it introduces support for a claim?",
                  explanationAr: "Such a paragraph supports; naming the move is the test.",
                  explanationEn: "Such a paragraph supports; naming the move is the test.",
                  acceptedAnswers: ["support", "supports", "supporting", "evidence"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "Which moves does a well-formed paragraph make?",
                  promptEn: "Which moves does a well-formed paragraph make?",
                  explanationAr:
                    "Claiming, supporting, and connecting are the three paragraph jobs.",
                  explanationEn:
                    "Claiming, supporting, and connecting are the three paragraph jobs.",
                  options: [
                    { textAr: "Claim", textEn: "Claim", isCorrect: true },
                    { textAr: "Support", textEn: "Support", isCorrect: true },
                    {
                      textAr: "تكرار عنوان القسم",
                      textEn: "Repeating the section heading",
                      isCorrect: false,
                    },
                    { textAr: "Decorate", textEn: "Decorate", isCorrect: false },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "Which verb fits a consistent pattern from a limited sample?",
                  promptEn: "Which verb fits a consistent pattern from a limited sample?",
                  explanationAr: "«Suggest» matches a pattern that a limited sample cannot prove.",
                  explanationEn: "«Suggest» matches a pattern that a limited sample cannot prove.",
                  options: [
                    { textAr: "The data suggest", textEn: "The data suggest", isCorrect: true },
                    { textAr: "The data prove", textEn: "The data prove", isCorrect: false },
                    {
                      textAr: "The data guarantee",
                      textEn: "The data guarantee",
                      isCorrect: false,
                    },
                    {
                      textAr: "The data establish beyond doubt",
                      textEn: "The data establish beyond doubt",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "The Edit Pass",
        titleEn: "The Edit Pass",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "Cutting before polishing",
            titleEn: "Cutting before polishing",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "An abstract that stands alone",
            titleEn: "An abstract that stands alone",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "Reading: cut, reorder, then rewrite",
            titleEn: "Reading: cut, reorder, then rewrite",
            durationSec: 300,
            contentAr:
              "<p>Most writers polish sentences first, then discover the section has to be reorganised. The order wastes work. Cut what does not serve the argument, reorder what remains, and only then improve the phrasing.</p><h3>The order that saves time</h3><ul><li>Cut: remove sentences that serve no claim, support, or link.</li><li>Reorder: put the moves in the order the reader needs them.</li><li>Rewrite: fix the sentences that still resist reading aloud.</li></ul><p>Notice that style comes last. A well-ordered section with plain sentences reads better than a beautiful paragraph in the wrong place.</p>",
            contentEn:
              "<p>Most writers polish sentences first, then discover the section has to be reorganised. The order wastes work. Cut what does not serve the argument, reorder what remains, and only then improve the phrasing.</p><h3>The order that saves time</h3><ul><li>Cut: remove sentences that serve no claim, support, or link.</li><li>Reorder: put the moves in the order the reader needs them.</li><li>Rewrite: fix the sentences that still resist reading aloud.</li></ul><p>Notice that style comes last. A well-ordered section with plain sentences reads better than a beautiful paragraph in the wrong place.</p>",
          },
          {
            type: "FILE",
            titleAr: "Academic paragraph checklist",
            titleEn: "Academic paragraph checklist",
            durationSec: 300,
            attachmentAr: "قائمة فحص الفقرة الأكاديمية",
            attachmentEn: "Academic paragraph checklist",
          },
          {
            type: "QUIZ",
            titleAr: "Quiz: the edit pass",
            titleEn: "Quiz: the edit pass",
            quiz: {
              titleAr: "Quiz: the edit pass",
              titleEn: "Quiz: the edit pass",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "What is the most efficient editing order?",
                  promptEn: "What is the most efficient editing order?",
                  explanationAr:
                    "Cut, reorder, then rewrite avoids polishing text that will be deleted.",
                  explanationEn:
                    "Cut, reorder, then rewrite avoids polishing text that will be deleted.",
                  options: [
                    {
                      textAr: "Cut, reorder, then rewrite",
                      textEn: "Cut, reorder, then rewrite",
                      isCorrect: true,
                    },
                    {
                      textAr: "Rewrite, cut, reorder",
                      textEn: "Rewrite, cut, reorder",
                      isCorrect: false,
                    },
                    {
                      textAr: "Reorder, rewrite, cut",
                      textEn: "Reorder, rewrite, cut",
                      isCorrect: false,
                    },
                    { textAr: "Rewrite only", textEn: "Rewrite only", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr:
                    "A well-ordered section with plain sentences reads better than a beautiful paragraph in the wrong place.",
                  promptEn:
                    "A well-ordered section with plain sentences reads better than a beautiful paragraph in the wrong place.",
                  explanationAr: "Order serves comprehension more than phrasing does.",
                  explanationEn: "Order serves comprehension more than phrasing does.",
                  options: [
                    { textAr: "True", textEn: "True", isCorrect: true },
                    { textAr: "False", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "What should an abstract state besides the method?",
                  promptEn: "What should an abstract state besides the method?",
                  explanationAr: "The problem and the finding make an abstract stand alone.",
                  explanationEn: "The problem and the finding make an abstract stand alone.",
                  acceptedAnswers: ["the problem", "problem", "problem and finding", "finding"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "Which sentences should be cut first?",
                  promptEn: "Which sentences should be cut first?",
                  explanationAr:
                    "Sentences serving no claim, support, or link are the first to remove.",
                  explanationEn:
                    "Sentences serving no claim, support, or link are the first to remove.",
                  options: [
                    {
                      textAr: "Sentences serving no claim, support, or link",
                      textEn: "Sentences serving no claim, support, or link",
                      isCorrect: true,
                    },
                    {
                      textAr: "Sentences repeating a point already made",
                      textEn: "Sentences repeating a point already made",
                      isCorrect: true,
                    },
                    {
                      textAr: "Topic sentences that announce the paragraph",
                      textEn: "Topic sentences that announce the paragraph",
                      isCorrect: false,
                    },
                    {
                      textAr: "Sentences stating the finding",
                      textEn: "Sentences stating the finding",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "Why is polishing before reorganising wasteful?",
                  promptEn: "Why is polishing before reorganising wasteful?",
                  explanationAr: "Text may be cut or moved after polishing, so the effort is lost.",
                  explanationEn: "Text may be cut or moved after polishing, so the effort is lost.",
                  options: [
                    {
                      textAr: "Because text may be cut or moved afterwards",
                      textEn: "Because text may be cut or moved afterwards",
                      isCorrect: true,
                    },
                    {
                      textAr: "Because grammar does not matter",
                      textEn: "Because grammar does not matter",
                      isCorrect: false,
                    },
                    {
                      textAr: "Because readers ignore style",
                      textEn: "Because readers ignore style",
                      isCorrect: false,
                    },
                    {
                      textAr: "Because editing takes no time",
                      textEn: "Because editing takes no time",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "professional-business-english",
    instructorUsername: "hind-alshehri",
    categorySlug: "languages",
    titleAr: "الإنجليزية المهنية في بيئة العمل",
    titleEn: "Professional English at Work",
    subtitleAr: "كتابة بريد وتقارير واجتماعات بلغة واضحة تحترم وقت القارئ",
    subtitleEn: "Emails, reports, and meetings in clear language that respects the reader's time",
    descriptionAr:
      "الإنجليزية في العمل لا تفشل بسبب القواعد بقدر ما تفشل لأن الرسالة مدفونة. نعمل على المواقف الثلاثة التي تستهلك معظم أسبوع العمل: بريد يحصل على قرار، وتلخيص اجتماع يجعل الناس يتصرفون، وشرح مشكلة لشخص خارج فريقك.\n\nكل وحدة تبدأ من رسالة حقيقية فيها طلب خفيّ، ونعيد كتابتها حتى يظهر الطلب في السطرين الأولين. نغطي أيضًا النبرة: كيف تكون مباشرًا بلا جفاء، وكيف تعترض كتابةً، وكيف تتابع أمرًا سكت عنه الآخرون دون أن تخسر العلاقة.",
    descriptionEn:
      "Workplace English fails less often because of grammar and more often because the message is buried. We work on the three situations that take most of the working week: writing an email that gets a decision, summarizing a meeting so people act, and explaining a problem to someone outside your team.\n\nEach module starts from a real message with a hidden ask, and we rewrite it until the request is visible in the first two lines. We also cover tone: how to be direct without being abrupt, how to disagree in writing, and how to follow up on something that has gone quiet without damaging the relationship.",
    level: "ALL_LEVELS",
    language: "EN",
    priceCents: 19900,
    objectives: [
      {
        textAr: "تكتب بريدًا يظهر طلبه في السطر الأول.",
        textEn: "Write an email whose request appears in the first line.",
      },
      {
        textAr: "تلخّص اجتماعًا بحيث يعرف القارئ ما فُعل وما يجب فعله.",
        textEn: "Summarise a meeting so the reader knows what was done and what to do.",
      },
      {
        textAr: "تشرح مشكلة تقنية لشخص خارج فريقك بلا مصطلحات.",
        textEn: "Explain a technical problem to someone outside your team without jargon.",
      },
      {
        textAr: "تستخدم نبرة مباشرة دون أن تبدو فجّة.",
        textEn: "Use a direct tone without sounding abrupt.",
      },
      {
        textAr: "تعترض كتابيًا على قرار وتقترح بديلًا.",
        textEn: "Disagree in writing with a decision and propose an alternative.",
      },
      {
        textAr: "تتابع رسالة لم يُردّ عليها دون إحراج.",
        textEn: "Follow up on an unanswered message without awkwardness.",
      },
    ],
    requirements: [
      { textAr: "مستوى إنجليزية متوسط على الأقل.", textEn: "At least intermediate English." },
      {
        textAr: "تجربة عملية في العمل ضمن فريق.",
        textEn: "Practical experience working in a team.",
      },
      { textAr: "لا حاجة إلى شهادة لغوية.", textEn: "No language certificate needed." },
    ],
    sections: [
      {
        titleAr: "Emails That Get Answered",
        titleEn: "Emails That Get Answered",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "Why the ask gets buried",
            titleEn: "Why the ask gets buried",
            isPreview: true,
            durationSec: 420,
          },
          {
            type: "VIDEO",
            titleAr: "The first two lines decide",
            titleEn: "The first two lines decide",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "Direct without being abrupt",
            titleEn: "Direct without being abrupt",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "Following up without friction",
            titleEn: "Following up without friction",
            durationSec: 480,
          },
          {
            type: "TEXT",
            titleAr: "Reading: the subject line is a promise",
            titleEn: "Reading: the subject line is a promise",
            durationSec: 300,
            contentAr:
              "<p>Most emails are opened by the subject line alone, and many are postponed because the subject says nothing. «Quick question» makes the reader open it to find out what it is about; «Approval needed for Tuesday's launch» lets them decide immediately.</p><h3>Three subject patterns that work</h3><ul><li>Action plus deadline: «Review needed by Thursday».</li><li>Topic plus decision: «Vendor choice: A or B».</li><li>Status plus risk: «Launch on track, one dependency».</li></ul><p>The pattern matters less than the content: a subject that names the decision saves the reader from opening the message to discover it.</p>",
            contentEn:
              "<p>Most emails are opened by the subject line alone, and many are postponed because the subject says nothing. «Quick question» makes the reader open it to find out what it is about; «Approval needed for Tuesday's launch» lets them decide immediately.</p><h3>Three subject patterns that work</h3><ul><li>Action plus deadline: «Review needed by Thursday».</li><li>Topic plus decision: «Vendor choice: A or B».</li><li>Status plus risk: «Launch on track, one dependency».</li></ul><p>The pattern matters less than the content: a subject that names the decision saves the reader from opening the message to discover it.</p>",
          },
        ],
      },
      {
        titleAr: "Meetings and Explanations",
        titleEn: "Meetings and Explanations",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "Summaries people act on",
            titleEn: "Summaries people act on",
            isPreview: true,
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "Explaining a technical problem simply",
            titleEn: "Explaining a technical problem simply",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "Disagreeing in writing",
            titleEn: "Disagreeing in writing",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "Reading: the summary that replaces the meeting",
            titleEn: "Reading: the summary that replaces the meeting",
            durationSec: 360,
            contentAr:
              "<p>A meeting summary that recounts the discussion is a transcript with extra work. A useful summary records only what someone must do differently because the meeting happened.</p><h3>Three sections, nothing else</h3><ul><li>Decisions: what is now settled, in one line each.</li><li>Actions: who does what by when.</li><li>Open questions: what remains unresolved and who owns it.</li></ul><p>Anything that does not fit these three is context for a conversation, not a summary. Cutting it is not laziness; it is what makes the document get read.</p>",
            contentEn:
              "<p>A meeting summary that recounts the discussion is a transcript with extra work. A useful summary records only what someone must do differently because the meeting happened.</p><h3>Three sections, nothing else</h3><ul><li>Decisions: what is now settled, in one line each.</li><li>Actions: who does what by when.</li><li>Open questions: what remains unresolved and who owns it.</li></ul><p>Anything that does not fit these three is context for a conversation, not a summary. Cutting it is not laziness; it is what makes the document get read.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "Quiz: emails and meetings",
            titleEn: "Quiz: emails and meetings",
            quiz: {
              titleAr: "Quiz: emails and meetings",
              titleEn: "Quiz: emails and meetings",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 900,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "What makes an email subject line useful?",
                  promptEn: "What makes an email subject line useful?",
                  explanationAr:
                    "Naming the decision or action lets the reader prioritise without opening it.",
                  explanationEn:
                    "Naming the decision or action lets the reader prioritise without opening it.",
                  options: [
                    {
                      textAr: "It names the decision or action",
                      textEn: "It names the decision or action",
                      isCorrect: true,
                    },
                    {
                      textAr: "It is short and vague",
                      textEn: "It is short and vague",
                      isCorrect: false,
                    },
                    {
                      textAr: "It uses «Quick question»",
                      textEn: "It uses «Quick question»",
                      isCorrect: false,
                    },
                    {
                      textAr: "It is written in caps",
                      textEn: "It is written in caps",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "A meeting summary should recount the whole discussion.",
                  promptEn: "A meeting summary should recount the whole discussion.",
                  explanationAr: "Only decisions, actions, and open questions belong in a summary.",
                  explanationEn: "Only decisions, actions, and open questions belong in a summary.",
                  options: [
                    { textAr: "True", textEn: "True", isCorrect: false },
                    { textAr: "False", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "What three sections belong in a meeting summary?",
                  promptEn: "What three sections belong in a meeting summary?",
                  explanationAr: "Decisions, actions, and open questions are the three sections.",
                  explanationEn: "Decisions, actions, and open questions are the three sections.",
                  acceptedAnswers: [
                    "decisions, actions, open questions",
                    "decisions actions open questions",
                    "decisions and actions",
                    "actions and decisions",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "Which patterns make a subject line work?",
                  promptEn: "Which patterns make a subject line work?",
                  explanationAr:
                    "Action plus deadline and topic plus decision both tell the reader what to do.",
                  explanationEn:
                    "Action plus deadline and topic plus decision both tell the reader what to do.",
                  options: [
                    {
                      textAr: "Action plus deadline",
                      textEn: "Action plus deadline",
                      isCorrect: true,
                    },
                    {
                      textAr: "Topic plus decision",
                      textEn: "Topic plus decision",
                      isCorrect: true,
                    },
                    {
                      textAr: "A single vague word",
                      textEn: "A single vague word",
                      isCorrect: false,
                    },
                    {
                      textAr: "An internal code only the sender knows",
                      textEn: "An internal code only the sender knows",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "What does a follow-up email need to avoid?",
                  promptEn: "What does a follow-up email need to avoid?",
                  explanationAr:
                    "Frictionless follow-ups restate the ask rather than implying neglect.",
                  explanationEn:
                    "Frictionless follow-ups restate the ask rather than implying neglect.",
                  options: [
                    {
                      textAr: "Implying the recipient ignored you",
                      textEn: "Implying the recipient ignored you",
                      isCorrect: true,
                    },
                    {
                      textAr: "Restating the original ask",
                      textEn: "Restating the original ask",
                      isCorrect: false,
                    },
                    {
                      textAr: "Offering a new deadline",
                      textEn: "Offering a new deadline",
                      isCorrect: false,
                    },
                    { textAr: "Keeping it short", textEn: "Keeping it short", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "Tone and Repair",
        titleEn: "Tone and Repair",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "Tone across cultures",
            titleEn: "Tone across cultures",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "Repairing a message that landed badly",
            titleEn: "Repairing a message that landed badly",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "Reading: why an email feels rude in another office",
            titleEn: "Reading: why an email feels rude in another office",
            durationSec: 300,
            contentAr:
              "<p>The same sentence can read as efficient in one office and cold in another. Short sentences and direct requests are valued in some cultures and read as impatient in others, and no grammar rule settles it.</p><h3>Two adjustments that travel well</h3><ul><li>Name the reason for the request, not just the request.</li><li>Offer a choice of timing rather than a demand.</li></ul><p>«Send this by Thursday» becomes «Could this reach me by Thursday? It blocks the release review», which keeps the deadline and adds a reason the reader can weigh. The second version is not weaker; it is more likely to be acted on.</p>",
            contentEn:
              "<p>The same sentence can read as efficient in one office and cold in another. Short sentences and direct requests are valued in some cultures and read as impatient in others, and no grammar rule settles it.</p><h3>Two adjustments that travel well</h3><ul><li>Name the reason for the request, not just the request.</li><li>Offer a choice of timing rather than a demand.</li></ul><p>«Send this by Thursday» becomes «Could this reach me by Thursday? It blocks the release review», which keeps the deadline and adds a reason the reader can weigh. The second version is not weaker; it is more likely to be acted on.</p>",
          },
          {
            type: "FILE",
            titleAr: "Workplace email patterns",
            titleEn: "Workplace email patterns",
            durationSec: 300,
            attachmentAr: "أنماط البريد المهني",
            attachmentEn: "Workplace email patterns",
          },
          {
            type: "QUIZ",
            titleAr: "Quiz: tone and repair",
            titleEn: "Quiz: tone and repair",
            quiz: {
              titleAr: "Quiz: tone and repair",
              titleEn: "Quiz: tone and repair",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "Why can the same sentence feel rude in another office?",
                  promptEn: "Why can the same sentence feel rude in another office?",
                  explanationAr:
                    "Directness is valued differently across cultures, and no grammar rule settles it.",
                  explanationEn:
                    "Directness is valued differently across cultures, and no grammar rule settles it.",
                  options: [
                    {
                      textAr: "Because directness is valued differently across cultures",
                      textEn: "Because directness is valued differently across cultures",
                      isCorrect: true,
                    },
                    {
                      textAr: "Because the grammar is wrong",
                      textEn: "Because the grammar is wrong",
                      isCorrect: false,
                    },
                    {
                      textAr: "Because email is always rude",
                      textEn: "Because email is always rude",
                      isCorrect: false,
                    },
                    {
                      textAr: "Because the recipient cannot read",
                      textEn: "Because the recipient cannot read",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "Adding a reason to a request makes it more likely to be acted on.",
                  promptEn: "Adding a reason to a request makes it more likely to be acted on.",
                  explanationAr:
                    "A reason lets the reader weigh the deadline instead of merely obeying it.",
                  explanationEn:
                    "A reason lets the reader weigh the deadline instead of merely obeying it.",
                  options: [
                    { textAr: "True", textEn: "True", isCorrect: true },
                    { textAr: "False", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "What should you do when a message lands badly?",
                  promptEn: "What should you do when a message lands badly?",
                  explanationAr:
                    "Repairing means naming the misunderstanding and restating the intent plainly.",
                  explanationEn:
                    "Repairing means naming the misunderstanding and restating the intent plainly.",
                  acceptedAnswers: ["repair", "apologise and clarify", "clarify", "restate"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "Which adjustments make a request travel well across cultures?",
                  promptEn: "Which adjustments make a request travel well across cultures?",
                  explanationAr:
                    "Naming the reason and offering timing choices both soften a demand without losing the deadline.",
                  explanationEn:
                    "Naming the reason and offering timing choices both soften a demand without losing the deadline.",
                  options: [
                    {
                      textAr: "Naming the reason for the request",
                      textEn: "Naming the reason for the request",
                      isCorrect: true,
                    },
                    {
                      textAr: "Offering a choice of timing",
                      textEn: "Offering a choice of timing",
                      isCorrect: true,
                    },
                    {
                      textAr: "Using more capital letters",
                      textEn: "Using more capital letters",
                      isCorrect: false,
                    },
                    {
                      textAr: "Removing the deadline",
                      textEn: "Removing the deadline",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "Which version keeps the deadline and adds a reason?",
                  promptEn: "Which version keeps the deadline and adds a reason?",
                  explanationAr:
                    "The version with «it blocks the release review» keeps the date and explains it.",
                  explanationEn:
                    "The version with «it blocks the release review» keeps the date and explains it.",
                  options: [
                    {
                      textAr: "«Could this reach me by Thursday? It blocks the release review.»",
                      textEn: "«Could this reach me by Thursday? It blocks the release review.»",
                      isCorrect: true,
                    },
                    {
                      textAr: "«Send this by Thursday.»",
                      textEn: "«Send this by Thursday.»",
                      isCorrect: false,
                    },
                    {
                      textAr: "«Whenever you can.»",
                      textEn: "«Whenever you can.»",
                      isCorrect: false,
                    },
                    { textAr: "«URGENT!!!»", textEn: "«URGENT!!!»", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "arabic-editing-and-proofreading",
    instructorUsername: "hind-alshehri",
    categorySlug: "languages",
    titleAr: "التحرير والتصحيح اللغوي للنصوص العربية",
    titleEn: "Arabic Editing and Proofreading",
    subtitleAr: "مراجعة تكشف الخطأ وتفهم سبب وقوعه، وتُصلح النصّ دون أن تُغيّر صوت كاتبه",
    subtitleEn:
      "A review that finds the error, understands its cause, and corrects the text without erasing the author's voice",
    descriptionAr:
      "التحرير الجيد ليس تصحيح أخطاء إملائية فقط. نبدأ من نصّ حقيقي فيه جُمل طويلة، وتكرار، وضمائر غامضة، ونفصل بين ما هو خطأ لغوي وما هو قرار أسلوبي يحتاج نقاشًا مع الكاتب. ثم نرتّب عملنا على ثلاث طبقات: المعنى، ثم البنية، ثم اللغة.\n\nنتناول بعد ذلك الأخطاء الشائعة في الكتابة العربية المعاصرة: الهمزات، وعلامات الترقيم، والاتّساق في المصطلح، والتذكير والتأنيث. نختتم بتحرير نصّ كامل وإعداد ملاحظات للكاتب تشرح سبب كل تغيير بدل أن تسلّمه نسخة معدّلة بلا تفسير.",
    descriptionEn:
      "Good editing is not just fixing spelling. We start from a real text with long sentences, repetition, and unclear pronouns, and separate a language error from a stylistic decision that needs discussing with the author. We then order the work in three layers: meaning, structure, then language.\n\nWe then cover common errors in contemporary Arabic writing: hamzas, punctuation, terminology consistency, and grammatical gender agreement. We finish by editing a full text and preparing notes for the author that explain each change instead of handing back a rewritten copy with no explanation.",
    level: "INTERMEDIATE",
    language: "AR",
    priceCents: 0,
    objectives: [
      {
        textAr: "تفصل بين الخطأ اللغوي والقرار الأسلوبي.",
        textEn: "Separate a language error from a stylistic decision.",
      },
      {
        textAr: "تحرّر على ثلاث طبقات: المعنى ثم البنية ثم اللغة.",
        textEn: "Edit in three layers: meaning, structure, then language.",
      },
      {
        textAr: "تصحّح الهمزات وعلامات الترقيم في سياقها.",
        textEn: "Correct hamzas and punctuation in context.",
      },
      { textAr: "توحّد المصطلح في نصّ طويل.", textEn: "Unify terminology across a long text." },
      {
        textAr: "تكتب ملاحظات للكاتب تشرح سبب كل تغيير.",
        textEn: "Write notes to the author explaining each change's reason.",
      },
      {
        textAr: "تحافظ على صوت الكاتب مع تحسين الوضوح.",
        textEn: "Preserve the author's voice while improving clarity.",
      },
    ],
    requirements: [
      { textAr: "تمكّن جيد من العربية الفصحى.", textEn: "Solid command of standard Arabic." },
      {
        textAr: "نصّ عربي طويل نسبيًا للتدريب عليه.",
        textEn: "A relatively long Arabic text to practise on.",
      },
      {
        textAr: "لا حاجة إلى خلفية أكاديمية في اللغة.",
        textEn: "No academic background in linguistics needed.",
      },
    ],
    sections: [
      {
        titleAr: "طبقات التحرير",
        titleEn: "Layers of Editing",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا نبدأ من المعنى لا من الإملاء",
            titleEn: "Why we start with meaning, not spelling",
            isPreview: true,
            durationSec: 420,
          },
          {
            type: "VIDEO",
            titleAr: "فصل الخطأ عن القرار الأسلوبي",
            titleEn: "Separating an error from a stylistic choice",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "البنية: الفقرة والانتقال بينها",
            titleEn: "Structure: the paragraph and its transitions",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "الجملة الطويلة: كيف نفكّها دون فقدان المعنى",
            titleEn: "The long sentence: splitting without losing meaning",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: ما نتركه للكاتب وما نقرّره",
            titleEn: "Reading: what we leave to the author and what we decide",
            durationSec: 300,
            contentAr:
              "<p>ليس كل ما يعجبنا في النصّ مشكلة. التحرير مهنة قرارات، وأصعبها التمييز بين ما يجب تغييره وما يجب أن يُترك لأن الكاتب اختاره عن قصد.</p><h3>ثلاث فئات</h3><ul><li>خطأ واضح: يُصحَّح ويُذكر السبب.</li><li>اختيار أسلوبي: يُقترح لا يُفرض.</li><li>غموض يحتاج الكاتب: يُسأل لا يُخمَّن.</li></ul><p>الفئة الثالثة هي التي تحمي النصّ من محرّر يفرض تفسيره. حين تسأل «هل قصدت هذا؟» تحصل على جملة أدقّ ممّا لو كتبتها بنفسك.</p>",
            contentEn:
              "<p>Not everything we dislike in a text is a problem. Editing is a profession of decisions, and the hardest is telling what must change from what must stay because the author chose it deliberately.</p><h3>Three categories</h3><ul><li>A clear error: corrected, with the reason given.</li><li>A stylistic choice: suggested, not imposed.</li><li>An ambiguity needing the author: asked about, not guessed.</li></ul><p>The third category protects a text from an editor imposing their reading. When you ask «did you mean this?», you get a more accurate sentence than if you had written it yourself.</p>",
          },
        ],
      },
      {
        titleAr: "اللغة والمصطلح",
        titleEn: "Language and Terminology",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "الهمزات: قواعد وحالات مربكة",
            titleEn: "Hamzas: rules and confusing cases",
            isPreview: true,
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "علامات الترقيم في العربية المعاصرة",
            titleEn: "Punctuation in contemporary Arabic",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "توحيد المصطلح في نصّ طويل",
            titleEn: "Unifying terminology in a long text",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: علامة الترقيم التي تغيّر المعنى",
            titleEn: "Reading: the punctuation mark that changes meaning",
            durationSec: 360,
            contentAr:
              "<p>وضع فاصلة في المكان الخطأ لا يجعل الجملة ركيكة فقط، بل قد يغيّر المعنى. جملة بلا فاصلة قد تُقرأ بحسبين مختلفين، وكلاهما مقبول لغويًا، وهذا أخطر من خطأ إملائي واضح.</p><h3>ثلاث حالات متكرّرة</h3><ul><li>الواو مع جملة معطوفة طويلة: هل تبدأ جملة جديدة؟</li><li>النقطتان قبل التعداد: هل القائمة تكمل الجملة أم تشرحها؟</li><li>الشرطة بين جملتين: هل التفسير جزء من الجملة أم استطراد؟</li></ul><p>القاعدة العملية: اقرأ الجملة بصوتك. مواضع التوقّف الطبيعية هي مواضع الترقيم غالبًا.</p>",
            contentEn:
              "<p>A comma in the wrong place does not only make a sentence clumsy; it can change the meaning. A sentence without a comma may be read two different ways, both grammatically valid, and that is more dangerous than an obvious spelling error.</p><h3>Three recurring cases</h3><ul><li>«And» before a long coordinated clause: does a new sentence start?</li><li>A colon before a list: does it complete the sentence or explain it?</li><li>A dash between sentences: is the explanation part of the sentence or an aside?</li></ul><p>The working rule: read the sentence aloud. The natural places to pause are usually where punctuation belongs.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الطبقات واللغة",
            titleEn: "Quiz: layers and language",
            quiz: {
              titleAr: "اختبار: الطبقات واللغة",
              titleEn: "Quiz: layers and language",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 900,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "بأي طبقة نبدأ التحرير؟",
                  promptEn: "Which layer of editing do we start with?",
                  explanationAr: "المعنى أولًا، فالبنية ثم اللغة؛ البدء بالإملاء يضيّع الجهد.",
                  explanationEn:
                    "Meaning first, then structure, then language; starting with spelling wastes effort.",
                  options: [
                    { textAr: "المعنى", textEn: "Meaning", isCorrect: true },
                    { textAr: "الإملاء", textEn: "Spelling", isCorrect: false },
                    { textAr: "الترقيم", textEn: "Punctuation", isCorrect: false },
                    { textAr: "الخطّ", textEn: "Typography", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "كل ما لا يعجبنا في النصّ يجب أن يُغيَّر.",
                  promptEn: "Everything we dislike in a text must be changed.",
                  explanationAr: "بعض ما لا يعجبنا اختيار أسلوبي للكاتب يُقترح لا يُفرض.",
                  explanationEn:
                    "Some of what we dislike is the author's stylistic choice, suggested not imposed.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ماذا نفعل بالغموض الذي يحتاج قرار الكاتب؟",
                  promptEn: "What do we do with ambiguity needing the author's decision?",
                  explanationAr: "نسأل الكاتب عن قصده بدل أن نخمّن ونفرض تفسيرنا.",
                  explanationEn:
                    "We ask the author their intent instead of guessing and imposing our reading.",
                  acceptedAnswers: [
                    "ask the author",
                    "ask",
                    "question the author",
                    "clarify with the author",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يندرج في فئة الخطأ الواضح؟",
                  promptEn: "Which of these fall under a clear error?",
                  explanationAr:
                    "الهمزة الخاطئة والمصطلح غير الموحّد أخطاء قابلة للتصحيح مع ذكر السبب.",
                  explanationEn:
                    "A wrong hamza and inconsistent terminology are correctable with a stated reason.",
                  options: [
                    {
                      textAr: "همزة مكتوبة في غير موضعها",
                      textEn: "A hamza written in the wrong place",
                      isCorrect: true,
                    },
                    {
                      textAr: "مصطلح مكتوب بصيغتين في النصّ",
                      textEn: "A term written two ways in the text",
                      isCorrect: true,
                    },
                    {
                      textAr: "اختيار الكاتب لجملة قصيرة",
                      textEn: "The author's choice of a short sentence",
                      isCorrect: false,
                    },
                    {
                      textAr: "نبرة الكاتب الشخصية",
                      textEn: "The author's personal tone",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما القاعدة العملية لمواضع الترقيم؟",
                  promptEn: "What is the practical rule for punctuation placement?",
                  explanationAr: "القراءة بصوت مسموع تكشف مواضع التوقّف الطبيعية.",
                  explanationEn: "Reading aloud reveals the natural places to pause.",
                  options: [
                    {
                      textAr: "اقرأ الجملة بصوتك ووقّف عند التوقّف الطبيعي",
                      textEn: "Read the sentence aloud and pause where it naturally pauses",
                      isCorrect: true,
                    },
                    {
                      textAr: "ضع فاصلة بعد كل كلمة",
                      textEn: "Put a comma after every word",
                      isCorrect: false,
                    },
                    {
                      textAr: "احذف كل الترقيم",
                      textEn: "Delete all punctuation",
                      isCorrect: false,
                    },
                    {
                      textAr: "اتبع عدد الكلمات فقط",
                      textEn: "Follow the word count only",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "الملاحظات والتسليم",
        titleEn: "Notes and Handover",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "ملاحظة تشرح السبب لا تعطي نسخة جاهزة",
            titleEn: "A note explaining the reason, not handing a rewrite",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "الحفاظ على صوت الكاتب",
            titleEn: "Preserving the author's voice",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: كيف تكتب ملاحظة لا تُغضب الكاتب",
            titleEn: "Reading: writing a note the author will not resent",
            durationSec: 300,
            contentAr:
              "<p>الملاحظة التي تبدأ بـ«هذه الجملة خاطئة» تضع الكاتب في موضع الدفاع. الملاحظة التي تبدأ بالمشكلة التي رآها القارئ تضع الاثنين في موضع واحد ضدّ المشكلة.</p><h3>بنية الملاحظة</h3><ul><li>ما الذي فهمته من الجملة؟</li><li>ما الذي قد يفهمه قارئ آخر؟</li><li>ما التعديل المقترح، ولماذا يحلّ الالتباس؟</li></ul><p>ابدأ بما فهمته لا بما أخطأ فيه. هذا الترتيب يجعل الكاتب يرى المشكلة بنفسه، ويقبل التعديل لأنه يخدم المعنى لا ذوق المحرّر.</p>",
            contentEn:
              "<p>A note starting with «this sentence is wrong» puts the author on the defensive. A note starting with the problem the reader encountered puts both of you on the same side against the problem.</p><h3>The shape of a note</h3><ul><li>What I understood from the sentence.</li><li>What another reader might understand instead.</li><li>The suggested change, and why it resolves the ambiguity.</li></ul><p>Start with what you understood, not what was wrong. This order lets the author see the problem themselves and accept the edit because it serves meaning, not the editor's taste.</p>",
          },
          {
            type: "FILE",
            titleAr: "ورقة مراجعة نصّ عربي",
            titleEn: "Arabic text review sheet",
            durationSec: 300,
            attachmentAr: "ورقة مراجعة نصّ عربي",
            attachmentEn: "Arabic text review sheet",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الملاحظات والتسليم",
            titleEn: "Quiz: notes and handover",
            quiz: {
              titleAr: "اختبار: الملاحظات والتسليم",
              titleEn: "Quiz: notes and handover",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "بماذا تبدأ ملاحظة التحرير الجيدة؟",
                  promptEn: "How does a good editing note begin?",
                  explanationAr: "البدء بما فهمته يضع الاثنين في موضع واحد ضدّ المشكلة.",
                  explanationEn:
                    "Starting with what you understood puts both on the same side against the problem.",
                  options: [
                    {
                      textAr: "بما فهمته من الجملة",
                      textEn: "With what you understood from the sentence",
                      isCorrect: true,
                    },
                    {
                      textAr: "بعبارة «هذه خاطئة»",
                      textEn: "With the phrase «this is wrong»",
                      isCorrect: false,
                    },
                    { textAr: "باسم المحرّر", textEn: "With the editor's name", isCorrect: false },
                    { textAr: "بعدد الكلمات", textEn: "With the word count", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "تسليم نسخة معدّلة بلا شرح يكفي للكاتب.",
                  promptEn:
                    "Handing back a rewritten copy with no explanation is enough for the author.",
                  explanationAr: "بدون سبب واضح لا يستطيع الكاتب تعلّم القاعدة أو قبول التغيير.",
                  explanationEn:
                    "Without a clear reason the author cannot learn the rule or accept the change.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الذي يجب أن يُشرح مع كل تعديل؟",
                  promptEn: "What must be explained with each change?",
                  explanationAr: "سبب التعديل وما يحلّه من التباس هو ما يجعل الملاحظة مقبولة.",
                  explanationEn:
                    "The reason for the change and the ambiguity it resolves make the note acceptable.",
                  acceptedAnswers: ["the reason", "reason", "why", "the rationale"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يحافظ على صوت الكاتب؟",
                  promptEn: "Which of these preserve the author's voice?",
                  explanationAr: "اقتراح التعديل وذكر ما يفهمه قارئ آخر يحفظان نبرة الكاتب.",
                  explanationEn:
                    "Suggesting rather than imposing, and naming what another reader might think, preserve the author's tone.",
                  options: [
                    {
                      textAr: "اقتراح التعديل بدل فرضه",
                      textEn: "Suggesting the change rather than imposing it",
                      isCorrect: true,
                    },
                    {
                      textAr: "ذكر ما قد يفهمه قارئ آخر",
                      textEn: "Naming what another reader might understand",
                      isCorrect: true,
                    },
                    {
                      textAr: "إعادة كتابة النصّ كاملًا بأسلوبك",
                      textEn: "Rewriting the whole text in your own style",
                      isCorrect: false,
                    },
                    {
                      textAr: "حذف كل جملة طويلة",
                      textEn: "Deleting every long sentence",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما فائدة البدء بما فهمته؟",
                  promptEn: "What is the benefit of starting with what you understood?",
                  explanationAr: "يجعل الكاتب يرى المشكلة بنفسه فيقبل التعديل.",
                  explanationEn:
                    "It lets the author see the problem themselves and accept the change.",
                  options: [
                    {
                      textAr: "يجعل الكاتب يرى المشكلة بنفسه",
                      textEn: "It lets the author see the problem themselves",
                      isCorrect: true,
                    },
                    { textAr: "يقصّر الملاحظة", textEn: "It shortens the note", isCorrect: false },
                    { textAr: "يخفي الأخطاء", textEn: "It hides the errors", isCorrect: false },
                    {
                      textAr: "يلغي الحاجة للتعديل",
                      textEn: "It removes the need for the change",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "performance-marketing-foundations",
    instructorUsername: "faisal-alduwais",
    categorySlug: "marketing",
    titleAr: "أساسيات التسويق القائم على الأداء",
    titleEn: "Performance Marketing Foundations",
    subtitleAr: "رسالة صحيحة قبل ميزانية أكبر، وقياس يربط الإنفاق بالقيمة",
    subtitleEn:
      "The right message before a bigger budget, and measurement that ties spend to value",
    descriptionAr:
      "التسويق القائم على الأداء لا يبدأ بميزانية، بل بسؤال: من نخدم، وما المشكلة التي نحلّها، وكيف يصفها العميل بكلماته. نبدأ من ثلاث حملات صغيرة برسائل مختلفة، ونرى كيف يغيّر تغيير الرسالة نتيجة الإعلان أكثر مما يغيّرها مضاعفة الميزانية.\n\nثم نبني قياسًا بسيطًا: تكلفة اكتساب العميل، وقيمة الطلب، وهامش الربح الحقيقي بعد الإعلان. نناقش أيضًا الحالات التي يبدو فيها الإعلان رابحًا لأن التكلفة لا تشمل الإرجاع أو الشحن، ونختتم بقرار واضح: أي حملة تُوقف، وأي تحمل الزيادة، ولماذا.",
    descriptionEn:
      "Performance marketing does not begin with a budget but with a question: who do we serve, what problem do we solve, and how does the customer describe it in their own words. We start with three small campaigns using different messages, and watch how changing the message moves results more than doubling the budget does.\n\nWe then build simple measurement: cost per acquired customer, order value, and the real profit margin after advertising. We also discuss cases where an ad looks profitable because the cost excludes returns or shipping, and we finish with a clear decision: which campaign to stop, which deserves an increase, and why.",
    level: "BEGINNER",
    language: "AR",
    priceCents: 21900,
    objectives: [
      {
        textAr: "تصوغ رسالة إعلانية بكلمات العميل لا بكلمات الشركة.",
        textEn: "Write an ad message in the customer's words, not the company's.",
      },
      {
        textAr: "تحسب تكلفة اكتساب العميل وقيمة الطلب.",
        textEn: "Calculate customer acquisition cost and order value.",
      },
      {
        textAr: "تحسب الهامش الحقيقي بعد الإعلان والإرجاع.",
        textEn: "Calculate real margin after advertising and returns.",
      },
      {
        textAr: "تقرّر أي حملة تُوقف وأيًا تحمل زيادة.",
        textEn: "Decide which campaign to stop and which to scale.",
      },
      {
        textAr: "تفرّق بين نتيجة تبدو جيدة ونتيجة مربحة.",
        textEn: "Tell a result that looks good from one that is profitable.",
      },
      {
        textAr: "تقرأ أرقام حملة صغيرة دون أن تنخدع بالمعدّل الواحد.",
        textEn: "Read small-campaign numbers without being fooled by a single rate.",
      },
    ],
    requirements: [
      {
        textAr: "لا حاجة إلى خبرة إعلانية سابقة.",
        textEn: "No prior advertising experience needed.",
      },
      {
        textAr: "أساسيات استخدام جداول البيانات أو آلة حاسبة.",
        textEn: "Basic spreadsheet or calculator skills.",
      },
      { textAr: "منتج أو خدمة للتدريب عليها.", textEn: "A product or service to practise on." },
    ],
    sections: [
      {
        titleAr: "الرسالة قبل الميزانية",
        titleEn: "Message Before Budget",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا لا تُصلح الميزانية رسالة خاطئة",
            titleEn: "Why a budget cannot fix a wrong message",
            isPreview: true,
            durationSec: 420,
          },
          {
            type: "VIDEO",
            titleAr: "كلمات العميل: من أين نحصل عليها",
            titleEn: "The customer's words: where to get them",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "ثلاث رسائل وثلاث حملات صغيرة",
            titleEn: "Three messages, three small campaigns",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "الاستهداف: من نستثني لا من نضيف",
            titleEn: "Targeting: who to exclude, not who to add",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: الفرق بين وصف المنتج ووصف المشكلة",
            titleEn: "Reading: the difference between describing a product and a problem",
            durationSec: 300,
            contentAr:
              "<p>«أداة إدارة مهامّ بميزات متقدّمة» لا تعني شيئًا لشخص يعاني ثلاث مهامّ متراكمة. الوصف الذي يبدأ من المشكلة يفعل شيئًا مختلفًا: يضع القارئ داخل تجربته قبل أن يعرض الحلّ.</p><h3>ثلاث خطوات لصياغة</h3><ul><li>اكتب المشكلة بكلمات قريبة من كلمات العميل.</li><li>اذكر العاقبة إن لم تُحلّ.</li><li>أظهر الحلّ بفعل محدّد لا بصفة.</li></ul><p>لاحظ أن كل خطوة قابلة للاختبار: إن لم تتغيّر نتيجة الحملة عند تغيير المشكلة، فالرسالة لم تكن المشكلة، أو الجمهور لا يعانيها فعلًا.</p>",
            contentEn:
              "<p>«A task tool with advanced features» means nothing to someone with three overdue tasks. Copy that starts from the problem does something different: it places the reader inside their experience before offering the solution.</p><h3>Three steps to draft it</h3><ul><li>Write the problem in words close to the customer's.</li><li>Name the consequence if it stays unsolved.</li><li>Show the solution as a specific action, not an adjective.</li></ul><p>Note that each step is testable: if results do not move when the problem changes, either the message was not the issue or the audience does not live with that problem.</p>",
          },
        ],
      },
      {
        titleAr: "القياس والقرار",
        titleEn: "Measurement and Decisions",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "تكلفة اكتساب العميل وقيمة الطلب",
            titleEn: "Acquisition cost and order value",
            isPreview: true,
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "الهامش الحقيقي بعد الإعلان والإرجاع",
            titleEn: "Real margin after ads and returns",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "عيّنة صغيرة: ما يمكن وما لا يمكن استنتاجه",
            titleEn: "Small samples: what you can and cannot conclude",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: حملة رابحة على الورق",
            titleEn: "Reading: a campaign that is profitable on paper",
            durationSec: 360,
            contentAr:
              "<p>حملة تكسب ٥٠ ريالًا على كل طلب تبدو رابحة حتى نضيف الشحن والإرجاع ورسوم الدفع. عندها قد يتحوّل الرقم إلى خسارة صغيرة تتكرّر مع كل عميل، وهي أخطر من خسارة كبيرة واضحة.</p><h3>ثلاثة بنود تُنسى</h3><ul><li>نسبة الإرجاع وتكلفة معالجة المرتجع.</li><li>الشحن المجاني الذي يدفعه المتجر فعلًا.</li><li>تكلفة خدمة العملاء للطلبات المعقّدة.</li></ul><p>الحملة التي تظلّ رابحة بعد هذه البنود تستحق الزيادة، وما عداها يستحق تعديلًا في العرض أو الرسالة لا ميزانية أكبر.</p>",
            contentEn:
              "<p>A campaign earning fifty riyals per order looks profitable until we add shipping, returns, and payment fees. Then the number may become a small loss that repeats with every customer, which is more dangerous than an obvious large loss.</p><h3>Three forgotten lines</h3><ul><li>The return rate and the cost of processing a return.</li><li>Free shipping the store actually pays for.</li><li>Customer-service cost on complicated orders.</li></ul><p>A campaign still profitable after these lines deserves a budget increase; anything else deserves a change in offer or message, not more money.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الرسالة والقياس",
            titleEn: "Quiz: message and measurement",
            quiz: {
              titleAr: "اختبار: الرسالة والقياس",
              titleEn: "Quiz: message and measurement",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 900,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما الذي يغيّر نتيجة الحملة أكثر غالبًا؟",
                  promptEn: "What more often changes a campaign's result?",
                  explanationAr: "تغيير الرسالة يؤثّر أكثر من مضاعفة الميزانية على رسالة ضعيفة.",
                  explanationEn:
                    "Changing the message moves more than doubling the budget behind weak copy.",
                  options: [
                    { textAr: "تغيير الرسالة", textEn: "Changing the message", isCorrect: true },
                    { textAr: "مضاعفة الميزانية", textEn: "Doubling the budget", isCorrect: false },
                    {
                      textAr: "تغيير اسم الحملة",
                      textEn: "Renaming the campaign",
                      isCorrect: false,
                    },
                    {
                      textAr: "زيادة عدد الإعلانات فقط",
                      textEn: "Only adding more ads",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي بنود تُنسى عند حساب الربح من الحملة؟",
                  promptEn: "Which lines are forgotten when computing campaign profit?",
                  explanationAr: "الإرجاع والشحن المجاني وتكلفة الدعم بنود حقيقية تُنسى.",
                  explanationEn:
                    "Returns, free shipping, and support cost are real forgotten lines.",
                  options: [
                    { textAr: "نسبة الإرجاع", textEn: "The return rate", isCorrect: true },
                    {
                      textAr: "الشحن الذي يدفعه المتجر",
                      textEn: "Shipping the store pays for",
                      isCorrect: true,
                    },
                    { textAr: "اسم المنصّة", textEn: "The platform name", isCorrect: false },
                    { textAr: "لون زرّ الإعلان", textEn: "The ad button colour", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "حملة تكسب مبلغًا على كل طلب رابحة دائمًا.",
                  promptEn: "A campaign earning an amount per order is always profitable.",
                  explanationAr: "قد تتحوّل إلى خسارة بعد الإرجاع والشحن ورسوم الدفع.",
                  explanationEn: "It can become a loss after returns, shipping, and payment fees.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما المقياس الذي يقيس تكلفة الحصول على عميل؟",
                  promptEn: "Which measure captures the cost of acquiring a customer?",
                  explanationAr: "تكلفة اكتساب العميل تقيس ما دفعناه للحصول على عميل.",
                  explanationEn:
                    "Customer acquisition cost measures what we paid to gain one customer.",
                  acceptedAnswers: [
                    "customer acquisition cost",
                    "acquisition cost",
                    "CAC",
                    "cost per acquisition",
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ماذا نفعل بحملة رابحة بعد كل البنود؟",
                  promptEn: "What do we do with a campaign profitable after all lines?",
                  explanationAr: "الحملة الرابحة بعد البنود الحقيقية تستحق زيادة الميزانية.",
                  explanationEn:
                    "A campaign profitable after real lines deserves a budget increase.",
                  options: [
                    { textAr: "نزيد ميزانيتها", textEn: "Increase its budget", isCorrect: true },
                    { textAr: "نوقفها فورًا", textEn: "Stop it immediately", isCorrect: false },
                    {
                      textAr: "نحذفها ونبدأ من جديد",
                      textEn: "Delete it and start over",
                      isCorrect: false,
                    },
                    {
                      textAr: "نغيّر رسالتها فقط",
                      textEn: "Only change its message",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "التحسين المستمر",
        titleEn: "Continuous Improvement",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "اختبار واحد في الوقت الواحد",
            titleEn: "One test at a time",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "قراءة الأرقام أسبوعيًا دون إرباك",
            titleEn: "Reading weekly numbers without confusion",
            durationSec: 600,
          },
          {
            type: "FILE",
            titleAr: "ورقة تقرير الحملة الأسبوعي",
            titleEn: "Weekly campaign report sheet",
            durationSec: 300,
            attachmentAr: "ورقة تقرير الحملة الأسبوعي",
            attachmentEn: "Weekly campaign report sheet",
          },
          {
            type: "TEXT",
            titleAr: "قراءة: ماذا تفعل حين لا تتحرّك الأرقام",
            titleEn: "Reading: what to do when the numbers will not move",
            durationSec: 300,
            contentAr:
              "<p>أحيانًا تُجرّب رسالة جديدة ولا يتغيّر شيء. هذا ليس فشلًا بالضرورة؛ قد يعني أن المشكلة ليست في الرسالة بل في العرض أو السعر أو الجمهور. الاختبار الجيد يحدّد ما نستبعده.</p><h3>ثلاثة أسئلة عند الثبات</h3><ul><li>هل الجمهور يرى الإعلان أصلًا؟</li><li>هل العرض واضح عند النقر؟</li><li>هل السعر يوقف القرار في اللحظة الأخيرة؟</li></ul><p>استبعاد سبب واحد في كل اختبار أسرع من تغيير كل شيء معًا، لأن التغيير المتعدّد لا يخبرك أيّه كان المؤثّر.</p>",
            contentEn:
              "<p>Sometimes you try a new message and nothing moves. That is not necessarily a failure; it may mean the problem is the offer, the price, or the audience rather than the message. A good test tells you what to rule out.</p><h3>Three questions when results are flat</h3><ul><li>Is the audience even seeing the ad?</li><li>Is the offer clear at the click?</li><li>Is the price stopping the decision at the last moment?</li></ul><p>Ruling out one cause per test is faster than changing everything at once, because a multi-change test cannot tell you which change did the work.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: التحسين المستمر",
            titleEn: "Quiz: continuous improvement",
            quiz: {
              titleAr: "اختبار: التحسين المستمر",
              titleEn: "Quiz: continuous improvement",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "لماذا نغيّر شيئًا واحدًا في كل اختبار؟",
                  promptEn: "Why change one thing per test?",
                  explanationAr: "التغييرات المتعدّدة لا تكشف أيّها كان المؤثّر.",
                  explanationEn: "Multiple changes cannot reveal which one did the work.",
                  options: [
                    {
                      textAr: "لنعرف أي تغيير كان المؤثّر",
                      textEn: "To know which change made the difference",
                      isCorrect: true,
                    },
                    {
                      textAr: "لتقليل عدد الحملات",
                      textEn: "To reduce the number of campaigns",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأن المنصّة تمنع غير ذلك",
                      textEn: "Because the platform forbids otherwise",
                      isCorrect: false,
                    },
                    { textAr: "لتوفير الوقت فقط", textEn: "Only to save time", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "ثبات النتائج يعني دائمًا أن الرسالة فاشلة.",
                  promptEn: "Flat results always mean the message failed.",
                  explanationAr: "قد تكون المشكلة في العرض أو السعر أو الجمهور لا الرسالة.",
                  explanationEn:
                    "The problem may be the offer, price, or audience rather than the message.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما السؤال الأول عند ثبات الأرقام؟",
                  promptEn: "What is the first question when numbers are flat?",
                  explanationAr: "نتأكد أولًا أن الجمهور يرى الإعلان فعلًا قبل تغيير الرسالة.",
                  explanationEn:
                    "First confirm the audience actually sees the ad, before changing the message.",
                  acceptedAnswers: [
                    "does the audience see the ad",
                    "is the audience seeing it",
                    "audience reach",
                    "is it seen",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما قد يكون سببًا لثبات النتائج بدل الرسالة؟",
                  promptEn: "Which of these may cause flat results instead of the message?",
                  explanationAr: "العرض والسعر والجمهور أسباب بديلة يجب استبعادها.",
                  explanationEn: "Offer, price, and audience are alternative causes to rule out.",
                  options: [
                    {
                      textAr: "عرض غير واضح عند النقر",
                      textEn: "An unclear offer at the click",
                      isCorrect: true,
                    },
                    {
                      textAr: "سعر يوقف القرار",
                      textEn: "A price stopping the decision",
                      isCorrect: true,
                    },
                    { textAr: "لون الشعار", textEn: "The logo colour", isCorrect: false },
                    { textAr: "اسم الشركة", textEn: "The company name", isCorrect: false },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما أفضل ترتيب عند تحسين حملة ضعيفة؟",
                  promptEn: "What is the best order when improving a weak campaign?",
                  explanationAr: "استبعاد الأسباب واحدًا واحدًا أوضح من تغيير كل شيء.",
                  explanationEn:
                    "Ruling out causes one by one is clearer than changing everything.",
                  options: [
                    {
                      textAr: "استبعاد سبب واحد في كل اختبار",
                      textEn: "Rule out one cause per test",
                      isCorrect: true,
                    },
                    {
                      textAr: "تغيير كل شيء دفعة واحدة",
                      textEn: "Change everything at once",
                      isCorrect: false,
                    },
                    {
                      textAr: "إيقاف الحملة نهائيًا",
                      textEn: "Stop the campaign permanently",
                      isCorrect: false,
                    },
                    { textAr: "مضاعفة الميزانية", textEn: "Double the budget", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "google-ads-campaign-management",
    instructorUsername: "faisal-alduwais",
    categorySlug: "marketing",
    titleAr: "إدارة حملات إعلانات البحث",
    titleEn: "Managing Search Ads Campaigns",
    subtitleAr: "من بنية الحساب إلى الكلمة المفتاحية التي لا تُهدر الميزانية",
    subtitleEn: "From account structure to the keyword that stops wasting budget",
    descriptionAr:
      "نبني حسابًا إعلانيًا من الصفر: حملة واحدة، ومجموعة إعلانية واحدة، وكلمات مفتاحية قليلة مقصودة. نراقب تقرير مصطلحات البحث لنرى ما الذي دفعنا مقابله فعلًا، ونستبعد الاستعلامات التي لا تخدم الهدف بلا خوف من تضييق الوصول.\n\nثم نتناول البنية التي تُربك معظم الحسابات الصغيرة: كم حملة نحتاج فعلًا، وكيف نوزّع الميزانية، وكيف نقرأ نتائج عيّنة صغيرة دون أن نبني عليها قرارًا كبيرًا. نختتم بمراجعة أسبوعية قصيرة تحمي الميزانية من التسريب الصامت.",
    descriptionEn:
      "We build an ad account from scratch: one campaign, one ad group, and a few deliberate keywords. We read the search-terms report to see what we actually paid for, and exclude queries that do not serve the goal without fearing a narrower reach.\n\nWe then cover the structure that confuses most small accounts: how many campaigns we really need, how to distribute budget, and how to read small-sample results without building a large decision on them. We finish with a short weekly review that protects the budget from silent leakage.",
    level: "INTERMEDIATE",
    language: "AR",
    priceCents: 28900,
    objectives: [
      {
        textAr: "تبني بنية حملة ومجموعة إعلانية واضحة الهدف.",
        textEn: "Build a campaign and ad-group structure with a clear goal.",
      },
      {
        textAr: "تختار كلمات مفتاحية مقصودة وتستبعد غير المناسبة.",
        textEn: "Choose deliberate keywords and exclude unsuitable ones.",
      },
      {
        textAr: "تقرأ تقرير مصطلحات البحث وتستخرج ما دفعنا مقابله.",
        textEn: "Read the search-terms report and extract what we paid for.",
      },
      {
        textAr: "توزّع الميزانية وفق هدف لا وفق توزيع متساوٍ.",
        textEn: "Distribute budget by goal rather than equally.",
      },
      {
        textAr: "تفرّق بين نتيجة تعتمد على عيّنة صغيرة وقرار موثوق.",
        textEn: "Distinguish a small-sample result from a reliable decision.",
      },
      {
        textAr: "تدير مراجعة أسبوعية تكشف تسريب الميزانية.",
        textEn: "Run a weekly review that exposes budget leakage.",
      },
    ],
    requirements: [
      {
        textAr: "معرفة بأساسيات التسويق الرقمي.",
        textEn: "Knowledge of digital marketing basics.",
      },
      {
        textAr: "حساب إعلاني تجريبي أو صلاحية إدارة حملة.",
        textEn: "A test ad account or campaign management access.",
      },
      {
        textAr: "أساسيات جداول البيانات لتحليل التقرير.",
        textEn: "Basic spreadsheets for report analysis.",
      },
    ],
    sections: [
      {
        titleAr: "البنية والكلمات",
        titleEn: "Structure and Keywords",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "كم حملة نحتاج فعلًا",
            titleEn: "How many campaigns we actually need",
            isPreview: true,
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "الكلمات المفتاحية المقصودة",
            titleEn: "Deliberate keywords",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "مطابقة الكلمات وما تسمح به",
            titleEn: "Keyword match types and what they allow",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "الإعلان الذي يطابق الكلمة",
            titleEn: "The ad that matches the keyword",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: تقرير مصطلحات البحث هو فاتورتك",
            titleEn: "Reading: the search-terms report is your invoice",
            durationSec: 360,
            contentAr:
              "<p>تظنّ أنك دفعت مقابل كلماتك المفتاحية، لكن الحقيقة أنك دفعت مقابل الاستعلامات التي كتبها الناس. تقرير مصطلحات البحث هو المكان الذي ترى فيه الفرق بين ما اخترته وما جرى.</p><h3>ثلاث قراءات أسبوعية</h3><ul><li>استعلامات صرفت مبلغًا بلا تحويل.</li><li>استعلامات تحوّلت بكفاءة أعلى من المتوقّع.</li><li>استعلامات لا تخصّ منتجك أصلًا.</li></ul><p>أضف الثانية ككلمات مستبعدة معكوسة، واحذف الأولى، وأضف الثانية إلى الكلمات الناجحة. هذه القراءة وحدها تحسّن الحساب أكثر من تغيير نصّ الإعلان.</p>",
            contentEn:
              "<p>You think you paid for your keywords, but in truth you paid for the queries people typed. The search-terms report is where you see the gap between what you chose and what happened.</p><h3>Three weekly readings</h3><ul><li>Queries that spent money without a conversion.</li><li>Queries that converted more efficiently than expected.</li><li>Queries unrelated to your product entirely.</li></ul><p>Exclude the third, cut the first, and add the second to your successful keywords. This one reading improves an account more than rewriting ad text.</p>",
          },
        ],
      },
      {
        titleAr: "الميزانية والنتائج",
        titleEn: "Budget and Results",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "توزيع الميزانية وفق الهدف",
            titleEn: "Distributing budget by goal",
            isPreview: true,
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "عيّنة صغيرة: متى نثق بالفرق",
            titleEn: "Small samples: when to trust a difference",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "التسريب الصامت في الحسابات الصغيرة",
            titleEn: "Silent leakage in small accounts",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: توزيع متساوٍ ليس عدلًا",
            titleEn: "Reading: equal distribution is not fairness",
            durationSec: 360,
            contentAr:
              "<p>توزيع الميزانية بالتساوي على الحملات يبدو عادلًا ويخفي حقيقة أن بعض الحملات لا تستحقّ الإنفاق أصلًا. الميزانية قرار، لا تقسيم.</p><h3>ثلاث قواعد للتوزيع</h3><ul><li>امنح الحملة الأقرب للشراء أكبر نصيب.</li><li>احتفظ بنسبة صغيرة للتجربة، لا أكثر.</li><li>أوقف الحملة التي لا تخدم هدفًا معلنًا بدل إبقائها للشكل.</li></ul><p>هذه القواعد تجعل الحساب يعكس أولويات العمل، لا رغبة في إرضاء كل الأفكار في وقت واحد.</p>",
            contentEn:
              "<p>Spreading the budget equally across campaigns looks fair and hides the fact that some campaigns do not deserve spend at all. A budget is a decision, not a division.</p><h3>Three distribution rules</h3><ul><li>Give the campaign closest to purchase the largest share.</li><li>Keep a small share for testing, no more.</li><li>Pause a campaign serving no stated goal instead of keeping it for appearance.</li></ul><p>These rules make the account reflect business priorities rather than a wish to please every idea at once.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: البنية والميزانية",
            titleEn: "Quiz: structure and budget",
            quiz: {
              titleAr: "اختبار: البنية والميزانية",
              titleEn: "Quiz: structure and budget",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 1200,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما الذي ندفع مقابله فعلًا في إعلانات البحث؟",
                  promptEn: "What do we actually pay for in search ads?",
                  explanationAr: "الدفع مقابل الاستعلامات التي كتبها الناس، لا لقائمة كلماتك.",
                  explanationEn: "We pay for the queries people typed, not for your keyword list.",
                  options: [
                    {
                      textAr: "الاستعلامات التي كتبها الناس",
                      textEn: "The queries people typed",
                      isCorrect: true,
                    },
                    {
                      textAr: "قائمة كلماتك المفتاحية",
                      textEn: "Your keyword list",
                      isCorrect: false,
                    },
                    { textAr: "عدد الإعلانات", textEn: "The number of ads", isCorrect: false },
                    { textAr: "اسم الحساب", textEn: "The account name", isCorrect: false },
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما تفعله بعد قراءة تقرير مصطلحات البحث؟",
                  promptEn: "Which of these follow from reading the search-terms report?",
                  explanationAr: "استبعاد غير المناسب وإضافة الناجح وتحذف المكلف بلا نتيجة.",
                  explanationEn:
                    "Exclude irrelevant terms, add winners, and cut costly no-result terms.",
                  options: [
                    {
                      textAr: "استبعاد الاستعلامات غير المناسبة",
                      textEn: "Excluding irrelevant queries",
                      isCorrect: true,
                    },
                    {
                      textAr: "إضافة الاستعلامات الناجحة ككلمات",
                      textEn: "Adding successful queries as keywords",
                      isCorrect: true,
                    },
                    {
                      textAr: "حذف التقرير بعد القراءة",
                      textEn: "Deleting the report after reading",
                      isCorrect: false,
                    },
                    {
                      textAr: "توزيع الميزانية بالتساوي",
                      textEn: "Distributing budget equally",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "توزيع الميزانية بالتساوي على الحملات هو الأسلوب الأفضل.",
                  promptEn: "Equal budget distribution across campaigns is the best approach.",
                  explanationAr: "التوزيع وفق الهدف لا بالتساوي هو ما يخدم العمل.",
                  explanationEn:
                    "Distribution by goal rather than equally is what serves the business.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما نوع الكلمات التي تمنع ظهور إعلانك على استعلام غير مناسب؟",
                  promptEn: "What kind of keywords stop your ad appearing on an unsuitable query?",
                  explanationAr: "الكلمات المستبعدة تمنع الظهور على استعلامات لا تخصّك.",
                  explanationEn:
                    "Negative keywords stop your ad appearing on queries unrelated to you.",
                  acceptedAnswers: [
                    "negative keywords",
                    "negatives",
                    "negative keyword",
                    "excluded keywords",
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما أخطر ما يحدث في الحسابات الصغيرة؟",
                  promptEn: "What is the most dangerous thing in small accounts?",
                  explanationAr: "التسريب الصامت يستهلك الميزانية بلا ملاحظة أحد.",
                  explanationEn: "Silent leakage consumes budget without anyone noticing.",
                  options: [
                    {
                      textAr: "تسريب صامت للميزانية",
                      textEn: "Silent budget leakage",
                      isCorrect: true,
                    },
                    {
                      textAr: "زيادة عدد الإعلانات",
                      textEn: "More ads being added",
                      isCorrect: false,
                    },
                    {
                      textAr: "تغيّر لون الواجهة",
                      textEn: "The interface colour changing",
                      isCorrect: false,
                    },
                    { textAr: "بطء التقرير", textEn: "A slow report", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "المراجعة الأسبوعية",
        titleEn: "The Weekly Review",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "مراجعة في عشرين دقيقة",
            titleEn: "A twenty-minute review",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "قرارات المراجعة الثلاثة",
            titleEn: "The three review decisions",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: ثلاث قرارات فقط كل أسبوع",
            titleEn: "Reading: only three decisions each week",
            durationSec: 300,
            contentAr:
              "<p>المراجعة الطويلة تنتهي بلا قرار. المراجعة المفيدة تحدّد ثلاثة قرارات فقط: ما نوقفه، وما نزيده، وما نجرّبه. كل قرار له سبب مكتوب ورقم يسنده، ولا يُتّخذ قرار بلا هذين.</p><h3>قاعدة الأسبوع</h3><ul><li>أوقف ما صرف بلا نتيجة لثلاثة أسابيع متتالية.</li><li>زد ما يحقّق هدفه بكفاءة ثابتة.</li><li>جرّب تغييرًا واحدًا فقط.</li></ul><p>هذه القاعدة تمنع الحساب من التضخّم بلا سبب، وتجعل كل ريال له مبرّر يمكن مراجعته لاحقًا.</p>",
            contentEn:
              "<p>A long review ends without a decision. A useful review makes only three decisions: what to pause, what to increase, and what to test. Each decision has a written reason and a number supporting it.</p><h3>The weekly rule</h3><ul><li>Pause what spent with no result for three consecutive weeks.</li><li>Increase what meets its goal at a stable efficiency.</li><li>Test exactly one change.</li></ul><p>This rule keeps an account from growing without reason and gives every riyal a justification that can be reviewed later.</p>",
          },
          {
            type: "FILE",
            titleAr: "قائمة المراجعة الأسبوعية للحساب",
            titleEn: "Weekly account review checklist",
            durationSec: 300,
            attachmentAr: "قائمة المراجعة الأسبوعية للحساب",
            attachmentEn: "Weekly account review checklist",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: المراجعة الأسبوعية",
            titleEn: "Quiz: the weekly review",
            quiz: {
              titleAr: "اختبار: المراجعة الأسبوعية",
              titleEn: "Quiz: the weekly review",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "كم قرارًا تتّخذ المراجعة الأسبوعية؟",
                  promptEn: "How many decisions does the weekly review make?",
                  explanationAr: "ثلاثة قرارات: إيقاف وزيادة وتجربة.",
                  explanationEn: "Three decisions: pause, increase, and test.",
                  options: [
                    { textAr: "ثلاثة", textEn: "Three", isCorrect: true },
                    { textAr: "عشرة", textEn: "Ten", isCorrect: false },
                    { textAr: "قرار واحد فقط", textEn: "Only one", isCorrect: false },
                    { textAr: "لا قرارات", textEn: "No decisions", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "نوقف ما صرف بلا نتيجة لثلاثة أسابيع متتالية.",
                  promptEn: "We pause what spent with no result for three consecutive weeks.",
                  explanationAr: "هذه القاعدة تمنع تسريب الميزانية الصامت.",
                  explanationEn: "This rule prevents silent budget leakage.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "كم تغييرًا نجرّب في الأسبوع؟",
                  promptEn: "How many changes do we test per week?",
                  explanationAr: "تغيير واحد في كل أسبوع يجعل الأثر قابلًا للقراءة.",
                  explanationEn: "One change per week keeps the effect readable.",
                  acceptedAnswers: ["one", "one change", "a single change", "1"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي قرارات تنتمي للمراجعة الأسبوعية؟",
                  promptEn: "Which decisions belong in the weekly review?",
                  explanationAr:
                    "قرارا الميزانية في المراجعة هما الإيقاف والزيادة؛ حذف الموقع وتغيير اللون ليسا قرارَي ميزانية.",
                  explanationEn:
                    "The budget decisions in the review are pause and increase; deleting the site and changing colour are not budget decisions.",
                  options: [
                    { textAr: "ما نوقفه", textEn: "What to pause", isCorrect: true },
                    { textAr: "ما نزيده", textEn: "What to increase", isCorrect: true },
                    {
                      textAr: "حذف الموقع بالكامل",
                      textEn: "Deleting the entire site",
                      isCorrect: false,
                    },
                    {
                      textAr: "تغيير لون الزرّ",
                      textEn: "Changing the button colour",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ماذا يحتاج كل قرار في المراجعة؟",
                  promptEn: "What does each review decision need?",
                  explanationAr: "سبب مكتوب ورقم يسنده هما أساس القرار القابل للمراجعة.",
                  explanationEn:
                    "A written reason and a supporting number make the decision reviewable.",
                  options: [
                    {
                      textAr: "سبب مكتوب ورقم يسنده",
                      textEn: "A written reason and a supporting number",
                      isCorrect: true,
                    },
                    {
                      textAr: "اسم من اقترحه فقط",
                      textEn: "Only the name of who suggested it",
                      isCorrect: false,
                    },
                    { textAr: "لونًا جديدًا", textEn: "A new colour", isCorrect: false },
                    { textAr: "لا شيء", textEn: "Nothing", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "analytics-and-measurement-plans",
    instructorUsername: "faisal-alduwais",
    categorySlug: "marketing",
    titleAr: "خطط القياس والتحليلات الرقمية",
    titleEn: "Measurement Plans and Digital Analytics",
    subtitleAr: "خطّة قياس مكتوبة قبل جمع البيانات، تجيب عن قرار لا عن فضول",
    subtitleEn:
      "A written measurement plan before data collection, answering a decision rather than curiosity",
    descriptionAr:
      "جمع البيانات سهل، لكن معظم الفرق تجمع ما تستطيع بدل ما تحتاج. نبدأ من قرار حقيقي: هل نغيّر صفحة الدفع أم نحسّن الإعلان؟ ثم نكتب خطّة قياس تحدد السؤال، والمقياس، والمصدر، ومن يقرأ النتيجة، وقبل ذلك: ماذا سنفعل إن جاء الرقم عكس المتوقّع.\n\nنغطّي الجانب التقني بدرجة كافية للتعاون مع المطوّرين: الأحداث، وخصائص المستخدم، وحدود التتبّع عبر الأجهزة، وأثر حجب التتبّع. نختتم بمراجعة خطّة قياس مكتوبة ونبحث فيها الثغرات قبل أن تُصرف ميزانية على تنفيذها.",
    descriptionEn:
      "Collecting data is easy, but most teams collect what they can rather than what they need. We start from a real decision: do we change the checkout page or improve the ad? Then we write a measurement plan naming the question, the metric, the source, who reads the result, and — before any of that — what we will do if the number comes back opposite to expectation.\n\nWe cover the technical side far enough to collaborate with developers: events, user properties, the limits of cross-device tracking, and the effect of tracking blockers. We close by reviewing a written measurement plan and finding its gaps before budget is spent implementing it.",
    level: "ADVANCED",
    language: "AR",
    priceCents: 34900,
    objectives: [
      {
        textAr: "تكتب خطّة قياس تبدأ من قرار لا من أداة.",
        textEn: "Write a measurement plan that starts from a decision, not a tool.",
      },
      {
        textAr: "تحدّد المقياس والمصدر ومن يقرأ النتيجة.",
        textEn: "Specify the metric, source, and who reads the result.",
      },
      {
        textAr: "تحدّد سلفًا ما ستفعله إن جاء الرقم مخالفًا للتوقّع.",
        textEn: "Decide in advance what you will do if the number defies expectation.",
      },
      {
        textAr: "تتعاون مع المطوّرين على تعريف الأحداث بدقّة.",
        textEn: "Collaborate with developers on precise event definitions.",
      },
      {
        textAr: "تشرح حدود التتبّع عبر الأجهزة وحجب التتبّع.",
        textEn: "Explain cross-device tracking limits and tracking blockers.",
      },
      {
        textAr: "تراجع خطّة قياس وتكتشف ثغراتها قبل التنفيذ.",
        textEn: "Review a measurement plan and find its gaps before implementation.",
      },
    ],
    requirements: [
      {
        textAr: "خبرة عملية بتحليلات الويب أو التطبيقات.",
        textEn: "Practical experience with web or app analytics.",
      },
      {
        textAr: "فهم أساسي لكيفية عمل الأحداث في الواجهة.",
        textEn: "Basic understanding of how front-end events work.",
      },
      {
        textAr: "قدرة على قراءة خطّة تقنية ومناقشتها.",
        textEn: "Ability to read and discuss a technical plan.",
      },
    ],
    sections: [
      {
        titleAr: "الخطّة قبل الأداة",
        titleEn: "The Plan Before the Tool",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا نجمع بيانات لا نستخدمها",
            titleEn: "Why we collect data we never use",
            isPreview: true,
            durationSec: 480,
          },
          {
            type: "VIDEO",
            titleAr: "من القرار إلى السؤال إلى المقياس",
            titleEn: "From decision to question to metric",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "المقياس الذي يمكن أن يتحرّك",
            titleEn: "The metric that can actually move",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "من يقرأ النتيجة وماذا يفعل بها",
            titleEn: "Who reads the result and what they do with it",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: خطّة قياس في صفحة واحدة",
            titleEn: "Reading: a measurement plan on one page",
            durationSec: 360,
            contentAr:
              "<p>الخطّة الجيدة تُقرأ في دقيقتين وتُنفّذ بلا اجتماعات إضافية. لذلك تكتب في صفحة واحدة، وكل سطر فيها يجيب عن سؤال يُطرح فعلًا عند التنفيذ.</p><h3>أسطر الخطّة</h3><ul><li>القرار: ماذا سنغيّر بناءً على النتيجة؟</li><li>السؤال: ماذا نحتاج أن نعرف بالتحديد؟</li><li>المقياس والمصدر: من أين يأتي الرقم ومن يحسبه؟</li><li>الحدّ: ماذا لا يقيسه هذا المقياس؟</li></ul><p>السطر الرابع هو الذي يمنع الفريق من تفسير الرقم أكثر ممّا يحتمل، ويكشف مبكرًا إذا كانت الخطّة لا تستطيع الإجابة أصلًا.</p>",
            contentEn:
              "<p>A good plan is read in two minutes and executed without extra meetings. So it fits on one page, and every line answers a question actually asked during implementation.</p><h3>The plan's lines</h3><ul><li>The decision: what will we change based on the result?</li><li>The question: what exactly do we need to know?</li><li>The metric and source: where does the number come from and who computes it?</li><li>The limit: what does this metric not measure?</li></ul><p>The fourth line stops the team from over-reading the number and reveals early if the plan cannot answer the question at all.</p>",
          },
        ],
      },
      {
        titleAr: "التنفيذ والحدود",
        titleEn: "Implementation and Limits",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "تعريف الأحداث مع المطوّر",
            titleEn: "Defining events with the developer",
            isPreview: true,
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "خصائص المستخدم وحدود التتبّع",
            titleEn: "User properties and tracking limits",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "حجب التتبّع وأثره على الأرقام",
            titleEn: "Tracking blockers and their effect on numbers",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: الحدث الذي يخبرك بما تريد لا بما يحدث",
            titleEn: "Reading: the event that tells you what you want, not what happened",
            durationSec: 360,
            contentAr:
              "<p>حدث باسم «نقر الزرّ» يخبرك أن الزرّ نُقر، لا أن المستخدم أكمل ما أراد. الحدث المفيد يصف نتيجة، لا حركة.</p><h3>ثلاثة أسئلة لتعريف الحدث</h3><ul><li>ما النتيجة التي تعني أن المستخدم نجح؟</li><li>ما الشروط الإضافية التي تجعل الحركة ذات معنى؟</li><li>كيف نعرف أن هذا الحدث لم يُطلق مرتين بالخطأ؟</li></ul><p>اتّفق على هذه الإجابات مع المطوّر قبل التنفيذ. تعديل تعريف حدث بعد جمع شهر من البيانات يعني فقدان الشهر كله.</p>",
            contentEn:
              "<p>An event named «button clicked» tells you the button was clicked, not that the user achieved anything. A useful event describes an outcome, not a movement.</p><h3>Three questions to define an event</h3><ul><li>What outcome means the user succeeded?</li><li>What additional conditions make the action meaningful?</li><li>How do we know the event was not fired twice by mistake?</li></ul><p>Agree on these answers with the developer before implementation. Changing an event definition after a month of collection means losing that entire month.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: التنفيذ والحدود",
            titleEn: "Quiz: implementation and limits",
            quiz: {
              titleAr: "اختبار: التنفيذ والحدود",
              titleEn: "Quiz: implementation and limits",
              passPct: 80,
              maxAttempts: 3,
              timeLimitSec: 1500,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما الذي يجب أن تبدأ منه خطّة القياس؟",
                  promptEn: "What must a measurement plan start from?",
                  explanationAr: "البدء من القرار يجعل القياس يخدم عملًا لا فضولًا.",
                  explanationEn:
                    "Starting from the decision makes measurement serve work, not curiosity.",
                  options: [
                    {
                      textAr: "من قرار سنتّخذه",
                      textEn: "A decision we will make",
                      isCorrect: true,
                    },
                    {
                      textAr: "من أداة نريد تجربتها",
                      textEn: "A tool we want to try",
                      isCorrect: false,
                    },
                    {
                      textAr: "من عدد الأحداث الممكنة",
                      textEn: "The number of possible events",
                      isCorrect: false,
                    },
                    {
                      textAr: "من ميزانية التحليلات",
                      textEn: "The analytics budget",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "الحدث المفيد يصف حركة زرّ لا نتيجة للمستخدم.",
                  promptEn: "A useful event describes a button movement, not a user outcome.",
                  explanationAr: "الحدث المفيد يصف نتيجة يعرف بها أن المستخدم نجح.",
                  explanationEn: "A useful event describes an outcome showing the user succeeded.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما السطر في الخطّة الذي يمنع تفسير الرقم أكثر مما يحتمل؟",
                  promptEn: "Which line in the plan stops over-reading the number?",
                  explanationAr: "سطر الحدّ يوضّح ما لا يقيسه المقياس.",
                  explanationEn: "The limit line states what the metric does not measure.",
                  acceptedAnswers: ["the limit", "limit", "limitation", "limits"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يجب الاتّفاق عليه مع المطوّر قبل التنفيذ؟",
                  promptEn:
                    "Which of these must be agreed with the developer before implementation?",
                  explanationAr: "تعريف النتيجة وشروط المعنى ومنع التكرار تُتّفق قبل التنفيذ.",
                  explanationEn:
                    "Outcome definition, meaningful conditions, and duplicate prevention are agreed before implementation.",
                  options: [
                    {
                      textAr: "النتيجة التي تعني النجاح",
                      textEn: "The outcome that means success",
                      isCorrect: true,
                    },
                    {
                      textAr: "الشروط التي تجعل الحركة ذات معنى",
                      textEn: "The conditions making the action meaningful",
                      isCorrect: true,
                    },
                    {
                      textAr: "منع الإطلاق المكرّر بالخطأ",
                      textEn: "Preventing accidental double firing",
                      isCorrect: true,
                    },
                    {
                      textAr: "لون لوحة التحليلات",
                      textEn: "The analytics dashboard colour",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "متى نحدّد ماذا سنفعل إن جاء الرقم مخالفًا؟",
                  promptEn: "When do we decide what to do if the number defies expectation?",
                  explanationAr: "التحديد المسبق يمنع تفسير النتيجة بعد رؤيتها بما يخدم الرأي.",
                  explanationEn:
                    "Deciding in advance prevents interpreting the result after seeing it in a self-serving way.",
                  options: [
                    {
                      textAr: "قبل جمع البيانات",
                      textEn: "Before collecting data",
                      isCorrect: true,
                    },
                    {
                      textAr: "بعد رؤية الرقم",
                      textEn: "After seeing the number",
                      isCorrect: false,
                    },
                    { textAr: "في اجتماع سنوي", textEn: "In an annual meeting", isCorrect: false },
                    { textAr: "لا حاجة لتحديده", textEn: "No need to decide", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "المراجعة والصيانة",
        titleEn: "Review and Maintenance",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "مراجعة خطّة قياس قبل التنفيذ",
            titleEn: "Reviewing a measurement plan before implementation",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "صيانة التعريفات مع تغيّر المنتج",
            titleEn: "Maintaining definitions as the product changes",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: ثغرات خطّة القياس الشائعة",
            titleEn: "Reading: common gaps in measurement plans",
            durationSec: 300,
            contentAr:
              "<p>معظم خطط القياس تفشل في ثلاثة مواضع متكرّرة، وكلها قابلة للكشف بمراجعة نصف ساعة قبل التنفيذ.</p><h3>ثلاث ثغرات</h3><ul><li>مقياس يمكن أن يتحسّن بلا تحسّن حقيقي في العمل.</li><li>مصدر بيانات لا يغطّي كل المستخدمين، مثل تطبيق لا يُتتبّع.</li><li>لا أحد مسؤول عن قراءة الرقم عند ظهوره.</li></ul><p>الثغرة الثالثة هي الأكثر شيوعًا: خطّة بلا قارئ مسؤول تنتج تقريرًا يُفتح مرة واحدة، ثم يبقى بلا قرار.</p>",
            contentEn:
              "<p>Most measurement plans fail at three recurring points, all detectable in a half-hour review before implementation.</p><h3>Three gaps</h3><ul><li>A metric that can improve without any real improvement in the work.</li><li>A data source that does not cover every user, such as an untracked app.</li><li>Nobody is responsible for reading the number when it appears.</li></ul><p>The third gap is the most common: a plan with no accountable reader produces a report opened once and left without a decision.</p>",
          },
          {
            type: "FILE",
            titleAr: "قالب خطّة قياس في صفحة",
            titleEn: "One-page measurement plan template",
            durationSec: 300,
            attachmentAr: "قالب خطّة قياس في صفحة",
            attachmentEn: "One-page measurement plan template",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: المراجعة والصيانة",
            titleEn: "Quiz: review and maintenance",
            quiz: {
              titleAr: "اختبار: المراجعة والصيانة",
              titleEn: "Quiz: review and maintenance",
              passPct: 80,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما أكثر ثغرات خطط القياس شيوعًا؟",
                  promptEn: "What is the most common gap in measurement plans?",
                  explanationAr: "غياب قارئ مسؤول يجعل التقرير بلا قرار.",
                  explanationEn:
                    "The absence of an accountable reader leaves the report without a decision.",
                  options: [
                    {
                      textAr: "غياب قارئ مسؤول عن الرقم",
                      textEn: "No accountable reader for the number",
                      isCorrect: true,
                    },
                    { textAr: "زيادة عدد المقاييس", textEn: "Too many metrics", isCorrect: false },
                    { textAr: "استخدام أدوات قديمة", textEn: "Using old tools", isCorrect: false },
                    { textAr: "قِصر الخطّة", textEn: "The plan being short", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "مقياس يمكن أن يتحسّن بلا تحسّن حقيقي في العمل هو ثغرة في الخطّة.",
                  promptEn:
                    "A metric that can improve without real improvement is a gap in the plan.",
                  explanationAr: "المقياس القابل للتحسين الشكلي يخدع القرار.",
                  explanationEn: "A metric improvable cosmetically misleads the decision.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الذي يجب أن يغطّيه مصدر البيانات؟",
                  promptEn: "What must a data source cover?",
                  explanationAr: "المصدر يجب أن يغطّي كل المستخدمين وإلّا فالرقم ناقص.",
                  explanationEn: "The source must cover every user, or the number is incomplete.",
                  acceptedAnswers: ["all users", "every user", "all of them", "complete coverage"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يُعدّ ثغرة يجب مراجعتها؟",
                  promptEn: "Which of these are gaps to review?",
                  explanationAr: "المصدر الناقص والمقياس الشكلي وغياب القارئ كلها ثغرات.",
                  explanationEn:
                    "Incomplete sources, cosmetic metrics, and missing readers are all gaps.",
                  options: [
                    {
                      textAr: "مصدر لا يغطّي كل المستخدمين",
                      textEn: "A source not covering every user",
                      isCorrect: true,
                    },
                    {
                      textAr: "مقياس يتحسّن شكليًا",
                      textEn: "A metric that improves cosmetically",
                      isCorrect: true,
                    },
                    { textAr: "غياب قارئ مسؤول", textEn: "No accountable reader", isCorrect: true },
                    {
                      textAr: "وجود حدّ مكتوب للمقياس",
                      textEn: "A written limit for the metric",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "متى نراجع الخطّة بحثًا عن الثغرات؟",
                  promptEn: "When do we review the plan for gaps?",
                  explanationAr: "المراجعة قبل التنفيذ توفّر ميزانية وجهدًا.",
                  explanationEn: "Reviewing before implementation saves budget and effort.",
                  options: [
                    { textAr: "قبل التنفيذ", textEn: "Before implementation", isCorrect: true },
                    {
                      textAr: "بعد سنة من الجمع",
                      textEn: "After a year of collection",
                      isCorrect: false,
                    },
                    {
                      textAr: "بعد إغلاق المشروع",
                      textEn: "After the project closes",
                      isCorrect: false,
                    },
                    {
                      textAr: "عند حدوث خلاف فقط",
                      textEn: "Only when a dispute arises",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "content-marketing-strategy",
    instructorUsername: "maryam-alotaibi",
    categorySlug: "marketing",
    titleAr: "استراتيجية المحتوى التسويقي",
    titleEn: "Content Marketing Strategy",
    subtitleAr: "خطة محتوى تبدأ من سؤال يبحث عنه العميل لا من تقويم نشر",
    subtitleEn:
      "A content plan that starts from a question the customer searches for, not from a publishing calendar",
    descriptionAr:
      "معظم خطط المحتوى تبدأ من عدد المنشورات في الأسبوع، فتنتهي بمحتوى كثير لا يقرأه أحد. نبدأ هنا من سؤال: أي سؤال يطرحه عميلك قبل أن يعرف أنك موجود؟ نجمع هذه الأسئلة من محادثات الدعم والبحث الداخلي، ثم نرتّبها بحسب قربها من قرار الشراء.\n\nثم نبني خطّة قابلة للتنفيذ: عمود محتوى واحد يتكرّر، وثلاث قطع تُختبر أولًا، ومعيار واضح لإيقاف ما لا يعمل. نختتم بمراجعة نتائج بعد شهرين وبتعديل الخطّة بناءً على ما تعلّمناه لا على ما تمنّيناه.",
    descriptionEn:
      "Most content plans start with how many posts go out each week, and end with plenty of content nobody reads. We start from a question instead: what does your customer ask before they know you exist? We gather these from support conversations and internal search, then order them by closeness to a purchase decision.\n\nWe then build an executable plan: one recurring content column, three pieces to test first, and a clear standard for stopping what does not work. We close with a review after two months and a plan revision based on what we learned rather than what we hoped.",
    level: "INTERMEDIATE",
    language: "AR",
    priceCents: 20900,
    objectives: [
      {
        textAr: "تجمع أسئلة العملاء من مصادر حقيقية لا من التخمين.",
        textEn: "Gather customer questions from real sources rather than guessing.",
      },
      {
        textAr: "ترتّب الأسئلة بحسب قربها من قرار الشراء.",
        textEn: "Order questions by their closeness to a purchase decision.",
      },
      {
        textAr: "تبني عمود محتوى واحدًا يتكرّر بدل نشر متفرّق.",
        textEn: "Build one recurring content column instead of scattered posts.",
      },
      {
        textAr: "تختبر ثلاث قطع قبل الالتزام بخطّة كبيرة.",
        textEn: "Test three pieces before committing to a large plan.",
      },
      {
        textAr: "تضع معيارًا واضحًا لإيقاف ما لا يعمل.",
        textEn: "Set a clear standard for stopping what does not work.",
      },
      {
        textAr: "تراجع النتائج بعد شهرين وتعدّل الخطّة بناء عليها.",
        textEn: "Review results after two months and revise the plan accordingly.",
      },
    ],
    requirements: [
      {
        textAr: "معرفة أساسية بالتسويق أو إدارة المنتج.",
        textEn: "Basic knowledge of marketing or product management.",
      },
      {
        textAr: "وصول إلى محادثات دعم أو أسئلة عملاء.",
        textEn: "Access to support conversations or customer questions.",
      },
      {
        textAr: "قدرة على كتابة أو تنسيق محتوى قصير.",
        textEn: "Ability to write or coordinate short content.",
      },
    ],
    sections: [
      {
        titleAr: "الأسئلة قبل التقويم",
        titleEn: "Questions Before the Calendar",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا يبدأ المحتوى من سؤال لا من عدد",
            titleEn: "Why content starts from a question, not a count",
            isPreview: true,
            durationSec: 420,
          },
          {
            type: "VIDEO",
            titleAr: "جمع الأسئلة من الدعم والبحث",
            titleEn: "Collecting questions from support and search",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "ترتيب الأسئلة بحسب قربها من الشراء",
            titleEn: "Ordering questions by closeness to purchase",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "العمود الواحد الذي يتكرّر",
            titleEn: "The one column that recurs",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: السؤال الذي يستحق مقالًا",
            titleEn: "Reading: the question that deserves an article",
            durationSec: 300,
            contentAr:
              "<p>ليست كل الأسئلة تستحق محتوى. السؤال الذي يستحق هو الذي يُطرح كثيرًا، ويظهر في أكثر من مصدر، ويكون جوابه غير موجود أو ناقص. هذا الثلاثي يمنع كتابة مقالات لا يبحث عنها أحد.</p><h3>ثلاثة اختبارات للسؤال</h3><ul><li>هل تكرّر في محادثات حقيقية أكثر من مرة؟</li><li>هل يظهر في بحث الموقع أو في أسئلة البيع؟</li><li>هل الجواب الحالي ناقص أو متفرّق؟</li></ul><p>السؤال الذي يجتاز الثلاثة يبدأ منه المحتوى، أما السؤال الذي يجتاز واحدًا فينتظر في القائمة حتى تتضح حاجته.</p>",
            contentEn:
              "<p>Not every question deserves content. The one that does is asked often, appears in more than one source, and has an answer that is missing or incomplete. That trio prevents articles nobody searches for.</p><h3>Three tests for a question</h3><ul><li>Did it recur in real conversations more than once?</li><li>Does it appear in site search or sales questions?</li><li>Is the current answer incomplete or scattered?</li></ul><p>A question passing all three starts the content; one passing only one waits on the list until its need becomes clear.</p>",
          },
        ],
      },
      {
        titleAr: "الخطّة والاختبار",
        titleEn: "Plan and Test",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "ثلاث قطع تُختبر قبل الالتزام",
            titleEn: "Three pieces tested before commitment",
            isPreview: true,
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "معيار إيقاف ما لا يعمل",
            titleEn: "A standard for stopping what does not work",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "إعادة استخدام القطعة بدل إنتاج جديد",
            titleEn: "Reusing a piece instead of producing new",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: الخطّة التي تنجح هي التي تُوقف شيئًا",
            titleEn: "Reading: a plan that works is one that stops something",
            durationSec: 360,
            contentAr:
              "<p>خطّة المحتوى التي تضيف بلا توقف تنهار بعد شهور. الخطّة التي تعمل تحدد منذ البداية ما ستوقفه إن لم يحقّق شرطه، فتحمي الوقت لمنتج يحتاج تحسينًا.</p><h3>ثلاثة شروط للإيقاف</h3><ul><li>عدد قراءات أقل من حدّ متّفق عليه بعدد مرّات نشر معروف.</li><li>عدم ظهور السؤال في محادثات جديدة.</li><li>عدم مساهمة القطعة في أي خطوة قبل الشراء.</li></ul><p>كتابة الشروط قبل النشر تمنع الجدال لاحقًا، وتجعل قرار الإيقاف قرارًا لا خصومة.</p>",
            contentEn:
              "<p>A content plan that only adds collapses after months. A plan that works defines from the start what it will stop if it misses its condition, protecting time for what needs improvement.</p><h3>Three stop conditions</h3><ul><li>Reads below an agreed threshold after a known number of publications.</li><li>The question stops appearing in new conversations.</li><li>The piece contributes to no pre-purchase step.</li></ul><p>Writing the conditions before publishing prevents later argument and makes stopping a decision rather than a feud.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الأسئلة والخطّة",
            titleEn: "Quiz: questions and the plan",
            quiz: {
              titleAr: "اختبار: الأسئلة والخطّة",
              titleEn: "Quiz: questions and the plan",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 900,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "أي سؤال يستحق أن يُكتب عنه محتوى؟",
                  promptEn: "Which question deserves content?",
                  explanationAr: "السؤال المتكرّر من مصادر متعدّدة وناقص الجواب يستحق المحتوى.",
                  explanationEn:
                    "A question recurring across sources with an incomplete answer deserves content.",
                  options: [
                    {
                      textAr: "سؤال تكرّر في مصادر متعدّدة وجوابه ناقص",
                      textEn: "One recurring across sources with an incomplete answer",
                      isCorrect: true,
                    },
                    {
                      textAr: "سؤال خطر ببالك مرة واحدة",
                      textEn: "One that crossed your mind once",
                      isCorrect: false,
                    },
                    {
                      textAr: "سؤال يحبّه فريق الإدارة",
                      textEn: "One the management team likes",
                      isCorrect: false,
                    },
                    {
                      textAr: "سؤال يسهل الجواب عنه",
                      textEn: "One that is easy to answer",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "خطّة المحتوى الجيدة تحدّد ما ستوقفه مسبقًا.",
                  promptEn: "A good content plan defines in advance what it will stop.",
                  explanationAr: "شروط الإيقاف المسبقة تحمي الوقت وتمنع الجدال.",
                  explanationEn: "Pre-set stop conditions protect time and prevent argument.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "كم قطعة تُختبر قبل الالتزام بخطّة كبيرة؟",
                  promptEn: "How many pieces are tested before committing to a large plan?",
                  explanationAr: "ثلاث قطع تكفي لكشف الاتجاه قبل الالتزام.",
                  explanationEn: "Three pieces reveal the direction before commitment.",
                  acceptedAnswers: ["three", "3", "three pieces", "3 pieces"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يجعل قرار الإيقاف قرارًا لا خصومة؟",
                  promptEn: "Which of these make stopping a decision rather than a feud?",
                  explanationAr: "شروط محدّدة سلفًا بمقاييس متّفق عليها تحوّل الإيقاف إلى قرار.",
                  explanationEn:
                    "Conditions set in advance with agreed measures turn stopping into a decision.",
                  options: [
                    {
                      textAr: "شروط مكتوبة قبل النشر",
                      textEn: "Conditions written before publishing",
                      isCorrect: true,
                    },
                    {
                      textAr: "مقياس متّفق عليه مسبقًا",
                      textEn: "A measure agreed in advance",
                      isCorrect: true,
                    },
                    {
                      textAr: "قرار مفاجئ من المدير",
                      textEn: "A sudden decision by the manager",
                      isCorrect: false,
                    },
                    {
                      textAr: "مقارنة بعدد المنشورات فقط",
                      textEn: "Comparing post counts only",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ماذا نفعل قبل إنتاج قطعة جديدة؟",
                  promptEn: "What do we consider before producing a new piece?",
                  explanationAr: "إعادة استخدام القطعة الناجحة أوفر من إنتاج جديد دائمًا.",
                  explanationEn: "Reusing a successful piece is cheaper than always producing new.",
                  options: [
                    {
                      textAr: "إعادة استخدام قطعة ناجحة",
                      textEn: "Reusing a successful piece",
                      isCorrect: true,
                    },
                    {
                      textAr: "إنتاج قطعة جديدة دائمًا",
                      textEn: "Always producing a new piece",
                      isCorrect: false,
                    },
                    {
                      textAr: "حذف المحتوى القديم",
                      textEn: "Deleting old content",
                      isCorrect: false,
                    },
                    { textAr: "تغيير التقويم", textEn: "Changing the calendar", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "المراجعة والتعديل",
        titleEn: "Review and Revise",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "مراجعة بعد شهرين لا بعد يوم",
            titleEn: "Review after two months, not a day",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "تعديل الخطّة وفق ما تعلّمناه",
            titleEn: "Revising the plan by what we learned",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: ما نتعلمه من قطعة لم تُقرأ",
            titleEn: "Reading: what an unread piece teaches",
            durationSec: 300,
            contentAr:
              "<p>القطعة التي لم تُقرأ ليست فشلًا بلا فائدة؛ هي إشارة إلى سؤال لم يكن مؤلمًا بما يكفي، أو عنوان لم يوضّح ما ينتظره القارئ. الفرق بين الحالتين يحدّد ما نعدّله في المرة القادمة.</p><h3>قراءتان للنتيجة</h3><ul><li>القراءات قليلة والوقت على الصفحة طويل: العنوان لم يوضّح الفائدة.</li><li>القراءات قليلة والوقت قصير: السؤال لا يهمّ الجمهور الحالي.</li><li>القراءات جيدة والتحويل صفر: المحتوى لا يقود إلى خطوة تالية.</li></ul><p>كل قراءة تقود تعديلًا مختلفًا. لهذا نحتاج أكثر من رقم واحد لنعرف ماذا نفعل.</p>",
            contentEn:
              "<p>An unread piece is not a useless failure; it signals either a question that was not painful enough or a title that did not state what the reader gets. The difference decides what we adjust next time.</p><h3>Two readings of the result</h3><ul><li>Few reads and long time on page: the title failed to state the benefit.</li><li>Few reads and short time: the question does not matter to the current audience.</li><li>Good reads and zero conversion: the content does not lead to a next step.</li></ul><p>Each reading implies a different fix, which is why one number is not enough to know what to do.</p>",
          },
          {
            type: "FILE",
            titleAr: "ورقة مراجعة خطّة المحتوى",
            titleEn: "Content plan review sheet",
            durationSec: 300,
            attachmentAr: "ورقة مراجعة خطّة المحتوى",
            attachmentEn: "Content plan review sheet",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: المراجعة والتعديل",
            titleEn: "Quiz: review and revise",
            quiz: {
              titleAr: "اختبار: المراجعة والتعديل",
              titleEn: "Quiz: review and revise",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ماذا تعني قراءات قليلة مع وقت طويل على الصفحة؟",
                  promptEn: "What do few reads with long time on page mean?",
                  explanationAr: "من يصل يقرأ، لكن العنوان لم يوضّح الفائدة.",
                  explanationEn: "Whoever arrives reads, but the title did not state the benefit.",
                  options: [
                    {
                      textAr: "العنوان لم يوضّح الفائدة",
                      textEn: "The title did not state the benefit",
                      isCorrect: true,
                    },
                    {
                      textAr: "المحتوى طويل جدًا",
                      textEn: "The content is too long",
                      isCorrect: false,
                    },
                    {
                      textAr: "السؤال لا يهمّ الجمهور",
                      textEn: "The question does not matter to the audience",
                      isCorrect: false,
                    },
                    { textAr: "الموقع معطّل", textEn: "The site is broken", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "رقم واحد يكفي لمعرفة ما يجب تعديله في المحتوى.",
                  promptEn: "One number is enough to know what to adjust in content.",
                  explanationAr: "كل قراءة للنتيجة تقود تعديلًا مختلفًا، فالحاجة لعدّة أرقام.",
                  explanationEn:
                    "Each reading implies a different fix, so several numbers are needed.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "متى نراجع نتائج المحتوى؟",
                  promptEn: "When do we review content results?",
                  explanationAr: "المراجعة بعد شهرين تعطي المحتوى وقتًا كافيًا ليُقرأ.",
                  explanationEn: "Reviewing after two months gives content time to be read.",
                  acceptedAnswers: ["after two months", "two months", "2 months", "after 2 months"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما نعدّله عندما لا يُقرأ المحتوى؟",
                  promptEn: "Which of these might we adjust when content is unread?",
                  explanationAr: "العنوان وسؤال المحتوى وقيادته لخطوة تالية كلها مواضع تعديل.",
                  explanationEn:
                    "The title, the question, and the lead to a next step are all adjustment points.",
                  options: [
                    {
                      textAr: "العنوان ليُظهر الفائدة",
                      textEn: "The title to show the benefit",
                      isCorrect: true,
                    },
                    {
                      textAr: "السؤال ليكون أكثر إلحاحًا للجمهور",
                      textEn: "The question to be more urgent for the audience",
                      isCorrect: true,
                    },
                    {
                      textAr: "إضافة خطوة تالية واضحة",
                      textEn: "Adding a clear next step",
                      isCorrect: true,
                    },
                    {
                      textAr: "تغيير لون الخلفية فقط",
                      textEn: "Changing only the background colour",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ماذا يعني محتوى يُقرأ جيدًا ولا يحوّل أحدًا؟",
                  promptEn: "What does content read well but converting nobody mean?",
                  explanationAr: "المحتوى لا يقود إلى خطوة تالية واضحة.",
                  explanationEn: "The content does not lead to a clear next step.",
                  options: [
                    {
                      textAr: "لا يقود إلى خطوة تالية",
                      textEn: "It does not lead to a next step",
                      isCorrect: true,
                    },
                    {
                      textAr: "السؤال غير مهمّ",
                      textEn: "The question is unimportant",
                      isCorrect: false,
                    },
                    { textAr: "العنوان ضعيف", textEn: "The title is weak", isCorrect: false },
                    { textAr: "الجمهور خاطئ", textEn: "The audience is wrong", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "instructional-design-essentials",
    instructorUsername: "nouf-alenezi",
    categorySlug: "education",
    titleAr: "أساسيات تصميم التدريب",
    titleEn: "Instructional Design Essentials",
    subtitleAr: "من هدف تعلّم واضح إلى نشاط يثبت أن المتدرّب فهم، لا أن المدرّب شرح",
    subtitleEn:
      "From a clear learning objective to an activity proving the learner understood, not that the trainer spoke",
    descriptionAr:
      "التدريب الذي يفشل غالبًا يفشل قبل القاعة: هدف مكتوب بعبارة عامة مثل «يفهم المتدرّب أهمية كذا»، فلا يعرف أحد كيف يقيسه. نبدأ من مهارة يمكن ملاحظتها، ونكتب هدفًا يحدّد الفعل والشرط ومعيار النجاح، ثم نبني نشاطًا ينتجه فعلًا.\n\nنغطّي بعد ذلك الفرق بين الشرح والتدرّب، وكيف نوزّع الوقت بينهما، وكيف نتعامل مع مجموعة مختلطة الخبرة. نختتم بإعادة تصميم جلسة واحدة من مادتك: هدف، ونشاطان، وتقييم قصير، مع تبرير كل خيار تعليمي لا تفضيل شخصي.",
    descriptionEn:
      "Training that fails usually fails before the room: an objective written as «the learner understands the importance of X» leaves nobody able to measure it. We start from an observable skill and write an objective naming the action, the condition, and the success criterion, then build an activity that actually produces it.\n\nWe then cover the difference between explaining and practising, how to divide time between them, and how to handle a mixed-experience group. We close by redesigning one session from your own material: an objective, two activities, and a short assessment, justifying each instructional choice rather than a personal preference.",
    level: "BEGINNER",
    language: "AR",
    priceCents: 0,
    objectives: [
      {
        textAr: "تكتب هدف تعلّم يحدّد الفعل والشرط ومعيار النجاح.",
        textEn: "Write a learning objective naming the action, condition, and success criterion.",
      },
      {
        textAr: "تصمّم نشاطًا ينتج السلوك المطلوب لا شرحًا عنه.",
        textEn: "Design an activity that produces the target behaviour rather than explaining it.",
      },
      {
        textAr: "توزّع وقت الجلسة بين الشرح والتدرّب بشكل مبرّر.",
        textEn: "Divide session time between explaining and practising with justification.",
      },
      {
        textAr: "تتعامل مع مجموعة مختلطة الخبرة دون إهمال طرف.",
        textEn: "Handle a mixed-experience group without neglecting either side.",
      },
      {
        textAr: "تبني تقييمًا قصيرًا يكشف الفهم لا الحفظ.",
        textEn: "Build a short assessment that reveals understanding rather than recall.",
      },
      {
        textAr: "تبرّر كل خيار تعليمي بمبدأ لا بذوق شخصي.",
        textEn: "Justify each instructional choice by principle rather than personal taste.",
      },
    ],
    requirements: [
      {
        textAr: "موضوع تدريبي تريد تحسينه أو تصميمه.",
        textEn: "A training topic you want to improve or design.",
      },
      {
        textAr: "لا حاجة إلى خبرة سابقة في التدريب.",
        textEn: "No prior training experience needed.",
      },
      {
        textAr: "استعداد لتجربة نشاط على مجموعة صغيرة.",
        textEn: "Willingness to try an activity with a small group.",
      },
    ],
    sections: [
      {
        titleAr: "الأهداف والنشاط",
        titleEn: "Objectives and Activity",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا «يفهم» ليست هدفًا",
            titleEn: "Why «understands» is not an objective",
            isPreview: true,
            durationSec: 420,
          },
          {
            type: "VIDEO",
            titleAr: "الفعل والشرط ومعيار النجاح",
            titleEn: "Action, condition, and success criterion",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "النشاط الذي ينتج السلوك",
            titleEn: "The activity that produces the behaviour",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "الشرح والتدرّب: توزيع الوقت",
            titleEn: "Explaining and practising: dividing time",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: هدف يمكن ملاحظته",
            titleEn: "Reading: an objective you can observe",
            durationSec: 300,
            contentAr:
              "<p>الهدف القابل للملاحظة يخبرك ماذا سيفعل المتدرّب بعد الجلسة، وليس ماذا سيقول المدرّب خلالها. هذا الفرق هو ما يجعل التقييم ممكنًا أصلًا.</p><h3>ثلاثة عناصر</h3><ul><li>الفعل: ماذا يفعل المتدرّب؟ يكتب، يصنّف، يصلح، يقيس.</li><li>الشرط: بأي أدوات أو معلومات؟ بلا مساعدة؟ خلال وقت محدّد؟</li><li>المعيار: ما مستوى النجاح المقبول؟</li></ul><p>مثال عملي: «يصنّف المتدرّب ثلاثة أخطاء في قيد محاسبي دون مساعدة، ويحدّد الخطأ في حالتين على الأقل». هذا الهدف قابل للملاحظة والتصحيح.</p>",
            contentEn:
              "<p>An observable objective tells you what the learner will do after the session, not what the trainer will say during it. That difference is what makes assessment possible at all.</p><h3>Three elements</h3><ul><li>The action: what does the learner do? Write, classify, fix, measure.</li><li>The condition: with which tools or information? Without help? In what time?</li><li>The criterion: what level of success is acceptable?</li></ul><p>A working example: «The learner classifies three errors in a journal entry unaided, and identifies the error in at least two.» That objective is observable and correctable.</p>",
          },
        ],
      },
      {
        titleAr: "التقييم والتنوّع",
        titleEn: "Assessment and Variety",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "تقييم يكشف الفهم لا الحفظ",
            titleEn: "An assessment revealing understanding, not recall",
            isPreview: true,
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "مجموعة مختلطة الخبرة",
            titleEn: "A mixed-experience group",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "الأسئلة التي تكشف الفهم الخاطئ",
            titleEn: "Questions that expose a wrong understanding",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: سؤال يكشف أكثر من إجابة صحيحة",
            titleEn: "Reading: a question that reveals more than a correct answer",
            durationSec: 360,
            contentAr:
              "<p>السؤال الذي يقبل إجابة واحدة صحيحة يخبرك أن المتدرّب اختار بسرعة. السؤال الذي يطلب تفسيرًا يخبرك كيف فهم، وأين سيفشل لاحقًا.</p><h3>ثلاث صيغ أنفع</h3><ul><li>اطلب تفسير اختيار: لماذا هذا الجواب وليس غيره؟</li><li>اعرض حالة جديدة قريبة من الحالة المدروسة.</li><li>اطلب تصحيح مثال خاطئ وشرح الخطأ.</li></ul><p>هذه الصيغ تكشف المفاهيم الخاطئة التي تمرّ عادة في اختبار الاختيار من متعدّد، وهي المفاهيم التي تعود لاحقًا في العمل.</p>",
            contentEn:
              "<p>A question accepting one correct answer tells you the learner chose quickly. A question asking for reasoning tells you how they understood and where they will fail later.</p><h3>Three more useful forms</h3><ul><li>Ask for the reasoning behind a choice: why this answer and not another?</li><li>Present a new case close to the studied one.</li><li>Ask them to correct a wrong example and explain the error.</li></ul><p>These forms expose the misconceptions that pass through a multiple-choice test, and those misconceptions return on the job.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: الأهداف والتقييم",
            titleEn: "Quiz: objectives and assessment",
            quiz: {
              titleAr: "اختبار: الأهداف والتقييم",
              titleEn: "Quiz: objectives and assessment",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 900,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما الذي يجعل «يفهم المتدرّب» هدفًا ضعيفًا؟",
                  promptEn: "What makes «the learner understands» a weak objective?",
                  explanationAr: "الفهم غير قابل للملاحظة مباشرة، فلا يمكن قياسه.",
                  explanationEn:
                    "Understanding is not directly observable, so it cannot be measured.",
                  options: [
                    {
                      textAr: "لأنه غير قابل للملاحظة والقياس",
                      textEn: "Because it is not observable or measurable",
                      isCorrect: true,
                    },
                    {
                      textAr: "لأنه طويل جدًا",
                      textEn: "Because it is too long",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأنه يستخدم العربية",
                      textEn: "Because it uses Arabic",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأنه يذكر المدرّب",
                      textEn: "Because it mentions the trainer",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي عناصر يجب أن يحملها هدف التعلّم؟",
                  promptEn: "Which elements must a learning objective carry?",
                  explanationAr: "الفعل والشرط والمعيار هي العناصر الثلاثة.",
                  explanationEn: "Action, condition, and criterion are the three elements.",
                  options: [
                    { textAr: "الفعل", textEn: "The action", isCorrect: true },
                    { textAr: "الشرط", textEn: "The condition", isCorrect: true },
                    { textAr: "معيار النجاح", textEn: "The success criterion", isCorrect: true },
                    { textAr: "اسم القاعة", textEn: "The room name", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "السؤال الذي يطلب تفسيرًا يكشف الفهم أكثر من سؤال الاختيار الواحد.",
                  promptEn:
                    "A question asking for reasoning reveals understanding more than a single-choice question.",
                  explanationAr: "التفسير يكشف كيف فهم المتدرّب وأين سيفشل.",
                  explanationEn:
                    "Reasoning reveals how the learner understood and where they will fail.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الفعل الذي يصف ما يفعله المتدرّب في هدف جيد؟",
                  promptEn: "What verb describes what the learner does in a good objective?",
                  explanationAr: "الأفعال القابلة للملاحظة مثل يصنّف ويصلح ويقيس تصف السلوك.",
                  explanationEn:
                    "Observable verbs like classify, fix, and measure describe behaviour.",
                  acceptedAnswers: [
                    "observable action",
                    "action verb",
                    "an action verb",
                    "observable verb",
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "كيف نتعامل مع مجموعة مختلطة الخبرة؟",
                  promptEn: "How do we handle a mixed-experience group?",
                  explanationAr: "مهامّ متدرّجة تتيح لكل مستوى عملًا مناسبًا دون إهمال طرف.",
                  explanationEn:
                    "Tiered tasks give each level suitable work without neglecting either side.",
                  options: [
                    {
                      textAr: "بمهامّ متدرّجة تناسب كل مستوى",
                      textEn: "With tiered tasks suited to each level",
                      isCorrect: true,
                    },
                    {
                      textAr: "بإهمال المبتدئين",
                      textEn: "By ignoring beginners",
                      isCorrect: false,
                    },
                    {
                      textAr: "بتدريس المستوى الأعلى فقط",
                      textEn: "By teaching only the advanced level",
                      isCorrect: false,
                    },
                    {
                      textAr: "بتقصير الجلسة",
                      textEn: "By shortening the session",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "إعادة التصميم",
        titleEn: "Redesign",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "إعادة تصميم جلسة واحدة",
            titleEn: "Redesigning one session",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "التبرير التعليمي لكل خيار",
            titleEn: "The instructional justification for each choice",
            durationSec: 540,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: ثلاثون دقيقة تُحسّن جلسة كاملة",
            titleEn: "Reading: thirty minutes that improve a whole session",
            durationSec: 300,
            contentAr:
              "<p>لا تحتاج إلى إعادة بناء كل مادتك لتتحسّن. جلسة واحدة أعدت تصميمها بدقّة تغيّر انطباع المتدرّب عن البرنامج كله، وتعطيك نموذجًا تنسخه لاحقًا.</p><h3>ثلاث خطوات</h3><ul><li>أعد كتابة هدف الجلسة بعناصره الثلاثة.</li><li>استبدل شرحًا طويلًا بنشاط ينتج السلوك نفسه.</li><li>أضف تقييمًا قصيرًا يكشف الفهم الخاطئ المتوقّع.</li></ul><p>بعدها قِس الفرق في جلسة تجريبية صغيرة. الملاحظة أصدق من الحكم على الورق، وهي أرخص من إعادة تصميم البرنامج كله.</p>",
            contentEn:
              "<p>You do not need to rebuild all your material to improve. One session redesigned carefully changes a learner's impression of the whole programme and gives you a model to copy later.</p><h3>Three steps</h3><ul><li>Rewrite the session objective with its three elements.</li><li>Replace a long explanation with an activity producing the same behaviour.</li><li>Add a short assessment exposing the expected misconception.</li></ul><p>Then measure the difference in a small trial session. Observation is truer than judging on paper, and cheaper than redesigning the whole programme.</p>",
          },
          {
            type: "FILE",
            titleAr: "ورقة إعادة تصميم جلسة تدريب",
            titleEn: "Training session redesign sheet",
            durationSec: 300,
            attachmentAr: "ورقة إعادة تصميم جلسة تدريب",
            attachmentEn: "Training session redesign sheet",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: إعادة التصميم",
            titleEn: "Quiz: redesign",
            quiz: {
              titleAr: "اختبار: إعادة التصميم",
              titleEn: "Quiz: redesign",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما أول خطوة في إعادة تصميم جلسة؟",
                  promptEn: "What is the first step in redesigning a session?",
                  explanationAr: "إعادة كتابة الهدف بعناصره الثلاثة توجّه بقية التصميم.",
                  explanationEn:
                    "Rewriting the objective with its three elements guides the rest of the design.",
                  options: [
                    {
                      textAr: "إعادة كتابة الهدف بعناصره",
                      textEn: "Rewriting the objective with its elements",
                      isCorrect: true,
                    },
                    {
                      textAr: "تغيير العرض التقديمي",
                      textEn: "Changing the slide deck",
                      isCorrect: false,
                    },
                    {
                      textAr: "زيادة مدة الجلسة",
                      textEn: "Extending the session",
                      isCorrect: false,
                    },
                    { textAr: "تغيير القاعة", textEn: "Changing the room", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "استبدال شرح طويل بنشاط قد يحقّق النتيجة نفسها بوقت أقل.",
                  promptEn:
                    "Replacing a long explanation with an activity can achieve the same result in less time.",
                  explanationAr: "النشاط ينتج السلوك مباشرة بدل وصفه.",
                  explanationEn:
                    "An activity produces the behaviour directly instead of describing it.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما أفضل طريقة لقياس أثر إعادة التصميم؟",
                  promptEn: "What is the best way to measure the effect of a redesign?",
                  explanationAr: "جلسة تجريبية صغيرة وملاحظة سلوك المتدرّبين أصدق من الحكم النظري.",
                  explanationEn:
                    "A small trial session observing learners is truer than judging on paper.",
                  acceptedAnswers: ["trial session", "small trial", "observation", "pilot"],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يندرج في إعادة تصميم جلسة واحدة؟",
                  promptEn: "Which of these belong to redesigning one session?",
                  explanationAr: "الهدف والنشاط والتقييم القصير هي خطوات إعادة التصميم.",
                  explanationEn:
                    "The objective, the activity, and the short assessment are the redesign steps.",
                  options: [
                    {
                      textAr: "إعادة كتابة الهدف",
                      textEn: "Rewriting the objective",
                      isCorrect: true,
                    },
                    {
                      textAr: "استبدال شرح بنشاط",
                      textEn: "Replacing explanation with activity",
                      isCorrect: true,
                    },
                    {
                      textAr: "إضافة تقييم قصير",
                      textEn: "Adding a short assessment",
                      isCorrect: true,
                    },
                    {
                      textAr: "إعادة تصميم البرنامج كله فورًا",
                      textEn: "Redesigning the whole programme immediately",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "كيف نبرّر الخيار التعليمي؟",
                  promptEn: "How do we justify an instructional choice?",
                  explanationAr: "التبرير بمبدأ تعليمي لا بذوق شخصي.",
                  explanationEn: "Justification by instructional principle, not personal taste.",
                  options: [
                    {
                      textAr: "بمبدأ تعليمي يخدم الهدف",
                      textEn: "By an instructional principle serving the objective",
                      isCorrect: true,
                    },
                    {
                      textAr: "بأنه أعجبك شخصيًا",
                      textEn: "Because you personally liked it",
                      isCorrect: false,
                    },
                    {
                      textAr: "بأنه أسهل تحضيرًا",
                      textEn: "Because it is easier to prepare",
                      isCorrect: false,
                    },
                    {
                      textAr: "بأن المدير طلبه",
                      textEn: "Because the manager asked",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "designing-effective-assessments",
    instructorUsername: "nouf-alenezi",
    categorySlug: "education",
    titleAr: "تصميم التقييمات الفعّالة",
    titleEn: "Designing Effective Assessments",
    subtitleAr: "أسئلة تقيس ما وعد به البرنامج، لا ما يسهل تصحيحه",
    subtitleEn: "Questions that measure what the programme promised, not what is easy to grade",
    descriptionAr:
      "التقييم الذي يُكتب في آخر يوم لا يقيس شيئًا؛ يقيس ما تذكّره المتدرّبون من الشرائح. نبدأ من أهداف البرنامج، ونبني جدول مواصفات يربط كل هدف بعدد أسئلة ونوعها، حتى نرى فورًا ما لا نقيّمه أصلًا.\n\nثم نصنع أسئلة لكل مستوى: تذكّر، وتطبيق، وتحليل قرار. نراجع صياغة كل سؤال بحثًا عن الغموض الذي يجعل الإجابة الصحيحة قابلة للجدال، ونبني سلّم تقدير للأسئلة المفتوحة يقلّل اختلاف المصحّحين. نختتم بتحليل نتيجة تقييم حقيقي واستخراج ما يجب تغييره في التدريب نفسه.",
    descriptionEn:
      "An assessment written on the last day measures nothing; it measures what learners remember from the slides. We start from the programme's objectives and build a specification table linking each objective to a number and type of questions, so we immediately see what we are not assessing at all.\n\nWe then write questions at each level: recall, application, and decision analysis. We review every question's wording for the ambiguity that makes the correct answer arguable, and build a rubric for open questions that reduces disagreement between markers. We finish by analysing a real assessment result and extracting what must change in the training itself.",
    level: "INTERMEDIATE",
    language: "AR",
    priceCents: 26900,
    objectives: [
      {
        textAr: "تبني جدول مواصفات يربط الأهداف بالأسئلة.",
        textEn: "Build a specification table linking objectives to questions.",
      },
      {
        textAr: "تكتب أسئلة على مستويات تذكّر وتطبيق وتحليل.",
        textEn: "Write questions at recall, application, and analysis levels.",
      },
      {
        textAr: "تراجع صياغة سؤال لتزيل الغموض القابل للجدال.",
        textEn: "Review question wording to remove arguable ambiguity.",
      },
      {
        textAr: "تبني سلّم تقدير للأسئلة المفتوحة يوحّد التصحيح.",
        textEn: "Build a rubric for open questions that standardises marking.",
      },
      {
        textAr: "تحلّل نتائج التقييم لتحديد ثغرة في التدريب.",
        textEn: "Analyse assessment results to locate a gap in the training.",
      },
      {
        textAr: "تتحقّق من أن التقييم يقيس ما وعد به البرنامج.",
        textEn: "Verify that the assessment measures what the programme promised.",
      },
    ],
    requirements: [
      {
        textAr: "خبرة بتدريب أو تدريس مجموعة.",
        textEn: "Experience training or teaching a group.",
      },
      {
        textAr: "أهداف برنامج أو جلسة موجودة.",
        textEn: "Existing programme or session objectives.",
      },
      { textAr: "أساسيات استخدام جداول البيانات.", textEn: "Basic spreadsheet usage." },
    ],
    sections: [
      {
        titleAr: "المواصفات والأهداف",
        titleEn: "Specification and Objectives",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا نبدأ من الأهداف لا من بنك الأسئلة",
            titleEn: "Why we start from objectives, not a question bank",
            isPreview: true,
            durationSec: 480,
          },
          {
            type: "VIDEO",
            titleAr: "جدول المواصفات: كيف نبنيه",
            titleEn: "The specification table: how to build it",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "ما لا نقيّمه: اكتشاف الفجوة",
            titleEn: "What we do not assess: finding the gap",
            durationSec: 540,
          },
          {
            type: "VIDEO",
            titleAr: "عدد الأسئلة مقابل وزن الهدف",
            titleEn: "Question count versus objective weight",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: جدول يكشف الفجوة قبل كتابة سؤال",
            titleEn: "Reading: a table that reveals the gap before you write a question",
            durationSec: 360,
            contentAr:
              "<p>جدول المواصفات صفحة واحدة: صفوفه أهداف البرنامج، وأعمدته مستويات الفهم، وخلاياه عدد الأسئلة. حين تملأه قبل الكتابة، ترى بصراحة أي هدف لا يقابله سؤال، وأي مستوى يهيمن على التقييم.</p><h3>ثلاث قراءات للجدول</h3><ul><li>خلية فارغة: هدف لا يُقيَّم أصلًا.</li><li>عمود ثقيل في «التذكّر»: تقييم يقيس الحفظ.</li><li>هدف مهمّ بسؤال واحد: وزن لا يناسب أهميته.</li></ul><p>إصلاح الجدول قبل كتابة الأسئلة يوفّر إعادة كتابة كاملة، لأن المشكلة تكون في التوزيع لا في الصياغة.</p>",
            contentEn:
              "<p>The specification table is one page: rows are programme objectives, columns are levels of understanding, and cells hold question counts. Filling it before writing reveals plainly which objective has no question and which level dominates the assessment.</p><h3>Three readings of the table</h3><ul><li>An empty cell: an objective not assessed at all.</li><li>A heavy «recall» column: an assessment measuring memorisation.</li><li>An important objective with one question: a weight that does not match its importance.</li></ul><p>Fixing the table before writing questions saves a full rewrite, because the problem is distribution, not wording.</p>",
          },
        ],
      },
      {
        titleAr: "الصياغة والتصحيح",
        titleEn: "Wording and Marking",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "الغموض الذي يجعل الإجابة قابلة للجدال",
            titleEn: "Ambiguity that makes the answer arguable",
            isPreview: true,
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "أسئلة التطبيق والتحليل",
            titleEn: "Application and analysis questions",
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "سلّم تقدير يوحّد المصحّحين",
            titleEn: "A rubric that standardises markers",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: سؤال يبدو واضحًا للكاتب فقط",
            titleEn: "Reading: a question clear only to its writer",
            durationSec: 360,
            contentAr:
              "<p>كاتب السؤال يعرف ما يقصده، لذلك يبدو له واضحًا. المتدرّب لا يملك هذه المعرفة، فيقرأ السؤال بطريقة مختلفة ويعطي إجابة صحيحة لسؤال آخر.</p><h3>ثلاث مراجعات للسؤال</h3><ul><li>هل يحدّد السؤال ما نريد قياسه بالتحديد؟</li><li>هل يمكن الوصول إلى الإجابة الصحيحة من معلومات درّسناها فعلًا؟</li><li>هل يوجد تفسير آخر مشروع للسؤال؟</li></ul><p>اختبر السؤال على شخص لم يحضر المادة واطلب منه شرح ما يفهمه. إن اختلف فهمه عن قصدك، فالمشكلة في الصياغة لا في المتدرّب.</p>",
            contentEn:
              "<p>The question writer knows what they mean, so it looks clear to them. The learner does not share that knowledge, reads the question differently, and gives a correct answer to a different question.</p><h3>Three checks on a question</h3><ul><li>Does it specify exactly what we want to measure?</li><li>Can the correct answer be reached from what we actually taught?</li><li>Is there another legitimate reading of the question?</li></ul><p>Test the question on someone who missed the material and ask them to explain what they understood. If their reading differs from your intent, the problem is the wording, not the learner.</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: المواصفات والصياغة",
            titleEn: "Quiz: specification and wording",
            quiz: {
              titleAr: "اختبار: المواصفات والصياغة",
              titleEn: "Quiz: specification and wording",
              passPct: 70,
              maxAttempts: 3,
              timeLimitSec: 1200,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما أول ما نبنيه عند تصميم تقييم؟",
                  promptEn: "What do we build first when designing an assessment?",
                  explanationAr: "جدول المواصفات من الأهداف يسبق كتابة الأسئلة.",
                  explanationEn:
                    "The specification table from objectives precedes question writing.",
                  options: [
                    {
                      textAr: "جدول مواصفات من الأهداف",
                      textEn: "A specification table from the objectives",
                      isCorrect: true,
                    },
                    { textAr: "بنك أسئلة جاهز", textEn: "A ready question bank", isCorrect: false },
                    { textAr: "ورقة الإجابات", textEn: "The answer sheet", isCorrect: false },
                    { textAr: "تعليمات التصحيح", textEn: "Marking instructions", isCorrect: false },
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يكشفه جدول المواصفات؟",
                  promptEn: "Which of these does the specification table reveal?",
                  explanationAr: "الخلية الفارغة وعمود التذكّر الثقيل يكشفان فجوة أو اختلال توزيع.",
                  explanationEn:
                    "An empty cell and a heavy recall column reveal a gap or skewed distribution.",
                  options: [
                    {
                      textAr: "هدفًا لا يُقيَّم",
                      textEn: "An objective not assessed",
                      isCorrect: true,
                    },
                    {
                      textAr: "تركيزًا على الحفظ",
                      textEn: "An over-focus on recall",
                      isCorrect: true,
                    },
                    { textAr: "لون الورقة", textEn: "The paper colour", isCorrect: false },
                    { textAr: "اسم المصحّح", textEn: "The marker's name", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "السؤال الواضح لكاتبه يكون واضحًا دائمًا للمتدرّب.",
                  promptEn: "A question clear to its writer is always clear to the learner.",
                  explanationAr: "الكاتب يعرف قصده، والمتدرّب لا يملك هذه المعرفة.",
                  explanationEn:
                    "The writer knows their intent; the learner does not share that knowledge.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الأداة التي تقلّل اختلاف المصحّحين في الأسئلة المفتوحة؟",
                  promptEn: "What tool reduces disagreement between markers on open questions?",
                  explanationAr: "سلّم التقدير يحدّد معايير موحّدة للتصحيح.",
                  explanationEn: "A rubric sets uniform marking criteria.",
                  acceptedAnswers: ["rubric", "marking rubric", "scoring guide", "grading rubric"],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "كيف نختبر وضوح السؤال؟",
                  promptEn: "How do we test a question's clarity?",
                  explanationAr: "شخص لم يحضر المادة يشرح ما فهمه، فيظهر الفرق عن القصد.",
                  explanationEn:
                    "Someone who missed the material explains what they understood, revealing the gap from intent.",
                  options: [
                    {
                      textAr: "بأن يشرح شخص لم يحضر المادة ما فهمه",
                      textEn:
                        "By having someone who missed the material explain what they understood",
                      isCorrect: true,
                    },
                    {
                      textAr: "بقراءته بصوت عالٍ",
                      textEn: "By reading it aloud",
                      isCorrect: false,
                    },
                    { textAr: "بحفظه", textEn: "By memorising it", isCorrect: false },
                    { textAr: "بتغيير لونه", textEn: "By changing its colour", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "التحليل والتحسين",
        titleEn: "Analysis and Improvement",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "قراءة نتائج التقييم",
            titleEn: "Reading assessment results",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "من سؤال ضعيف إلى تعديل في التدريب",
            titleEn: "From a weak question to a training change",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: سؤال أخفق فيه الجميع",
            titleEn: "Reading: a question everyone missed",
            durationSec: 300,
            contentAr:
              "<p>سؤال أخفق فيه معظم المجموعة قد يكون سؤالًا سيّئًا، أو مفهومًا لم يُدرَّس جيدًا. التمييز بين الحالتين يحدّد إن كان الإصلاح في السؤال أم في التدريب.</p><h3>ثلاثة احتمالات</h3><ul><li>الجميع أخفقوا والإجابات متشابهة: مفهوم ناقص في التدريب.</li><li>الجميع أخفقوا والإجابات متفرّقة: صياغة السؤال غامضة.</li><li>أخفق نصفهم فقط: فرق في الخبرة أو في الوقت المتاح.</li></ul><p>هذه القراءة تحوّل نتيجة التقييم من رقم يُعلن إلى معلومة تُصلح التدريب في دورته القادمة.</p>",
            contentEn:
              "<p>A question most of the group missed may be a bad question or a concept taught poorly. Distinguishing the two decides whether the fix is in the question or the training.</p><h3>Three possibilities</h3><ul><li>Everyone missed and answers look alike: a concept missing from the training.</li><li>Everyone missed and answers are scattered: ambiguous question wording.</li><li>Half missed: a difference in experience or in available time.</li></ul><p>This reading turns an assessment result from a number announced into information that fixes the training in its next run.</p>",
          },
          {
            type: "FILE",
            titleAr: "قالب جدول مواصفات التقييم",
            titleEn: "Assessment specification table template",
            durationSec: 300,
            attachmentAr: "قالب جدول مواصفات التقييم",
            attachmentEn: "Assessment specification table template",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: التحليل والتحسين",
            titleEn: "Quiz: analysis and improvement",
            quiz: {
              titleAr: "اختبار: التحليل والتحسين",
              titleEn: "Quiz: analysis and improvement",
              passPct: 70,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ماذا يعني إخفاق الجميع بإجابات متشابهة؟",
                  promptEn: "What does everyone missing with similar answers mean?",
                  explanationAr: "تشابه الإجابات يشير إلى مفهوم ناقص في التدريب.",
                  explanationEn: "Similar answers point to a concept missing from the training.",
                  options: [
                    {
                      textAr: "مفهوم ناقص في التدريب",
                      textEn: "A concept missing from the training",
                      isCorrect: true,
                    },
                    {
                      textAr: "سؤال سيّئ الصياغة",
                      textEn: "A badly worded question",
                      isCorrect: false,
                    },
                    { textAr: "مشكلة في الشبكة", textEn: "A network problem", isCorrect: false },
                    { textAr: "قاعة غير مناسبة", textEn: "An unsuitable room", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "نتيجة التقييم يمكن أن تكشف ثغرة في التدريب نفسه.",
                  promptEn: "An assessment result can reveal a gap in the training itself.",
                  explanationAr: "نمط الإخفاق المتشابه يشير إلى مفهوم لم يُدرَّس جيدًا.",
                  explanationEn: "A pattern of similar misses points to a poorly taught concept.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: true },
                    { textAr: "خطأ", textEn: "False", isCorrect: false },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما الذي نعدّله إن كان الإخفاق بسبب صياغة غامضة؟",
                  promptEn: "What do we fix if the failure is due to ambiguous wording?",
                  explanationAr: "الغموض يعالَج بإعادة صياغة السؤال لا بتغيير التدريب.",
                  explanationEn:
                    "Ambiguity is fixed by rewording the question, not changing the training.",
                  acceptedAnswers: [
                    "the question",
                    "question wording",
                    "reword the question",
                    "the wording",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما يجب التحقّق منه قبل تسليم التقييم؟",
                  promptEn: "Which of these should be checked before delivering an assessment?",
                  explanationAr: "التوازن مع الأهداف والوقت الكافي ووضوح الصياغة شروط أساسية.",
                  explanationEn:
                    "Balance with objectives, sufficient time, and clear wording are essential conditions.",
                  options: [
                    {
                      textAr: "التوازن مع أهداف البرنامج",
                      textEn: "Balance with the programme objectives",
                      isCorrect: true,
                    },
                    {
                      textAr: "كفاية الوقت للإجابة",
                      textEn: "Sufficient time to answer",
                      isCorrect: true,
                    },
                    { textAr: "وضوح الصياغة", textEn: "Clear wording", isCorrect: true },
                    {
                      textAr: "اختيار إجابات قصيرة فقط",
                      textEn: "Choosing only short answers",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ماذا نصنع بنتيجة التقييم؟",
                  promptEn: "What do we do with an assessment result?",
                  explanationAr: "النتيجة تصبح معلومة تُصلح الدورة القادمة من التدريب.",
                  explanationEn:
                    "The result becomes information that improves the next training run.",
                  options: [
                    {
                      textAr: "معلومة تُصلح التدريب القادم",
                      textEn: "Information that improves the next training",
                      isCorrect: true,
                    },
                    {
                      textAr: "رقمًا يُعلن فقط",
                      textEn: "A number merely announced",
                      isCorrect: false,
                    },
                    { textAr: "ملفًا يُؤرشف", textEn: "A file archived", isCorrect: false },
                    {
                      textAr: "سببًا لعقاب المتدرّبين",
                      textEn: "A reason to punish learners",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "training-impact-measurement",
    instructorUsername: "nouf-alenezi",
    categorySlug: "education",
    titleAr: "قياس أثر التدريب",
    titleEn: "Measuring Training Impact",
    subtitleAr: "من رضا الحضور إلى أثر في الأداء، ومن أثر إلى قرار يستحق الاستثمار",
    subtitleEn:
      "From attendee satisfaction to performance impact, and from impact to a decision worth investing in",
    descriptionAr:
      "معظم تقارير التدريب تنتهي بدرجة رضا، وهي أضعف ما يمكن قياسه. نبدأ من سؤال صاحب العمل: ما الذي يجب أن يتغيّر في العمل بعد التدريب؟ ثم نختار مقياسًا يمكن ملاحظته في العمل، ونجمع قياسًا قبليًا قبل التدريب لا بعده.\n\nنتناول بعد ذلك الصعوبات الحقيقية: كيف نعزل أثر التدريب عن تغيّرات أخرى حدثت في الفترة نفسها، وكيف نتعامل مع مجموعة صغيرة لا تكفي لاستنتاج قوي، وكيف نكتب تقريرًا يقول بوضوح ما لا نستطيع إثباته. نختتم ببناء خطّة قياس لبرنامج واحد من برامجك.",
    descriptionEn:
      "Most training reports end with a satisfaction score, the weakest thing available to measure. We start from the employer's question: what should change at work after the training? Then we choose a metric observable on the job and collect a baseline before the training, not after.\n\nWe then tackle the real difficulties: separating the training's effect from other changes in the same period, handling a small group that cannot support a strong conclusion, and writing a report that states plainly what cannot be proven. We finish by building a measurement plan for one of your own programmes.",
    level: "ADVANCED",
    language: "AR",
    priceCents: 36900,
    objectives: [
      {
        textAr: "تحدّد ما يجب أن يتغيّر في العمل بعد التدريب.",
        textEn: "Define what should change at work after the training.",
      },
      {
        textAr: "تجمع قياسًا قبليًا قبل التدريب لا بعده.",
        textEn: "Collect a baseline before the training, not after.",
      },
      {
        textAr: "تعزل أثر التدريب عن تغيّرات أخرى في الفترة نفسها.",
        textEn: "Separate the training's effect from other changes in the same period.",
      },
      {
        textAr: "تتعامل مع عيّنة صغيرة دون استنتاج مبالغ.",
        textEn: "Handle a small sample without an exaggerated conclusion.",
      },
      {
        textAr: "تكتب تقريرًا يذكر ما لا يمكن إثباته.",
        textEn: "Write a report stating what cannot be proven.",
      },
      {
        textAr: "تبني خطّة قياس كاملة لبرنامج تدريبي واحد.",
        textEn: "Build a complete measurement plan for one training programme.",
      },
    ],
    requirements: [
      {
        textAr: "خبرة في تصميم أو إدارة تدريب.",
        textEn: "Experience designing or managing training.",
      },
      {
        textAr: "وصول إلى بيانات أداء أو مؤشّرات عمل.",
        textEn: "Access to performance data or work indicators.",
      },
      {
        textAr: "قدرة على تحليل أرقام أساسية ومقارنتها.",
        textEn: "Ability to analyse and compare basic numbers.",
      },
    ],
    sections: [
      {
        titleAr: "من الرضا إلى الأثر",
        titleEn: "From Satisfaction to Impact",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "لماذا درجة الرضا لا تكفي",
            titleEn: "Why a satisfaction score is not enough",
            isPreview: true,
            durationSec: 480,
          },
          {
            type: "VIDEO",
            titleAr: "ما يجب أن يتغيّر في العمل",
            titleEn: "What should change at work",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "القياس القبلي: قبل التدريب لا بعده",
            titleEn: "The baseline: before the training, not after",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "اختيار مقياس يمكن ملاحظته في العمل",
            titleEn: "Choosing a metric observable on the job",
            durationSec: 660,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: القياس القبلي لا يمكن استرجاعه لاحقًا",
            titleEn: "Reading: a baseline cannot be recovered later",
            durationSec: 360,
            contentAr:
              "<p>إن لم تجمع القياس قبل التدريب، فلن تستطيع إثبات أي تغيّر بعده. جمع البيانات بعد التدريب يخبرك بالوضع الحالي، لا بالفرق بين ما كان وما صار، والفرق هو ما يهمّ صاحب القرار.</p><h3>ثلاثة قرارات قبل البدء</h3><ul><li>ما المقياس الذي سنلاحظه في العمل؟</li><li>كيف نجمع قيمته قبل التدريب من نفس الأشخاص أو نفس العملية؟</li><li>متى نعيد القياس بعد التدريب، وبعد كم أسبوع؟</li></ul><p>هذه القرارات تُتخذ قبل التسجيل في البرنامج. بعد التدريب يصبح كل قرار منها استنتاجًا متأخرًا لا قياسًا.</p>",
            contentEn:
              "<p>If you do not collect the baseline before the training, you cannot prove any change after it. Collecting data after the training tells you the current state, not the difference between what was and what is, and the difference is what a decision-maker needs.</p><h3>Three decisions before starting</h3><ul><li>Which metric will we observe at work?</li><li>How do we capture its value before training, from the same people or process?</li><li>When do we re-measure after training, and how many weeks later?</li></ul><p>These decisions are made before enrolling in the programme. After the training, each becomes a late inference rather than a measurement.</p>",
          },
        ],
      },
      {
        titleAr: "العزل والحدود",
        titleEn: "Isolation and Limits",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "عزل أثر التدريب عن تغيّرات أخرى",
            titleEn: "Separating the effect from other changes",
            isPreview: true,
            durationSec: 660,
          },
          {
            type: "VIDEO",
            titleAr: "عيّنة صغيرة: ما يمكن قوله",
            titleEn: "Small samples: what can be said",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "تقرير يقول ما لا يُثبت",
            titleEn: "A report that states what is not proven",
            durationSec: 600,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: الفرق الذي قد يكون سببه شيئًا آخر",
            titleEn: "Reading: the difference that may have another cause",
            durationSec: 360,
            contentAr:
              "<p>تحسّن مؤشّر بعد التدريب لا يعني أن التدريب سبّبه. في الفترة نفسها قد يتغيّر النظام، أو يتغيّر المشرف، أو يدخل موظّفون جدد. الإشارة إلى هذه الاحتمالات ليست ضعفًا في التقرير، بل ما يجعله صادقًا.</p><h3>ثلاث طرق لتقوية الاستنتاج</h3><ul><li>قارن بمجموعة لم تحضر التدريب إن أمكن.</li><li>سجّل التغيّرات الأخرى التي حدثت في الفترة.</li><li>اسأل المشرفين عن سبب التحسّن الذي لاحظوه.</li></ul><p>هذه الخطوات لا تعطي يقينًا كاملًا، لكنها تحوّل الادّعاء من «التدريب نجح» إلى «التدريب مرشّح قويّ للتفسير».</p>",
            contentEn:
              "<p>An indicator improving after training does not mean the training caused it. In the same period the system may have changed, the supervisor may have changed, or new staff may have joined. Naming these possibilities is not weakness in a report; it is what makes it honest.</p><h3>Three ways to strengthen the conclusion</h3><ul><li>Compare with a group that did not attend, where possible.</li><li>Record the other changes that occurred in the period.</li><li>Ask supervisors what they believe caused the improvement.</li></ul><p>These steps do not give certainty, but they move the claim from «the training worked» to «the training is a strong candidate explanation».</p>",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: العزل والحدود",
            titleEn: "Quiz: isolation and limits",
            quiz: {
              titleAr: "اختبار: العزل والحدود",
              titleEn: "Quiz: isolation and limits",
              passPct: 80,
              maxAttempts: 3,
              timeLimitSec: 1500,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "لماذا لا تكفي درجة الرضا؟",
                  promptEn: "Why is a satisfaction score insufficient?",
                  explanationAr: "الرضا لا يخبرنا هل تغيّر الأداء في العمل.",
                  explanationEn: "Satisfaction does not tell us whether work performance changed.",
                  options: [
                    {
                      textAr: "لأنها لا تخبرنا هل تغيّر الأداء",
                      textEn: "Because it does not tell us whether performance changed",
                      isCorrect: true,
                    },
                    {
                      textAr: "لأنها صعبة القياس",
                      textEn: "Because it is hard to measure",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأنها سرّية",
                      textEn: "Because it is confidential",
                      isCorrect: false,
                    },
                    {
                      textAr: "لأنها تُقاس بالأرقام",
                      textEn: "Because it is measured in numbers",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "يمكن استرجاع القياس القبلي بعد انتهاء التدريب.",
                  promptEn: "A baseline can be recovered after the training ends.",
                  explanationAr: "القياس بعد التدريب يخبر بالوضع الحالي لا بالفرق.",
                  explanationEn:
                    "Post-training measurement gives the current state, not the difference.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما نوع المجموعة التي تقوّي الاستنتاج عند المقارنة؟",
                  promptEn: "Which group strengthens a conclusion when used for comparison?",
                  explanationAr: "مجموعة لم تحضر التدريب تسمح بمقارنة أكثر عدلًا.",
                  explanationEn: "A group that did not attend allows a fairer comparison.",
                  acceptedAnswers: [
                    "control group",
                    "comparison group",
                    "a group that did not attend",
                    "non-attendees",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي مما قد يفسّر تحسّن مؤشّر بعد التدريب؟",
                  promptEn: "Which of these may explain an indicator improving after training?",
                  explanationAr: "تغيّر النظام أو المشرف أو دخول موظّفين جدد أسباب بديلة.",
                  explanationEn:
                    "A system change, a supervisor change, or new staff are alternative causes.",
                  options: [
                    {
                      textAr: "تغيّر النظام في الفترة نفسها",
                      textEn: "The system changing in the same period",
                      isCorrect: true,
                    },
                    { textAr: "تغيّر المشرف", textEn: "The supervisor changing", isCorrect: true },
                    { textAr: "دخول موظّفين جدد", textEn: "New staff joining", isCorrect: true },
                    {
                      textAr: "لون قاعة التدريب",
                      textEn: "The training room colour",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "ما الصياغة الأدقّ للاستنتاج؟",
                  promptEn: "What is the more accurate conclusion wording?",
                  explanationAr: "«مرشّح قويّ للتفسير» أدقّ من ادّعاء سببية كاملة.",
                  explanationEn:
                    "«A strong candidate explanation» is more accurate than claiming full causation.",
                  options: [
                    {
                      textAr: "التدريب مرشّح قويّ للتفسير",
                      textEn: "The training is a strong candidate explanation",
                      isCorrect: true,
                    },
                    {
                      textAr: "التدريب هو السبب الوحيد",
                      textEn: "The training is the only cause",
                      isCorrect: false,
                    },
                    { textAr: "لا شيء تغيّر", textEn: "Nothing changed", isCorrect: false },
                    {
                      textAr: "النتيجة عشوائية تمامًا",
                      textEn: "The result is entirely random",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        titleAr: "التقرير والخطّة",
        titleEn: "The Report and Plan",
        lessons: [
          {
            type: "VIDEO",
            titleAr: "تقرير يقرأه صاحب القرار",
            titleEn: "A report a decision-maker reads",
            durationSec: 600,
          },
          {
            type: "VIDEO",
            titleAr: "بناء خطّة قياس لبرنامج واحد",
            titleEn: "Building a measurement plan for one programme",
            durationSec: 660,
          },
          {
            type: "TEXT",
            titleAr: "قراءة: تقرير من صفحة واحدة يقود قرارًا",
            titleEn: "Reading: a one-page report that drives a decision",
            durationSec: 300,
            contentAr:
              "<p>صاحب القرار لا يريد تقريرًا عن التدريب، بل قرارًا: هل نكرّر البرنامج، ونعدّله، أو نوقفه؟ التقرير الجيد يبدأ بهذا السؤال ويجيب عنه في السطر الأول.</p><h3>أربعة أسطر</h3><ul><li>ما تغيّر، ومقداره، وفيمن.</li><li>ما الذي يدعم أن التدريب سبب مرجّح.</li><li>ما الذي لا يمكن إثباته.</li><li>القرار المقترح للدورة القادمة.</li></ul><p>الأسطر الأربعة تمنع التقرير من التحوّل إلى سرد أنشطة، وتجعل قيمته في القرار الذي ينتج عنه لا في عدد صفحاته.</p>",
            contentEn:
              "<p>A decision-maker does not want a report about training; they want a decision: do we repeat the programme, adjust it, or stop it? A good report starts from that question and answers it in the first line.</p><h3>Four lines</h3><ul><li>What changed, by how much, and among whom.</li><li>What supports the training as a likely cause.</li><li>What cannot be proven.</li><li>The proposed decision for the next run.</li></ul><p>These four lines keep the report from becoming an activity narrative, and place its value in the decision it produces rather than its page count.</p>",
          },
          {
            type: "FILE",
            titleAr: "قالب تقرير أثر التدريب",
            titleEn: "Training impact report template",
            durationSec: 300,
            attachmentAr: "قالب تقرير أثر التدريب",
            attachmentEn: "Training impact report template",
          },
          {
            type: "QUIZ",
            titleAr: "اختبار: التقرير والخطّة",
            titleEn: "Quiz: the report and plan",
            quiz: {
              titleAr: "اختبار: التقرير والخطّة",
              titleEn: "Quiz: the report and plan",
              passPct: 80,
              maxAttempts: 3,
              questions: [
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "بماذا يبدأ تقرير أثر التدريب؟",
                  promptEn: "How does a training impact report begin?",
                  explanationAr: "البدء بالقرار الذي يحتاجه صاحب القرار يجعل التقرير مفيدًا.",
                  explanationEn:
                    "Starting from the decision the reader needs makes the report useful.",
                  options: [
                    {
                      textAr: "بالقرار الذي يحتاجه القارئ",
                      textEn: "With the decision the reader needs",
                      isCorrect: true,
                    },
                    {
                      textAr: "بجدول الحضور",
                      textEn: "With the attendance table",
                      isCorrect: false,
                    },
                    { textAr: "بوصف القاعة", textEn: "With a room description", isCorrect: false },
                    { textAr: "بعدد الشرائح", textEn: "With the slide count", isCorrect: false },
                  ],
                },
                {
                  type: "TRUE_FALSE",
                  promptAr: "ذكر ما لا يمكن إثباته يضعف التقرير.",
                  promptEn: "Stating what cannot be proven weakens the report.",
                  explanationAr: "الاعتراف بالحدود يجعله صادقًا ويزيد الثقة.",
                  explanationEn: "Acknowledging limits makes it honest and increases trust.",
                  options: [
                    { textAr: "صحيح", textEn: "True", isCorrect: false },
                    { textAr: "خطأ", textEn: "False", isCorrect: true },
                  ],
                },
                {
                  type: "SHORT_ANSWER",
                  promptAr: "ما القرارات الثلاثة المحتملة بعد قياس الأثر؟",
                  promptEn: "What three possible decisions follow impact measurement?",
                  explanationAr: "التكرار أو التعديل أو الإيقاف هي الخيارات الثلاثة.",
                  explanationEn: "Repeat, adjust, or stop are the three options.",
                  acceptedAnswers: [
                    "repeat, adjust, or stop",
                    "repeat adjust stop",
                    "repeat or stop",
                    "continue, adjust, stop",
                  ],
                },
                {
                  type: "MULTI_CHOICE",
                  promptAr: "أي أسطر يجب أن يحملها تقرير الأثر؟",
                  promptEn: "Which lines must an impact report carry?",
                  explanationAr: "ما تغيّر ودليله وحدوده والقرار المقترح هي الأسطر الأربعة.",
                  explanationEn:
                    "What changed, its support, its limits, and the proposed decision are the four lines.",
                  options: [
                    {
                      textAr: "ما تغيّر ومقداره وفيمن",
                      textEn: "What changed, by how much, and among whom",
                      isCorrect: true,
                    },
                    {
                      textAr: "ما يدعم أن التدريب سبب مرجّح",
                      textEn: "What supports the training as a likely cause",
                      isCorrect: true,
                    },
                    {
                      textAr: "ما لا يمكن إثباته",
                      textEn: "What cannot be proven",
                      isCorrect: true,
                    },
                    {
                      textAr: "قائمة بكل الأنشطة",
                      textEn: "A list of every activity",
                      isCorrect: false,
                    },
                  ],
                },
                {
                  type: "SINGLE_CHOICE",
                  promptAr: "أين تكمن قيمة التقرير؟",
                  promptEn: "Where does the report's value lie?",
                  explanationAr: "القيمة في القرار الذي ينتج عنه لا في عدد صفحاته.",
                  explanationEn: "The value is in the decision it produces, not its page count.",
                  options: [
                    {
                      textAr: "في القرار الذي ينتج عنه",
                      textEn: "In the decision it produces",
                      isCorrect: true,
                    },
                    { textAr: "في عدد صفحاته", textEn: "In its page count", isCorrect: false },
                    { textAr: "في عدد الصور", textEn: "In its image count", isCorrect: false },
                    {
                      textAr: "في طول المقدّمة",
                      textEn: "In the length of its introduction",
                      isCorrect: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
];
