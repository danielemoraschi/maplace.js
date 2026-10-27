import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { EXAMPLE_GROUPS } from "../src/examples/example-sections.ts";
import { mapLibreDrawn } from "./drawn-on-maplibre.ts";
import { chooseProvider, chooseVersion, groupLink, sectionPage } from "./home-sections.ts";
import { ON_MAPLIBRE, siteOnMapLibreBeforeTests } from "./maplibre-session.ts";
import { ASKED, opened } from "./site-session.ts";
import { DESKTOP, duplicateIds, footerToggle, loadMapsButtons } from "./visitor.ts";

const site = siteOnMapLibreBeforeTests();

/** Marks the document, so a test can tell the page never navigated. */
const markDocument = (page: Page) =>
  page.evaluate(() => {
    (globalThis as { sameDocument?: true }).sameDocument = true;
  });
const sameDocument = (page: Page) =>
  page.evaluate(() => (globalThis as { sameDocument?: true }).sameDocument === true);

/** The groups whose panel the page shows, by id. */
const shownGroups = (page: Page) =>
  page
    .locator("[data-group-panel]")
    .evaluateAll((panels) =>
      panels
        .filter((panel) => !(panel as HTMLElement).hidden)
        .map((panel) => panel.getAttribute("data-group-panel")),
    );

/** Clicks `label`'s link and waits for its group to show. */
async function switchTo(page: Page, label: string, id: string): Promise<void> {
  await groupLink(page, label).click();
  await expect.poll(() => shownGroups(page), ASKED).toEqual([id]);
}

describe("switching the examples' group in place (W38)", () => {
  it("keeps the document, the header and hero in place, the URL, title and link the group's", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    await markDocument(page);
    await switchTo(page, "Lists", "lists");
    expect(await sameDocument(page)).toBe(true);
    expect(new URL(page.url()).pathname).toBe("/examples/lists/");
    expect(await page.title()).toBe("Lists: maplacejs examples");
    expect(await groupLink(page, "Lists").getAttribute("aria-current")).toBe("page");
    expect(await page.locator("header").isVisible()).toBe(true);
    expect(await page.getByRole("heading", { level: 1 }).count()).toBe(1);
    expect(await page.locator("[data-group-announce]").textContent()).toBe("Lists examples");
    expect(await groupLink(page, "Lists").evaluate((link) => link === document.activeElement)).toBe(
      true,
    );
    await context.close();
  }, 30_000);

  it("opens a group's page loaded directly with the hero and its group", async () => {
    const { page, context } = await opened(site, "/examples/shapes/", DESKTOP);
    expect(await page.getByRole("heading", { level: 1 }).count()).toBe(1);
    expect(await shownGroups(page)).toEqual(["shapes"]);
    expect(await page.title()).toBe("Shapes: maplacejs examples");
    await context.close();
  }, 30_000);

  it("switches groups on back and forward, each entry at its own scroll position", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    await markDocument(page);
    await switchTo(page, "Lists", "lists");
    await page.locator("section#tabs").scrollIntoViewIfNeeded();
    const listsScroll = await page.evaluate(() => scrollY);
    await page.goBack();
    await expect.poll(() => shownGroups(page), ASKED).toEqual(["basics"]);
    expect(new URL(page.url()).pathname).toBe("/");
    await page.goForward();
    await expect.poll(() => shownGroups(page), ASKED).toEqual(["lists"]);
    await expect.poll(() => page.evaluate(() => scrollY), ASKED).toBe(listsScroll);
    expect(await sameDocument(page)).toBe(true);
    await context.close();
  }, 30_000);

  it("brings a group left from deep down back at its scroll position, a shorter group shown in between", async () => {
    const { page, context } = await opened(site, "/examples/data-routes/", DESKTOP);
    await page.locator("section#route").scrollIntoViewIfNeeded();
    const deep = await page.evaluate(() => scrollY);
    await switchTo(page, "Basics", "basics");
    await page.goBack();
    await expect.poll(() => shownGroups(page), ASKED).toEqual(["data-routes"]);
    // Back deep in the group, not reset to the panel's start (~1183): that much holds in headless
    // Chromium, which restores within the shorter group left (2333), where Chrome restores the very
    // position (2748). The order that keeps it is pinned in `group-switch.test.ts`'s unit tests.
    const route = await page
      .locator("section#route")
      .evaluate((section) => (section as HTMLElement).offsetTop);
    await expect
      .poll(() => page.evaluate(() => scrollY), ASKED)
      .toBeGreaterThan(Math.min(deep, route) - 900);
    await context.close();
  }, 30_000);

  it("starts a fetched group's map in view once maps are on, consent given first", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    await footerToggle(page).click();
    await switchTo(page, "Shapes", "shapes");
    await page.locator("section#circles .map-frame").scrollIntoViewIfNeeded();
    await expect.poll(() => mapLibreDrawn(page.locator("section#circles")), ON_MAPLIBRE).toBe(true);
    await context.close();
  }, 30_000);

  it("starts a fetched group's map from its own placeholder's Load maps", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    await switchTo(page, "Shapes", "shapes");
    const circles = page.locator("section#circles");
    await circles.locator(".map-frame").scrollIntoViewIfNeeded();
    await loadMapsButtons(circles).click();
    await expect.poll(() => mapLibreDrawn(page.locator("section#circles")), ON_MAPLIBRE).toBe(true);
    await context.close();
  }, 30_000);

  it("runs a fetched group's version switch and the page's provider toggle", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    await switchTo(page, "Lists", "lists");
    await chooseVersion(page, "menu", "React");
    const shown = () =>
      page
        .locator("section#menu [data-live-version]:not([hidden])")
        .evaluateAll((versions) =>
          versions.map(
            (version) =>
              `${version.getAttribute("data-provider")} ${version.getAttribute("data-live-version")}`,
          ),
        );
    expect(await shown()).toEqual(["maplibre react"]);
    await chooseProvider(page, "Google");
    expect(await shown()).toEqual(["google react"]);
    await context.close();
  }, 30_000);

  it("uses no id twice with every group opened in one document", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    for (const group of EXAMPLE_GROUPS.slice(1)) await switchTo(page, group.label, group.id);
    expect(await duplicateIds(page)).toEqual([]);
    await context.close();
  }, 30_000);

  it("takes an old home page link to an example on another group's page there", async () => {
    const { page, context } = await opened(site, "/#route", DESKTOP);
    await page.waitForURL(new URL(`${sectionPage("route")}#route`, site.url).href);
    expect(await shownGroups(page)).toEqual(["data-routes"]);
    await context.close();
  }, 30_000);

  it("leaves another page's anchor sharing an example's name where it is", async () => {
    const { page, context } = await opened(site, "/locations/#markers", DESKTOP);
    await page.waitForTimeout(500);
    expect(new URL(page.url()).pathname).toBe("/locations/");
    await context.close();
  }, 30_000);

  it("goes to a group's page when fetching it in place fails", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    let refused = false;
    await page.route("**/examples/lists/", (route) => {
      if (refused) return route.fallback();
      refused = true;
      return route.abort();
    });
    await groupLink(page, "Lists").click();
    await page.waitForURL(new URL("/examples/lists/", site.url).href);
    await expect.poll(() => shownGroups(page), ASKED).toEqual(["lists"]);
    await context.close();
  }, 30_000);
});
