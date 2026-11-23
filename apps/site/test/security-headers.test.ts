import { describe, expect, it } from "vitest";
import { goesToMapProvider } from "../src/site/third-parties.ts";
import { everyResponseHeaders, reportedPolicy } from "./header-rules.ts";

/** The hosts `policy` names as sources, a `*.` wildcard's as the domain after it. */
const sourceHosts = (policy: string) =>
  [...policy.matchAll(/https:\/\/(?:\*\.)?([^\s;]+)/g)].map(([, host = ""]) => host);

// The reported policy enforced on every page, the maps on: `maps-consent.test.ts`.
describe("every response (W81)", () => {
  it("asks for HTTPS for a year, no sniffing, the origin alone as a referrer, frames from the site alone", () => {
    expect(everyResponseHeaders()).toMatchObject({
      "Strict-Transport-Security": "max-age=31536000",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy": "frame-ancestors 'self'",
      "Content-Security-Policy-Report-Only": expect.stringContaining("default-src 'self'"),
    });
  });

  it("names no origin in its reported policy but the maps' providers the privacy page names", () => {
    const hosts = sourceHosts(reportedPolicy());
    expect(hosts).not.toEqual([]);
    expect(hosts.filter((host) => !goesToMapProvider(`https://${host}/`))).toEqual([]);
  });
});
