import type { Locator, Page } from "playwright";
import { describe, expect, it } from "vitest";
import { mapLibreVersionIn } from "./drawn-on-maplibre.ts";
import {
  chooseProvider,
  chooseTab,
  chooseVersion,
  providerToggle,
  providerVersionIn,
  sectionOf,
  sectionPage,
  visitSection,
} from "./home-sections.ts";
import { ON_MAPLIBRE, siteOnMapLibreBeforeTests } from "./maplibre-session.ts";
import { ASKED, opened, SETTLE_MS } from "./site-session.ts";
import { type Box, boxOf, DESKTOP, drawnOnTop, loadMapsButtons, PHONE } from "./visitor.ts";

const site = siteOnMapLibreBeforeTests();

const meet = (a: Box, b: Box) =>
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
    expect(fetched("/points-4k.json")).toBe(false);
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

describe("route, on Google only", () => {
  const button = (section: Locator) => section.getByRole("button", { name: "Show it on Google" });

  for (const viewport of [DESKTOP, PHONE]) {
    it(`says MapLibre has no routing, in a frame a map tall, at ${viewport.width} px`, async () => {
      const { page, context } = await opened(site, `${sectionPage("route")}#route`, viewport);
      const section = await sectionOf(page, "route");
      const note = section.getByText("MapLibre has no routing.");
      expect(await note.isVisible()).toBe(true);
      const [frame, shown] = await Promise.all([
        boxOf(section.locator(".map-frame")),
        boxOf(button(section)),
      ]);
      expect(frame.height).toBeGreaterThanOrEqual(24 * 16);
      expect(meet(frame, shown)).toBe(true);
      // Before consent: the button is what is drawn there, no "Load maps" over it.
      expect(await drawnOnTop(button(section))).toBe(true);
      expect(await loadMapsButtons(section).isVisible()).toBe(false);
      await context.close();
    }, 30_000);
  }

  it("grays its version radios and code tabs out until shown on Google, then shows its code", async () => {
    const { page, context, section } = await visitSection(site, "route");
    const codeTabs = ["HTML", "Script", "Bundler", "React"];
    for (const name of codeTabs) {
      expect(await section.getByRole("tab", { name }).isDisabled(), name).toBe(true);
      expect(await section.getByRole("radio", { name, exact: true }).isDisabled(), name).toBe(true);
    }
    expect(await section.getByRole("tab", { name: "Map" }).isDisabled()).toBe(false);
    await button(section).click();
    for (const name of codeTabs) {
      expect(await section.getByRole("tab", { name }).isDisabled(), name).toBe(false);
      expect(await section.getByRole("radio", { name, exact: true }).isDisabled(), name).toBe(
        false,
      );
    }
    await chooseTab(page, "route", "HTML");
    const shown = section
      .getByRole("tabpanel")
      .getByText("examples/route/page.html")
      .filter({ visible: true });
    expect(await shown.count()).toBe(1);
    await context.close();
  }, 30_000);

  it("shows only route on Google from its button, the page's toggle left on MapLibre", async () => {
    const { page, context, section } = await visitSection(site, "route");
    await button(section).click();
    expect(await providerVersionIn(section, "google", "html").isVisible()).toBe(true);
    expect(await section.getByText("MapLibre has no routing.").isVisible()).toBe(false);
    expect(await providerToggle(page).getByRole("radio", { name: "MapLibre" }).isChecked()).toBe(
      true,
    );
    expect(await page.evaluate(() => document.activeElement?.getAttribute("name"))).toBe(
      "route-version",
    );
    await context.close();
  }, 30_000);

  it("shows its note again when the page's toggle goes to Google and back", async () => {
    const { page, context, section } = await visitSection(site, "route");
    const note = section.getByText("MapLibre has no routing.");
    await chooseProvider(page, "Google");
    expect(await note.isVisible()).toBe(false);
    expect(await providerVersionIn(section, "google", "html").isVisible()).toBe(true);
    await chooseProvider(page, "MapLibre");
    expect(await note.isVisible()).toBe(true);
    await context.close();
  }, 30_000);
});
