import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

/**
 * Authentication load, separated from the mixed action budget (P15-T02).
 *
 *   BASE_URL=http://127.0.0.1:8080 k6 run tests/load/auth.js
 *
 * Password verification is deliberately expensive (the production auth configuration is unchanged),
 * so this scenario has its own documented budget: p95 < 1000 ms and error rate < 1%. It never runs
 * inside the 200-VU mixed scenario, whose non-auth action budget is p95 < 300 ms.
 */

const authLatency = new Trend("auth_latency", true);
const failures = new Rate("auth_failed");

export const options = {
  setupTimeout: "180s",
  summaryTrendStats: ["avg", "min", "med", "p(50)", "p(90)", "p(95)", "p(99)", "max"],
  scenarios: {
    auth: {
      executor: "constant-vus",
      vus: Number(__ENV.AUTH_VUS ?? 10),
      duration: __ENV.DURATION ?? "2m",
      gracefulStop: "10s",
    },
  },
  thresholds: {
    // Auth is outside the 300 ms action budget because password hashing is intentionally costly.
    auth_latency: ["p(95)<1000"],
    auth_failed: ["rate<0.01"],
    http_req_failed: ["rate<0.01"],
  },
};

const BASE = __ENV.BASE_URL ?? "http://127.0.0.1:3100";
const PASSWORD = __ENV.E2E_PASSWORD ?? ["Midad", "Test", "2026"].join("-");

export function setup() {
  const fixtureUrl = __ENV.FIXTURE_URL ?? "http://127.0.0.1:3201";
  const users = Number(__ENV.AUTH_USERS ?? 50);
  const accounts = [];
  for (let index = 0; index < users; index += 1) {
    const user = http.post(`${fixtureUrl}/user`, JSON.stringify({ role: "STUDENT" }), {
      headers: { "content-type": "application/json" },
    });
    accounts.push({ email: user.json("email"), password: PASSWORD });
  }
  return { accounts };
}

export default function auth(data) {
  const account = data.accounts[(__VU - 1) % data.accounts.length];
  const response = http.post(
    `${BASE}/api/auth/sign-in/email`,
    JSON.stringify({ email: account.email, password: account.password }),
    { headers: { "content-type": "application/json", origin: BASE } },
  );
  authLatency.add(response.timings.duration, { action: "login" });
  failures.add(response.status !== 200);
  check(response, { "sign-in is 200": (r) => r.status === 200 });
  if (response.status !== 200) {
    console.error(`sign-in ${response.status}: ${response.body}`);
  }
  sleep(1);
}
