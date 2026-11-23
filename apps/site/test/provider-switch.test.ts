import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { mapLibreVersionIn } from "./drawn-on-maplibre.ts";
import {
  chooseProvider,
  chooseTab,
  chooseVersion,
  providerToggle,
  providerTogglesIn,
  providerVersionIn,
  sectionOf,
  visitSection,
} from "./home-sections.ts";
import { ON_MAPLIBRE, siteOnMapLibreBeforeTests } from "./maplibre-session.ts";
import { ASKED, opened, SETTLE_MS } from "./site-session.ts";
import { type Box, boxOf, DESKTOP, FIRST_EXAMPLES_PAGE, loadMapsButtons } from "./visitor.ts";

const site = siteOnMapLibreBeforeTests();

const _meet = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe("the examples' provider toggle, on a section", () => {
  it("shows MapLibre's version first, and Google's once chosen, keeping the version", async () => {
    const { page, context, section } = await visitSection(site, "simple");
    expect(await mapLibreVersionIn(section, "html").isVisible()).toBe(true);
    await chooseVersion(page, "simple", "Bundler");
    await chooseProvider(page, "Google");
    expect(await providerVersionIn(section, "google", "vanilla").isVisible()).toBe(true);
    expect(await mapLibreVersionIn(section, "vanilla").isHidden()).toBe(true);
    await context.close();
  }, 30_000);

  it("shows MapLibre's files in the code tabs, with no Google loader", async () => {
    const { page, context } = await visitSection(site, "simple");
    const section = await chooseTab(page, "simple", "Bundler");
    const shown = (text: string) =>
      section.getByRole("tabpanel").getByText(text).filter({ visible: true }).count();
    // Each provider's module, told apart by the entry it imports.
    expect(await shown('"@maplacejs/maplace/maplibre"')).toBe(1);
    expect(await shown('"@maplacejs/maplace/google"')).toBe(0);
    expect(await shown("Google's bootstrap loader")).toBe(0);
    await context.close();
  }, 30_000);

  it("asks OpenFreeMap nothing before consent, a MapLibre version chosen", async () => {
    const { page, context, mapProviders, fetched } = await visitSection(site, "big");
    await chooseVersion(page, "big", "React");
    await page.waitForTimeout(SETTLE_MS);
    expect(mapProviders()).toEqual([]);
    expect(fetched("/examples/data/points-4k.json")).toBe(false);
    await context.close();
  }, 30_000);

  it("leaves a running MapLibre version alone when Google's Maps JS fails", async () => {
    const { page, context, mapsJsRequests, section } = await visitSection(site, "simple");
    await chooseVersion(page, "simple", "Bundler");
    await loadMapsButtons(section).click();
    const onMapLibre = mapLibreVersionIn(section, "vanilla");
    await expect.poll(() => onMapLibre.getAttribute("data-started"), ON_MAPLIBRE).toBe("");
    await chooseProvider(page, "Google");
    const onGoogle = providerVersionIn(section, "google", "vanilla");
    await expect
      .poll(() => onGoogle.getAttribute("data-failed"), ASKED)
      .toBe("provider-load-failed");
    expect(mapsJsRequests().length).toBeGreaterThan(0);
    expect(await onMapLibre.getAttribute("data-failed")).toBeNull();
    await context.close();
  }, 30_000);

  it("keeps Google for the tab's visit: after a reload, not in a tab of its own", async () => {
    const { page, context } = await opened(site, FIRST_EXAMPLES_PAGE, DESKTOP);
    await chooseProvider(page, "Google");
    await page.reload();
    const radio = (on: Page, name: string) =>
      providerToggle(on).getByRole("radio", { name, exact: true });
    expect(await radio(page, "Google").isChecked()).toBe(true);
    const section = await sectionOf(page, "simple");
    expect(await providerVersionIn(section, "google", "html").isVisible()).toBe(true);
    // Its HTML code on Google written in at load, framed (W83).
    const code = section
      .locator('[role="tabpanel"] [data-code-frame] pre.astro-code')
      .filter({ visible: true });
    expect(await code.count()).toBeGreaterThan(0);
    // Same browser, same site data, a tab of its own: kept in the tab's session only.
    const other = await context.newPage();
    await other.goto(new URL(FIRST_EXAMPLES_PAGE, site.url).href);
    expect(await radio(other, "MapLibre").isChecked()).toBe(true);
    await context.close();
  }, 30_000);

  it("has one toggle on an example's page, MapLibre first and chosen", async () => {
    const { page, context } = await opened(site, FIRST_EXAMPLES_PAGE, DESKTOP);
    expect(await providerTogglesIn(page).count()).toBe(1);
    expect(await providerToggle(page).locator("label").allTextContents()).toEqual([
      "MapLibre",
      "Google",
    ]);
    expect(await providerToggle(page).getByRole("radio").first().isChecked()).toBe(true);
    await context.close();
  }, 30_000);

  it("carries the provider chosen to the next example's page in the tab", async () => {
    const { page, context } = await opened(site, FIRST_EXAMPLES_PAGE, DESKTOP);
    await chooseProvider(page, "Google");
    await page.getByRole("navigation", { name: "Previous and next" }).getByRole("link").click();
    await page.waitForURL(new URL("/examples/markers/markers/", site.url).href);
    const google = providerToggle(page).getByRole("radio", { name: "Google", exact: true });
    expect(await google.isChecked()).toBe(true);
    const section = await sectionOf(page, "markers");
    expect(await providerVersionIn(section, "google", "html").isVisible()).toBe(true);
    await context.close();
  }, 30_000);

  it("sets the switch under the tabs on a phone, at their start and of their height", async () => {
    const { page, context } = await opened(site, FIRST_EXAMPLES_PAGE, { width: 320, height: 700 });
    const tabs = await boxOf(page.locator("main [role=tablist]").first());
    const toggle = await boxOf(providerToggle(page));
    expect(toggle.y).toBeGreaterThanOrEqual(tabs.y + tabs.height);
    expect(toggle.x).toBeCloseTo(tabs.x, 0);
    expect(toggle.height).toBeCloseTo(tabs.height, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    await context.close();
  }, 30_000);

  it("keeps the dark ground under the chosen provider on a right-to-left page", async () => {
    const { page, context } = await opened(site, FIRST_EXAMPLES_PAGE, DESKTOP);
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const toggle = providerToggle(page);
    // The pill's ground is inset from the switch's edge: it lies within the chosen segment.
    const groundWithin = async (name: string) => {
      const ground = await boxOf(toggle.locator("span[aria-hidden]"));
      const chosen = await boxOf(toggle.locator("label", { hasText: name }));
      return ground.x >= chosen.x && ground.x + ground.width <= chosen.x + chosen.width;
    };
    for (const name of ["Google", "MapLibre"]) {
      await chooseProvider(page, name);
      await expect.poll(() => groundWithin(name)).toBe(true);
    }
    await context.close();
  }, 30_000);
});
