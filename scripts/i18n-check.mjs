#!/usr/bin/env node
/**
 * i18n:check — fails when a translation problem would reach a user.
 *
 * Checks:
 *   1. a key exists in messages/ar.json but not messages/en.json (or vice versa);
 *   2. a key is never referenced from src/**;
 *   3. a JSX text node contains literal copy instead of a translation call;
 *   4. an Arabic value is byte-identical to the English one (untranslated), unless allowlisted.
 *
 * Exit code: 0 clean, 1 with a printed list of problems.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname } from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const MESSAGES_DIR = join(ROOT, "messages");
const SRC_DIR = join(ROOT, "src");
const ALLOWLIST_FILE = join(ROOT, "i18n-allowlist.json");

const ARABIC_AND_LATIN_LETTERS = /[A-Za-z\u0600-\u06FF]/;
const problems = [];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function flatten(value, prefix = "", out = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child !== null && typeof child === "object" && !Array.isArray(child)) {
      flatten(child, path, out);
    } else {
      out.set(path, String(child));
    }
  }
  return out;
}

function walkFiles(dir, extensions, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (["node_modules", ".next", "coverage"].includes(entry)) continue;
      walkFiles(full, extensions, out);
    } else if (extensions.includes(extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * 1 + 4: catalogue parity                                             *
 * ------------------------------------------------------------------ */

const arPath = join(MESSAGES_DIR, "ar.json");
const enPath = join(MESSAGES_DIR, "en.json");
const catalogueExists = existsSync(arPath) && existsSync(enPath);

let arKeys = new Map();
let enKeys = new Map();

if (!catalogueExists) {
  console.log(
    "i18n:check — no message catalogue yet (messages/ar.json + messages/en.json land in P01-T03). Nothing to verify.",
  );
} else {
  const allowlist = existsSync(ALLOWLIST_FILE)
    ? new Set(readJson(ALLOWLIST_FILE).allowIdentical ?? [])
    : new Set();

  arKeys = flatten(readJson(arPath));
  enKeys = flatten(readJson(enPath));

  for (const key of arKeys.keys()) {
    if (!enKeys.has(key)) problems.push(`missing in en.json: ${key}`);
  }
  for (const key of enKeys.keys()) {
    if (!arKeys.has(key)) problems.push(`missing in ar.json: ${key}`);
  }
  for (const [key, value] of arKeys) {
    const other = enKeys.get(key);
    if (other === undefined) continue;
    if (value === other && !allowlist.has(key)) {
      problems.push(`identical ar/en value (untranslated?): ${key} = "${value}"`);
    }
    if (value.trim() === "") problems.push(`empty ar value: ${key}`);
  }

  /* ---------------------------------------------------------------- *
   * 2: unused keys                                                    *
   * ---------------------------------------------------------------- */

  const sourceFiles = walkFiles(SRC_DIR, [".ts", ".tsx"]);
  const sourceText = sourceFiles.map((file) => readFileSync(file, "utf8")).join("\n");

  /**
   * A key counts as used when one of its suffixes is referenced in quotes, e.g. the catalogue key
   * `DesignSystem.sections.forms` is used by `t("sections.forms")` inside the design-system namespace.
   */
  const isQuoted = (value) =>
    sourceText.includes(`"${value}"`) ||
    sourceText.includes(`'${value}'`) ||
    sourceText.includes(`\`${value}\``);

  for (const key of arKeys.keys()) {
    const segments = key.split(".");
    const suffixes = [];
    for (let start = 0; start < segments.length; start += 1) {
      suffixes.push(segments.slice(start).join("."));
    }
    const used = sourceText.includes(key) || suffixes.some(isQuoted);
    if (!used) problems.push(`unused key: ${key}`);
  }
}

/* ------------------------------------------------------------------ *
 * 3: static text in JSX                                               *
 * ------------------------------------------------------------------ */

function checkJsxText(file) {
  const text = readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const visit = (node) => {
    if (node.kind === ts.SyntaxKind.JsxText) {
      const content = node.getText(source).replace(/\s+/g, " ").trim();
      if (content.length > 0 && ARABIC_AND_LATIN_LETTERS.test(content)) {
        const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
        problems.push(
          `static JSX text at ${relative(ROOT, file)}:${line + 1} → "${content.slice(0, 60)}" (use next-intl)`,
        );
      }
    } else if (node.kind === ts.SyntaxKind.JsxAttribute) {
      const name = node.name?.getText?.(source);
      if (name === "title" || name === "placeholder" || name === "alt" || name === "aria-label") {
        const initializer = node.initializer;
        /**
         * Addresses, URLs and code samples are data, not copy: "name@example.com" reads the same in
         * both languages, so it is exempt rather than duplicated in the catalogue.
         */
        const isLanguageNeutral =
          initializer !== undefined &&
          initializer.kind === ts.SyntaxKind.StringLiteral &&
          (/@|^https?:\/\//.test(initializer.text) || /^[\w./#{}:-]+$/.test(initializer.text));

        if (
          initializer &&
          initializer.kind === ts.SyntaxKind.StringLiteral &&
          !isLanguageNeutral &&
          ARABIC_AND_LATIN_LETTERS.test(initializer.text)
        ) {
          const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
          problems.push(
            `static "${name}" attribute at ${relative(ROOT, file)}:${line + 1} → "${initializer.text.slice(0, 60)}"`,
          );
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(source);
}

for (const file of walkFiles(SRC_DIR, [".tsx"])) {
  checkJsxText(file);
}

/* ------------------------------------------------------------------ *
 * Result                                                             *
 * ------------------------------------------------------------------ */

if (problems.length > 0) {
  console.error(`i18n:check failed with ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ✖ ${problem}`);
  process.exit(1);
}

const keyCount = catalogueExists ? arKeys.size : 0;
console.log(
  `i18n:check passed — ${keyCount} keys, ${walkFiles(SRC_DIR, [".tsx"]).length} TSX files scanned.`,
);
