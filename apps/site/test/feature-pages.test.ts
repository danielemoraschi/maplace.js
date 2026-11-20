import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import {
  EXAMPLE_GROUPS,
  EXAMPLE_PAGE_ENTRIES,
  examplePagesOf,
  groupPath,
} from "../src/examples/example-sections.ts";
import {
  chooseProvider,
  chooseTab,
  chooseVersion,
  sectionPage,
  shownNotes,
  visitSection,
} from "./home-sections.ts";
import { recordAnimations } from "./recorded-animations.ts";
import { ASKED, opened, siteBuiltBeforeTests } from "./site-session.ts";
import { DESKTOP, footerToggle, openExamplesPage, placeholder } from "./visitor.ts";

const site = siteBuiltBeforeTests();

describe("a hub and its neighbours (W63)", () => {
  it("lists its examples, each linking its page, and draws no map", async () => {
    const { page, context } = await opened(site, "/examples/markers/", DESKTOP);
    const hrefs = await page
      .getByRole("region", { name: "Examples" })
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    const markers = EXAMPLE_GROUPS[0];
    expect(hrefs).toEqual((markers ? examplePagesOf(markers) : []).map(({ path }) => path));
    expect(await page.locator("maplace-map, section.example").count()).toBe(0);
    await context.close();
  }, 30_000);

  /** The headings of the page's reference tables, and where each links. */
  const referenceLinks = (page: Page) =>
    page
      .locator("section#reference h3 a")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));

  it("shows its reference tables under a heading of their own, each linking its section of the docs", async () => {
    const { page, context } = await opened(site, "/examples/markers/#reference", DESKTOP);
    expect(await page.getByRole("region", { name: "Reference" }).count()).toBe(1);
    expect(await referenceLinks(page)).toEqual(["/locations/#markers", "/store/#popup-options"]);
    expect(await page.locator("section#reference table").count()).toBe(2);
    await context.close();
  }, 30_000);

  /** The page's previous and next links: each its rel and href. */
  const neighbours = async (route: string) => {
    const { page, context } = await opened(site, route, DESKTOP);
    const links = await page
      .getByRole("navigation", { name: "Previous and next" })
      .getByRole("link")
      .evaluateAll((all) =>
        all.map((link) => [link.getAttribute("rel"), link.getAttribute("href")]),
      );
    await context.close();
    return links;
  };

  it("links a hub to the hubs before and after it", async () => {
    const paths = EXAMPLE_GROUPS.map(groupPath);
    expect(await neighbours(paths[1] as string)).toEqual([
      ["prev", paths[0]],
      ["next", paths[2]],
    ]);
  }, 30_000);

  it("links an example's page to the examples before and after it, across categories", async () => {
    const paths = EXAMPLE_PAGE_ENTRIES.map(({ path }) => path);
    // The last of Markers and popups, before Lists and menus' first example.
    const last = paths.indexOf("/examples/lists/menu/") - 1;
    expect(await neighbours(paths[last] as string)).toEqual([
      ["prev", paths[last - 1]],
      ["next", paths[last + 1]],
    ]);
  }, 30_000);
});

describe("an old link to an example (W63)", () => {
  it("lands on its example's page from the home page, or from any hub", async () => {
    for (const [from, to] of [
      ["/#route", "/examples/lines-routes/route/"],
      ["/examples/lists/#search", "/examples/search/search/"],
      ["/examples/circles-polygons/#flights", "/examples/lines-routes/flights/"],
    ]) {
      const { page, context } = await opened(site, from as string, DESKTOP);
      await page.waitForURL(new URL(to as string, site.url).href);
      expect(await page.evaluate(() => scrollY), from).toBe(0);
      await context.close();
    }
  }, 30_000);

  it("keeps a shared link-to-place address's query and map anchor on the way", async () => {
    const from = "/examples/live-data/?place-maplibre=milan#link-to-place-maplibre-map";
    const { page, context } = await opened(site, from, DESKTOP);
    await page.waitForURL("**/examples/live-data/link-to-place/**");
    const landed = new URL(page.url());
    expect(landed.pathname).toBe("/examples/live-data/link-to-place/");
    expect(landed.search).toBe("?place-maplibre=milan");
    expect(landed.hash).toBe("#link-to-place-maplibre-map");
    await context.close();
  }, 30_000);

  it("leaves another page's anchor sharing an example's name where it is", async () => {
    const { page, context } = await opened(site, "/locations/#markers", DESKTOP);
    await page.waitForTimeout(500);
    expect(new URL(page.url()).pathname).toBe("/locations/");
    await context.close();
  }, 30_000);
});

