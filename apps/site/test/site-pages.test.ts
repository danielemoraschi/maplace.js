import { readFileSync } from "node:fs";
import { setTimeout as pause } from "node:timers/promises";
import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { packageManifest, readRootFile } from "../../../scripts/build/package.ts";
import {
  CHANGELOG_FILE,
  isListLine,
  isVersionHeading,
  listLines,
  untilNextHeading,
} from "../../../scripts/docs/changelog-lines.ts";
import { repositoryPageFor } from "../../../scripts/release/repository.ts";
import { EXAMPLE_GROUPS, groupPath } from "../src/examples/example-sections.ts";
import {
  AGENTS_PAGE,
  CHANGELOG_PAGE,
  FOOTER_PAGES,
  PRIVACY_PAGE,
} from "../src/site/footer-pages.ts";
import { docRoute, REPO_DOCS } from "../src/site/repo-docs.ts";
import { SITE_ROUTES } from "../src/site/site-routes.ts";
import { MAP_PROVIDERS, MAP_PROVIDERS_SECTION } from "../src/site/third-parties.ts";
import { gluedText } from "./glued-text.ts";
import { sectionPage } from "./home-sections.ts";
import { SETTLE_MS, siteBuiltBeforeTests } from "./site-session.ts";
import { grantConsent, loadMapsButtons, placeholder, type Visitor } from "./visitor.ts";

/** The examples' pages, the home page first (W38). */
const EXAMPLE_PAGES = EXAMPLE_GROUPS.map(groupPath);

/** What Cloudflare serves, with a 404, at an address the site has no page for (`wrangler.jsonc`). */
const NOT_FOUND_PAGE = "/404.html";

/** The site's pages that show no map. */
const PAGES_WITHOUT_MAPS = [
  PRIVACY_PAGE.route,
  AGENTS_PAGE.route,
  NOT_FOUND_PAGE,
  CHANGELOG_PAGE.route,
  ...REPO_DOCS.map(({ id }) => docRoute(id)),
];

const site = siteBuiltBeforeTests();

/** A fresh visitor on the site's page at `route`. */
async function openPage(route: string): Promise<Visitor> {
  const visit = await site.visitor();
  await visit.page.goto(new URL(route, site.url).href);
  return visit;
}

const article = (page: Page) => page.locator("article");

/** The footer's links: each one's text, where it goes and whether it is the page shown. */
const footerLinks = (page: Page) =>
  page
    .getByRole("contentinfo")
    .locator("a")
    .evaluateAll((links) =>
      links.map((link) => ({
        label: link.textContent,
        href: link.getAttribute("href"),
        current: link.getAttribute("aria-current"),
      })),
    );

describe("the site's icon", () => {
  it("is the repo's favicon at a URL that changes with it, so no browser keeps an old one", async () => {
    const { page, context } = await openPage("/");
    const href = (await page.locator('link[rel="icon"]').getAttribute("href")) ?? "";
    expect(href).toMatch(/^\/_astro\/favicon\.[\w-]+\.svg$/);
    const served = await page.evaluate(async (url) => (await fetch(url)).text(), href);
    expect(served).toBe(
      readFileSync(new URL("../src/assets/favicon.svg", import.meta.url), "utf8"),
    );
    await context.close();
  }, 30_000);
});

describe("an example's guide", () => {
  it("shows under its example: the custom list's, linking the list views reference", async () => {
    const { page, context } = await openPage(sectionPage("custom-list"));
    const guide = page.locator("section#custom-list .example-guide");
    expect(await guide.textContent()).toContain("defineListView");
    const link = guide.getByRole("link", { name: "defineListView(name, factory)" });
    expect(await link.getAttribute("href")).toBe("/element/#list-views");
    await context.close();
  }, 30_000);
});

