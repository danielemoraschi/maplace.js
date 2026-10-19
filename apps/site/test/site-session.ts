import { type Browser, chromium } from "playwright";
import { afterAll, beforeAll } from "vitest";
import { type BuiltSite, buildAndServeSite } from "./built-site.ts";
import { type Visitor, type VisitorOptions, visitor } from "./visitor.ts";

/**
 * Long enough for a map scrolled into view to be released and ask for Maps JS, were it to: what a
 * test waits before saying nothing was asked.
 */
export const SETTLE_MS = 500;

/** How long a released map may take to ask for Maps JS, on a busy machine. */
export const ASKED = { timeout: 10_000 };

/** The built site a test file visits, and its visitors' browser. */
interface SiteSession {
  readonly url: string;
  /** A fresh visitor of the site (`visitor`). */
  visitor(options?: VisitorOptions): Promise<Visitor>;
}

/**
 * The site built with a key (never a real one) and a browser to visit it, ready before the test
 * file's tests run, closed after them.
 */
export function siteBuiltBeforeTests(): SiteSession {
  let site: BuiltSite | undefined;
  let browser: Browser | undefined;
  beforeAll(async () => {
    [site, browser] = await Promise.all([
      buildAndServeSite({ SITE_MAPS_KEY: "not-a-real-key" }),
      chromium.launch(),
    ]);
  }, 120_000);
  afterAll(async () => {
    await browser?.close();
    await site?.close();
  });
  const started = () => {
    if (site === undefined || browser === undefined) throw new Error("the site isn't built yet");
    return { site, browser };
  };
  return {
    get url() {
      return started().site.url;
    },
    visitor(options) {
      const { site, browser } = started();
      return visitor(browser, site.url, options);
    },
  };
}
