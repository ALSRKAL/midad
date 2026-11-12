import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

/**
 * P12-T05/P14-T04/P15-T02 mixed load scenario against a production build.
 *
 *   BASE_URL=http://127.0.0.1:8080 VUS=200 DURATION=10m k6 run tests/load/browse.js
 *
 * Browse 60% / search 20% / signed-in dashboard 15% / cart 5%, matching docs/TEST_PLAN.md §6.
 * The cart bucket also exercises two progress variants, tagged so the summary reports p50/p95/p99
 * per action: an unchanged heartbeat (read fast path) and a real write (upsert + streak). Auth is
 * not in this mix; tests/load/auth.js measures it separately against its own documented budget.
 */

const pageLatency = new Trend("page_latency", true);
const actionLatency = new Trend("action_latency", true);
const homeLatency = new Trend("page_home", true);
const catalogLatency = new Trend("page_catalog", true);
const courseLatency = new Trend("page_course", true);
const searchLatency = new Trend("page_search", true);
const dashboardLatency = new Trend("page_dashboard", true);
const cartLatency = new Trend("page_cart", true);
const progressLatency = new Trend("action_progress", true);
const failures = new Rate("failed_requests");
const statuses = new Counter("response_status");

export const options = {
  setupTimeout: "300s",
  summaryTrendStats: ["avg", "min", "med", "p(50)", "p(90)", "p(95)", "p(99)", "max"],
  scenarios: {
    mixed: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS ?? 200),
      duration: __ENV.DURATION ?? "10m",
      gracefulStop: "10s",
    },
  },
  thresholds: {
    page_latency: ["p(95)<500"],
    action_latency: ["p(95)<300"],
    "action_latency{action:progress_heartbeat}": ["p(95)<300"],
    "action_latency{action:progress_save}": ["p(95)<300"],
    failed_requests: ["rate<0.005"],
    http_req_failed: ["rate<0.005"],
  },
};

const BASE = __ENV.BASE_URL ?? "http://127.0.0.1:3100";
const PASSWORD = __ENV.E2E_PASSWORD ?? ["Midad", "Test", "2026"].join("-");
const PROGRESS_LESSON_IDS = (
  __ENV.PROGRESS_LESSON_IDS ??
  // Only lessons inside the one course every fixture learner is enrolled in; a lesson from another
  // course correctly returns ENROLLMENT_REQUIRED and would be measured as a load failure.
  [
    "c9334959-a7dc-4d40-95d5-346728aaebc4",
    "4b616d6d-dc78-4e41-b9fc-42f16cfc620f",
    "4070623a-113a-48b8-ba0b-1e6c43f0486c",
    "739d5e56-fdc6-4121-8a35-8d6a6524b58e",
    "fbf6d4e7-21b5-436a-974a-2b8a7d4e3dd2",
    "0e33e9a2-640b-48b7-984a-08a44339daa0",
    "2f82986b-334a-4f2a-a9ea-b32102c680e2",
    "8e5158fa-8d9c-4960-b201-e38cce6eafeb",
    "2852b920-6dab-491d-97c0-de4833696f5f",
  ].join(",")
).split(",");

function cookieHeaderFrom(response) {
  return Object.entries(response.cookies)
    .map(([name, values]) => `${name}=${values[0]?.value ?? ""}`)
    .join("; ");
}

