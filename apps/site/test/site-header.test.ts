import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { EXAMPLES_PAGE_ROUTE } from "../src/examples/example-sections.ts";
import { EXAMPLES_HEADING } from "../src/examples/examples-page.ts";
import { docRoute, REPOSITORY_URL } from "../src/site/repo-docs.ts";
import { opened, siteBuiltBeforeTests } from "./site-session.ts";
import { boxOf, DESKTOP, drawnOnTop, PHONE } from "./visitor.ts";

const site = siteBuiltBeforeTests();

/** Time for the page's script to act once the fonts are in. */
const SCRIPT_RAN_MS = 300;

const header = (page: Page) => page.getByRole("banner");
const siteNav = (page: Page) => page.getByRole("navigation", { name: "Site" });

/** Where the header ends, from the top of the screen. */
async function headerBottom(page: Page): Promise<number> {
  const box = await header(page).boundingBox();
  return (box?.y ?? 0) + (box?.height ?? 0);
}

describe("the site's header", () => {
  it("links Documentation and Examples (Docs on a phone), and the repository from 48rem, the footer's on every screen", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    const labels = await siteNav(page).getByRole("link").allInnerTexts();
    expect(labels).toEqual(["Documentation", "Examples", "GitHub"]);
    const repository = siteNav(page).getByRole("link", { name: "GitHub" });
    expect(await repository.getAttribute("href")).toBe(REPOSITORY_URL);
    expect(await repository.isVisible()).toBe(true);
    await page.setViewportSize(PHONE);
    expect(await repository.isVisible()).toBe(false);
    // biome-ignore lint/performance/useDomNodeTextContent: the label as shown, the hidden one left out.
    expect(await siteNav(page).getByRole("link").first().innerText()).toBe("Docs");
    const toRepo = `a[href="${REPOSITORY_URL}"]`;
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
    expect(iconBox?.width).toBe(22);
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

  it("takes Examples to the examples page, its heading in view and the link marked there", async () => {
    for (const viewport of [DESKTOP, PHONE]) {
      const { page, context } = await opened(site, docRoute("setup"), viewport);
      await siteNav(page).getByRole("link", { name: "Examples" }).click();
      await page.waitForURL(new URL(EXAMPLES_PAGE_ROUTE, site.url).href);
      const heading = page.getByRole("heading", { level: 1, name: EXAMPLES_HEADING });
      expect(await heading.isVisible()).toBe(true);
      expect((await boxOf(heading)).y).toBeGreaterThanOrEqual(await headerBottom(page));
      const examples = siteNav(page).getByRole("link", { name: "Examples" });
      expect(await examples.getAttribute("aria-current")).toBe("true");
      await context.close();
    }
  }, 60_000);

  it("marks Documentation on a doc page, Examples on a hub and an example's page, and nothing elsewhere", async () => {
    const shown = async (route: string) => {
      const { page, context } = await opened(site, route, DESKTOP);
      const marked = await siteNav(page)
        .locator("[aria-current]")
        .evaluateAll((links) =>
          links.map((link) => [
            // biome-ignore lint/performance/useDomNodeTextContent: the label as shown, the hidden one left out.
            (link as HTMLElement).innerText.trim(),
            link.getAttribute("aria-current"),
          ]),
        );
      await context.close();
      return marked;
    };
    expect(await shown(docRoute("store"))).toEqual([["Documentation", "true"]]);
    expect(await shown(docRoute("getting-started"))).toEqual([["Documentation", "true"]]);
    expect(await shown("/examples/markers/")).toEqual([["Examples", "true"]]);
    expect(await shown("/examples/markers/popups/")).toEqual([["Examples", "true"]]);
    expect(await shown("/")).toEqual([]);
  }, 60_000);

  it("leaves the page where an anchor put it", async () => {
    for (const viewport of [DESKTOP, PHONE]) {
      for (const route of [
        "/#examples",
        "/examples/markers/#reference",
        `${docRoute("element")}#url-state`,
      ]) {
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

  it("fits every link whole beside the name, with nothing to scroll, at 320 and 375, and scrolls the nav alone narrower", async () => {
    const { page, context } = await opened(site, "/", { width: 320, height: 700 });
    await page.evaluate(() => document.fonts.ready);
    const fit = () =>
      siteNav(page).evaluate((nav) => {
        const tops = [...nav.querySelectorAll("a")]
          .map((link) => link.getBoundingClientRect())
          .filter(({ width }) => width > 0)
          .map(({ top }) => top);
        return {
          navScrolls: nav.scrollWidth > nav.clientWidth,
          pageScrolls: document.documentElement.scrollWidth > innerWidth,
          rows: new Set(tops).size,
        };
      });
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 700 });
      expect(await fit(), `${width}`).toEqual({ navScrolls: false, pageScrolls: false, rows: 1 });
    }
    await page.setViewportSize({ width: 256, height: 700 });
    const narrow = await fit();
    expect({ navScrolls: narrow.navScrolls, pageScrolls: narrow.pageScrolls }, "256").toEqual({
      navScrolls: true,
      pageScrolls: false,
    });
    await context.close();
  }, 30_000);

  it("keeps its content within its height on a phone, on the web fonts and on the fallback", async () => {
    for (const fonts of ["web", "fallback"]) {
      const { page, context } = await site.visitor({ viewport: PHONE });
      if (fonts === "fallback") await page.route(/\.woff2$/, (route) => route.abort());
      await page.goto(site.url);
      const fits = await header(page).evaluate(async (element) => {
        await document.fonts.ready;
        const { top, bottom } = element.getBoundingClientRect();
        return [...element.querySelectorAll("*")].every((child) => {
          const box = child.getBoundingClientRect();
          const drawn = box.height > 1 || box.width > 1;
          return !drawn || (box.top >= top - 0.5 && box.bottom <= bottom + 0.5);
        });
      });
      expect(fits, fonts).toBe(true);
      await context.close();
    }
  }, 30_000);

  it("stays at the top as the page scrolls, drawn above what scrolls under it", async () => {
    const { page, context } = await opened(site, "/examples/styling/whats-on/", DESKTOP);
    await page.mouse.wheel(0, 2500);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(2000);
    expect((await header(page).boundingBox())?.y).toBe(0);
    expect(await drawnOnTop(header(page))).toBe(true);
    await context.close();
  }, 30_000);

  it("lands an anchor's target below it", async () => {
    for (const viewport of [DESKTOP, PHONE]) {
      const { page, context } = await opened(site, "/examples/markers/#reference", viewport);
      const heading = await page.locator("#reference-title").boundingBox();
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