describe("the changelog page", () => {
  const changelog = readRootFile(CHANGELOG_FILE);

  it("shows every line of CHANGELOG.md under its version, dated", async () => {
    const { page, context } = await openPage(CHANGELOG_PAGE.route);
    const lines = changelog.split("\n");
    const unreleased = untilNextHeading(lines).some(isListLine) ? ["Unreleased"] : [];
    const versions = lines.filter(isVersionHeading).map((line) => line.slice(3));
    expect(await article(page).locator("time[datetime]").count()).toBe(listLines(changelog).length);
    expect(await article(page).locator("h2").allTextContents()).toEqual([
      ...unreleased,
      ...versions,
    ]);
    await context.close();
  }, 30_000);

  it("links its issues to GitHub and its repo links to the site or the repo", async () => {
    const { page, context } = await openPage(CHANGELOG_PAGE.route);
    const issue = `${repositoryPageFor(packageManifest())}/issues/147`;
    expect(await article(page).locator(`a[href="${issue}"]`).count()).toBe(1);
    const hrefs = await article(page)
      .locator("a")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
    expect(hrefs.filter((href) => !/^(?:https:|\/|#)/.test(href))).toEqual([]);
    await context.close();
  }, 30_000);
});

describe("the not-found page", () => {
  it("says the address leads nowhere and links to the examples", async () => {
    const { page, context } = await openPage(NOT_FOUND_PAGE);
    expect(await page.getByRole("heading", { level: 1 }).textContent()).toBe("Page not found");
    expect(
      await article(page).getByRole("link", { name: "the examples" }).getAttribute("href"),
    ).toBe("/");
    await context.close();
  }, 30_000);
});

describe("the footer", () => {
  it("links the footer's pages from every page, marking the one shown", async () => {
    for (const route of SITE_ROUTES) {
      const { page, context } = await openPage(route);
      const expected = FOOTER_PAGES.map(({ route: href, label }) => ({
        label,
        href,
        current: href === route ? "page" : null,
      }));
      expect(await footerLinks(page), route).toEqual(expect.arrayContaining(expected));
      await context.close();
    }
  }, 60_000);

  it("reaches each page it links", async () => {
    for (const { route, label } of FOOTER_PAGES) {
      const { page, context } = await openPage("/");
      await page.getByRole("contentinfo").getByRole("link", { name: label, exact: true }).click();
      await page.waitForURL(new URL(route, site.url).href);
      expect(await page.locator("h1").textContent()).toBe(label);
      await context.close();
    }
  }, 30_000);
});

describe("the site's copy", () => {
  it("keeps a space between text and the link or code after it, on every page", async () => {
    for (const route of [...EXAMPLE_PAGES, ...PAGES_WITHOUT_MAPS]) {
      const { page, context } = await openPage(route);
      expect({ route, glued: await gluedText(page) }).toEqual({ route, glued: [] });
      await context.close();
    }
  }, 60_000);
});

describe("the consent placeholder", () => {
  it("links each map's placeholder to the privacy page's section on the maps, naming every provider", async () => {
    const { page, context } = await openPage("/");
    const placeholders = await loadMapsButtons(page).count();
    const href = `${PRIVACY_PAGE.route}#${MAP_PROVIDERS_SECTION}`;
    expect(placeholders).toBeGreaterThan(0);
    // Route's placeholder is hidden while route shows its note, on MapLibre: count the ones shown.
    expect(await page.locator(`a[href="${href}"]`).filter({ visible: true }).count()).toBe(
      placeholders,
    );
    const copy = await placeholder(page).locator("..").textContent();
    for (const { name } of MAP_PROVIDERS) expect(copy).toContain(name);
    expect(copy).toMatch(/whole site\. What loading/);
    await context.close();
  }, 30_000);
});

describe("what the site sends where", () => {
  /**
   * Opens every page without maps at once in `visit`'s context, as long as a map would take: each
   * page's `<html data-maps>`, `on` once the visitor has consented.
   */
  async function visitPagesWithoutMaps({ context }: Visitor): Promise<(string | null)[]> {
    const pages = await Promise.all(
      PAGES_WITHOUT_MAPS.map(async (route) => {
        const page = await context.newPage();
        await page.goto(new URL(route, site.url).href);
        return page;
      }),
    );
    await pause(SETTLE_MS);
    const maps = await Promise.all(
      pages.map((page) => page.locator("html").getAttribute("data-maps")),
    );
    await Promise.all(pages.map((page) => page.close()));
    return maps;
  }

  /** The same `<html data-maps>` on every page without maps. */
  const onEveryPage = (setting: string) => PAGES_WITHOUT_MAPS.map(() => setting);

  it("a page without maps asks nothing off the site, before consent or after", async () => {
    const visit = await site.visitor();
    expect(await visitPagesWithoutMaps(visit)).toEqual(onEveryPage("off"));
    expect(visit.offsite()).toEqual([]);
    await grantConsent(visit.page, site.url);
    await visit.page.close();
    const before = visit.offsite().length;
    expect(await visitPagesWithoutMaps(visit)).toEqual(onEveryPage("on"));
    expect(visit.offsite().slice(before)).toEqual([]);
    await visit.context.close();
  }, 60_000);
});
