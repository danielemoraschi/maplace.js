import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { opened, siteBuiltBeforeTests } from "./site-session.ts";
import { boxOf, DESKTOP, footerToggle, PHONE } from "./visitor.ts";

const LONG_PAGE = "/examples/data-routes/";
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

describe("the footer on a phone", () => {
  it("isn't on the screen at the top of a long page, and adds no sideways scroll", async () => {
    const { page, context } = await opened(site, LONG_PAGE, PHONE);
    expect((await footerBox(page)).y).toBeGreaterThanOrEqual(PHONE.height);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(PHONE.width);
    await context.close();
  }, 30_000);

  it("ends a long page", async () => {
    const { page, context } = await opened(site, LONG_PAGE, PHONE);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => footerBottom(page)).toBe(PHONE.height);
    await context.close();
  }, 30_000);

  it("sits at the bottom of the screen under a page shorter than it", async () => {
    const { page, context } = await opened(site, SHORT_PAGE, PHONE);
    expect(await footerBottom(page)).toBe(PHONE.height);
    await context.close();
  }, 30_000);

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

describe("the footer at the phone breakpoint", () => {
  it.each([
    { width: 767, position: "static", drawsAction: false },
    { width: 768, position: "sticky", drawsAction: true },
  ])(
    "is $position at $width px",
    async ({ width, position, drawsAction }) => {
      const { page, context } = await opened(site, LONG_PAGE, { width, height: 900 });
      const footer = page.getByRole("contentinfo");
      expect(await footer.evaluate((element) => getComputedStyle(element).position)).toBe(position);
      expect((await actionWidth(page, "· turn on")) > 1).toBe(drawsAction);
      await context.close();
    },
    30_000,
  );
});

describe("the footer on a desktop", () => {
  it("stays at the bottom of the screen as a long page scrolls", async () => {
    const { page, context } = await opened(site, LONG_PAGE, DESKTOP);
    await page.mouse.wheel(0, 2500);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(2000);
    expect(await footerBottom(page)).toBe(DESKTOP.height);
    await context.close();
  }, 30_000);

  it("sits at the bottom of the screen under a page shorter than it", async () => {
    const { page, context } = await opened(site, SHORT_PAGE, DESKTOP);
    expect(await footerBottom(page)).toBe(DESKTOP.height);
    await context.close();
  }, 30_000);

  it("shows the toggle's action", async () => {
    const { page, context } = await opened(site, LONG_PAGE, DESKTOP);
    expect(await actionWidth(page, "· turn on")).toBeGreaterThan(1);
    await footerToggle(page).click();
    await page.getByRole("button", { name: "Maps: on · turn off", exact: true }).waitFor();
    expect(await actionWidth(page, "· turn off")).toBeGreaterThan(1);
    await context.close();
  }, 30_000);
});
