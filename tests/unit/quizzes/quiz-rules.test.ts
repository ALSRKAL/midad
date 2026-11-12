import { describe, expect, it } from "vitest";

import { bestScore, gradeAttempt, gradeQuestion, type QuizQuestionInput } from "@/lib/quiz";

/** BR-16 quiz rules: exact 70% pass, exact multi-choice sets, normalised short answers. */

const single: QuizQuestionInput = {
  id: "q1",
  type: "SINGLE_CHOICE",
  points: 7,
  correctOptionIds: ["a"],
  acceptedAnswers: [],
};
const multi: QuizQuestionInput = {
  id: "q2",
  type: "MULTI_CHOICE",
  points: 3,
  correctOptionIds: ["b", "c"],
  acceptedAnswers: [],
};
const short: QuizQuestionInput = {
  id: "q3",
  type: "SHORT_ANSWER",
  points: 5,
  correctOptionIds: [],
  acceptedAnswers: ["مِداد", "Midad"],
};

describe("BR-16 grading", () => {
  it("BR-16: passes at exactly 70%", () => {
    const result = gradeAttempt([single, multi], [{ questionId: "q1", optionId: "a" }], 70);
    expect(result.score).toBe(7);
    expect(result.maxScore).toBe(10);
    expect(result.percentage).toBe(70);
    expect(result.passed).toBe(true);
  });

  it("BR-16: fails at 69%", () => {
    const a = { ...single, id: "a", points: 69 };
    const b = { ...single, id: "b", points: 31 };
    const result = gradeAttempt(
      [a, b],
      [
        { questionId: "a", optionId: "a" },
        { questionId: "b", optionId: "wrong" },
      ],
      70,
    );
    expect(result.percentage).toBe(69);
    expect(result.passed).toBe(false);
  });

  it("BR-16: multi-select requires the exact set", () => {
    expect(gradeQuestion(multi, { questionId: "q2", optionIds: ["b", "c"] }).correct).toBe(true);
    expect(gradeQuestion(multi, { questionId: "q2", optionIds: ["c", "b"] }).correct).toBe(true);
    expect(gradeQuestion(multi, { questionId: "q2", optionIds: ["b"] }).correct).toBe(false);
    expect(gradeQuestion(multi, { questionId: "q2", optionIds: ["b", "c", "d"] }).correct).toBe(
      false,
    );
  });

  it("BR-16: true/false is graded like single choice", () => {
    const tf: QuizQuestionInput = {
      id: "tf",
      type: "TRUE_FALSE",
      points: 1,
      correctOptionIds: ["true"],
      acceptedAnswers: [],
    };
    expect(gradeQuestion(tf, { questionId: "tf", optionId: "true" }).earned).toBe(1);
    expect(gradeQuestion(tf, { questionId: "tf", optionId: "false" }).earned).toBe(0);
  });

  it("BR-16: short answers ignore hamza, tashkeel, case and whitespace", () => {
    expect(gradeQuestion(short, { questionId: "q3", text: "  مِداد " }).correct).toBe(true);
    expect(gradeQuestion(short, { questionId: "q3", text: "مداد" }).correct).toBe(true);
    expect(gradeQuestion(short, { questionId: "q3", text: "midad" }).correct).toBe(true);
    expect(gradeQuestion(short, { questionId: "q3", text: "" }).correct).toBe(false);
    expect(gradeQuestion(short, { questionId: "q3", text: "مداد " }).correct).toBe(true);
  });

  it("BR-16: a missing answer earns zero", () => {
    expect(gradeAttempt([single], [], 70).score).toBe(0);
  });

  it("BR-16: an empty quiz cannot pass", () => {
    expect(gradeAttempt([], [], 70).passed).toBe(false);
  });

  it("BR-16: best score is the highest of submitted attempts", () => {
    expect(
      bestScore([
        { score: 5, maxScore: 10 },
        { score: 8, maxScore: 10 },
        { score: 7, maxScore: 10 },
      ]),
    ).toBe(80);
    expect(bestScore([])).toBeNull();
  });
});
