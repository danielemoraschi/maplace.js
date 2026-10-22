import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { BrowserContext, Page } from "playwright";
import { describe, expect, it } from "vitest";
import { headCommit } from "../../../scripts/build/git.ts";
import { ROOT } from "../../../scripts/build/package.ts";
import { exampleData } from "../src/examples/example-data.ts";
import { EXAMPLE_SECTIONS } from "../src/examples/example-sections.ts";
import { REPOSITORY_URL } from "../src/site/repo-docs.ts";
import { mayAskBeforeConsent } from "../src/site/third-parties.ts";
import { recordAnimations } from "./recorded-animations.ts";
import { ASKED, SETTLE_MS, SITE_MAP_ID, siteBuiltBeforeTests } from "./site-session.ts";
import { addedByBootstrap, chooseTab, chooseVersion, firstMap, placeholder } from "./visitor.ts";

/** One section per example on the home page (D23). */
const EXAMPLE_COUNT = EXAMPLE_SECTIONS.length;

const site = siteBuiltBeforeTests();

async function openHome(page: Page): Promise<void> {
  await page.goto(site.url);
  await firstMap(page).scrollIntoViewIfNeeded();
}

const footerToggle = (page: Page) => page.locator("[data-maps-toggle]");
const consentKept = (context: BrowserContext) =>
  context.storageState().then(({ origins }) => origins.flatMap(({ localStorage }) => localStorage));

describe("the site's consent to its maps", () => {
  it("asks no map provider anything until the visitor loads the maps, then Google for Maps JS", async () => {
    const { page, context, offsite, mapProviders, fetched, mapsJsRequests } = await site.visitor();
    await openHome(page);
    // A version chosen before consent waits too, as the pages' own scripts wait for their maps:
    // big's 4,000 points aren't fetched by its page or its React version.
    await chooseVersion(page, "route", "Vanilla");
    await chooseVersion(page, "big", "React");
    await page.waitForTimeout(SETTLE_MS);
    expect(mapProviders()).toEqual([]);
    expect(offsite().filter((url) => !mayAskBeforeConsent(url))).toEqual([]);
    expect(fetched("/points-4k.json")).toBe(false);
    await expect.poll(() => placeholder(page).isVisible()).toBe(true);
    await placeholder(page).click();
    await expect.poll(() => mapsJsRequests().length, ASKED).toBeGreaterThan(0);
    expect(await consentKept(context)).toHaveLength(1);
    await context.close();
  }, 30_000);

  it("remembers consent: the next visit loads the maps with no placeholder shown", async () => {
    const { page, context, mapProviders } = await site.visitor();
    await openHome(page);
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
    await openHome(page);
    await placeholder(page).click();
    await expect.poll(() => mapProviders().length, ASKED).toBeGreaterThan(0);
    const asked = mapProviders().length;
    await Promise.all([page.waitForEvent("load"), footerToggle(page).click()]);
    await firstMap(page).scrollIntoViewIfNeeded();
    await page.waitForTimeout(SETTLE_MS);
    expect(mapProviders()).toHaveLength(asked);
    expect(await placeholder(page).isVisible()).toBe(true);
    expect(await consentKept(context)).toEqual([]);
    await context.close();
  }, 30_000);

  it("turns the maps on from the footer as from a placeholder", async () => {
    const { page, context, mapsJsRequests } = await site.visitor();
    await openHome(page);
    await footerToggle(page).click();
    await expect.poll(() => mapsJsRequests().length, ASKED).toBeGreaterThan(0);
    await context.close();
  }, 30_000);
});

describe("the home page's links", () => {
  it("has GitHub's star button in place of its link, GitHub's count refused or not", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url);
    await expect.poll(() => page.locator("a.github-button").count(), ASKED).toBe(0);
    await context.close();
  }, 30_000);

  it("links the data an example fetches to the repo, at the commit built, in a new tab", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url, { waitUntil: "domcontentloaded" });
    const links = await page
      .locator("section.example")
      .getByRole("link", { name: /\.json$/ })
      .evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href")));
    const targets = await page
      .locator("section.example")
      .getByRole("link", { name: /\.json$/ })
      .evaluateAll((anchors) => anchors.map((a) => a.getAttribute("target")));
    expect(new Set(targets)).toEqual(new Set(["_blank"]));
    const blob = `${REPOSITORY_URL}/blob/${headCommit(ROOT)}/`;
    expect(links.sort()).toEqual(
      exampleData()
        .map(({ path }) => `${blob}${path}`)
        .sort(),
    );
    await context.close();
  }, 30_000);
});

