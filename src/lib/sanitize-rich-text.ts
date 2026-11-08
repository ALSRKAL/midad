/**
 * Rich-text sanitisation for lesson content (the product requirements, P04-T05).
 *
 * The editor is a convenience, never a trust boundary: the server stores only allow-listed tags and
 * attributes. Scripts, event handlers, styles, iframes and non-http schemes are removed. Classes are
 * kept on code/pre/span because the syntax highlighter needs them; a class cannot execute code.
 */

import sanitizeHtml from "sanitize-html";

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "h2",
    "h3",
    "h4",
    "strong",
    "em",
    "s",
    "ul",
    "ol",
    "li",
    "blockquote",
    "pre",
    "code",
    "a",
    "br",
    "hr",
    "span",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    code: ["class"],
    pre: ["class"],
    span: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
  disallowedTagsMode: "discard",
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, OPTIONS).trim();
}

/** Plain-text length, used by the BR-02 checklist (a TEXT lesson needs at least 200 characters). */
export function richTextPlainLength(html: string): number {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
  return text.replace(/\s+/g, " ").trim().length;
}
