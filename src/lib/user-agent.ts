/**
 * Minimal user-agent description for the sessions list (the product requirements).
 *
 * The full UA string is unreadable and leaks more than a learner needs, so the page shows
 * "Chrome · Linux" and keeps the raw string only in the export. This is presentation only: nothing
 * security-related is decided from a user agent.
 */

export type DeviceDescription = {
  browser: string;
  os: string;
};

export function describeUserAgent(userAgent: string | null): DeviceDescription | null {
  if (userAgent === null || userAgent.trim() === "") return null;
  const ua = userAgent;

  const browser = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("OPR/")
      ? "Opera"
      : ua.includes("Chrome/") || ua.includes("CriOS/")
        ? "Chrome"
        : ua.includes("Firefox/") || ua.includes("FxiOS/")
          ? "Firefox"
          : ua.includes("Safari/")
            ? "Safari"
            : "";

  const os = ua.includes("Android")
    ? "Android"
    : ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod")
      ? "iOS"
      : ua.includes("Windows")
        ? "Windows"
        : ua.includes("Mac OS X") || ua.includes("Macintosh")
          ? "macOS"
          : ua.includes("Linux")
            ? "Linux"
            : "";

  if (browser === "" && os === "") return null;
  return { browser: browser === "" ? "—" : browser, os: os === "" ? "—" : os };
}
