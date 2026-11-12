import { describe, expect, it } from "vitest";

import { describeUserAgent } from "@/lib/user-agent";

/** Session labels in the account settings list (P02-T05). Presentation only, never security. */
describe("describeUserAgent", () => {
  it("recognises Chrome on Linux", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
      ),
    ).toEqual({ browser: "Chrome", os: "Linux" });
  });

  it("checks Edge before Chrome", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36 Edg/131.0",
      ),
    ).toEqual({ browser: "Edge", os: "Windows" });
  });

  it("recognises Safari on iPhone as iOS", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
      ),
    ).toEqual({ browser: "Safari", os: "iOS" });
  });

  it("recognises Firefox on macOS", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:132.0) Gecko/20100101 Firefox/132.0",
      ),
    ).toEqual({ browser: "Firefox", os: "macOS" });
  });

  it("recognises Chrome on Android", () => {
    expect(
      describeUserAgent("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0 Mobile"),
    ).toEqual({ browser: "Chrome", os: "Android" });
  });

  it("returns null for a missing or empty user agent", () => {
    expect(describeUserAgent(null)).toBeNull();
    expect(describeUserAgent("")).toBeNull();
    expect(describeUserAgent("   ")).toBeNull();
  });

  it("returns null when neither browser nor OS is recognisable", () => {
    expect(describeUserAgent("curl/8.5.0")).toBeNull();
  });

  it("keeps the known half when only one is recognisable", () => {
    expect(describeUserAgent("something Firefox/132.0")).toEqual({ browser: "Firefox", os: "—" });
    expect(describeUserAgent("something Android")).toEqual({ browser: "—", os: "Android" });
  });
});
