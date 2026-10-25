import type { Locator, Page } from "playwright";
import { describe, expect, it } from "vitest";
import { EXAMPLE_SECTIONS } from "../src/examples/example-sections.ts";
import { mapLibreVersionIn } from "./drawn-on-maplibre.ts";
import {
  chooseProvider,
  chooseTab,
  chooseVersion,
  providerToggle,
  providerVersionIn,
  sectionOf,
  visitSection,
} from "./home-sections.ts";
import { ON_MAPLIBRE, siteOnMapLibreBeforeTests } from "./maplibre-session.ts";
import { ASKED, opened, SETTLE_MS } from "./site-session.ts";
import { DESKTOP, drawnOnTop, loadMapsButtons, PHONE } from "./visitor.ts";

const site = siteOnMapLibreBeforeTests();

type Box = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>;

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  if (box === null) throw new Error("nothing laid out");
  return box;
}

const meet = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** The home page at `viewport`, scrolled to its top. */
const home = (viewport: typeof DESKTOP) => opened(site, "/", viewport);

const WHITE = "rgb(255, 255, 255)";
const TRANSPARENT = "rgba(0, 0, 0, 0)";

/** The background of the box the toggle sits on: white once stuck, none in its place. */
const stuckBox = (page: Page) =>
  providerToggle(page)
    .locator("..")
    .evaluate((box) => getComputedStyle(box).backgroundColor);

const scrollTo = (page: Page, name: string) =>
  page.locator(`section#${name}`).evaluate((section) => section.scrollIntoView());

describe("the examples' provider toggle", () => {
  it("is one toggle on the page, MapLibre first and chosen", async () => {
    const { page, context } = await home(DESKTOP);
    expect(await providerToggle(page).count()).toBe(1);
    expect(await providerToggle(page).locator("label").allTextContents()).toEqual([
      "MapLibre",
      "Google",
    ]);
    expect(await providerToggle(page).getByRole("radio").first().isChecked()).toBe(true);
    await context.close();
  }, 30_000);

  for (const viewport of [DESKTOP, PHONE]) {
    it(`sits level with the first title, at its right end, over neither title nor summary, at ${viewport.width} px`, async () => {
      const { page, context } = await home(viewport);
      const first = await sectionOf(page, "simple");
      const [toggle, title, summary, section] = await Promise.all([
        boxOf(providerToggle(page)),
        boxOf(first.getByRole("heading", { level: 2 })),
        boxOf(first.locator("[data-heading-row] p")),
        boxOf(first),
      ]);
      expect(Math.round(toggle.height)).toBe(34); // `--spacing-toggle-height`, 2.125rem
      expect(Math.round(toggle.y)).toBe(Math.round(title.y));
      expect(Math.round(toggle.x + toggle.width)).toBe(Math.round(section.x + section.width));
      expect(meet(toggle, title) || meet(toggle, summary)).toBe(false);
      expect(await stuckBox(page)).toBe(TRANSPARENT);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        viewport.width,
      );
      await context.close();
    }, 30_000);

    it(`stays under the header, on the right, down to the last section, at ${viewport.width} px`, async () => {
      const { page, context } = await home(viewport);
      const header = await boxOf(page.locator("header"));
      const last = EXAMPLE_SECTIONS.at(-1)?.name ?? "";
      for (const name of ["markers", "route", last]) {
        await scrollTo(page, name);
        const toggle = await boxOf(providerToggle(page));
        expect(toggle.y).toBeGreaterThanOrEqual(header.y + header.height);
        expect(toggle.y).toBeLessThan(header.height + 16);
        const section = await boxOf(page.locator(`section#${name}`));
        expect(Math.round(toggle.x + toggle.width)).toBe(Math.round(section.x + section.width));
        // On a white box once stuck, square, reaching past the content's edge, the toggle where it was.
        await expect.poll(() => stuckBox(page)).toBe(WHITE);
        expect(
          await providerToggle(page)
            .locator("..")
            .evaluate((box) => getComputedStyle(box).borderRadius),
        ).toBe("0px");
        const box = await boxOf(providerToggle(page).locator(".."));
        expect(box.x + box.width).toBeGreaterThan(section.x + section.width);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      }
      // A map's top scrolled up under the header: the toggle is drawn over it.
      await page
        .locator("section#markers .map-frame")
        .evaluate((frame) => scrollBy(0, frame.getBoundingClientRect().top - 40));
      const under = await providerToggle(page)
        .locator("..")
        .evaluate((box) => {
          const { left, top, width, height } = box.getBoundingClientRect();
          (box as HTMLElement).style.visibility = "hidden";
          const below = document.elementFromPoint(left + width / 2, top + height / 2);
          (box as HTMLElement).style.visibility = "";
          return Boolean(below?.closest(".map-frame"));
        });
      expect(under).toBe(true);
      expect(await drawnOnTop(providerToggle(page))).toBe(true);
      await context.close();
    }, 30_000);
  }

  it("sits on its white box once stuck in a browser without scroll-state queries too", async () => {
    const { page, context } = await site.visitor({ viewport: DESKTOP });
    // As Safari and Firefox: no scroll-state queries, so only the site's own marking can tell.
    await page.addInitScript(() => {
      const supports = CSS.supports.bind(CSS);
      CSS.supports = ((property: string, value?: string) =>
        property === "container-type" && value === "scroll-state"
          ? false
          : supports(property, value as string)) as typeof CSS.supports;
    });
    await page.goto(site.url);
    await page.addStyleTag({
      content: "[data-sticky-toggle] { container-type: normal !important }",
    });
    expect(await stuckBox(page)).toBe(TRANSPARENT);
    await scrollTo(page, "markers");
    await expect.poll(() => stuckBox(page)).toBe(WHITE);
    await context.close();
  }, 30_000);

  it("lands a section reached by its anchor clear of the toggle", async () => {
    const { page, context } = await opened(site, "/#markers", DESKTOP);
    await expect
      .poll(async () => {
        const [toggle, row] = await Promise.all([
          boxOf(providerToggle(page)),
          boxOf(page.locator("section#markers [data-heading-row]")),
        ]);
        return row.y >= toggle.y + toggle.height;
      })
      .toBe(true);
    await context.close();
  }, 30_000);

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
    const { page, context } = await home(DESKTOP);
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
});

describe("route, on Google only", () => {
  const button = (section: Locator) => section.getByRole("button", { name: "Show it on Google" });

  for (const viewport of [DESKTOP, PHONE]) {
    it(`says MapLibre has no routing, in a frame a map tall, at ${viewport.width} px`, async () => {
      const { page, context } = await opened(site, "/#route", viewport);
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
