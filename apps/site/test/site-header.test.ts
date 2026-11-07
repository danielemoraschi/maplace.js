import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { docRoute, REPOSITORY_URL } from "../src/site/repo-docs.ts";
import { ASKED, opened, siteBuiltBeforeTests } from "./site-session.ts";
import { DESKTOP, drawnOnTop, PHONE } from "./visitor.ts";

const site = siteBuiltBeforeTests();

/** Time for the page's script to act once the fonts are in. */
const SCRIPT_RAN_MS = 300;

const header = (page: Page) => page.getByRole("banner");
const siteNav = (page: Page) => page.getByRole("navigation", { name: "Site" });

/** Where the nav's links show in full: up to its end fade, as wide as its end padding. */
async function navClearEnd(page: Page): Promise<number> {
  return siteNav(page).evaluate((nav) => {
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
  it("links Documentation and Examples, the repository from the footer", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    const labels = await siteNav(page).getByRole("link").allTextContents();
    expect(labels).toEqual(["Documentation", "Examples"]);
    const toRepo = `a[href="${REPOSITORY_URL}"]`;
    expect(await header(page).locator(toRepo).count()).toBe(0);
    expect(await page.getByRole("contentinfo").locator(toRepo).count()).toBe(1);
    await context.close();
  }, 30_000);

  it("shows the favicon before the name, its text in line with the nav's links", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    const name = header(page).getByRole("link", { name: "Maplace.js" });
    const icon = name.locator("img");
    expect(await icon.getAttribute("alt")).toBe("");
    expect(await icon.getAttribute("src")).toMatch(/favicon\.[\w-]+\.svg$/);
    const [iconBox, nameBox] = [await icon.boundingBox(), await name.boundingBox()];
    expect(iconBox?.width).toBe(24);
    expect(iconBox?.x).toBe(nameBox?.x);
    const baselineOf = (element: Element) => {
      const marker = document.createElement("span");
      marker.style.cssText = "display:inline-block;width:0;height:0";
      element.append(marker);
      const { bottom } = marker.getBoundingClientRect();
      marker.remove();
      return bottom;
    };
    const baselines = [
      await name.evaluate(baselineOf),
      await siteNav(page).getByRole("link").first().evaluate(baselineOf),
    ];
    expect(Math.abs((baselines[0] as number) - (baselines[1] as number))).toBeLessThanOrEqual(1);
    await context.close();
  }, 30_000);

  it("takes Examples to the group bar, held right under it", async () => {
    for (const viewport of [DESKTOP, PHONE]) {
      const { page, context } = await opened(site, docRoute("setup"), viewport);
      await siteNav(page).getByRole("link", { name: "Examples" }).click();
      await page.waitForURL("**/#examples");
      const bar = page.locator("[data-group-bar]");
      await expect
        .poll(async () => {
          const box = await bar.boundingBox();
          return Math.abs((box?.y ?? 0) - (await headerBottom(page)));
        }, ASKED)
        .toBeLessThanOrEqual(8);
      await context.close();
    }
  }, 60_000);

  it("marks Documentation on a doc page, and nothing elsewhere", async () => {
    const shown = async (route: string) => {
      const { page, context } = await opened(site, route, DESKTOP);
      const marked = await siteNav(page)
        .locator("[aria-current]")
        .evaluateAll((links) =>
          links.map((link) => [link.textContent?.trim(), link.getAttribute("aria-current")]),
        );
      await context.close();
      return marked;
    };
    expect(await shown(docRoute("store"))).toEqual([["Documentation", "true"]]);
    expect(await shown(docRoute("getting-started"))).toEqual([["Documentation", "true"]]);
    expect(await shown("/")).toEqual([]);
  }, 60_000);

  it("leaves the page where an anchor put it", async () => {
    for (const viewport of [DESKTOP, PHONE]) {
      for (const route of ["/#examples", "/#markers", `${docRoute("element")}#url-state`]) {
        const { page, context } = await opened(site, route, viewport);
        const before = await page.evaluate(() => scrollY);
        expect(before, route).toBeGreaterThan(0);
        await page.evaluate(() => document.fonts.ready);
        // Time for anything on the page's script to move it.
        await page.waitForTimeout(SCRIPT_RAN_MS);
        expect(await page.evaluate(() => scrollY), route).toBe(before);
        await context.close();
      }
    }
  }, 120_000);

  it("opens a phone's home page with its first link whole", async () => {
    const { page, context } = await opened(site, "/", PHONE);
    await page.evaluate(() => document.fonts.ready);
    const [nav, first] = [
      await siteNav(page).boundingBox(),
      await siteNav(page).getByRole("link").first().boundingBox(),
    ];
    expect((first?.x ?? 0) + 1).toBeGreaterThanOrEqual(nav?.x ?? 0);
    expect((first?.x ?? 0) + (first?.width ?? 0)).toBeLessThanOrEqual(
      (await navClearEnd(page)) + 1,
    );
    await context.close();
  }, 30_000);

  it("fits the nav beside the name at the first width with no fade", async () => {
    const { page, context } = await opened(site, "/", { width: 448, height: 800 });
    await page.evaluate(() => document.fonts.ready);
    const nav = await siteNav(page).evaluate((element) => ({
      scroll: element.scrollWidth,
      client: element.clientWidth,
      paddingInlineEnd: getComputedStyle(element).paddingInlineEnd,
    }));
    expect(nav.paddingInlineEnd).toBe("0px");
    expect(nav.scroll).toBeLessThanOrEqual(nav.client);
    await context.close();
  }, 30_000);

  it("runs the last link to the wrap's edge, with no fade, at 1024", async () => {
    const { page, context } = await opened(site, "/", { width: 1024, height: 800 });
    const nav = await siteNav(page).evaluate((element) => {
      const { paddingInlineEnd, maskImage } = getComputedStyle(element);
      return { paddingInlineEnd, maskImage };
    });
    expect(nav).toEqual({ paddingInlineEnd: "0px", maskImage: "none" });
    await context.close();
  }, 30_000);

  it("stays at the top as the page scrolls, drawn above what scrolls under it", async () => {
    const { page, context } = await opened(site, "/examples/data-routes/", DESKTOP);
    await page.mouse.wheel(0, 2500);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(2000);
    expect((await header(page).boundingBox())?.y).toBe(0);
    expect(await drawnOnTop(header(page))).toBe(true);
    await context.close();
  }, 30_000);

  it("keeps to one line on a phone, its links reached by scrolling the nav", async () => {
    const { page, context } = await opened(site, "/", PHONE);
    const links = siteNav(page).getByRole("link");
    const tops = await links.evaluateAll((all) =>
      all.map((link) => link.getBoundingClientRect().top),
    );
    expect(new Set(tops).size).toBe(1);
    await links.last().scrollIntoViewIfNeeded();
    const [nav, last] = [await siteNav(page).boundingBox(), await links.last().boundingBox()];
    expect(last && nav && last.x + last.width <= nav.x + nav.width + 1).toBe(true);
    await context.close();
  }, 30_000);

  it("brings a link tabbed to on a phone clear of the nav's end fade", async () => {
    const { page, context } = await opened(site, "/", PHONE);
    const clearEnd = await navClearEnd(page);
    for (const link of await siteNav(page).getByRole("link").all()) {
      await link.focus();
      const box = await link.boundingBox();
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(clearEnd + 1);
    }
    await context.close();
  }, 30_000);

  it("brings a link tabbed back to on a phone clear of the nav's start", async () => {
    const { page, context } = await opened(site, "/", PHONE);
    const links = await siteNav(page).getByRole("link").all();
    await links.at(-1)?.focus();
    for (const link of [...links].reverse()) {
      await link.focus();
      const [nav, box] = [await siteNav(page).boundingBox(), await link.boundingBox()];
      expect((box?.x ?? 0) + 1).toBeGreaterThanOrEqual(nav?.x ?? 0);
    }
    await context.close();
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
