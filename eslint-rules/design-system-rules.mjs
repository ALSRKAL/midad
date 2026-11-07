/**
 * Local ESLint plugin: rules that make the Midad design system enforceable.
 *
 * the product requirements/§7.4 and docs/DESIGN_SYSTEM.md §12 require:
 *   - logical CSS properties only (ms-/me-/ps-/pe-/start/end), never ml-/mr-/pl-/pr-/left/right;
 *   - no raw colours (tokens only) and no `font-bold` (weights are 400/500/600 only).
 *
 * Only class lists are inspected: JSX `className` attributes and the arguments of the
 * class helpers actually used in this code base (`cn`, `cva`, `clsx`). Prose in other
 * strings can never be mistaken for a class list.
 */

const LOGICAL_SUGGESTIONS = new Map([
  ["ml", "ms"],
  ["mr", "me"],
  ["pl", "ps"],
  ["pr", "pe"],
  ["left", "start"],
  ["right", "end"],
  ["text-left", "text-start"],
  ["text-right", "text-end"],
  ["border-l", "border-s"],
  ["border-r", "border-e"],
  ["rounded-l", "rounded-s"],
  ["rounded-r", "rounded-e"],
  ["rounded-tl", "rounded-ss"],
  ["rounded-tr", "rounded-se"],
  ["rounded-bl", "rounded-es"],
  ["rounded-br", "rounded-ee"],
  ["float-left", "float-start"],
  ["float-right", "float-end"],
  ["clear-left", "clear-start"],
  ["clear-right", "clear-end"],
]);

const PHYSICAL_PATTERNS = [
  { re: /^([mp])([lr])-/, key: (m) => `${m[1]}${m[2]}` },
  { re: /^(left|right)-/, key: (m) => m[1] },
  { re: /^(text|float|clear)-(left|right)(-|$)/, key: (m) => `${m[1]}-${m[2]}` },
  { re: /^border-([lr])(-|$)/, key: (m) => `border-${m[1]}` },
  { re: /^rounded-([lr])(-|$)/, key: (m) => `rounded-${m[1]}` },
  { re: /^rounded-(tl|tr|bl|br)(-|$)/, key: (m) => `rounded-${m[1]}` },
];

const RAW_VALUE_PATTERNS = [
  {
    re: /#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z])/,
    message:
      "Raw hex colour. Use a design token (bg-primary, text-muted-foreground, border-border-strong…).",
  },
  {
    re: /^(bg|text|border|fill|stroke|from|via|to)-(white|black)(-|$|\/)/,
    message:
      "Direct white/black breaks dark mode. Use the --surface / --foreground / --background tokens.",
  },
  {
    re: /^font-(bold|extrabold|black)$/,
    message:
      "Only weights 400/500/600 exist in the design system: use font-medium or font-semibold.",
  },
];

const CLASS_HELPERS = new Set(["cn", "cva", "clsx", "twMerge"]);

/** Splits a class string into utilities, dropping `!`, negative signs and variant prefixes. */
function utilityOf(token) {
  let depth = 0;
  let cut = 0;
  for (let i = 0; i < token.length; i += 1) {
    const ch = token[i];
    if (ch === "[") depth += 1;
    else if (ch === "]") depth = Math.max(0, depth - 1);
    else if (ch === ":" && depth === 0) cut = i + 1;
  }
  return token.slice(cut).replace(/^!/, "").replace(/^-/, "");
}

function tokensOf(value) {
  return value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

/** Collects every string that participates in a class list rooted at `node`. */
function collectClassStrings(node) {
  const values = [];
  const visit = (current) => {
    if (!current) return;
    switch (current.type) {
      case "Literal":
        if (typeof current.value === "string") values.push({ value: current.value, node: current });
        break;
      case "TemplateLiteral":
        for (const quasi of current.quasis) {
          values.push({ value: quasi.value.cooked ?? quasi.value.raw, node: quasi });
        }
        break;
      case "ConditionalExpression":
        visit(current.consequent);
        visit(current.alternate);
        break;
      case "LogicalExpression":
        visit(current.left);
        visit(current.right);
        break;
      case "BinaryExpression":
        visit(current.left);
        visit(current.right);
        break;
      case "ArrayExpression":
        for (const element of current.elements) visit(element);
        break;
      case "ObjectExpression":
        for (const property of current.properties) {
          if (property.type === "Property") visit(property.value);
        }
        break;
      case "CallExpression":
        for (const argument of current.arguments) visit(argument);
        break;
      case "TSAsExpression":
      case "TSNonNullExpression":
        visit(current.expression);
        break;
      default:
        break;
    }
  };
  visit(node);
  return values;
}

function isClassHelper(callee) {
  if (callee.type === "Identifier") return CLASS_HELPERS.has(callee.name);
  return (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier" &&
    CLASS_HELPERS.has(callee.property.name)
  );
}

function reportClasses(context, strings, inspect) {
  for (const { value, node } of strings) {
    for (const token of tokensOf(value)) inspect(token, node);
  }
}

function classVisitors(context, inspect) {
  const visitAttribute = (node) => {
    if (node.name.type !== "JSXIdentifier") return;
    if (node.name.name !== "className" && node.name.name !== "class") return;
    reportClasses(context, collectClassStrings(node.value), inspect);
  };

  return {
    JSXAttribute: visitAttribute,
    CallExpression(node) {
      if (!isClassHelper(node.callee)) return;
      reportClasses(context, collectClassStrings(node), inspect);
    },
    Literal(node) {
      if (node.parent?.type !== "Property") return;
      if (node.parent.key?.type !== "Identifier") return;
      if (node.parent.key.name !== "className") return;
      reportClasses(context, [{ value: String(node.value), node }], inspect);
    },
  };
}

const designSystemRules = {
  meta: { name: "midad-design-system", version: "1.0.0" },
  rules: {
    "no-physical-properties": {
      meta: {
        type: "problem",
        docs: {
          description: "Disallow physical CSS utilities; logical properties only, so RTL works.",
        },
        schema: [],
        messages: {
          physical:
            "Physical utility '{{token}}' breaks RTL. Use '{{suggestion}}' (logical property).",
        },
      },
      create(context) {
        return classVisitors(context, (token, node) => {
          const utility = utilityOf(token);
          for (const { re, key } of PHYSICAL_PATTERNS) {
            const match = re.exec(utility);
            if (!match) continue;
            const suggestion = LOGICAL_SUGGESTIONS.get(key(match));
            if (!suggestion) continue;
            context.report({
              node,
              messageId: "physical",
              data: { token, suggestion },
            });
            return;
          }
        });
      },
    },

    "no-raw-design-values": {
      meta: {
        type: "problem",
        docs: { description: "Disallow raw colours and disallowed font weights." },
        schema: [],
        messages: { raw: "{{detail}}" },
      },
      create(context) {
        return classVisitors(context, (token, node) => {
          for (const { re, message } of RAW_VALUE_PATTERNS) {
            if (!re.test(token)) continue;
            context.report({ node, messageId: "raw", data: { detail: message } });
            return;
          }
        });
      },
    },
  },
};

export default designSystemRules;
