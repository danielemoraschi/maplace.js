import type { Browser, BrowserContext, Page } from "playwright";
import { MAPS_SCRIPT_ORIGIN } from "../../../packages/maplace/src/google/maps-script-url.ts";

/** Any of Google's hosts: none may be asked before consent. */
const GOOGLE = /^https?:\/\/[^/]*\b(google|googleapis|gstatic)\.com\//;

/**
 * Maps JS as far as a version waits for it: `importLibrary` there, its libraries never coming.
 * Served in place of Google's, so nothing leaves the machine.
 */
const STUB_MAPS_JS =
  "globalThis.google = { maps: { importLibrary: () => new Promise(() => {}) } };";

export interface VisitorOptions {
  /** Answers the Maps JS request with a stub instead of refusing it, as Google never would. */
  readonly stubMapsJs?: boolean;
}

/** A visitor of the built site at `siteUrl`, and what they asked for. */
export interface Visitor {
  readonly context: BrowserContext;
  readonly page: Page;
  /** Every request off the site, refused (or the stubbed Maps JS). */
  offsite(): readonly string[];
  /** Whether the site was asked for `path`. */
  fetched(path: string): boolean;
  google(): readonly string[];
  /** What Google was asked for Maps JS: its script, by the page or the bootstrap. */
  mapsJsRequests(): readonly string[];
}

/**
 * A visitor: their own storage, every request off this machine recorded, then refused, and every
 * request to the site recorded too.
 */
export async function visitor(
  browser: Browser,
  siteUrl: string,
  { stubMapsJs = false }: VisitorOptions = {},
): Promise<Visitor> {
  const context = await browser.newContext();
  const asked: string[] = [];
  const onSite: string[] = [];
  await context.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith(siteUrl)) {
      onSite.push(new URL(url).pathname);
      return route.continue();
    }
    asked.push(url);
    if (stubMapsJs && url.startsWith(MAPS_SCRIPT_ORIGIN)) {
      return route.fulfill({ contentType: "text/javascript", body: STUB_MAPS_JS });
    }
    return route.abort();
  });
  const page = await context.newPage();
  return {
    context,
    page,
    offsite: () => asked,
    fetched: (path) => onSite.includes(path),
    google: () => asked.filter((url) => GOOGLE.test(url)),
    mapsJsRequests: () => asked.filter((url) => url.startsWith(MAPS_SCRIPT_ORIGIN)),
  };
}

/** The page's first map: every section has one, so a locator for all would match them all. */
export const firstMap = (page: Page) => page.locator("maplace-map").first();

export const placeholder = (page: Page) =>
  page.getByRole("button", { name: "Load Google Maps" }).first();

/** Runs `example`'s section's map from `version`: the switch above its frame. */
export async function chooseVersion(page: Page, example: string, version: string): Promise<void> {
  const section = page.locator(`section#${example}`);
  await section.scrollIntoViewIfNeeded();
  await section.getByRole("radio", { name: version }).check();
}