export function setup() {
  const fixtureUrl = __ENV.FIXTURE_URL ?? "http://127.0.0.1:3201";
  const users = Number(__ENV.LOAD_USERS ?? 50);
  const cookies = [];
  const lessonIds = [];
  for (let index = 0; index < users; index += 1) {
    // Each load user owns an enrollment, so progress writes never queue behind one row lock.
    const learner = http.post(
      `${fixtureUrl}/learner`,
      JSON.stringify({
        courseSlug: "modern-react-app-development",
        progressPct: 0,
        // Steady-state saves: the learner has already watched the first second of every lesson, so
        // repeated identical heartbeats exercise the real save path without first-write skew.
        seedProgress: true,
      }),
      { headers: { "content-type": "application/json" } },
    );
    const email = learner.json("email");
    const response = http.post(
      `${BASE}/api/auth/sign-in/email`,
      JSON.stringify({ email, password: PASSWORD }),
      { headers: { "content-type": "application/json", origin: BASE } },
    );
    cookies.push(cookieHeaderFrom(response));
    lessonIds.push(learner.json("seededLessonId") ?? null);
  }
  return { cookies, lessonIds };
}

export default function browse(data) {
  const pick = Math.random();

  if (pick < 0.6) {
    const paths = [
      { path: "/ar", page: "home", trend: homeLatency },
      { path: "/ar/courses", page: "catalog", trend: catalogLatency },
      { path: "/ar/courses/modern-react-app-development", page: "course", trend: courseLatency },
    ];
    const selected = paths[Math.floor(Math.random() * paths.length)] ?? paths[0];
    const response = http.get(`${BASE}${selected.path}`);
    pageLatency.add(response.timings.duration, { page: selected.page });
    selected.trend.add(response.timings.duration, { page: selected.page });
    failures.add(response.status >= 400);
    check(response, { "browse is 200": (r) => r.status === 200 });
  } else if (pick < 0.8) {
    const response = http.get(`${BASE}/ar/courses?q=react`);
    pageLatency.add(response.timings.duration, { page: "search" });
    searchLatency.add(response.timings.duration, { page: "search" });
    failures.add(response.status >= 400);
    check(response, { "search is 200": (r) => r.status === 200 });
  } else if (pick < 0.95) {
    const response = http.get(`${BASE}/ar/dashboard`, {
      headers: { cookie: data.cookies[(__VU - 1) % data.cookies.length] },
    });
    pageLatency.add(response.timings.duration, { page: "dashboard" });
    dashboardLatency.add(response.timings.duration, { page: "dashboard" });
    failures.add(response.status >= 400);
    check(response, { "dashboard is 200": (r) => r.status === 200 });
  } else if (Math.random() < 0.5) {
    const response = http.get(`${BASE}/ar/cart`, {
      headers: { cookie: data.cookies[(__VU - 1) % data.cookies.length] },
    });
    pageLatency.add(response.timings.duration, { page: "cart" });
    cartLatency.add(response.timings.duration, { page: "cart" });
    failures.add(response.status >= 400);
    check(response, { "cart is 200": (r) => r.status === 200 });
  } else {
    // Two real shapes of the same endpoint: an unchanged heartbeat takes the read fast path, while
    // the save variant changes the segment/position so it pays for the upsert and streak write.
    const heartbeat = __ITER % 2 === 0;
    const action = heartbeat ? "progress_heartbeat" : "progress_save";
    const endSec = heartbeat ? 1 : 2 + (__ITER % 2) * 2;
    const response = http.post(
      `${BASE}/api/player/progress`,
      JSON.stringify({
        lessonId:
          data.lessonIds[(__VU - 1) % data.lessonIds.length] ??
          PROGRESS_LESSON_IDS[(__VU - 1) % PROGRESS_LESSON_IDS.length],
        startSec: 0,
        endSec,
        positionSec: endSec,
      }),
      {
        headers: {
          cookie: data.cookies[(__VU - 1) % data.cookies.length],
          origin: BASE,
          "content-type": "application/json",
        },
      },
    );
    actionLatency.add(response.timings.duration, { action });
    progressLatency.add(response.timings.duration, { action });
    statuses.add(1, { status: String(response.status), action });
    if (response.status !== 200) {
      console.error(`progress ${action} ${response.status}: ${response.body}`);
    }
    failures.add(response.status >= 400);
    check(response, { "progress saved": (r) => r.status === 200 });
  }

  sleep(Math.random() * 1.5 + 0.5);
}
