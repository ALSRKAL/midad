import { describe, expect, it } from "vitest";

import { richTextPlainLength, sanitizeRichText } from "@/lib/sanitize-rich-text";

/** Lesson HTML sanitisation (P04-T05). Scripts and handlers must never reach the database. */

describe("sanitizeRichText", () => {
  it("keeps the allow-listed formatting", () => {
    const html = "<h2>عنوان</h2><p><strong>نص</strong> و<em>تأكيد</em></p><ul><li>بند</li></ul>";
    expect(sanitizeRichText(html)).toBe(html);
  });

  it("removes scripts, event handlers and styles", () => {
    const html =
      '<p onclick="alert(1)" style="color:red">x</p><script>alert(2)</script><img src=x onerror="alert(3)">';
    const clean = sanitizeRichText(html);
    expect(clean).not.toContain("script");
    expect(clean).not.toContain("onclick");
    expect(clean).not.toContain("onerror");
    expect(clean).not.toContain("style=");
    expect(clean).not.toContain("<img");
    expect(clean).toContain("<p>x</p>");
  });

  it("rejects javascript: links but keeps http(s) and mailto", () => {
    const clean = sanitizeRichText(
      '<a href="javascript:alert(1)">bad</a><a href="https://example.com">good</a><a href="mailto:a@b.c">mail</a>',
    );
    expect(clean).not.toContain("javascript:");
    expect(clean).toContain('href="https://example.com"');
    expect(clean).toContain('href="mailto:a@b.c"');
    expect(clean).toContain('rel="noopener noreferrer"');
  });

  it("keeps syntax-highlight classes on code and span", () => {
    const clean = sanitizeRichText(
      '<pre class="hljs"><code class="language-ts"><span class="hljs-keyword">const</span> x = 1;</code></pre>',
    );
    expect(clean).toContain('class="language-ts"');
    expect(clean).toContain('class="hljs-keyword"');
  });

  it("drops iframes and forms", () => {
    const clean = sanitizeRichText(
      '<iframe src="https://evil.example"></iframe><form><input></form>',
    );
    expect(clean).toBe("");
  });
});

describe("richTextPlainLength", () => {
  it("counts visible text, not markup", () => {
    expect(richTextPlainLength("<p>مرحبًا <strong>بالعالم</strong></p>")).toBe(14);
    expect(richTextPlainLength("<p>   </p>")).toBe(0);
  });
});
