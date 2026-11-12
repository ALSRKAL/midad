/**
 * Client for the loopback fixture API (P14-T01). Each call returns rows owned by the calling
 * project, so Playwright engines can run the same journey concurrently without seeded-row coupling.
 */

export const FIXTURE_URL = process.env["E2E_FIXTURE_URL"] ?? "http://127.0.0.1:3201";

export type FixtureUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  password: string;
};

export type FixtureLearner = FixtureUser & {
  courseId: string;
  enrollmentId: string;
};

export type FixtureAssessment = FixtureUser & {
  courseId: string;
  courseSlug: string;
  videoLessonId: string | null;
  textLessonId: string;
  quizLessonId: string;
  answers: { single: string; multi: string[]; short: string };
};

export type FixtureOrder = FixtureUser & { orderId: string };

export async function fixture<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${FIXTURE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Fixture ${path} failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as T;
}

export async function fixtureHealth(): Promise<void> {
  const response = await fetch(`${FIXTURE_URL}/health`);
  if (!response.ok) throw new Error(`Fixture API is not ready: ${response.status}`);
}
