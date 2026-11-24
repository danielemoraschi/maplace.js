import type { BrowserContext, Page } from "playwright";
import { describe, expect, it } from "vitest";
import { EXAMPLE_PAGE_ENTRIES } from "../src/examples/example-sections.ts";
import { SITE_ROUTES } from "../src/site/site-routes.ts";
import { contrastRatio } from "./contrast.ts";
import { mapLibreDrawn } from "./drawn-on-maplibre.ts";
import { enforcedPolicy } from "./header-rules.ts";
import { chooseProvider, chooseVersion, sectionPage } from "./home-sections.ts";
import { ON_MAPLIBRE } from "./maplibre-session.ts";
import {
  ASKED,
  EXAMPLE_MAPS,
  SETTLE_MS,
  scrollPastShownMaps,
  settled,
  siteBuiltBeforeTests,
  visitingPages,
} from "./site-session.ts";
import {
  consentFromFooter,
  FIRST_EXAMPLES_PAGE,
  firstMap,
  footerToggle,
  grantConsent,
  loadMapButton,
  openExamplesPage,
  placeholder,
} from "./visitor.ts";

const site = siteBuiltBeforeTests();

/**
 * The display of every node `selector` matches, found and read in one pass in the page, once there
 * is one. A locator's `count` and `evaluateAll` each go to the page apart, and a map released
 * between two of them takes its load panel away, which then has no display at all, or none left.
 */
async function displaysOf(page: Page, selector: string): Promise<string[]> {
  let displays: string[] = [];
  const read = () =>
    page.evaluate(
      (matching) =>
        Array.from(document.querySelectorAll(matching), (node) => getComputedStyle(node).display),
      selector,
    );
  const readCount = async () => {
    displays = await read();
    return displays.length;
  };
  await expect.poll(readCount, ASKED).toBeGreaterThan(0);
  return displays;
}

const consentKept = (context: BrowserContext) =>
  context.storageState().then(({ origins }) => origins.flatMap(({ localStorage }) => localStorage));

