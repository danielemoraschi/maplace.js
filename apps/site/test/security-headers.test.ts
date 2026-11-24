import { describe, expect, it } from "vitest";
import { goesToMapProvider } from "../src/site/third-parties.ts";
import { enforcedPolicy, everyResponseHeaders } from "./header-rules.ts";

/** The hosts `policy` names as sources, a `*.` wildcard's as the domain after it. */
const sourceHosts = (policy: string) =>
  [...policy.matchAll(/https:\/\/(?:\*\.)?([^\s;]+)/g)].map(([, host = ""]) => host);

// The test server sends these on every page: `maps-consent.test.ts` walks them, the maps on.
describe("every response (W81)", () => {
  it("asks for HTTPS for a year, no sniffing, the origin alone as a referrer", () => {
    expect(everyResponseHeaders()).toMatchObject({
      "Strict-Transport-Security": "max-age=31536000",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
  });

  it("enforces the full policy, frames from the site alone, and reports nothing", () => {
    const policy = enforcedPolicy();
    expect(policy).toMatch(/^default-src 'self';/);
    expect(policy).toMatch(/; frame-ancestors 'self'$/);
    expect(everyResponseHeaders()).not.toHaveProperty("Content-Security-Policy-Report-Only");
  });

  it("names no origin in its policy but the maps' providers the privacy page names", () => {
    const hosts = sourceHosts(enforcedPolicy());
    expect(hosts).not.toEqual([]);
    expect(hosts.filter((host) => !goesToMapProvider(`https://${host}/`))).toEqual([]);
  });
});
