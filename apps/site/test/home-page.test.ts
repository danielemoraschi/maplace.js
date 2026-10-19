import type { BrowserContext, Page } from "playwright";
import { describe, expect, it } from "vitest";
import { MAPS_SCRIPT_ORIGIN } from "../../../packages/maplace/src/google/maps-script-url.ts";
import { EXAMPLE_SECTIONS } from "../src/examples/example-sections.ts";
import { ASKED, SETTLE_MS, siteBuiltBeforeTests } from "./site-session.ts";
import { chooseVersion, firstMap, placeholder, type VisitorOptions } from "./visitor.ts";

/** One section per example on the home page (D23). */
const EXAMPLE_COUNT = EXAMPLE_SECTIONS.length;

/**
 * The callback Google's bootstrap loader names in the Maps tag it adds
 * (`callback=google.maps.__ib__`): a tag without it is the element's own.
 */
const BOOTSTRAP_CALLBACK = "__ib__";

const site = siteBuiltBeforeTests();

const visitor = (options?: VisitorOptions) => site.visitor(options);

async function openHome(page: Page): Promise<void> {
  await page.goto(site.url);
  await firstMap(page).scrollIntoViewIfNeeded();
}

const footerToggle = (page: Page) => page.locator("[data-maps-toggle]");
const consentKept = (context: BrowserContext) =>
  context.storageState().then(({ origins }) => origins.flatMap(({ localStorage }) => localStorage));

describe("the site's consent to Google Maps", () => {
  it("asks nothing off the site until the visitor loads the maps, then Google for Maps JS", async () => {
    const { page, context, offsite, fetched, askedForMapsJs } = await visitor();
    await openHome(page);
    // A version chosen before consent waits too, as the pages' own scripts wait for their maps:
    // big's 4,000 points aren't fetched by its page or its React version.
    await chooseVersion(page, "route", "Vanilla");
    await chooseVersion(page, "big", "React");
    await page.waitForTimeout(SETTLE_MS);
    expect(offsite()).toEqual([]);
    expect(fetched("/points-4k.json")).toBe(false);
    await expect.poll(() => placeholder(page).isVisible()).toBe(true);
    await placeholder(page).click();
    await expect.poll(askedForMapsJs, ASKED).toBe(true);
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
    const { page, context, askedForMapsJs } = await visitor();
    await openHome(page);
    await footerToggle(page).click();
    await expect.poll(askedForMapsJs, ASKED).toBe(true);
    await context.close();
  }, 30_000);
});

describe("the home page's examples", () => {
  it("shows every example's map, held", async () => {
    const { page, context } = await visitor();
    await page.goto(site.url);
    expect(await page.locator("section.example maplace-map[hold]").count()).toBe(EXAMPLE_COUNT);
    await context.close();
  }, 30_000);

  it("gives every map a box, as a map without one never comes into view to be released", async () => {
    const { page, context } = await visitor();
    await page.goto(site.url);
    const heights = await page
      .locator("section.example maplace-map")
      .evaluateAll((maps) => maps.map((map) => map.getBoundingClientRect().height));
    expect(heights.filter((height) => height === 0)).toEqual([]);
    await context.close();
  }, 30_000);

  it("uses no id twice, with every example's versions on one page", async () => {
    const { page, context } = await visitor();
    await page.goto(site.url);
    const ids = await page.evaluate(() =>
      [...document.querySelectorAll("[id]")].map(({ id }) => id),
    );
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
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
      .toMatchObject({ stops: ["milan", "zurich", "paris", "munich"], via: ["zurich"] });
    await page.locator("#big-map").scrollIntoViewIfNeeded();
    await expect.poll(() => fetched("/points-4k.json"), ASKED).toBe(true);
    await context.close();
  }, 30_000);

  it("runs the chosen version once consented, its map in a box", async () => {
    const { page, context, fetched } = await visitor({ stubMapsJs: true });
    await openHome(page);
    // Chosen before consent, so big's page map, hidden, is never released: only its React
    // version can fetch the points.
    await chooseVersion(page, "route", "Vanilla");
    await chooseVersion(page, "big", "React");
    await footerToggle(page).click();
    await page.locator("#route-vanilla-map").scrollIntoViewIfNeeded();
    await expect
      .poll(() => page.locator('#route-vanilla-list [role="listbox"]').count(), ASKED)
      .toBe(1);
    const box = await page.locator("#route-vanilla-map").boundingBox();
    expect(box?.height).toBeGreaterThan(0);
    await page.locator("#big-react-root").scrollIntoViewIfNeeded();
    await expect.poll(() => fetched("/points-4k.json"), ASKED).toBe(true);
    const reactMap = await page.locator("#big-react-root .map").boundingBox();
    expect(reactMap?.height).toBeGreaterThan(0);
    await context.close();
  }, 30_000);

  it("says when its own bootstrap's Maps JS didn't load for a version", async () => {
    const { page, context, google } = await visitor();
    await openHome(page);
    // Only simple's section left, its Vanilla version chosen before consent: its page map never
    // asks for Maps JS, so only the version's bootstrap does.
    await page.evaluate(() => {
      for (const other of document.querySelectorAll("section.example:not(#simple)")) other.remove();
    });
    await chooseVersion(page, "simple", "Vanilla");
    await footerToggle(page).click();
    await page.locator("#simple-vanilla-map").scrollIntoViewIfNeeded();
    const vanilla = page.locator('[data-example="simple"][data-live-version="vanilla"]');
    await expect.poll(() => vanilla.getAttribute("data-failed"), ASKED).toBe("");
    const mapsTags = google().filter((url) => url.startsWith(MAPS_SCRIPT_ORIGIN));
    expect(mapsTags.length).toBeGreaterThan(0);
    expect(mapsTags.filter((url) => !url.includes(BOOTSTRAP_CALLBACK))).toEqual([]);
    await context.close();
  }, 30_000);

  it("says when Maps JS didn't load for a version, the page's tag having failed first", async () => {
    const { page, context, askedForMapsJs } = await visitor();
    await openHome(page);
    await placeholder(page).click();
    await expect.poll(askedForMapsJs, ASKED).toBe(true);
    await chooseVersion(page, "simple", "Vanilla");
    const vanilla = page.locator('[data-example="simple"][data-live-version="vanilla"]');
    await expect.poll(() => vanilla.getAttribute("data-failed"), ASKED).toBe("");
    const note = page.locator("section#simple [data-map-failure]");
    expect(await note.textContent()).toMatch(/^The map couldn't load: Google Maps didn't load/);
    expect(await note.isVisible()).toBe(true);
    await context.close();
  }, 30_000);
});