describe("the site's consent to its maps", () => {
  it("asks no map provider anything until the visitor loads the maps, then Google for Maps JS", async () => {
    const { page, context, offsite, mapProviders, fetched, mapsJsRequests } = await site.visitor();
    await openExamplesPage(page, site.url, sectionPage("route"));
    await chooseProvider(page, "Google");
    // A version chosen before consent waits too, as the pages' own scripts wait for their maps:
    // big's 4,000 points aren't fetched by its page or its React version, on Google as chosen.
    await chooseVersion(page, "route", "Bundler");
    await page.waitForTimeout(SETTLE_MS);
    await openExamplesPage(page, site.url, sectionPage("big"));
    await chooseVersion(page, "big", "React");
    await page.waitForTimeout(SETTLE_MS);
    expect(mapProviders()).toEqual([]);
    expect(offsite()).toEqual([]);
    expect(fetched("/examples/data/points-4k.json")).toBe(false);
    await expect.poll(() => placeholder(page).isVisible()).toBe(true);
    await placeholder(page).click();
    await expect.poll(() => mapsJsRequests().length, ASKED).toBeGreaterThan(0);
    expect(await consentKept(context)).toHaveLength(1);
    await context.close();
  }, 30_000);

  it(
    "asks no map provider anything before consent on any example's page",
    async () => {
      const { page, context, offsite, mapProviders } = await site.visitor();
      const routes = EXAMPLE_PAGE_ENTRIES.map(({ path }) => path);
      await scrollPastShownMaps(page, site.url, routes, page.locator(EXAMPLE_MAPS));
      await page.waitForTimeout(SETTLE_MS);
      expect(mapProviders()).toEqual([]);
      expect(offsite()).toEqual([]);
      await context.close();
    },
    visitingPages(EXAMPLE_PAGE_ENTRIES.length),
  );

  it.each([FIRST_EXAMPLES_PAGE, "/builder/"])(
    "draws the Load maps button's text at 4.5:1 or more against its red, on %s",
    async (route) => {
      const { page, context } = await site.visitor();
      await openExamplesPage(page, site.url, route);
      const { color, backgroundColor } = await placeholder(page).evaluate((button) =>
        getComputedStyle(button),
      );
      expect(contrastRatio(color, backgroundColor)).toBeGreaterThanOrEqual(4.5);
      await context.close();
    },
    30_000,
  );

  it("remembers consent: the next visit loads the maps with no placeholder shown", async () => {
    const { page, context, mapProviders } = await site.visitor();
    await openExamplesPage(page, site.url);
    await placeholder(page).click();
    const next = await context.newPage();
    await next.goto(new URL(FIRST_EXAMPLES_PAGE, site.url).href, { waitUntil: "domcontentloaded" });
    expect(await placeholder(next).isVisible()).toBe(false);
    const before = mapProviders().length;
    await firstMap(next).scrollIntoViewIfNeeded();
    await expect.poll(() => mapProviders().length, ASKED).toBeGreaterThan(before);
    await context.close();
  }, 30_000);

  it("forgets consent from the footer: the page reloads with the maps off", async () => {
    const { page, context, mapProviders } = await site.visitor();
    await openExamplesPage(page, site.url);
    await placeholder(page).click();
    await expect.poll(() => mapProviders().length, ASKED).toBeGreaterThan(0);
    // A MapLibre map, the first one, asks OpenFreeMap more than once as it opens.
    const asked = await settled(async () => mapProviders().length, {
      ...ASKED,
      what: "the map providers' requests",
    });
    await Promise.all([page.waitForEvent("load"), footerToggle(page).click()]);
    await firstMap(page).scrollIntoViewIfNeeded();
    await page.waitForTimeout(SETTLE_MS);
    expect(mapProviders()).toHaveLength(asked);
    expect(await placeholder(page).isVisible()).toBe(true);
    expect(await consentKept(context)).toEqual([]);
    await context.close();
  }, 30_000);

  it("turns the maps on from the footer as from a placeholder", async () => {
    const { page, context, mapProviders } = await site.visitor();
    await openExamplesPage(page, site.url);
    await consentFromFooter(page);
    await expect.poll(() => mapProviders().length, ASKED).toBeGreaterThan(0);
    await context.close();
  }, 30_000);

  it("shows no load panel of the library's on a map still held after consent", async () => {
    const { page, context } = await site.visitor();
    await openExamplesPage(page, site.url);
    await placeholder(page).click();
    const maps = "maplace-map:not([data-held-by-example])";
    const panels = `${maps}:state(idle) .maplace-load-panel`;
    expect(new Set(await displaysOf(page, panels))).toEqual(new Set(["none"]));
    expect(await placeholder(page).isVisible()).toBe(false);
    expect(await loadMapButton(page.locator(maps)).count()).toBe(0);
    await context.close();
  }, 30_000);

  it("hides the load panel of Load the map on click's map until it is released, after consent", async () => {
    const { page, context } = await site.visitor();
    await openExamplesPage(page, site.url, sectionPage("load-on-demand"));
    await placeholder(page).click();
    // Its map holds itself, for its reader to press; one not released yet hides the library's panel,
    // until pressing it can load the map.
    const unreleased =
      '[data-held-by-example]:not([data-held-by-example="open"]) .maplace-load-panel';
    expect(new Set(await displaysOf(page, unreleased))).toEqual(new Set(["none"]));
    expect(await placeholder(page).isVisible()).toBe(false);
    await context.close();
  }, 30_000);
});

describe("every page with the maps on, under the site's policy (W81)", () => {
  it(
    "is served the policy, and it breaks nothing: no load blocked, no error, MapLibre drawing",
    async () => {
      const { page, context, errors } = await site.visitor({ openFreeMap: "local" });
      // The policy each page and script of the site came with, by kind: the server sends it.
      const policies = { document: new Set<string>(), script: new Set<string>() };
      page.on("response", (response) => {
        const kind = response.request().resourceType();
        if (!response.url().startsWith(site.url) || !(kind === "document" || kind === "script"))
          return;
        policies[kind].add(response.headers()["content-security-policy"] ?? "none");
      });
      await grantConsent(page, site.url);
      await expect.poll(() => mapLibreDrawn(firstMap(page)), ON_MAPLIBRE).toBe(true);
      await scrollPastShownMaps(page, site.url, SITE_ROUTES, page.locator("maplace-map"));
      const policy = enforcedPolicy();
      expect(policies).toEqual({ document: new Set([policy]), script: new Set([policy]) });
      // Chromium logs every load the policy blocks as an error, naming the directive.
      expect(errors()).toEqual([]);
      await context.close();
    },
    visitingPages(SITE_ROUTES.length + 1),
  );
});
