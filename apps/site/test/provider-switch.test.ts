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
import { type Box, boxOf, DESKTOP, loadMapsButtons } from "./visitor.ts";

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
    expect(await shown("examples/simple/maplibre/vanilla.ts")).toBe(1);
    expect(await shown("examples/simple/vanilla.ts")).toBe(0);
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
    const { page, context } = await opened(site, "/", DESKTOP);
    await chooseProvider(page, "Google");
    await page.reload();
    const radio = (on: Page, name: string) =>
      providerToggle(on).getByRole("radio", { name, exact: true });
    expect(await radio(page, "Google").isChecked()).toBe(true);
    const section = await sectionOf(page, "simple");
    expect(await providerVersionIn(section, "google", "html").isVisible()).toBe(true);
    // Same browser, same site data, a tab of its own: kept in the tab's session only.
    const other = await context.newPage();
    await other.goto(site.url);
    expect(await radio(other, "MapLibre").isChecked()).toBe(true);
    await context.close();
  }, 30_000);

  it("has one toggle on each section, MapLibre first and chosen", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    const sections = page.locator("section.example");
    expect(await providerTogglesIn(sections).count()).toBe(await sections.count());
    expect(await providerToggle(page).locator("label").allTextContents()).toEqual([
      "MapLibre",
      "Google",
    ]);
    expect(await providerToggle(page).getByRole("radio").first().isChecked()).toBe(true);
    await context.close();
  }, 30_000);

  it("moves every section's toggle with the one clicked", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    const google = providerTogglesIn(page).getByRole("radio", { name: "Google", exact: true });
    await google.nth(1).scrollIntoViewIfNeeded();
    await google.nth(1).check();
    const checked = await google.evaluateAll((all) =>
      all.map((radio) => (radio as HTMLInputElement).checked),
    );
    expect(checked.length).toBeGreaterThan(1);
    expect(checked.every(Boolean)).toBe(true);
    await context.close();
  }, 30_000);

  it("keeps the dark ground under the chosen provider on a right-to-left page", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const toggle = providerToggle(page);
    const groundAt = async () => (await boxOf(toggle.locator("span[aria-hidden]"))).x;
    for (const name of ["Google", "MapLibre"]) {
      await chooseProvider(page, name);
      const chosen = await boxOf(toggle.locator("label", { hasText: name }));
      await expect.poll(groundAt).toBeCloseTo(chosen.x, 0);
    }
    await context.close();
  }, 30_000);
});
