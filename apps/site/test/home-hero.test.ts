import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { exampleFile } from "../src/examples/example-sources.ts";
import { HERO_TABLE, heroCards, hiddenBelowWidths } from "../src/examples/hero-table.ts";
import { HOME_HEADING, HOME_INTRO, WAYS_IN_NOTES } from "../src/examples/home-page.ts";
import { skillInstallCommand } from "../src/site/agent-links.ts";
import { docRoute } from "../src/site/repo-docs.ts";
import { chooseProvider } from "./home-sections.ts";
import { opened, PUBLIC_SITE, siteBuiltBeforeTests } from "./site-session.ts";
import { boxOf, DESKTOP, PHONE } from "./visitor.ts";

/** An example's file as the repo holds it, as the hero shows it. */
const codeOf = (folder: string, file: string) => exampleFile(folder, file).trimEnd();

const site = siteBuiltBeforeTests();

/** The hero's ground, as a computed colour. */
const WATER = "rgb(207, 227, 234)";
const SKILLS = skillInstallCommand(new URL(PUBLIC_SITE));
const npmCommand = (provider: "google" | "maplibre") =>
  provider === "google"
    ? "npm install @maplacejs/maplace"
    : "npm install @maplacejs/maplace maplibre-gl";

/** Shows the four ways' code for `provider`, as a visitor checks it on the switch. */
const showCodeFor = (page: Page, provider: "MapLibre" | "Google") =>
  chooseProvider(page, provider, "Show the code for");

/** The hero's table of examples. */
const heroTable = (page: Page) => page.locator('[aria-hidden="true"]:has([data-hero-card])');

/**
 * The table's cards under any of the copy's text, by name: sampled along each line it draws, the
 * cards made to take the pointer while it looks (they take none, and a hit test skips them).
 */
function cardsUnderCopy(): string[] {
  const copy = document.querySelector('[data-version-switch="ways-in"] > div');
  const texts = [
    ...(copy?.querySelectorAll("h1, p, code, a, [data-star-button]") ?? []),
    // The four ways' tabs, transparent over the table; their panels are opaque.
    ...document.querySelectorAll('[aria-label="Ways to use Maplace.js"] [role="tab"]'),
  ];
  const lines = texts.flatMap((text) => {
    const range = document.createRange();
    range.selectNodeContents(text);
    const rects = [...range.getClientRects()];
    // The star button draws in its shadow root: its own box, where its text has none.
    return rects.length > 0 ? rects : [text.getBoundingClientRect()];
  });
  const points = lines.flatMap((line) =>
    Array.from(
      { length: Math.floor(line.width / 16) + 1 },
      (_, step) => line.left + step * 16,
    ).flatMap((x) =>
      [line.top + 2, line.top + line.height / 2, line.bottom - 2].map((y) => [x, y] as const),
    ),
  );
  const hittable = document.createElement("style");
  hittable.textContent = "[data-hero-card] { pointer-events: auto }";
  document.head.append(hittable);
  const cards = points
    .flatMap(([x, y]) => document.elementsFromPoint(x, y))
    .map((hit) => hit.closest<HTMLElement>("[data-hero-card]")?.dataset.heroCard)
    .filter((name) => name !== undefined);
  hittable.remove();
  return [...new Set(cards)];
}