describe("the home page's examples", () => {
  it("shows every example's map, held", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url);
    expect(await page.locator("section.example maplace-map[hold]").count()).toBe(EXAMPLE_COUNT);
    await context.close();
  }, 30_000);

  it("gives every map a box, as a map without one never comes into view to be released", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url);
    const heights = await page
      .locator("section.example maplace-map")
      .evaluateAll((maps) => maps.map((map) => map.getBoundingClientRect().height));
    expect(heights.filter((height) => height === 0)).toEqual([]);
    await context.close();
  }, 30_000);

  it("uses no id twice, with every example's versions on one page", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url);
    const ids = await page.evaluate(() =>
      [...document.querySelectorAll("[id]")].map(({ id }) => id),
    );
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
    await context.close();
  }, 30_000);

  it("runs a page's scripts as its map opens: route's stops, big's points", async () => {
    const { page, context, fetched } = await site.visitor();
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
    const { page, context, fetched } = await site.visitor({ google: "stubbed" });
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
    const { page, context, mapsJsRequests } = await site.visitor();
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
    const mapsTags = mapsJsRequests();
    expect(mapsTags.length).toBeGreaterThan(0);
    expect(mapsTags.filter((url) => !addedByBootstrap(url))).toEqual([]);
    await context.close();
  }, 30_000);

  it("says when Maps JS didn't load for a version, the page's tag having failed first", async () => {
    const { page, context, mapsJsRequests } = await site.visitor();
    await openHome(page);
    await placeholder(page).click();
    await expect.poll(() => mapsJsRequests().length, ASKED).toBeGreaterThan(0);
    await chooseVersion(page, "simple", "Vanilla");
    const vanilla = page.locator('[data-example="simple"][data-live-version="vanilla"]');
    await expect.poll(() => vanilla.getAttribute("data-failed"), ASKED).toBe("");
    const note = page.locator("section#simple [data-map-failure]");
    expect(await note.textContent()).toMatch(/^The map couldn't load: Google Maps didn't load/);
    expect(await note.isVisible()).toBe(true);
    await context.close();
  }, 30_000);
});

describe("the home page's code tabs", () => {
  it("shows a host's Google loader as one closed line, opened on a click", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url);
    const section = await chooseTab(page, "simple", "Vanilla");
    const loader = section.getByRole("group").filter({ hasText: "Google's bootstrap loader" });
    expect(await loader.getAttribute("open")).toBeNull();
    expect(await loader.getByText("importLibrary").isVisible()).toBe(false);
    await loader.getByText("Google's bootstrap loader").click();
    expect(await loader.getByText("importLibrary").isVisible()).toBe(true);
    await context.close();
  }, 30_000);

  it("fades in the panel a tab shows, the one left hidden at once, unless asked for less motion", async () => {
    const { page, context } = await site.visitor();
    const animated = await recordAnimations(page);
    await page.goto(site.url);
    await chooseTab(page, "simple", "HTML");
    expect(await animated()).toEqual(["example-simple-html"]);
    expect(await page.locator("#example-simple-map").isHidden()).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await chooseTab(page, "simple", "React");
    expect(await page.locator("#example-simple-react").isVisible()).toBe(true);
    expect(await animated()).toEqual(["example-simple-html"]);
    await context.close();
  }, 30_000);
});

describe("the site's map ID", () => {
  it("is every example page's map ID, but where the page sets its own", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url, { waitUntil: "domcontentloaded" });
    const mapIds = await page
      .locator("section.example maplace-map")
      .evaluateAll((maps) => maps.map((map) => map.getAttribute("map-id")));
    const styled = await page.locator("section#styled maplace-map").getAttribute("map-id");
    expect(styled).toBe("DEMO_MAP_ID");
    expect(mapIds.filter((id) => id !== SITE_MAP_ID)).toEqual(["DEMO_MAP_ID"]);
    await context.close();
  }, 30_000);

  it("is in the scripts the vanilla and React versions run on", async () => {
    const scripts = await readdir(join(site.dir, "_astro"));
    const texts = await Promise.all(
      scripts
        .filter((file) => file.endsWith(".js"))
        .map((file) => readFile(join(site.dir, "_astro", file), "utf8")),
    );
    expect(texts.some((text) => text.includes(SITE_MAP_ID))).toBe(true);
  });
});
