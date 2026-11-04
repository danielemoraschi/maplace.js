import type { BrowserContext, Page } from "playwright";
import { describe, expect, it } from "vitest";
import { EXAMPLE_GROUPS, groupPath } from "../src/examples/example-sections.ts";
import { chooseProvider, chooseVersion, groupLink, sectionPage } from "./home-sections.ts";
import { ASKED, SETTLE_MS, settled, siteBuiltBeforeTests } from "./site-session.ts";
import { firstMap, footerToggle, loadMapButton, openHome, placeholder } from "./visitor.ts";

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
    // Route and big share Data & routes' page.
    await openHome(page, site.url, sectionPage("route"));
    await chooseProvider(page, "Google");
    // A version chosen before consent waits too, as the pages' own scripts wait for their maps:
    // big's 4,000 points aren't fetched by its page or its React version.
    await chooseVersion(page, "route", "Bundler");
    await chooseVersion(page, "big", "React");
    await page.waitForTimeout(SETTLE_MS);
    expect(mapProviders()).toEqual([]);
    expect(offsite()).toEqual([]);
    expect(fetched("/points-4k.json")).toBe(false);
    await expect.poll(() => placeholder(page).isVisible()).toBe(true);
    await placeholder(page).click();
    await expect.poll(() => mapsJsRequests().length, ASKED).toBeGreaterThan(0);
    expect(await consentKept(context)).toHaveLength(1);
    await context.close();
  }, 30_000);

  it("asks no map provider anything before consent on any group, loaded or switched to in place", async () => {
    const { page, context, offsite, mapProviders } = await site.visitor();
    const shownMaps = page.locator("section.example maplace-map").filter({ visible: true });
    const scrollPastShownMaps = async () => {
      for (const map of await shownMaps.all()) await map.scrollIntoViewIfNeeded();
    };
    for (const group of EXAMPLE_GROUPS) {
      await page.goto(new URL(groupPath(group), site.url).href);
      await scrollPastShownMaps();
    }
    // Back home, every other group switched to in place: their panels fetched, held still.
    await page.goto(site.url);
    for (const group of EXAMPLE_GROUPS.slice(1)) {
      await groupLink(page, group.label).click();
      await page.waitForURL(new URL(groupPath(group), site.url).href);
      await scrollPastShownMaps();
    }
    await page.waitForTimeout(SETTLE_MS);
    expect(mapProviders()).toEqual([]);
    expect(offsite()).toEqual([]);
    await context.close();
  }, 60_000);

  it("remembers consent: the next visit loads the maps with no placeholder shown", async () => {
    const { page, context, mapProviders } = await site.visitor();
    await openHome(page, site.url);
    await placeholder(page).click();
    const next = await context.newPage();
    await next.goto(site.url, { waitUntil: "domcontentloaded" });
    expect(await placeholder(next).isVisible()).toBe(false);
    const before = mapProviders().length;
    await firstMap(next).scrollIntoViewIfNeeded();
    await expect.poll(() => mapProviders().length, ASKED).toBeGreaterThan(before);
    await context.close();
  }, 30_000);

  it("forgets consent from the footer: the page reloads with the maps off", async () => {
    const { page, context, mapProviders } = await site.visitor();
    await openHome(page, site.url);
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
    await openHome(page, site.url);
    await footerToggle(page).click();
    await expect.poll(() => mapProviders().length, ASKED).toBeGreaterThan(0);
    await context.close();
  }, 30_000);

  it("shows no load panel of the library's on a map still held after consent", async () => {
    const { page, context } = await site.visitor();
    await openHome(page, site.url, sectionPage("route"));
    await placeholder(page).click();
    // Load on demand's map keeps its panel: it holds itself, for its reader to press.
    const others = "maplace-map:not([data-held-by-example])";
    const panels = `${others}:state(idle) .maplace-load-panel`;
    expect(new Set(await displaysOf(page, panels))).toEqual(new Set(["none"]));
    // One not released yet hides its panel too, until pressing it can load the map.
    const unreleased =
      '[data-held-by-example]:not([data-held-by-example="open"]) .maplace-load-panel';
    expect(new Set(await displaysOf(page, unreleased))).toEqual(new Set(["none"]));
    expect(await placeholder(page).isVisible()).toBe(false);
    expect(await loadMapButton(page.locator(others)).count()).toBe(0);
    await context.close();
  }, 30_000);
});