describe("the home page's hero (W66)", () => {
  it("heads the page with the library on map water, run up under the header, and gets started on Getting started", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    const heading = page.locator("h1");
    // biome-ignore lint/performance/useDomNodeTextContent: Playwright's, and the text as rendered: the H1's <br>s are its spaces.
    expect((await heading.innerText()).replace(/\s+/g, " ")).toBe(`${HOME_HEADING}.`);
    expect(await page.locator("h1 + p").textContent()).toBe(HOME_INTRO);
    const underHeader = await page.evaluate(() => {
      const [hero] = document
        .elementsFromPoint(innerWidth / 2, 8)
        .filter((at) => at.closest("main"));
      return hero && getComputedStyle(hero.closest(".hero-water") ?? hero).backgroundColor;
    });
    expect(underHeader).toBe(WATER);
    const started = page.getByRole("link", { name: "Get started" });
    expect(await started.getAttribute("href")).toBe(docRoute("getting-started"));
    await context.close();
  }, 30_000);

  it("offers the npm command of the provider chosen for the code, MapLibre's first", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    const npm = (command: string) => page.locator("code", { hasText: command });
    expect(await npm(npmCommand("maplibre")).isVisible()).toBe(true);
    expect(await npm(npmCommand("google")).filter({ hasNotText: "maplibre-gl" }).isVisible()).toBe(
      false,
    );
    await showCodeFor(page, "Google");
    expect(await npm(npmCommand("maplibre")).isVisible()).toBe(false);
    expect(await npm(npmCommand("google")).filter({ hasNotText: "maplibre-gl" }).isVisible()).toBe(
      true,
    );
    await context.close();
  }, 30_000);

  it("copies the skills command, and says so", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const pill = page.locator("div", { has: page.locator("code", { hasText: SKILLS }) }).last();
    const ways = page.getByRole("tablist", { name: "Ways to use Maplace.js" });
    const waysBefore = await boxOf(ways);
    await pill.getByRole("button", { name: `Copy ${SKILLS}` }).click();
    await expect.poll(() => pill.getByRole("status").textContent()).toBe("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(SKILLS);
    expect(await boxOf(ways), "nothing below moves").toEqual(waysBefore);
    await context.close();
  }, 30_000);

  it("shows Simple's code by way, its MapLibre page first, the provider switch swapping the files and holding on an example's page", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    const shown = () => page.locator('[role="tabpanel"]:visible pre:visible').allTextContents();
    expect(await shown()).toEqual([codeOf("simple/maplibre", "page.html")]);
    expect(await page.locator('[role="tabpanel"] figcaption').count()).toBe(0);
    await page.getByRole("tab", { name: "React" }).click();
    expect(await page.locator('[role="tabpanel"]:visible p').first().textContent()).toBe(
      WAYS_IN_NOTES.react.title,
    );
    await showCodeFor(page, "Google");
    expect(await shown()).toContain(codeOf("simple", "react.tsx"));
    await page.goto(new URL("/examples/markers/simple/", site.url).href);
    expect(await page.locator('input[value="google"]').first().isChecked()).toBe(true);
    await context.close();
  }, 30_000);

  it("lays every card of the table as a picture, no link and taking no pointer, hidden from screen readers, each 320 wide from the site", async () => {
    const { page, context, offsite } = await opened(site, "/", DESKTOP);
    const cards = await heroTable(page)
      .locator("[data-hero-card]")
      .evaluateAll((all) =>
        all.map((card) => ({
          name: (card as HTMLElement).dataset.heroCard,
          width: card.querySelector("img")?.getAttribute("width"),
          local: card.querySelector("img")?.src.startsWith(location.origin),
          pointer: getComputedStyle(card).pointerEvents,
        })),
      );
    expect(cards.map(({ name }) => name)).toEqual(heroCards(HERO_TABLE).map(({ name }) => name));
    expect(
      cards.every(({ width, local, pointer }) => width === "320" && local && pointer === "none"),
    ).toBe(true);
    expect(await heroTable(page).locator("a").count()).toBe(0);
    expect(offsite()).toEqual([]);
    await context.close();
  }, 30_000);

  it("keeps the copy clear of the cards, with nothing to scroll sideways, at every width the table lies beside it", async () => {
    // Either side of where the table moves beside the copy and of each width a card steps out
    // below (`hero-table.ts`), and the common screens between.
    const edges = [1024, ...hiddenBelowWidths(HERO_TABLE)].flatMap((width) => [width - 1, width]);
    const widths = [...edges, 1100, 1152, 1200, 1240, 1340, 1440, 1600, 1800].sort((a, b) => a - b);
    const { page, context } = await opened(site, "/", { width: widths[0] ?? 1023, height: 900 });
    // The table at rest: not landing, not turned by a scroll.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => document.fonts.ready);
    const crowded: Record<number, string[]> = {};
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      const under = await page.evaluate(cardsUnderCopy);
      if (under.length > 0) crowded[width] = under;
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${width}`).toBe(
        width,
      );
    }
    expect(crowded).toEqual({});
    await context.close();
  }, 30_000);

  it("keeps the table inside the hero as the page scrolls, turning it only for a visitor who doesn't ask for less motion", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    const plane = page.locator("[data-hero-card]").first().locator("..");
    const transformAt = async (y: number) => {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      return plane.evaluate((element) => getComputedStyle(element).transform);
    };
    const resting = await transformAt(0);
    // A scroll timeline moves the table on the frames after the scroll.
    await expect.poll(() => transformAt(400)).not.toBe(resting);
    // Turned, the table runs past the hero's foot: the hero clips it off the band below.
    const cardsUnderHero = await page.evaluate(() => {
      const hittable = document.createElement("style");
      hittable.textContent = "[data-hero-card] { pointer-events: auto }";
      document.head.append(hittable);
      const below =
        (document.querySelector(".hero-water")?.getBoundingClientRect().bottom ?? 0) + 4;
      if (below >= innerHeight) return "the hero's foot is off the screen";
      const hits = Array.from({ length: 40 }, (_, step) => (innerWidth * step) / 40).flatMap((x) =>
        document.elementsFromPoint(x, below).filter((hit) => hit.closest("[data-hero-card]")),
      );
      hittable.remove();
      return hits.length;
    });
    expect(cardsUnderHero).toBe(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await transformAt(400)).toBe(resting);
    const moving = await page.evaluate(() => document.getAnimations().length);
    expect(moving).toBe(0);
    await context.close();
  }, 30_000);

  it("puts the table under the four ways on a phone, with nothing to scroll sideways", async () => {
    const { page, context } = await opened(site, "/", PHONE);
    const ways = await boxOf(page.getByRole("tablist", { name: "Ways to use Maplace.js" }));
    const table = await boxOf(heroTable(page));
    expect(table.y).toBeGreaterThan(ways.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(PHONE.width);
    const commandsCut = await page.locator("[data-copy]").evaluateAll(
      (buttons) =>
        buttons
          .map((button) => button.parentElement?.querySelector("code"))
          .filter((code) => code?.checkVisibility())
          .filter((code) => code && code.scrollWidth > code.clientWidth).length,
    );
    expect(commandsCut).toBe(0);
    await context.close();
  }, 30_000);
});
