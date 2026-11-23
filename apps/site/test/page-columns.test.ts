import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { CHANGELOG_PAGE } from "../src/site/footer-pages.ts";
import { docRoute, REPO_DOCS } from "../src/site/repo-docs.ts";
import { opened, siteBuiltBeforeTests } from "./site-session.ts";
import { DESKTOP, PHONE } from "./visitor.ts";

const site = siteBuiltBeforeTests();

const FIRST_DOC = docRoute(REPO_DOCS[0]?.id ?? "");

/** A screen wider than the site's measure, where a capped column would stop short of it. */
const WIDE = { width: 1440, height: 900 };

/** How far short of the site's measure, the main column's content box, the article stops. */
const shortOfMeasure = (page: Page) =>
  page.evaluate(() => {
    const main = document.querySelector("main") as HTMLElement;
    const article = document.querySelector("article") as HTMLElement;
    const measureEnd =
      main.getBoundingClientRect().right - Number.parseFloat(getComputedStyle(main).paddingRight);
    return Math.round(measureEnd - article.getBoundingClientRect().right);
  });

describe("a doc's page and the changelog, beside their column (W82)", () => {
  it.each([FIRST_DOC, CHANGELOG_PAGE.route])(
    "run %s's text to the site's width on a wide screen",
    async (route) => {
      const { page, context } = await opened(site, route, WIDE);
      expect(await shortOfMeasure(page)).toBe(0);
      await context.close();
    },
    30_000,
  );

  it("lists every version of the changelog beside it, each to its heading, pinned as the page scrolls", async () => {
    const { page, context } = await opened(site, CHANGELOG_PAGE.route, DESKTOP);
    const versions = page.getByRole("navigation", { name: "Versions" });
    const headings = page.locator("article h2");
    const links = versions.getByRole("link");
    expect(await links.allTextContents()).toEqual(await headings.allTextContents());
    const ids = await headings.evaluateAll((all) => all.map(({ id }) => `#${id}`));
    expect(await links.evaluateAll((all) => all.map((link) => link.getAttribute("href")))).toEqual(
      ids,
    );
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => links.last().isVisible()).toBe(true);
    expect(await links.last().evaluate((link) => link.getBoundingClientRect().top)).toBeGreaterThan(
      0,
    );
    await context.close();
  }, 30_000);

  it("pins a doc's whole column, its pages and its headings, as the page scrolls", async () => {
    const { page, context } = await opened(site, FIRST_DOC, DESKTOP);
    const pages = page.getByRole("navigation", { name: "Documentation" });
    const headings = page.getByRole("navigation", { name: "On this page" });
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    const top = (nav: typeof pages) => nav.evaluate((node) => node.getBoundingClientRect().top);
    await expect.poll(() => top(pages)).toBeGreaterThan(0);
    expect(await top(headings)).toBeGreaterThan(await top(pages));
    await context.close();
  }, 30_000);

  it("folds the changelog's versions away on a phone, its text the screen's width", async () => {
    const { page, context } = await opened(site, CHANGELOG_PAGE.route, PHONE);
    expect(await page.getByRole("navigation", { name: "Versions" }).isVisible()).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      PHONE.width,
    );
    await context.close();
  }, 30_000);
});
