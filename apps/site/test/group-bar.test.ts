import type { Locator, Page } from "playwright";
import { describe, expect, it } from "vitest";
import { EXAMPLE_GROUPS } from "../src/examples/example-sections.ts";
import { groupNav, providerToggle } from "./home-sections.ts";
import { siteOnMapLibreBeforeTests } from "./maplibre-session.ts";
import { opened } from "./site-session.ts";
import { boxOf, DESKTOP, drawnOnTop, PHONE } from "./visitor.ts";

const site = siteOnMapLibreBeforeTests();

/** Just above 48rem, where the bar is one row at its narrowest (`ExampleGroupBar.astro`). */
const ONE_ROW_NARROWEST = { width: 800, height: 900 };
/** Just above 52rem, the narrowest width the bar draws its links' counts at. */
const COUNTS_NARROWEST = { width: 840, height: 900 };
const VIEWPORTS = [DESKTOP, ONE_ROW_NARROWEST, PHONE];
/** Narrower phones than `PHONE`, down to the narrowest screen a page is laid out for. */
const NARROW_PHONES = [
  { width: 360, height: 800 },
  { width: 320, height: 640 },
];
/** Where the bar's content must fit: every width it is laid out at, the counts' narrowest too. */
const FIT_VIEWPORTS = [DESKTOP, COUNTS_NARROWEST, ONE_ROW_NARROWEST, PHONE, ...NARROW_PHONES];

/** The home page at `viewport`, scrolled to its top. */
const home = (viewport: typeof DESKTOP) => opened(site, "/", viewport);

const groupBar = (page: Page) => page.locator("[data-group-bar]");

/** Whether every element in `container` is laid out within its box, once the fonts are in. */
const contentFits = (container: Locator) =>
  container.evaluate(async (element) => {
    await document.fonts.ready;
    const { top, bottom } = element.getBoundingClientRect();
    return [...element.querySelectorAll("*")].every((child) => {
      const box = child.getBoundingClientRect();
      // Visually hidden (`sr-only`, a pixel), as the bar's live region: nothing drawn to fit.
      const drawn = box.height > 1 || box.width > 1;
      return !drawn || (box.top >= top - 0.5 && box.bottom <= bottom + 0.5);
    });
  });

/** How wide the page is laid out: no wider than the screen, or it scrolls sideways. */
const pageWidth = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth);

/** How far the nav's links run past its width: they scroll sideways if more than none. */
const linksOverflow = (nav: Locator) =>
  nav.evaluate(async (element) => {
    await document.fonts.ready;
    return element.scrollWidth - element.clientWidth;
  });

const scrollTo = (page: Page, name: string) =>
  page.locator(`section#${name}`).evaluate((section) => section.scrollIntoView());
describe("the examples' bar and its provider toggle (W38)", () => {
  it("has one provider toggle on the page, in the bar, MapLibre first and chosen", async () => {
    const { page, context } = await home(DESKTOP);
    expect(await providerToggle(page).count()).toBe(1);
    expect(await groupBar(page).locator("[data-provider-choice]").count()).toBe(1);
    expect(await providerToggle(page).locator("label").allTextContents()).toEqual([
      "MapLibre",
      "Google",
    ]);
    expect(await providerToggle(page).getByRole("radio").first().isChecked()).toBe(true);
    await context.close();
  }, 30_000);

  it("keeps the header's content within its height, on the web fonts and on the fallback", async () => {
    for (const fonts of ["web", "fallback"]) {
      const { page, context } = await site.visitor({ viewport: PHONE });
      if (fonts === "fallback") await page.route(/\.woff2$/, (route) => route.abort());
      await page.goto(site.url);
      expect(await contentFits(page.locator("header")), fonts).toBe(true);
      await context.close();
    }
  }, 30_000);

  for (const viewport of FIT_VIEWPORTS) {
    it(`fits its content in its height, every link in the nav, the page no wider than the screen, at ${viewport.width} px`, async () => {
      const { page, context } = await home(viewport);
      expect(await contentFits(groupBar(page))).toBe(true);
      const nav = groupNav(page);
      expect(await linksOverflow(nav)).toBeLessThanOrEqual(0);
      expect(await pageWidth(page)).toBeLessThanOrEqual(viewport.width);
      await context.close();
    }, 30_000);
  }

  for (const viewport of VIEWPORTS) {
    it(`is held right under the header, drawn over a map scrolled under it, at ${viewport.width} px`, async () => {
      const { page, context } = await opened(site, "/examples/data-routes/", viewport);
      const header = await boxOf(page.locator("header"));
      for (const name of ["mixed", "route"]) {
        await scrollTo(page, name);
        const bar = await boxOf(groupBar(page));
        expect(Math.round(bar.y)).toBe(Math.round(header.y + header.height));
      }
      await page
        .locator("section#mixed .map-frame")
        .evaluate((frame) => scrollBy(0, frame.getBoundingClientRect().top - 40));
      const toggle = providerToggle(page);
      const under = await toggle.evaluate((element) => {
        const { left, top, width, height } = element.getBoundingClientRect();
        const bar = element.closest<HTMLElement>("[data-group-bar]");
        if (bar === null) return false;
        bar.style.visibility = "hidden";
        const below = document.elementFromPoint(left + width / 2, top + height / 2);
        bar.style.visibility = "";
        return Boolean(below?.closest(".map-frame"));
      });
      expect(under).toBe(true);
      expect(await drawnOnTop(toggle)).toBe(true);
      await context.close();
    }, 30_000);

    it(`lands a section reached by its anchor clear of the bar, at ${viewport.width} px`, async () => {
      const { page, context } = await opened(site, "/examples/lists/#tabs", viewport);
      await expect
        .poll(async () => {
          const [bar, row] = await Promise.all([
            boxOf(groupBar(page)),
            boxOf(page.locator("section#tabs [data-heading-row]")),
          ]);
          return row.y >= bar.y + bar.height;
        })
        .toBe(true);
      await context.close();
    }, 30_000);
  }

  it("keeps the page no wider than the screen when its links scroll sideways", async () => {
    const { page, context } = await home(PHONE);
    // Larger text, as a reader's zoom gives: the links no longer fit and scroll within the nav.
    await page.addStyleTag({ content: "[data-group-bar] nav a { font-size: 2rem; }" });
    const nav = groupNav(page);
    expect(await linksOverflow(nav)).toBeGreaterThan(0);
    expect(await pageWidth(page)).toBeLessThanOrEqual(PHONE.width);
    await context.close();
  }, 30_000);

  it("names each group's link by its label and number of examples", async () => {
    const { page, context } = await home(DESKTOP);
    const links = groupNav(page).getByRole("link");
    const names = await links.evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.textContent?.replace(/\s+/g, " ").trim()),
    );
    expect(names).toEqual(
      EXAMPLE_GROUPS.map(({ label, sections }) => `${label} ${sections.length} examples`),
    );
    expect(await links.first().getAttribute("aria-current")).toBe("page");
    await context.close();
  }, 30_000);
});
