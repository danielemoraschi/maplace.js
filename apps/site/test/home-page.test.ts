import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import {
  EXAMPLE_GROUPS,
  EXAMPLE_PAGE_ENTRIES,
  EXAMPLES_PAGE_ROUTE,
  groupPath,
} from "../src/examples/example-sections.ts";
import { HOME_HEADING, HOME_INTRO } from "../src/examples/home-page.ts";
import { STAR_COUNT_PATH } from "../src/site/star-count-api.ts";
import { ASKED, opened, SITE_MAP_ID, siteBuiltBeforeTests } from "./site-session.ts";
import { boxOf, DESKTOP, PHONE } from "./visitor.ts";

const site = siteBuiltBeforeTests();

describe("the home page's star button", () => {
  /** The star button's own shadow root, drawn by the page (W44). */
  const starButton = (page: Page) => page.locator("[data-star-button]");

  it("is drawn by the site, its count asked of the site itself and nothing of GitHub", async () => {
    const { page, context, fetched, offsite } = await site.visitor();
    await page.goto(site.url);
    await expect(starButton(page).locator(".btn span").textContent()).resolves.toBe("GitHub");
    // The fallback link, for a browser that can't attach the shadow root, stays out of sight.
    expect(await starButton(page).locator(":scope > a").isVisible()).toBe(false);
    await expect.poll(() => fetched(STAR_COUNT_PATH), ASKED).toBe(true);
    expect(offsite()).toEqual([]);
    await context.close();
  }, 30_000);

  it("shows the site's star count beside the button", async () => {
    const { page, context } = await site.visitor();
    await page.route(`**${STAR_COUNT_PATH}`, (route) => route.fulfill({ json: { stars: 1234 } }));
    await page.goto(site.url);
    await expect
      .poll(() => starButton(page).locator(".social-count").textContent(), ASKED)
      .toBe("1,234");
    await context.close();
  }, 30_000);
});

describe("the home page's headings and install box", () => {
  it("offers each provider's npm command and pinned script", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url, { waitUntil: "domcontentloaded" });
    expect(await page.locator("#npm-install-google").textContent()).toBe(
      "npm install @maplacejs/maplace",
    );
    expect(await page.locator("#npm-install-maplibre").textContent()).toBe(
      "npm install @maplacejs/maplace maplibre-gl",
    );
    for (const provider of ["google", "maplibre"]) {
      expect(await page.locator(`#pinned-script-${provider}`).textContent()).toContain(
        "integrity=",
      );
    }
    await context.close();
  }, 30_000);

  const npmCommand = (page: Page) => page.locator("#npm-install-google");
  const installSummary = (page: Page) => page.locator("summary").filter({ hasText: "Install" });

  it("is folded on every screen, and opens from its heading by keyboard", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    expect(await npmCommand(page).isVisible(), "desktop").toBe(false);
    await page.setViewportSize(PHONE);
    expect(await npmCommand(page).isVisible(), "phone").toBe(false);
    await installSummary(page).focus();
    await page.keyboard.press("Enter");
    expect(await npmCommand(page).isVisible()).toBe(true);
    await context.close();
  }, 30_000);

  it("ends with the version and its hash, and nothing else", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url, { waitUntil: "domcontentloaded" });
    const note = page.getByText("checked by the browser against its hash");
    expect(await note.textContent()).toMatch(
      /^Maplace\.js \S+, checked by the browser against its hash\.$/,
    );
    expect(await note.locator("a").count()).toBe(0);
    await context.close();
  }, 30_000);
});

describe("the home page's hero (W63)", () => {
  it("heads the page with the library, its words clear of the drawing beside it", async () => {
    const { page, context } = await opened(site, "/", { width: 1120, height: 800 });
    await page.evaluate(() => document.fonts.ready);
    const heading = page.locator("h1");
    // biome-ignore lint/performance/useDomNodeTextContent: Playwright's, and the text as rendered: the H1's <br>s are its spaces.
    expect((await heading.innerText()).replace(/\s+/g, " ")).toBe(`${HOME_HEADING}.`);
    expect(await page.locator("h1 + p").textContent()).toBe(HOME_INTRO);
    const drawing = await boxOf(page.locator("svg:has(+ h1)"));
    const textRight = await heading.evaluate((h1) => {
      const range = document.createRange();
      range.selectNodeContents(h1);
      return Math.max(...[...range.getClientRects()].map((rect) => rect.right));
    });
    expect(drawing.x - textRight).toBeGreaterThan(0);
    await context.close();
  }, 30_000);
});

describe("the index of examples, on the home page and the examples page (W63, W72)", () => {
  // The home page's sits under its h2 "Examples", the examples page's right under its H1.
  const INDEXES = [
    { route: "/", within: "section#examples", indexHeading: "h2", categoryHeading: "h3" },
    { route: EXAMPLES_PAGE_ROUTE, within: "main", indexHeading: "h1", categoryHeading: "h2" },
  ];

  it.each(INDEXES)(
    "heads the index on $route, then lists every category, a level under, linking its hub, then each of its examples linking its page with its thumbnail, credits the map images once, and draws no map",
    async ({ route, within, indexHeading, categoryHeading }) => {
      const { page, context } = await opened(site, route, DESKTOP);
      const index = page.locator(within);
      const levels = await index
        .locator(":is(h1, h2, h3)")
        .evaluateAll((headings) => headings.map(({ tagName }) => tagName.toLowerCase()));
      expect(levels).toEqual([indexHeading, ...EXAMPLE_GROUPS.map(() => categoryHeading)]);
      const pages = await index
        .locator(`${categoryHeading} a`)
        .evaluateAll((links) => links.map((link) => [link.textContent, link.getAttribute("href")]));
      expect(pages).toEqual(EXAMPLE_GROUPS.map((group) => [group.label, groupPath(group)]));
      const examples = await index
        .locator("li a")
        .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
      expect(examples).toEqual(EXAMPLE_PAGE_ENTRIES.map(({ path }) => path));
      expect(await index.locator('li a img[alt=""]').count()).toBe(EXAMPLE_PAGE_ENTRIES.length);
      expect(await index.getByText("Map images:").count()).toBe(1);
      expect(await page.locator("maplace-map, section.example").count()).toBe(0);
      await context.close();
    },
    30_000,
  );
});

describe("the site's map ID", () => {
  it("is in the scripts the vanilla and React versions run on", async () => {
    const scripts = await readdir(join(site.dir, "_astro"));
    const texts = await Promise.all(
      scripts
        .filter((file) => file.endsWith(".js"))
        .map((file) => readFile(join(site.dir, "_astro", file), "utf8")),
    );
    expect(texts.some((text) => text.includes(SITE_MAP_ID))).toBe(true);
  });
});
