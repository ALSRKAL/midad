import nextVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import globals from "globals";

import designSystem from "./eslint-rules/design-system-rules.mjs";

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "worker-dist/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "public/**",
      "next-env.d.ts",
    ],
  },

  // Next.js / React / import / jsx-a11y rules.
  ...nextVitals,

  // Type-aware correctness rules (no-floating-promises, no-misused-promises, …).
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Config files and scripts are plain JS/MJS: no type information available.
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      // CLI tooling writes its report to stdout.
      "no-console": "off",
    },
  },

  // Our own design-system enforcement.
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { midad: designSystem },
    rules: {
      "midad/no-physical-properties": "error",
      "midad/no-raw-design-values": "error",
    },
  },

  // Project-wide rules.
  {
    files: ["**/*.{ts,tsx,mjs}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "no-console": ["error", { allow: ["error", "warn"] }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSIgnoreDirective",
          message:
            "Never silence the compiler: fix the type instead (specification golden rule 10).",
        },
        {
          selector: "TSAsExpression[typeAnnotation.typeName.name='any']",
          message: "`as any` is forbidden; model the type properly.",
        },
      ],
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
    },
  },

  // Server-side logging goes through pino (src/server/logger.ts), never console.
  {
    files: ["src/server/**/*.ts", "src/features/**/*.ts", "worker/**/*.ts"],
    rules: { "no-console": "error" },
  },

  // CLI scripts must print their report.
  {
    files: ["scripts/**/*.{js,mjs,cjs,ts}", "tools/**/*.{js,mjs,cjs}"],
    rules: { "no-console": "off" },
  },

  // The seeder reports progress and a final summary; it is a CLI, not request-handling code.
  {
    files: ["prisma/seed/**/*.ts"],
    rules: { "no-console": "off" },
  },

  // The HLS worker is a long-running CLI process; its stdout is the operator's log.
  {
    files: ["worker/**/*.ts"],
    rules: { "no-console": "off" },
  },

  prettier,
);
