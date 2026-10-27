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
 * Maps JS whose libraries fail to load once its tag has: `importLibrary` rejecting. Served in place
 * of Google's, so nothing leaves the machine.
 */
const STUB_FAILING_MAPS_JS =
  "globalThis.google = { maps: { importLibrary: () => Promise.reject(new Error('stubbed Maps JS')) } };";

/**
 * What a visitor's requests to Google Maps get: refused, as by default; Maps JS answered with a
 * stub whose libraries never come (`stubbed`, `STUB_MAPS_JS`) or fail (`failing`,
 * `STUB_FAILING_MAPS_JS`), as Google never would, the rest refused; or Google itself.
 */
export type GoogleAnswer = "refused" | "stubbed" | "failing" | "reached";

/**
 * What a visitor's requests to OpenFreeMap get: refused, as by default; its styles answered from
 * the machine with the package's test style (`local`, `TEST_STYLE`: no tiles, fonts or icons to
 * ask for); or its styles refused with a 403 (`forbidden`), as a server refusing the page, which
 * may read the refusal across origins. Anything else refused.
 */
export type OpenFreeMapAnswer = "refused" | "local" | "forbidden";

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
    if (answer !== "refused") return route.fulfill(FULFILLED[answer]);
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
 * OpenFreeMap refusing a style: a 403 the page may read across origins, as `LOCAL_STYLE`, so
 * MapLibre sees the refusal, not a request the browser blocked.
 */
const FORBIDDEN_STYLE = { status: 403, headers: { "access-control-allow-origin": "*" } };

/** What answers each request the visitor's browser doesn't send on or refuse. */
const FULFILLED = {
  stub: { contentType: "text/javascript", body: STUB_MAPS_JS },
  "failing-stub": { contentType: "text/javascript", body: STUB_FAILING_MAPS_JS },
  "local-style": LOCAL_STYLE,
  forbidden: FORBIDDEN_STYLE,
} as const;

type OffsiteAnswer = keyof typeof FULFILLED | "google" | "refused";

/**
 * What `url`, off the site, gets: Google itself, a stub, the local style, a 403, or refused, as
 * the answers say.
 */
function offsiteAnswer(
  url: string,
  { google, openFreeMap }: Required<Pick<VisitorOptions, "google" | "openFreeMap">>,
): OffsiteAnswer {
  if (google === "reached" && thirdPartyOf(url) === GOOGLE_MAPS) return "google";
  if (google === "stubbed" && isMapsScript(url)) return "stub";
  if (google === "failing" && isMapsScript(url)) return "failing-stub";
  const isStyle = url.startsWith(OPENFREEMAP_STYLES);
  if (openFreeMap === "local" && isStyle) return "local-style";
  if (openFreeMap === "forbidden" && isStyle) return "forbidden";
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

/**
 * Opens the home page of the site at `siteUrl`, or the examples' page at `route`, and scrolls to
 * its first map.
 */
export async function openHome(page: Page, siteUrl: string, route = "/"): Promise<void> {
  await page.goto(new URL(route, siteUrl).href);
  await firstMap(page).scrollIntoViewIfNeeded();
}

/** The consent placeholders' "Load maps" buttons within `scope`. */
export const loadMapsButtons = (scope: Page | Locator) =>
  scope.getByRole("button", { name: "Load maps", exact: true });

/** Screens the tests lay the site out on. */
export const PHONE = { width: 375, height: 812 };
export const DESKTOP = { width: 1280, height: 900 };

/** Whether what is drawn at `locator`'s centre is `locator` itself, or inside it. */
export const drawnOnTop = (locator: Locator) =>
  locator.evaluate((element) => {
    const { left, top, width, height } = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(left + width / 2, top + height / 2));
  });

/** The page's first "Load maps" button. */
export const placeholder = (page: Page) => loadMapsButtons(page).first();

/** A laid-out box, as Playwright measures it. */
export type Box = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>;

/** `locator`'s box, which must be laid out. */
export async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  if (box === null) throw new Error("nothing laid out");
  return box;
}

/** Consents to the maps from the first placeholder of the home page of the site at `siteUrl`. */
export async function grantConsent(page: Page, siteUrl: string): Promise<void> {
  await openHome(page, siteUrl);
  await placeholder(page).click();
}

/** The ids `page` uses more than once. */
export const duplicateIds = (page: Page) =>
  page.evaluate(() => {
    const ids = [...document.querySelectorAll("[id]")].map(({ id }) => id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  });
