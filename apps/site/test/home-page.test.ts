import { type Browser, type BrowserContext, chromium, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MAPS_SCRIPT_ORIGIN } from "../../../packages/maplace/src/google/maps-script-url.ts";
import { type BuiltSite, buildAndServeSite } from "./built-site.ts";

/** Any of Google's hosts: none may be asked before consent. */
const GOOGLE = /^https?:\/\/[^/]*\b(google|googleapis|gstatic)\.com\//;

/**
 * Long enough for a map scrolled into view to be released and ask for Maps JS, were it to: what a
 * test waits before saying nothing was asked.
 */
const SETTLE_MS = 500;

/** One section per example on the home page (D23). */
const EXAMPLE_COUNT = 10;

/** How long a released map may take to ask for Maps JS, on a busy machine. */
const ASKED = { timeout: 10_000 };

let site: BuiltSite;
let browser: Browser;

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

/**
 * A visitor: their own storage, every request off this machine recorded, then refused, and every
 * request to the site recorded too.
 */
async function visitor() {
  const context = await browser.newContext();
  const asked: string[] = [];
  const onSite: string[] = [];
  await context.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith(site.url)) {
      onSite.push(new URL(url).pathname);
      return route.continue();
    }
    asked.push(url);
    return route.abort();
  });
  const page = await context.newPage();
  return {
    context,
    page,
    offsite: () => asked,
    fetched: (path: string) => onSite.includes(path),
    google: () => asked.filter((url) => GOOGLE.test(url)),
  };
}

async function openHome(page: Page): Promise<void> {
  await page.goto(site.url);
  await firstMap(page).scrollIntoViewIfNeeded();
}

/** The page's first map: every section has one, so a locator for all would match ten. */
const firstMap = (page: Page) => page.locator("maplace-map").first();
const placeholder = (page: Page) => page.getByRole("button", { name: "Load Google Maps" }).first();
const footerToggle = (page: Page) => page.locator("[data-maps-toggle]");
const consentKept = (context: BrowserContext) =>
  context.storageState().then(({ origins }) => origins.flatMap(({ localStorage }) => localStorage));

describe("the site's consent to Google Maps", () => {
  it("asks nothing off the site until the visitor loads the maps, then Google for Maps JS", async () => {
    const { page, context, google, offsite, fetched } = await visitor();
    await openHome(page);
    await page.locator("#big").scrollIntoViewIfNeeded();
    await page.waitForTimeout(SETTLE_MS);
    expect(offsite()).toEqual([]);
    // The pages' own scripts wait for their maps too: big's 4,000 points aren't fetched yet.
    expect(fetched("/points-4k.json")).toBe(false);
    await expect.poll(() => placeholder(page).isVisible()).toBe(true);
    await placeholder(page).click();
    await expect
      .poll(() => google().some((url) => url.startsWith(MAPS_SCRIPT_ORIGIN)), ASKED)
      .toBe(true);
    expect(await consentKept(context)).toHaveLength(1);
    await context.close();
  }, 30_000);

  it("remembers consent: the next visit loads the maps with no placeholder shown", async () => {
    const { page, context, google } = await visitor();
    await openHome(page);
    await placeholder(page).click();
    const next = await context.newPage();
    await next.goto(site.url, { waitUntil: "domcontentloaded" });
    expect(await placeholder(next).isVisible()).toBe(false);
    const before = google().length;
    await firstMap(next).scrollIntoViewIfNeeded();
    await expect.poll(() => google().length, ASKED).toBeGreaterThan(before);
    await context.close();
  }, 30_000);

  it("forgets consent from the footer: the page reloads with the maps off", async () => {
    const { page, context, google } = await visitor();
    await openHome(page);
    await placeholder(page).click();
    await expect.poll(() => google().length, ASKED).toBeGreaterThan(0);
    const asked = google().length;
    await Promise.all([page.waitForEvent("load"), footerToggle(page).click()]);
    await firstMap(page).scrollIntoViewIfNeeded();
    await page.waitForTimeout(SETTLE_MS);
    expect(google()).toHaveLength(asked);
    expect(await placeholder(page).isVisible()).toBe(true);
    expect(await consentKept(context)).toEqual([]);
    await context.close();
  }, 30_000);

  it("turns the maps on from the footer as from a placeholder", async () => {
    const { page, context, google } = await visitor();
    await openHome(page);
    await footerToggle(page).click();
    await expect
      .poll(() => google().some((url) => url.startsWith(MAPS_SCRIPT_ORIGIN)), ASKED)
      .toBe(true);
    await context.close();
  }, 30_000);
});

describe("the home page's examples", () => {
  it("shows every example's map, held, and uses no id twice", async () => {
    const { page, context } = await visitor();
    await page.goto(site.url);
    const ids = await page.evaluate(() =>
      [...document.querySelectorAll("[id]")].map(({ id }) => id),
    );
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
    expect(await page.locator("section.example maplace-map[hold]").count()).toBe(EXAMPLE_COUNT);
    // A map without a box never comes into view, so it would never be released.
    const heights = await page
      .locator("section.example maplace-map")
      .evaluateAll((maps) => maps.map((map) => map.getBoundingClientRect().height));
    expect(heights.filter((height) => height === 0)).toEqual([]);
    await context.close();
  }, 30_000);

  it("runs a page's scripts as its map opens: route's stops, big's points", async () => {
    const { page, context, fetched } = await visitor();
    await openHome(page);
    await placeholder(page).click();
    await page.locator("#route-map").scrollIntoViewIfNeeded();
    await expect
      .poll(
        () =>
          page.evaluate(
            () => (document.getElementById("route-map") as { route?: unknown } | null)?.route,
          ),
        ASKED,
      )
      .toMatchObject({ stops: ["milan", "bologna", "florence"] });
    await page.locator("#big-map").scrollIntoViewIfNeeded();
    await expect.poll(() => fetched("/points-4k.json"), ASKED).toBe(true);
    await context.close();
  }, 30_000);
});