describe("the examples' pages' scripts", () => {
  it("runs a page's scripts as its map opens: route's stops, big's points", async () => {
    const { page, context, fetched } = await site.visitor();
    await openExamplesPage(page, site.url, sectionPage("route"));
    await placeholder(page).click();
    await chooseProvider(page, "Google");
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
    await openExamplesPage(page, site.url, sectionPage("big"));
    await page.locator("#big-map").scrollIntoViewIfNeeded();
    await expect.poll(() => fetched("/examples/data/points-4k.json"), ASKED).toBe(true);
    await context.close();
  }, 30_000);

  it("runs the chosen version once consented, its map in a box", async () => {
    const { page, context, fetched } = await site.visitor({ google: "stubbed" });
    // Chosen before consent, so big's page map, hidden, is never released: only its React
    // version can fetch the points.
    await openExamplesPage(page, site.url, sectionPage("big"));
    await chooseProvider(page, "Google");
    await chooseVersion(page, "big", "React");
    await footerToggle(page).click();
    await page.locator("#big-react-root").scrollIntoViewIfNeeded();
    await expect.poll(() => fetched("/examples/data/points-4k.json"), ASKED).toBe(true);
    const reactMap = await page.locator("#big-react-root .map").boundingBox();
    expect(reactMap?.height).toBeGreaterThan(0);
    await openExamplesPage(page, site.url, sectionPage("route"));
    await chooseVersion(page, "route", "Bundler");
    await page.locator("#route-vanilla-map").scrollIntoViewIfNeeded();
    await expect
      .poll(() => page.locator('#route-vanilla-list [role="listbox"]').count(), ASKED)
      .toBe(1);
    expect((await page.locator("#route-vanilla-map").boundingBox())?.height).toBeGreaterThan(0);
    await context.close();
  }, 30_000);
});

describe("an example's code tabs", () => {
  it("shows a host's Google loader as one closed line, opened on a click", async () => {
    const { page, context } = await site.visitor();
    await page.goto(new URL(sectionPage("simple"), site.url).href);
    await chooseProvider(page, "Google");
    const section = await chooseTab(page, "simple", "Bundler");
    const loader = section.getByRole("group").filter({ hasText: "Google's bootstrap loader" });
    expect(await loader.getAttribute("open")).toBeNull();
    expect(await loader.getByText("importLibrary").isVisible()).toBe(false);
    await loader.getByText("Google's bootstrap loader").click();
    expect(await loader.getByText("importLibrary").isVisible()).toBe(true);
    await context.close();
  }, 30_000);

  it("fades in the code a tab shows and its map, the ones left hidden at once, unless asked for less motion", async () => {
    const { page, context } = await site.visitor();
    const animated = await recordAnimations(page);
    await page.goto(new URL(sectionPage("simple"), site.url).href);
    const section = await chooseTab(page, "simple", "React");
    // The code panel, then the React version in the frame, which has no id.
    expect(await animated()).toEqual(["example-simple-react", ""]);
    expect(await section.locator(".map-frame").isVisible()).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await chooseTab(page, "simple", "Script");
    expect(await page.locator("#example-simple-script").isVisible()).toBe(true);
    expect(await animated()).toEqual(["example-simple-react", ""]);
    await context.close();
  }, 30_000);
});

describe("polygon's saved note", () => {
  /** Calls the `save` polygon's versions call with an edit, as one would. */
  const save = (page: Page, title: string) =>
    page.evaluate((saved) => {
      const pageGlobals = globalThis as unknown as { save(location: object): void };
      pageGlobals.save({ id: "park", title: saved, path: [1, 2, 3] });
    }, title);

  it("says what the shown version saved, each version keeping its own", async () => {
    const { page, context, section } = await visitSection(site, "polygon");
    await chooseVersion(page, "polygon", "Bundler");
    const saved = shownNotes(section).locator("[data-saved]");
    await save(page, "Park");
    expect(await saved.textContent()).toBe("Saved: Park, 3 points.");
    expect(await saved.isVisible()).toBe(true);
    await chooseVersion(page, "polygon", "Script");
    expect(await saved.isVisible(), "the Script version saved nothing").toBe(false);
    const bundlerSave = section.getByText("Saved: Park, 3 points.");
    expect(await bundlerSave.isVisible(), "the hidden Bundler version's save").toBe(false);
    await chooseVersion(page, "polygon", "Bundler");
    expect(await saved.textContent()).toBe("Saved: Park, 3 points.");
    expect(await saved.isVisible()).toBe(true);
    await context.close();
  }, 30_000);
});
