import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { examplesMenu } from "../src/site/examples-menu.ts";
import { examplesNav } from "./home-sections.ts";
import { opened, siteBuiltBeforeTests } from "./site-session.ts";
import { DESKTOP, PHONE } from "./visitor.ts";

const site = siteBuiltBeforeTests();

/** Every link of the menu: each category, then its examples. */
const LABELS = examplesMenu().flatMap(({ label, children = [] }) => [
  label,
  ...children.map((child) => child.label),
]);
/** The narrowest screen the side column is drawn on, beside the examples: 64rem. */
const COLUMN_NARROWEST = { width: 1024, height: 800 };
/** Just below it, where the column folds into a disclosure above the examples. */
const FOLDED = { width: 1023, height: 800 };

/** Where `link` sits in the menu's view: whether it is in it, top to bottom. */
const inMenuView = (page: Page, href: string) =>
  examplesNav(page).evaluate((nav, wanted) => {
    const link = nav.querySelector(`a[href="${wanted}"]`);
    const view = nav.getBoundingClientRect();
    const box = link?.getBoundingClientRect();
    return box !== undefined && box.top >= view.top && box.bottom <= view.bottom;
  }, href);

describe("the examples pages' menu (W63)", () => {
  it("lists every category and its examples, marking the page shown, on a hub and an example's page", async () => {
    for (const [route, label] of [
      ["/examples/search/", "Search and filters"],
      ["/examples/search/tags/", "Filter by tags"],
    ]) {
      const { page, context } = await opened(site, route as string, DESKTOP);
      expect(await examplesNav(page).getByRole("link").allTextContents()).toEqual(LABELS);
      const marked = examplesNav(page).locator('[aria-current="page"]');
      expect(await marked.allTextContents(), route).toEqual([label]);
      await context.close();
    }
  }, 30_000);

  it("stands without a heading over it, a rule beside it or an indent under its categories", async () => {
    const { page, context } = await opened(site, "/examples/search/tags/", DESKTOP);
    const look = await examplesNav(page).evaluate((nav) => {
      const list = nav.querySelector("ul") as HTMLElement;
      const example = nav.querySelector("ul ul") as HTMLElement;
      return {
        // The list first: no "Examples" heading over it.
        first: nav.firstElementChild?.tagName,
        rule: getComputedStyle(list).borderLeftWidth,
        indents: [list, example].map((each) => getComputedStyle(each).paddingLeft),
      };
    });
    expect(look).toEqual({ first: "UL", rule: "0px", indents: ["0px", "0px"] });
    await context.close();
  }, 30_000);

  it.each([DESKTOP, COLUMN_NARROWEST])(
    "stays under the header as the page scrolls, scrolling within itself, at $width",
    async (viewport) => {
      const { page, context } = await opened(site, "/examples/search/tags/", viewport);
      const top = () => examplesNav(page).evaluate((nav) => nav.getBoundingClientRect().top);
      const before = await top();
      // Within the column: past its end, the column takes the list up with it, as sticky does.
      await page.mouse.wheel(0, 600);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500);
      // Stuck 1.5rem under the header, a pixel above where the page's flow first put it.
      expect(Math.abs((await top()) - before)).toBeLessThanOrEqual(1);
      const fits = await examplesNav(page).evaluate((nav) => ({
        scrolls: nav.scrollHeight > nav.clientHeight,
        bottom: nav.getBoundingClientRect().bottom,
        screen: innerHeight,
      }));
      expect(fits.scrolls).toBe(true);
      // Its end on the screen, the rest reached by scrolling the list.
      expect(fits.bottom).toBeLessThanOrEqual(fits.screen);
      await context.close();
    },
    30_000,
  );

  it("opens a Styling example's page with its link in the menu's view", async () => {
    const { page, context } = await opened(site, "/examples/styling/unstyled/", DESKTOP);
    await expect.poll(() => inMenuView(page, "/examples/styling/unstyled/")).toBe(true);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await context.close();
  }, 30_000);

  it("shows one Examples nav at each width, folded below 64rem and opened by keyboard", async () => {
    const { page, context } = await opened(site, "/examples/search/tags/", DESKTOP);
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

  it("draws the column at 64rem, and leaves an example's map its width beside its list there", async () => {
    const { page, context } = await opened(site, "/examples/search/tags/", COLUMN_NARROWEST);
    expect(await examplesNav(page).getByRole("link").allTextContents()).toEqual(LABELS);
    expect(await examplesNav(page).locator("summary").isVisible()).toBe(false);
    const frame = await page.locator("section#tags .map-frame").boundingBox();
    // The list beside the map takes 17rem of the frame (`default-styles.ts`, `frame.css`): 42rem
    // leaves the map 400px.
    expect(frame?.width).toBeGreaterThanOrEqual(672);
    await context.close();
  }, 30_000);
});
