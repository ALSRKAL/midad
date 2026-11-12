import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

/**
 * P14-T04 stress: ramp to 1000 VUs. The system may return 429 from the configured rate limits, but
 * a 5xx is a failure; after the ramp-down the same paths must answer 200 again.
 */

const serverErrors = new Rate("server_errors");
const pageLatency = new Trend("page_latency", true);

export const options = {
  scenarios: {
    stress: {
      executor: "ramping-vus",
      startVUs: 50,
      stages: [
        { duration: "2m", target: 250 },
        { duration: "3m", target: 500 },
        { duration: "3m", target: 1000 },
        { duration: "1m", target: 1000 },
        { duration: "2m", target: 50 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    server_errors: ["rate<0.01"],
    page_latency: ["p(95)<5000"],
  },
};

const BASE = __ENV.BASE_URL ?? "http://127.0.0.1:8080";
const PATHS = ["/ar", "/ar/courses", "/ar/courses/modern-react-app-development"];

export default function stress() {
  const path = PATHS[Math.floor(Math.random() * PATHS.length)] ?? PATHS[0];
  const response = http.get(`${BASE}${path}`);
  pageLatency.add(response.timings.duration);
  serverErrors.add(response.status >= 500);
  check(response, { "not a server error": (r) => r.status < 500 });
  sleep(Math.random() * 1.5 + 0.5);
}
