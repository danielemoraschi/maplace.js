import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { EXAMPLE_GROUPS, groupPath } from "../src/examples/example-sections.ts";
import {
  chooseProvider,
  chooseTab,
  chooseVersion,
  examplesNav,
  sectionPage,
  shownNotes,
  visitSection,
} from "./home-sections.ts";
import { recordAnimations } from "./recorded-animations.ts";
import { ASKED, opened, siteBuiltBeforeTests } from "./site-session.ts";
import { DESKTOP, footerToggle, openExamplesPage, PHONE, placeholder } from "./visitor.ts";

const site = siteBuiltBeforeTests();

const LABELS = EXAMPLE_GROUPS.map(({ label }) => label);
/** The narrowest screen the side column is drawn on, beside the examples: 64rem. */
const COLUMN_NARROWEST = { width: 1024, height: 800 };
/** Just below it, where the column folds into a disclosure above the examples. */
const FOLDED = { width: 1023, height: 800 };

describe("a feature's page's list of the features' pages (W63)", () => {
  it("lists every feature's page in order, marking the page shown", async () => {
    const { page, context } = await opened(site, "/examples/search/", DESKTOP);
    expect(await examplesNav(page).getByRole("link").allTextContents()).toEqual(LABELS);
    const marked = examplesNav(page).locator('[aria-current="page"]');
    expect(await marked.allTextContents()).toEqual(["Search and filters"]);
    await context.close();
  }, 30_000);

  it("shows one Examples nav at each width, folded below 64rem and opened by keyboard", async () => {
    const { page, context } = await opened(site, "/examples/search/", DESKTOP);
    for (const viewport of [COLUMN_NARROWEST, PHONE, FOLDED]) {
      await page.setViewportSize(viewport);
      expect(await examplesNav(page).count(), `${viewport.width}`).toBe(1);
    }
    const links = examplesNav(page).getByRole("link");
    expect(await links.count()).toBe(0);
    await examplesNav(page).locator("summary").focus();
    await page.keyboard.press("Enter");
    expect(await links.allTextContents()).toEqual(LABELS);
    await context.close();
  }, 60_000);

  it("draws the column at 64rem, and leaves a section's map its width beside its list there", async () => {
    const { page, context } = await opened(site, "/examples/search/#tags", COLUMN_NARROWEST);
    expect(await examplesNav(page).getByRole("link").allTextContents()).toEqual(LABELS);
    expect(await examplesNav(page).locator("summary").isVisible()).toBe(false);
    const frame = await page.locator("section#tags .map-frame").boundingBox();
    // The list beside the map takes 17rem of the frame (`default-styles.ts`, `frame.css`): 42rem
    // leaves the map 400px.
    expect(frame?.width).toBeGreaterThanOrEqual(672);
    await context.close();
  }, 30_000);
});

describe("a feature's page's reference and neighbours (W63)", () => {
  it("lists its examples, then its reference, on this page", async () => {
    const { page, context } = await opened(site, "/examples/markers/", DESKTOP);
    const hrefs = await page
      .getByRole("navigation", { name: "On this page" })
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    const markers = EXAMPLE_GROUPS[0];
    expect(hrefs).toEqual([
      ...(markers?.sections ?? []).map(({ name }) => `#${name}`),
      "#reference",
    ]);
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

  it("links the previous and next features' pages, none before the first or after the last", async () => {
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
    const paths = EXAMPLE_GROUPS.map(groupPath);
    expect(await neighbours(paths[0] as string)).toEqual([["next", paths[1]]]);
    expect(await neighbours(paths[1] as string)).toEqual([
      ["prev", paths[0]],
      ["next", paths[2]],
    ]);
    expect(await neighbours(paths.at(-1) as string)).toEqual([["prev", paths.at(-2)]]);
  }, 60_000);
});

describe("an old link to an example (W63)", () => {
  it("lands on its section from the home page, or from a page that gave it to another", async () => {
    for (const [from, to] of [
      ["/#route", "/examples/lines-routes/#route"],
      ["/examples/lists/#search", "/examples/search/#search"],
    ]) {
      const { page, context } = await opened(site, from as string, DESKTOP);
      const landing = new URL(to as string, site.url);
      await page.waitForURL(landing.href);
      const sectionTop = () =>
        page
          .locator(`section${landing.hash}`)
          .evaluate((section) => section.getBoundingClientRect().top);
      await expect.poll(sectionTop, ASKED).toBeGreaterThanOrEqual(0);
      expect(await sectionTop(), from).toBeLessThan(DESKTOP.height / 2);
      await context.close();
    }
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
