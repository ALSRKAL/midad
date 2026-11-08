/**
 * Bilingual transactional email templates (P09-T03).
 *
 * Every message carries Arabic and English sections; `locale` decides which comes first. The renderer
 * is pure so the worker can use it without the Next server runtime. All interpolated values are
 * escaped before HTML assembly.
 */

export const EMAIL_TEMPLATES = [
  "email_verification",
  "password_reset",
  "purchase_receipt",
  "course_review_decision",
  "instructor_application_decision",
  "review_reply",
  "announcement",
  "certificate_issued",
  "welcome",
  "question_answered",
] as const;

export type EmailTemplate = (typeof EMAIL_TEMPLATES)[number];
export type EmailLocale = "ar" | "en";
export type EmailData = Record<string, unknown>;

export type RenderedEmail = { subject: string; text: string; html: string };

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
    ? String(value)
    : "";
}

function html(value: unknown): string {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function link(url: unknown, label: string): string {
  const href = text(url);
  return `<a href="${html(href)}">${html(label)}</a>`;
}

/**
 * Plain-text alternative derived from the rendered block. Values were escaped for HTML, so the
 * entities are decoded again; links keep their href so text-only clients can still act.
 */
function htmlToText(value: string): string {
  return value
    .replace(/<a href="([^"]*)">([^<]*)<\/a>/g, "$2: $1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<\/(p|h1|h2|h3|li|blockquote|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function renderEmail(
  template: EmailTemplate,
  locale: EmailLocale,
  data: EmailData,
): RenderedEmail {
  const name = text(data.name);
  const url = text(data.url);

  const blocks = (() => {
    switch (template) {
      case "email_verification":
        return {
          subjectAr: "فعّل بريدك · Verify your email",
          subjectEn: "Verify your email · فعّل بريدك",
          ar: `<h2>أهلًا ${html(name)}</h2><p>فعّل بريدك لإكمال إنشاء الحساب.</p><p>${link(url, "فعّل البريد")}</p>`,
          en: `<h2>Welcome ${html(name)}</h2><p>Confirm your email address to finish creating your account.</p><p>${link(url, "Verify email")}</p>`,
        };
      case "password_reset":
        return {
          subjectAr: "إعادة تعيين كلمة المرور · Reset your password",
          subjectEn: "Reset your password · إعادة تعيين كلمة المرور",
          ar: `<h2>إعادة تعيين كلمة المرور</h2><p>افتح الرابط خلال ساعة. يُستخدم مرة واحدة.</p><p>${link(url, "أعد تعيين كلمة المرور")}</p>`,
          en: `<h2>Reset your password</h2><p>This single-use link expires in one hour.</p><p>${link(url, "Reset password")}</p>`,
        };
      case "purchase_receipt": {
        const items = list(data.items);
        return {
          subjectAr: "إيصال الشراء · Your purchase receipt",
          subjectEn: "Your purchase receipt · إيصال الشراء",
          ar: `<h2>شكرًا لشرائك</h2><p>مرحبًا ${html(name)}، استلمنا دفعتك بمبلغ <strong>${html(data.amount)}</strong>.</p><ul>${items.map((item) => `<li>${html(item)}</li>`).join("")}</ul><p>${link(data.invoiceUrl, "نزّل الفاتورة")} · ${link(data.purchasesUrl, "سجل المشتريات")}</p>`,
          en: `<h2>Thank you</h2><p>Hi ${html(name)}, we received your payment of <strong>${html(data.amount)}</strong>.</p><ul>${items.map((item) => `<li>${html(item)}</li>`).join("")}</ul><p>${link(data.invoiceUrl, "Download invoice")} · ${link(data.purchasesUrl, "Purchase history")}</p>`,
        };
      }
      case "course_review_decision": {
        const approved = data.approved === true;
        return {
          subjectAr: approved
            ? "نُشرت دورتك · Course published"
            : "دورتك تحتاج تعديلًا · Course needs changes",
          subjectEn: approved
            ? "Course published · نُشرت دورتك"
            : "Course needs changes · دورتك تحتاج تعديلًا",
          ar: `<h2 dir="auto">${approved ? "نُشرت دورتك" : "تحتاج دورتك إلى تعديل"}</h2><p dir="auto">${html(data.courseTitle)}</p>${data.reason === undefined || data.reason === null ? "" : `<p dir="auto">السبب: ${html(data.reason)}</p>`}<p>${link(data.url, "افتح لوحة المدرب")}</p>`,
          en: `<h2 dir="auto">${approved ? "Your course is published" : "Your course needs changes"}</h2><p dir="auto">${html(data.courseTitle)}</p>${data.reason === undefined || data.reason === null ? "" : `<p dir="auto">Reason: ${html(data.reason)}</p>`}<p>${link(data.url, "Open the instructor dashboard")}</p>`,
        };
      }
      case "instructor_application_decision": {
        const approved = data.approved === true;
        return {
          subjectAr: approved
            ? "قُبل طلبك · Application approved"
            : "طلبك يحتاج تعديلًا · Application needs changes",
          subjectEn: approved
            ? "Application approved · قُبل طلبك"
            : "Application needs changes · طلبك يحتاج تعديلًا",
          ar: `<h2>${approved ? "قُبل طلب الانضمام كمدرب" : "لم يُقبل الطلب بعد"}</h2><p>مرحبًا ${html(name)}.</p>${data.reason === undefined || data.reason === null ? "" : `<p>السبب: ${html(data.reason)}</p>`}<p>${link(url, "افتح حسابك")}</p>`,
          en: `<h2>${approved ? "Instructor application approved" : "Application not approved"}</h2><p>Hi ${html(name)}.</p>${data.reason === undefined || data.reason === null ? "" : `<p>Reason: ${html(data.reason)}</p>`}<p>${link(url, "Open your account")}</p>`,
        };
      }
      case "review_reply":
        return {
          subjectAr: "ردّ المدرب على تقييمك · Instructor replied",
          subjectEn: "Instructor replied · ردّ المدرب على تقييمك",
          ar: `<h2>ردّ جديد على تقييمك</h2><p dir="auto">${html(data.courseTitle)}</p><blockquote dir="auto">${html(data.reply)}</blockquote><p>${link(url, "افتح الدورة")}</p>`,
          en: `<h2>A reply to your review</h2><p dir="auto">${html(data.courseTitle)}</p><blockquote dir="auto">${html(data.reply)}</blockquote><p>${link(url, "Open the course")}</p>`,
        };
      case "announcement":
        return {
          subjectAr: `إعلان / Announcement: ${text(data.title)}`,
          subjectEn: `Announcement / إعلان: ${text(data.title)}`,
          ar: `<h2 dir="auto">${html(data.title)}</h2><p dir="auto">${html(data.courseTitle)}</p><p dir="auto">${html(data.body)}</p><p>${link(url, "افتح الدورة")}</p>`,
          en: `<h2 dir="auto">${html(data.title)}</h2><p dir="auto">${html(data.courseTitle)}</p><p dir="auto">${html(data.body)}</p><p>${link(url, "Open the course")}</p>`,
        };
      case "certificate_issued":
        return {
          subjectAr: "شهادتك جاهزة · Certificate ready",
          subjectEn: "Certificate ready · شهادتك جاهزة",
          ar: `<h2>تهانينا ${html(name)}</h2><p>شهادة إتمام دورة ${html(data.courseTitle)} جاهزة برمز ${html(data.code)}.</p><p>${link(url, "اعرض الشهادة")}</p>`,
          en: `<h2>Congratulations ${html(name)}</h2><p>Your certificate for ${html(data.courseTitle)} is ready with code ${html(data.code)}.</p><p>${link(url, "View certificate")}</p>`,
        };
      case "welcome":
        return {
          subjectAr: "أهلًا بك في مِداد · Welcome to Midad",
          subjectEn: "Welcome to Midad · أهلًا بك في مِداد",
          ar: `<h2>أهلًا ${html(name)}</h2><p>ابدأ من الكتالوج واختر دورتك الأولى.</p><p>${link(url, "تصفح الدورات")}</p>`,
          en: `<h2>Welcome ${html(name)}</h2><p>Start from the catalog and choose your first course.</p><p>${link(url, "Browse courses")}</p>`,
        };
      case "question_answered":
        return {
          subjectAr: "ردّ جديد على سؤالك · New reply",
          subjectEn: "New reply · ردّ جديد على سؤالك",
          ar: `<h2>ردّ جديد على سؤالك</h2><p dir="auto">${html(data.threadTitle)}</p><p>${link(url, "افتح النقاش")}</p>`,
          en: `<h2>A new reply to your question</h2><p dir="auto">${html(data.threadTitle)}</p><p>${link(url, "Open the discussion")}</p>`,
        };
      default:
        return {
          subjectAr: "رسالة من مِداد",
          subjectEn: "A message from Midad",
          ar: `<p>${html(data.body)}</p>`,
          en: `<p>${html(data.body)}</p>`,
        };
    }
  })();

  const first = locale === "ar" ? blocks.ar : blocks.en;
  const second = locale === "ar" ? blocks.en : blocks.ar;
  // Header values must stay single-line even when content came from a user-supplied title.
  const subject = (locale === "ar" ? blocks.subjectAr : blocks.subjectEn)
    .replace(/[\r\n]+/g, " ")
    .trim();
  const textBody = `${htmlToText(first)}\n\n---\n\n${htmlToText(second)}`;

  return {
    subject,
    text: textBody,
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.6"><div dir="${locale === "ar" ? "rtl" : "ltr"}">${first}</div><hr/><div dir="${locale === "ar" ? "ltr" : "rtl"}">${second}</div><p style="color:#666;font-size:12px">Midad · support@midad.example</p></div>`,
  };
}
