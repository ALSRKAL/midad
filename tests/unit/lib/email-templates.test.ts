import { describe, expect, it } from "vitest";

import { EMAIL_TEMPLATES, renderEmail } from "@/lib/email-templates";

/** P09-T03: every template renders both languages and escapes interpolated values. */

describe("email templates", () => {
  it("renders every template in both locales", () => {
    for (const template of EMAIL_TEMPLATES) {
      for (const locale of ["ar", "en"] as const) {
        const rendered = renderEmail(template, locale, {
          name: "أفنان",
          url: "https://midad.example/ar",
          courseTitle: "دورة",
          title: "عنوان",
          body: "نص",
          code: "MD-TEST-2026",
          amount: "10.00 SAR",
          items: ["دورة"],
          invoiceUrl: "https://midad.example/ar/invoice",
          purchasesUrl: "https://midad.example/ar/purchases",
        });
        expect(rendered.subject.length).toBeGreaterThan(0);
        expect(rendered.html).toContain("dir=");
        expect(rendered.html).toContain("https://midad.example/ar");
      }
    }
  });

  it("puts the requested language first", () => {
    const ar = renderEmail("welcome", "ar", { name: "أفنان", url: "https://m.example" });
    const en = renderEmail("welcome", "en", { name: "Afnan", url: "https://m.example" });
    expect(ar.html.indexOf("أهلًا")).toBeLessThan(ar.html.indexOf("Welcome"));
    expect(en.html.indexOf("Welcome")).toBeLessThan(en.html.indexOf("أهلًا"));
  });

  it("escapes interpolated HTML", () => {
    const rendered = renderEmail("announcement", "ar", {
      title: '<script>alert("x")</script>',
      body: "<b>مرحبًا</b>",
      courseTitle: "دورة",
      url: "https://midad.example",
    });
    expect(rendered.html).not.toContain("<script>");
    expect(rendered.html).toContain("&lt;script&gt;");
  });

  it("includes every purchased item in a receipt", () => {
    const rendered = renderEmail("purchase_receipt", "ar", {
      name: "أفنان",
      amount: "20.00 SAR",
      items: ["دورة أ", "دورة ب"],
      invoiceUrl: "https://midad.example/invoice",
      purchasesUrl: "https://midad.example/purchases",
    });
    expect(rendered.html).toContain("دورة أ");
    expect(rendered.html).toContain("دورة ب");
  });

  it("produces a readable plain-text alternative with its links", () => {
    const rendered = renderEmail("review_reply", "ar", {
      courseTitle: "دورة المراجعات",
      reply: "شكرًا لملاحظاتك",
      url: "https://midad.example/ar/courses/reviews",
    });
    expect(rendered.text).toContain("دورة المراجعات");
    expect(rendered.text).toContain("شكرًا لملاحظاتك");
    expect(rendered.text).toContain("https://midad.example/ar/courses/reviews");
    expect(rendered.text).not.toContain("<");
    expect(rendered.text).not.toContain("&lt;");
  });

  it("keeps user titles on one subject line", () => {
    const rendered = renderEmail("announcement", "ar", {
      title: "درس جديد\nBcc: attacker@example.test",
      body: "نص",
      courseTitle: "دورة",
      url: "https://midad.example",
    });
    expect(rendered.subject).not.toContain("\n");
    expect(rendered.subject).toContain("درس جديد");
  });
});
