import { createRequire } from "node:module";
import { type Browser, chromium, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { REPOSITORY_URL } from "../src/site/repo-docs.ts";
import { starButtonShadow, starCountMarkup } from "../src/site/star-button-markup.ts";

const GITHUB_BUTTONS = createRequire(import.meta.url).resolve("github-buttons/dist/buttons.js");
const STARS = 1234;

/** The hero's link as github-buttons took it: it draws GitHub's button in its place. */
const GITHUB_LINK = `<a class="github-button" href="${REPOSITORY_URL}" data-size="large" data-show-count="true" aria-label="danielemoraschi/maplace.js on GitHub">GitHub</a>`;

/** A page holding `content` at its top-left corner, so both buttons are drawn at one spot. */
const pageOf = (content: string) =>
  `<body style="margin:0"><p style="margin:0">${content}</p></body>`;

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser.close();
});

/** GitHub's own button, drawn by github-buttons with its count answered by the test. */
async function drawnByGitHub(page: Page): Promise<void> {
  // The page's origin is opaque: GitHub's answer must say any origin may read it.
  await page.route("https://api.github.com/**", (route) =>
    route.fulfill({
      json: { stargazers_count: STARS, html_url: REPOSITORY_URL },
      headers: { "access-control-allow-origin": "*" },
    }),
  );
  await page.setContent(pageOf(GITHUB_LINK));
  await page.addScriptTag({ path: GITHUB_BUTTONS });
  // github-buttons replaces the link only once its count is in: its root is closed to a search.
  await expect.poll(() => page.locator("a.github-button").count()).toBe(0);
}

/** The site's button, its shadow root as the hero writes it and its count as the script adds it. */
async function drawnBySite(page: Page): Promise<void> {
  await page.setContent(pageOf("<span></span>"));
  await page.evaluate(
    ({ shadow, count }) => {
      const root = (document.querySelector("span") as HTMLElement).attachShadow({ mode: "open" });
      root.innerHTML = shadow;
      root.querySelector(".widget")?.insertAdjacentHTML("beforeend", count);
    },
    { shadow: starButtonShadow(REPOSITORY_URL), count: starCountMarkup(STARS, REPOSITORY_URL) },
  );
}

/** The button `draw` puts on a fresh page: where it sits, and how it looks. */
async function button(draw: (page: Page) => Promise<void>) {
  const page = await browser.newPage();
  await draw(page);
  const host = page.locator("p > span");
  const drawn = { box: await host.boundingBox(), pixels: await host.screenshot() };
  await page.close();
  return drawn;
}

describe("the site's star button", () => {
  it("draws the button and its count as GitHub's own does, pixel for pixel", async () => {
    const [github, site] = await Promise.all([button(drawnByGitHub), button(drawnBySite)]);
    expect(site.box).toEqual(github.box);
    expect(site.pixels.equals(github.pixels)).toBe(true);
  }, 30_000);
});
