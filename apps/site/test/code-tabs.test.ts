import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { siteBuiltBeforeTests } from "./site-session.ts";

const site = siteBuiltBeforeTests();

/** The simple example's section, its tab `name` chosen. */
async function chooseTab(page: Page, name: string) {
  const section = page.locator("section#simple");
  await section.getByRole("tab", { name }).click();
  return section;
}

/** How many animations are running on the panel `id`: the fade, while it lasts. */
const runningAnimations = (page: Page, id: string) =>
  page
    .locator(`#${id}`)
    .evaluate(
      (panel) => panel.getAnimations().filter(({ playState }) => playState === "running").length,
    );

describe("the home page's code tabs", () => {
  it("shows a host's Google loader as one closed line, opened on a click", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url);
    const section = await chooseTab(page, "Vanilla");
    const loader = section.getByRole("group").filter({ hasText: "Google's bootstrap loader" });
    expect(await loader.getAttribute("open")).toBeNull();
    expect(await loader.getByText("importLibrary").isVisible()).toBe(false);
    await loader.getByText("Google's bootstrap loader").click();
    expect(await loader.getByText("importLibrary").isVisible()).toBe(true);
    await context.close();
  }, 30_000);

  it("fades in the panel a tab shows, the map's hidden at once", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url);
    await chooseTab(page, "HTML");
    expect(await runningAnimations(page, "example-simple-html")).toBe(1);
    expect(await page.locator("#example-simple-map").isHidden()).toBe(true);
    await context.close();
  }, 30_000);

  it("shows the panel without a fade when the visitor asks for less motion", async () => {
    const { page, context } = await site.visitor();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(site.url);
    await chooseTab(page, "HTML");
    expect(await page.locator("#example-simple-html").isVisible()).toBe(true);
    expect(await runningAnimations(page, "example-simple-html")).toBe(0);
    await context.close();
  }, 30_000);
});
