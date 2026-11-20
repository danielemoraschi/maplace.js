import { setTimeout as pause } from "node:timers/promises";
import { type Browser, chromium, type Page } from "playwright";
import { afterAll, beforeAll } from "vitest";
import { type BuiltSite, buildAndServeSite, SITE_WAIT_MS } from "./built-site.ts";
import { type Visitor, type VisitorOptions, visitor } from "./visitor.ts";

/**
 * Long enough for a map scrolled into view to be released and ask for Maps JS, were it to: what a
 * test waits before saying nothing was asked.
 */
export const SETTLE_MS = 500;

/**
 * What `read` gives once two reads `SETTLE_MS` apart agree, and aren't `undefined`: a map's
 * markers or view may still change as it opens. Throws, naming `what`, if it hasn't within
 * `timeout`.
 */
export async function settled<Value>(
  read: () => Promise<Value | undefined>,
  { timeout, what }: { readonly timeout: number; readonly what: string },
): Promise<Value> {
  const giveUpAt = Date.now() + timeout;
  let last = await read();
  while (Date.now() < giveUpAt) {
    await pause(SETTLE_MS);
    const now = await read();
    if (now !== undefined && now === last) return now;
    last = now;
  }
  throw new Error(`${what} kept changing for ${timeout} ms, last ${String(last)}`);
}

/**
 * What `look` finds on each page at `routes` of the site at `siteUrl`, `page` going to one after
 * another: each as soon as its document is in, or once it has loaded (`waitUntil: "load"`) for a
 * look at what the page asks the network for.
 */
export async function visitEach<Found>(
  page: Page,
  siteUrl: string,
  routes: readonly string[],
  look: (route: string) => Promise<Found>,
  waitUntil: "domcontentloaded" | "load" = "domcontentloaded",
): Promise<Found[]> {
  const found: Found[] = [];
  for (const route of routes) {
    await page.goto(new URL(route, siteUrl).href, { waitUntil });
    found.push(await look(route));
  }
  return found;
}

/** How long a test visiting `pages` pages one after another may take, on a busy machine. */
export const visitingPages = (pages: number) => 10_000 + pages * 3_000;

/** How long a released map may take to ask for Maps JS, on a busy machine. */
export const ASKED = { timeout: 10_000 };

/** The built site a test file visits, and its visitors' browser. */
export interface SiteSession {
  /** Where its visitors find the site. */
  readonly url: string;
  /** Where the site was built. */
  readonly dir: string;
  /** A fresh visitor of the site (`visitor`). */
  visitor(options?: VisitorOptions): Promise<Visitor>;
}

/** A fresh visitor's page at `route` of `site`, on a screen of `viewport`. */
export async function opened(
  site: SiteSession,
  route: string,
  viewport: { readonly width: number; readonly height: number },
) {
  const visit = await site.visitor({ viewport });
  await visit.page.goto(new URL(route, site.url).href);
  return visit;
}

/** How a session's visitors see the site, unless a test says otherwise. */
export type SeenSite = Pick<VisitorOptions, "google" | "openFreeMap" | "seenAt">;

/** The map ID the site is built with. */
/** The site `astro.config.ts` names, which the pages write: not the local server they are tested on. */
export const PUBLIC_SITE = "https://maplacejs.com";

export const SITE_MAP_ID = "site-map-id";

/** The site's build settings as it ships, its key never a real one. */
export const AS_SHIPPED = { SITE_MAPS_KEY: "not-a-real-key", SITE_MAPS_MAP_ID: SITE_MAP_ID };

/**
 * The site built with a key (never a real one) and a map ID, and a browser to visit it, ready
 * before the test file's tests run, closed after them.
 */
export function siteBuiltBeforeTests(): SiteSession {
  return builtSiteSession(AS_SHIPPED);
}

/**
 * The site built with `env` added, and a browser whose visitors see it as `seen` says, ready
 * before the tests of the file or `describe` that calls this run, closed after them.
 */
export function builtSiteSession(env: Record<string, string>, seen: SeenSite = {}): SiteSession {
  let site: BuiltSite | undefined;
  let browser: Browser | undefined;
  beforeAll(async () => {
    [site, browser] = await Promise.all([buildAndServeSite(env), chromium.launch()]);
  }, SITE_WAIT_MS);
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
      return seen.seenAt ?? started().site.url;
    },
    get dir() {
      return started().site.dir;
    },
    visitor(options) {
      const { site, browser } = started();
      return visitor(browser, site.url, { ...seen, ...options });
    },
  };
}
