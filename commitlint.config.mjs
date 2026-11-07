/** Commit message rules (the product requirements). Enforced by Husky's commit-msg hook and CI. */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "refactor",
        "perf",
        "test",
        "docs",
        "style",
        "chore",
        "build",
        "ci",
        "revert",
      ],
    ],
    "subject-empty": [2, "never"],
    "subject-case": [2, "always", ["lower-case", "sentence-case"]],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 72],
    "body-max-line-length": [2, "always", 100],
    "body-leading-blank": [2, "always"],
    "footer-leading-blank": [2, "always"],
  },
};

export default config;
