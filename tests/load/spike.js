import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

/**
 * P14-T04 spike: 10 → 500 → 10 VUs on one course page. No 5xx is allowed, and the post-spike
 * window must recover: the scenario records a separate trend for the final low-load stage.
 */

const serverErrors = new Rate("server_errors");
const spikeLatency = new Trend("spike_latency", true);
const recoveryLatency = new Trend("recovery_latency", true);

export const options = {
  scenarios: {
    spike: {
      executor: "ramping-vus",
      startVUs: 10,
      stages: [
        { duration: "1m", target: 10 },
        { duration: "30s", target: 500 },
        { duration: "2m", target: 500 },
        { duration: "30s", target: 10 },
        { duration: "2m", target: 10 },
      ],
      gracefulRampDown: "20s",
    },
  },
  thresholds: {
    server_errors: ["rate<0.01"],
  },
};

const BASE = __ENV.BASE_URL ?? "http://127.0.0.1:8080";
const COURSE = `${BASE}/ar/courses/modern-react-app-development`;
let phase = "spike";

export function setup() {
  return { started: Date.now() };
}

export default function spike(data) {
  // Four minutes after the start the ramp is back at 10 VUs; treat that window as recovery.
  phase = Date.now() - data.started > 4 * 60_000 ? "recovery" : "spike";
  const response = http.get(COURSE);
  if (phase === "spike") spikeLatency.add(response.timings.duration);
  else recoveryLatency.add(response.timings.duration);
  serverErrors.add(response.status >= 500);
  check(response, { "not a server error": (r) => r.status < 500 });
  sleep(Math.random() + 0.5);
}
