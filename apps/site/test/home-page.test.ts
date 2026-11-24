import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Locator, Page } from "playwright";
import { describe, expect, it } from "vitest";
import {
  EXAMPLE_GROUPS,
  EXAMPLE_PAGE_ENTRIES,
  EXAMPLES_PAGE_ROUTE,
  groupPath,
} from "../src/examples/example-sections.ts";
import { WAYS_IN_GOOGLE_LOADER } from "../src/examples/home-page.ts";
import { docRoute } from "../src/site/repo-docs.ts";
import { HERO_LIGHT, WATER } from "./hero-ground.ts";
import { chooseProvider } from "./home-sections.ts";
import { opened, SITE_MAP_ID, siteBuiltBeforeTests } from "./site-session.ts";
import { boxOf, DESKTOP, PHONE } from "./visitor.ts";

/** The band's ground, as a computed colour. */
const NIGHT = "rgb(18, 26, 34)";

const site = siteBuiltBeforeTests();

describe("the home page's night band (W66)", () => {
  /** The ground `node` sits on: its first own or ancestor's background, as the page draws it. */
  const groundOf = (node: Locator) =>
    node.evaluate((start) => {
      let ground: Element | null = start;
      while (ground && getComputedStyle(ground).backgroundColor === "rgba(0, 0, 0, 0)")
        ground = ground.parentElement;
      return ground && getComputedStyle(ground).backgroundColor;
    });
  /** A category row's ground and text, as the page draws them. */
  const rowColours = async (page: Page) => {
    const row = page.getByRole("link", { name: "Markers and popups" }).first();
    return [await groundOf(row), await row.evaluate((link) => getComputedStyle(link).color)];
  };

  it("draws the index on the night ground on the home page and the examples page, under its title on map water there", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    expect(await rowColours(page)).toEqual([NIGHT, "rgb(230, 236, 240)"]);
    await page.goto(new URL(EXAMPLES_PAGE_ROUTE, site.url).href);
    expect(await rowColours(page)).toEqual([NIGHT, "rgb(230, 236, 240)"]);
    expect(await groundOf(page.locator("h1"))).toBe(WATER);
    const hero = page.locator(".hero-water");
    expect(await hero.evaluate((ground) => getComputedStyle(ground).backgroundImage)).toBe(
      HERO_LIGHT,
    );
    await context.close();
  }, 30_000);

  it("ends every page on the night footer, a divider above it (W82)", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    const ground = () =>
      page.getByRole("contentinfo").evaluate((footer) => {
        const { backgroundColor, borderTopWidth } = getComputedStyle(footer);
        return { backgroundColor, borderTopWidth };
      });
    expect(await ground()).toEqual({ backgroundColor: NIGHT, borderTopWidth: "1px" });
    await page.goto(new URL(EXAMPLES_PAGE_ROUTE, site.url).href);
    expect(await ground()).toEqual({ backgroundColor: NIGHT, borderTopWidth: "1px" });
    await page.goto(new URL(docRoute("getting-started"), site.url).href);
    expect(await ground()).toEqual({ backgroundColor: NIGHT, borderTopWidth: "1px" });
    await context.close();
  }, 30_000);

  it("sets the providers side by side, one above the other on a phone", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    const names = page.getByRole("heading", { level: 3, name: /^(MapLibre|Google Maps)$/ });
    const sideBySide = async () => {
      const [first, second] = [await boxOf(names.first()), await boxOf(names.last())];
      return first.y === second.y && second.x > first.x;
    };
    expect(await sideBySide()).toBe(true);
    await page.setViewportSize(PHONE);
    expect(await sideBySide()).toBe(false);
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
    "heads the index on $route, then lists every category, a level under, linking its hub, then each of its examples by its title alone, unnumbered, linking its page with its thumbnail, credits the map images once, and draws no map",
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
        .evaluateAll((links) =>
          links.map((link) => [
            link.textContent?.replace(/\s+/g, " ").trim(),
            link.getAttribute("href"),
          ]),
        );
      expect(examples).toEqual(
        EXAMPLE_PAGE_ENTRIES.map(({ section, path }) => [section.title, path]),
      );
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

describe("the home page's controls (W66)", () => {
  it("tells a module's Google reader the page loads Google's loader first, and no one else", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    const note = page.getByText(WAYS_IN_GOOGLE_LOADER);
    const shownAt = async (tab: string, provider: "MapLibre" | "Google") => {
      await page.getByRole("tab", { name: tab }).click();
      await chooseProvider(page, provider, "Show the code for");
      return note.filter({ visible: true }).count();
    };
    expect(await shownAt("Bundler", "MapLibre")).toBe(0);
    expect(await shownAt("Bundler", "Google")).toBe(1);
    expect(await shownAt("React", "Google")).toBe(1);
    expect(await shownAt("HTML", "Google")).toBe(0);
    expect(await shownAt("Script", "Google")).toBe(0);
    await context.close();
  }, 30_000);

  it("draws the focus ring of every copy button, switch segment and code block whole", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    const clipped = await page.evaluate(() => {
      // The ring as base.css draws it: 3px, 2px out.
      const ring = 5;
      const controls = [
        ...document.querySelectorAll("[data-copy]"),
        ...document.querySelectorAll("[data-provider-choice] label"),
        // The shown code, a scroller a keyboard reaches (`<Code>`'s tabindex).
        ...document.querySelectorAll('[role="tabpanel"] pre[tabindex]'),
      ].filter((control) => control.checkVisibility());
      return controls.filter((control) => {
        const box = control.getBoundingClientRect();
        for (let up = control.parentElement; up; up = up.parentElement) {
          if (getComputedStyle(up).overflow === "visible") continue;
          const room = up.getBoundingClientRect();
          return (
            box.left - ring < room.left ||
            box.right + ring > room.right ||
            box.top - ring < room.top ||
            box.bottom + ring > room.bottom
          );
        }
        return false;
      }).length;
    });
    expect(clipped).toBe(0);
    await context.close();
  }, 30_000);
});
