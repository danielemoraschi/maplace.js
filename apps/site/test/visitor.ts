import type { Browser, BrowserContext, ConsoleMessage, Locator, Page } from "playwright";
import { MAPS_SCRIPT_ORIGIN } from "../../../packages/maplace/src/google/maps-script-url.ts";
import { TEST_STYLE } from "../../../packages/maplace/src/maplibre/testing/test-style.ts";
import { OPENFREEMAP_STYLES } from "../../../packages/maplace/src/testing/examples/openfreemap-styles.ts";
import { GOOGLE_MAPS, goesToMapProvider, thirdPartyOf } from "../src/site/third-parties.ts";

/**
 * Maps JS as far as a version waits for it: `importLibrary` there, its libraries never coming.
 * Served in place of Google's, so nothing leaves the machine.
 */
const STUB_MAPS_JS =
  "globalThis.google = { maps: { importLibrary: () => new Promise(() => {}) } };";

/**
 * What a visitor's requests to Google Maps get: refused, as by default; Maps JS answered with a
 * stub (`STUB_MAPS_JS`), as Google never would, the rest refused; or Google itself.
 */
export type GoogleAnswer = "refused" | "stubbed" | "reached";

/**
 * What a visitor's requests to OpenFreeMap get: refused, as by default; or its styles answered
 * from the machine with the package's test style (`TEST_STYLE`: no tiles, fonts or icons to ask
 * for), anything else refused.
 */
export type OpenFreeMapAnswer = "refused" | "local";

export interface VisitorOptions {
  readonly google?: GoogleAnswer;
  readonly openFreeMap?: OpenFreeMapAnswer;
  /**
   * The origin the visitor's browser finds the site at, answered from where the site is served:
   * a page there is what Google sees as the referrer. The served URL itself without one.
   */
  readonly seenAt?: string;
  /** The screen's size in CSS pixels; Playwright's default, 1280 by 720, without one. */
  readonly viewport?: { readonly width: number; readonly height: number };
}

/** A visitor of the built site, and what they asked for. */
export interface Visitor {
  readonly context: BrowserContext;
  readonly page: Page;
  /** Every request off the site: refused, stubbed, answered locally, or Google's when reached. */
  offsite(): readonly string[];
  /** Whether the site was asked for `path`. */
  fetched(path: string): boolean;
  /** What the maps' providers were asked (`MAP_PROVIDERS`): nothing before consent. */
  mapProviders(): readonly string[];
  /** What Google was asked for Maps JS: its script, by the page or the bootstrap. */
  mapsJsRequests(): readonly string[];
  /**
   * What the page threw or logged as an error, but for the browser's notes of the requests the
   * visitor refused.
   */
  errors(): readonly string[];
}

/**
 * A visitor of the site served at `siteUrl`: their own storage, every request off the site
 * recorded, then refused unless `google` or `openFreeMap` answers it, and every request to the
 * site recorded too.
 */
export async function visitor(
  browser: Browser,
  siteUrl: string,
  { google = "refused", openFreeMap = "refused", seenAt = siteUrl, viewport }: VisitorOptions = {},
): Promise<Visitor> {
  const context = await browser.newContext(viewport && { viewport });
  const asked: string[] = [];
  const refused = new Set<string>();
  const onSite: string[] = [];
  const seenOrigin = new URL(seenAt).origin;
  const servedElsewhere = seenOrigin !== new URL(siteUrl).origin;
  await context.route("**/*", async (route) => {
    const requested = route.request().url();
    const url = new URL(requested);
    if (url.origin === seenOrigin) {
      onSite.push(url.pathname);
      if (!servedElsewhere) return route.continue();
      const served = new URL(url.pathname + url.search, siteUrl).href;
      return route.fulfill({ response: await route.fetch({ url: served }) });
    }
    asked.push(requested);
    const answer = offsiteAnswer(requested, { google, openFreeMap });
    if (answer === "google") return route.continue();
    if (answer === "stub") {
      return route.fulfill({ contentType: "text/javascript", body: STUB_MAPS_JS });
    }
    if (answer === "local-style") return route.fulfill(LOCAL_STYLE);
    refused.add(requested);
    return route.abort();
  });
  const page = await context.newPage();
  const errors = recordErrors(page, refused);
  return {
    context,
    page,
    offsite: () => asked,
    fetched: (path) => onSite.includes(path),
    mapProviders: () => asked.filter(goesToMapProvider),
    mapsJsRequests: () => asked.filter(isMapsScript),
    errors: () => errors,
  };
}

/**
 * Whether `url` is Maps JS's script, a page's tag or a bootstrap's: its path is exactly the
 * script's. Maps JS calls Google's services under it too (`/maps/api/js/StaticMapService…`).
 */
function isMapsScript(url: string): boolean {
  const { origin, pathname } = new URL(url);
  return origin + pathname === MAPS_SCRIPT_ORIGIN;
}

/**
 * OpenFreeMap's style as the visitor gets it locally: the test style, which a map fetches across
 * origins, so it says any origin may read it.
 */
const LOCAL_STYLE = {
  contentType: "application/json",
  headers: { "access-control-allow-origin": "*" },
  body: JSON.stringify(TEST_STYLE),
};

/**
 * What `url`, off the site, gets: Google itself, the stub, the local style, or refused, as the
 * answers say.
 */
function offsiteAnswer(
  url: string,
  { google, openFreeMap }: Required<Pick<VisitorOptions, "google" | "openFreeMap">>,
): "google" | "stub" | "local-style" | "refused" {
  if (google === "reached" && thirdPartyOf(url) === GOOGLE_MAPS) return "google";
  if (google === "stubbed" && isMapsScript(url)) return "stub";
  if (openFreeMap === "local" && url.startsWith(OPENFREEMAP_STYLES)) return "local-style";
  return "refused";
}

/**
 * The errors `page` throws or logs from now on, the browser's note of each `refused` request
 * aside: it logs one at the request's URL.
 */
function recordErrors(page: Page, refused: ReadonlySet<string>): readonly string[] {
  const errors: string[] = [];
  const isRefusalNote = (message: ConsoleMessage) => refused.has(message.location().url);
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error" && !isRefusalNote(message)) errors.push(message.text());
  });
  return errors;
}

/**
 * Whether the Maps tag at `url` is the one Google's bootstrap loader adds: it names its callback
 * (`callback=google.maps.__ib__`), the element's own tag none.
 */
export const addedByBootstrap = (url: string) => url.includes("__ib__");

/** The page's first map: every section has one, so a locator for all would match them all. */
export const firstMap = (page: Page) => page.locator("maplace-map").first();

/** The footer's switch that turns the maps on, or off, on every page. */
export const footerToggle = (page: Page) => page.locator("[data-maps-toggle]");

/** Opens the home page of the site at `siteUrl` and scrolls to its first map. */
export async function openHome(page: Page, siteUrl: string): Promise<void> {
  await page.goto(siteUrl);
  await firstMap(page).scrollIntoViewIfNeeded();
}

/** The consent placeholders' "Load maps" buttons within `scope`. */
export const loadMapsButtons = (scope: Page | Locator) =>
  scope.getByRole("button", { name: "Load maps", exact: true });

/** The page's first "Load maps" button. */
export const placeholder = (page: Page) => loadMapsButtons(page).first();
