/**
 * Quiz grading rules (BR-16), pure and server-only in practice.
 *
 * The UI receives only question/option text; correctness is resolved by these functions after submit.
 * Correct answers never leave the server before submission. Multi-choice requires the exact set;
 * short answers are compared after Arabic-aware normalisation; the pass mark is a percentage of the
 * attempt's maximum points.
 */

import { normalizeText } from "@/lib/search-normalize";

export type QuizQuestionInput = {
  id: string;
  type: "SINGLE_CHOICE" | "MULTI_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  points: number;
  correctOptionIds: string[];
  acceptedAnswers: string[];
};

export type AnswerInput = {
  questionId: string;
  optionId?: string | null | undefined;
  optionIds?: string[] | null | undefined;
  text?: string | null | undefined;
};

export type GradedAnswer = { questionId: string; correct: boolean; earned: number };

export function gradeQuestion(
  question: QuizQuestionInput,
  answer: AnswerInput | undefined,
): GradedAnswer {
  if (answer === undefined) return { questionId: question.id, correct: false, earned: 0 };

  if (question.type === "SHORT_ANSWER") {
    const given = normalizeText(answer.text ?? "");
    const correct =
      given !== "" &&
      question.acceptedAnswers.some((accepted) => normalizeText(accepted) === given);
    return { questionId: question.id, correct, earned: correct ? question.points : 0 };
  }

  if (question.type === "MULTI_CHOICE") {
    const selected = [...new Set(answer.optionIds ?? [])].sort();
    const expected = [...new Set(question.correctOptionIds)].sort();
    const correct =
      selected.length === expected.length && selected.every((id, index) => id === expected[index]);
    return { questionId: question.id, correct, earned: correct ? question.points : 0 };
  }

  const correct =
    answer.optionId !== null &&
    answer.optionId !== undefined &&
    question.correctOptionIds.includes(answer.optionId);
  return { questionId: question.id, correct, earned: correct ? question.points : 0 };
}

export type GradedAttempt = {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  answers: GradedAnswer[];
};

export function gradeAttempt(
  questions: readonly QuizQuestionInput[],
  answers: readonly AnswerInput[],
  passPct: number,
): GradedAttempt {
  const byQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
  const graded = questions.map((question) => gradeQuestion(question, byQuestion.get(question.id)));
  const score = graded.reduce((total, answer) => total + answer.earned, 0);
  const maxScore = questions.reduce((total, question) => total + question.points, 0);
  const percentage = maxScore === 0 ? 0 : (score / maxScore) * 100;

  return {
    score,
    maxScore,
    percentage,
    passed: maxScore > 0 && percentage >= passPct,
    answers: graded,
  };
}

/** Highest score among submitted attempts, for the "best attempt" display. */
export function bestScore(attempts: readonly { score: number; maxScore: number }[]): number | null {
  if (attempts.length === 0) return null;
  return Math.max(
    ...attempts.map((attempt) =>
      attempt.maxScore === 0 ? 0 : Math.round((attempt.score / attempt.maxScore) * 100),
    ),
  );
}
