import { describe, expect, it } from "vitest";
import { problemsOf, strayRequests } from "./offsite-requests.ts";

const PAGE = "https://next-maplacejs.example.workers.dev/";

describe("strayRequests", () => {
  it("passes what a page loads from its own origin, and links a reader follows", () => {
    const html = `<script src="/_astro/a.js"></script><link rel="stylesheet" href="/_astro/a.css">
      <img src="icons/a.svg" srcset="/a.png 1x, /a@2.png 2x"><a href="https://github.com/x">GitHub</a>`;
    expect(strayRequests(html, PAGE)).toEqual([]);
  });

  it("names what a page loads from another origin, as the edge's injected analytics beacon", () => {
    const html = `<script defer src='https://static.cloudflareinsights.com/beacon.min.js'></script>
      <img srcset="/a.png 1x, https://maps.googleapis.com/b.png 2x">`;
    expect(strayRequests(html, PAGE)).toEqual([
      "https://static.cloudflareinsights.com/beacon.min.js",
      "https://maps.googleapis.com/b.png",
    ]);
  });

  it("names a request to GitHub's API: the star count comes from the site itself (W44)", () => {
    expect(strayRequests('<img src="https://api.github.com/x.svg">', PAGE)).toEqual([
      "https://api.github.com/x.svg",
    ]);
  });

  it("names what the edge adds under /cdn-cgi/, but not its bot check", () => {
    const html = `<script src="/cdn-cgi/zaraz/i.js"></script>
      <script src="/cdn-cgi/challenge-platform/scripts/jsd/main.js"></script>`;
    expect(strayRequests(html, PAGE)).toEqual([`${PAGE}cdn-cgi/zaraz/i.js`]);
  });

  it("doesn't count the canonical link, which fetches nothing", () => {
    expect(strayRequests('<link rel="canonical" href="https://maplacejs.com/">', PAGE)).toEqual([]);
  });
});

describe("problemsOf", () => {
  it("names a page served from elsewhere, as Access's login is, whatever it loads", () => {
    const login = "https://example.cloudflareaccess.com";
    expect(problemsOf({ url: PAGE, html: "", servedFrom: login })).toEqual([
      `${PAGE} is served from ${login}: the page is not the site's own`,
    ]);
  });

  it("names each stray request of the site's own page", () => {
    const html = '<script src="https://static.cloudflareinsights.com/beacon.min.js"></script>';
    expect(problemsOf({ url: PAGE, html, servedFrom: new URL(PAGE).origin })).toEqual([
      `${PAGE} loads https://static.cloudflareinsights.com/beacon.min.js: the privacy page allows no such request before consent`,
    ]);
  });
});
