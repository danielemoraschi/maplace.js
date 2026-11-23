import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { FOOTER_PAGES } from "../src/site/footer-pages.ts";
import { opened, siteBuiltBeforeTests } from "./site-session.ts";
import { boxOf, DESKTOP, footerToggle, PHONE } from "./visitor.ts";

const LONG_PAGE = "/examples/styling/whats-on/";
const SHORT_PAGE = "/404.html";

const site = siteBuiltBeforeTests();

const footerBox = (page: Page) => boxOf(page.getByRole("contentinfo"));

/** How far down the screen the footer ends, in whole pixels. */
async function footerBottom(page: Page): Promise<number> {
  const { y, height } = await footerBox(page);
  return Math.round(y + height);
}

/** How wide the toggle draws its action, whose text is `action`. */
const actionWidth = (page: Page, action: string) =>
  footerToggle(page)
    .getByText(action)
    .evaluate((element) => element.getBoundingClientRect().width);

// In the page's flow at every width: the same on a phone and a desktop.
describe.each([
  { screen: "a phone", viewport: PHONE },
  { screen: "a desktop", viewport: DESKTOP },
])("the footer on $screen", ({ viewport }) => {
  it("isn't on the screen at the top of a long page, ends it, and adds no sideways scroll", async () => {
    const { page, context } = await opened(site, LONG_PAGE, viewport);
    expect((await footerBox(page)).y).toBeGreaterThanOrEqual(viewport.height);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(viewport.width);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => footerBottom(page)).toBe(viewport.height);
    await context.close();
  }, 30_000);

  it("sits at the bottom of the screen under a page shorter than it", async () => {
    const { page, context } = await opened(site, SHORT_PAGE, viewport);
    expect(await footerBottom(page)).toBe(viewport.height);
    await context.close();
  }, 30_000);
});

describe("the footer on a phone", () => {
  it("shows only the toggle's state, its action left in the button's name", async () => {
    const { page, context } = await opened(site, LONG_PAGE, PHONE);
    const named = (name: string) => page.getByRole("button", { name, exact: true });
    expect(await named("Maps: off · turn on").count()).toBe(1);
    expect(await actionWidth(page, "· turn on")).toBeLessThanOrEqual(1);
    await named("Maps: off · turn on").click();
    await named("Maps: on · turn off").waitFor();
    expect(await actionWidth(page, "· turn off")).toBeLessThanOrEqual(1);
    await context.close();
  }, 30_000);
});

describe("the footer's links on a narrow screen", () => {
  it.each([375, 320])(
    "holds every link on the screen at %i px, the builder's among them",
    async (width) => {
      const { page, context } = await opened(site, SHORT_PAGE, { width, height: 700 });
      for (const { label } of FOOTER_PAGES) {
        const link = page.getByRole("contentinfo").getByRole("link", { name: label, exact: true });
        const { x, width: wide } = await boxOf(link);
        expect(x, label).toBeGreaterThanOrEqual(0);
        expect(x + wide, label).toBeLessThanOrEqual(width);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      await context.close();
    },
    30_000,
  );
});

describe("the footer at the phone breakpoint", () => {
  it.each([
    { width: 767, drawsAction: false },
    { width: 768, drawsAction: true },
  ])(
    "draws the toggle's action from 48rem: at $width px, $drawsAction",
    async ({ width, drawsAction }) => {
      const { page, context } = await opened(site, LONG_PAGE, { width, height: 900 });
      expect((await actionWidth(page, "· turn on")) > 1).toBe(drawsAction);
      await context.close();
    },
    30_000,
  );
});

describe("the footer on a desktop", () => {
  it("shows the toggle's action", async () => {
    const { page, context } = await opened(site, LONG_PAGE, DESKTOP);
    expect(await actionWidth(page, "· turn on")).toBeGreaterThan(1);
    await footerToggle(page).click();
    await page.getByRole("button", { name: "Maps: on · turn off", exact: true }).waitFor();
    expect(await actionWidth(page, "· turn off")).toBeGreaterThan(1);
    await context.close();
  }, 30_000);
});
