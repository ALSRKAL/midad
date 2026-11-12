import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

/**
 * P14-T04 soak: 50 VUs for 30 minutes over the public catalog. A stable process and connection
 * pool should keep p95 under the §13.6 page budget with no error growth.
 */

const pageLatency = new Trend("page_latency", true);
const failures = new Rate("failed_requests");

export const options = {
  scenarios: {
    soak: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS ?? 50),
      duration: __ENV.DURATION ?? "30m",
      gracefulStop: "10s",
    },
  },
  thresholds: {
    page_latency: ["p(95)<500"],
    failed_requests: ["rate<0.005"],
  },
};

const BASE = __ENV.BASE_URL ?? "http://127.0.0.1:8080";
const PATHS = ["/ar", "/ar/courses", "/ar/courses/modern-react-app-development", "/en/courses"];

export default function soak() {
  const path = PATHS[Math.floor(Math.random() * PATHS.length)] ?? PATHS[0];
  const response = http.get(`${BASE}${path}`);
  pageLatency.add(response.timings.duration);
  failures.add(response.status >= 400);
  check(response, { "page is 200": (r) => r.status === 200 });
  sleep(Math.random() * 2 + 1);
}
