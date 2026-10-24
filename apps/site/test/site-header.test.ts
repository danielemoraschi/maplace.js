import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { docRoute, REPO_DOCS, REPOSITORY_URL } from "../src/site/repo-docs.ts";
import { ASKED, opened, siteBuiltBeforeTests } from "./site-session.ts";
import { DESKTOP, drawnOnTop, PHONE } from "./visitor.ts";

const site = siteBuiltBeforeTests();

/** How late the web fonts come in the test of a slow connection. */
const LATE_FONTS_MS = 1500;

const header = (page: Page) => page.getByRole("banner");
const docsNav = (page: Page) => page.getByRole("navigation", { name: "Documentation" });

/** Where the nav's links show in full: up to its end fade, as wide as its end padding. */
async function navClearEnd(page: Page): Promise<number> {
  return docsNav(page).evaluate((nav) => {
    const { right } = nav.getBoundingClientRect();
    return right - Number.parseFloat(getComputedStyle(nav).paddingInlineEnd);
  });
}

/** Where the header ends, from the top of the screen. */
async function headerBottom(page: Page): Promise<number> {
  const box = await header(page).boundingBox();
  return (box?.y ?? 0) + (box?.height ?? 0);
}

describe("the site's header", () => {
  it("links the reference pages only, the repository from the footer", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    const labels = await docsNav(page).getByRole("link").allTextContents();
    expect(labels).toEqual(REPO_DOCS.map(({ label }) => label));
    const toRepo = `a[href="${REPOSITORY_URL}"]`;
    expect(await header(page).locator(toRepo).count()).toBe(0);
    expect(await page.getByRole("contentinfo").locator(toRepo).count()).toBe(1);
    await context.close();
  }, 30_000);

  it("stays at the top as the page scrolls, drawn above what scrolls under it", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    await page.mouse.wheel(0, 2500);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(2000);
    expect((await header(page).boundingBox())?.y).toBe(0);
    expect(await drawnOnTop(header(page))).toBe(true);
    await context.close();
  }, 30_000);

  it("keeps to one line on a phone, its links reached by scrolling the nav", async () => {
    const { page, context } = await opened(site, "/", PHONE);
    const links = docsNav(page).getByRole("link");
    const tops = await links.evaluateAll((all) =>
      all.map((link) => link.getBoundingClientRect().top),
    );
    expect(new Set(tops).size).toBe(1);
    await links.last().scrollIntoViewIfNeeded();
    const [nav, last] = [await docsNav(page).boundingBox(), await links.last().boundingBox()];
    expect(last && nav && last.x + last.width <= nav.x + nav.width + 1).toBe(true);
    await context.close();
  }, 30_000);

  it("brings a link tabbed to on a phone clear of the nav's end fade", async () => {
    const { page, context } = await opened(site, "/", PHONE);
    const clearEnd = await navClearEnd(page);
    for (const link of await docsNav(page).getByRole("link").all()) {
      await link.focus();
      const box = await link.boundingBox();
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(clearEnd + 1);
    }
    await context.close();
  }, 30_000);

  it("shows the current page's own link on a phone", async () => {
    const { page, context } = await opened(site, docRoute("migrating"), PHONE);
    // The page's script scrolls the nav to the link once it runs: on a busy machine, after load.
    await expect.poll(() => currentLinkInView(page), ASKED).toBe(true);
    await context.close();
  }, 30_000);

  it("shows the current page's own link on a phone when its fonts come late", async () => {
    const visit = await site.visitor({ viewport: PHONE });
    // The web fonts widen the links once they load: the nav scrolled before then would leave the
    // last link under its end fade.
    await visit.context.route(/\.woff2?$/, async (route) => {
      await new Promise((loaded) => setTimeout(loaded, LATE_FONTS_MS));
      await route.continue();
    });
    await visit.page.goto(new URL(docRoute("migrating"), site.url).href);
    await visit.page.evaluate(() => document.fonts.ready);
    await expect.poll(() => currentLinkInView(visit.page), ASKED).toBe(true);
    await visit.context.close();
  }, 30_000);

  it("lands an anchor's target below it", async () => {
    for (const viewport of [DESKTOP, PHONE]) {
      const { page, context } = await opened(site, "/#markers", viewport);
      const heading = await page.locator("#markers-title").boundingBox();
      expect(heading?.y).toBeGreaterThanOrEqual(await headerBottom(page));
      await context.close();
    }
  }, 30_000);

  it("leaves a reference page's contents clear of it as the page scrolls", async () => {
    const { page, context } = await opened(site, docRoute("element"), { width: 1024, height: 800 });
    await page.mouse.wheel(0, 1500);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(1000);
    const first = await page
      .getByRole("navigation", { name: "On this page" })
      .getByRole("link")
      .first()
      .boundingBox();
    expect(first?.y).toBeGreaterThanOrEqual(await headerBottom(page));
    await context.close();
  }, 30_000);
});

/** Whether the docs nav shows the current page's link whole, clear of its end's fade. */
async function currentLinkInView(page: Page): Promise<boolean> {
  const nav = await docsNav(page).boundingBox();
  const current = await docsNav(page).locator('[aria-current="page"]').boundingBox();
  if (nav === null || current === null) return false;
  return current.x >= nav.x - 1 && current.x + current.width <= (await navClearEnd(page)) + 1;
}
