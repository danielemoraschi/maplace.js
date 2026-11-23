import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { findExamplePage } from "../src/examples/example-sections.ts";
import { exampleFile } from "../src/examples/example-sources.ts";
import { docRoute } from "../src/site/repo-docs.ts";
import { chooseProvider, chooseVersion, visitSection } from "./home-sections.ts";
import { siteOnMapLibreBeforeTests } from "./maplibre-session.ts";
import { opened } from "./site-session.ts";
import { boxOf, DESKTOP, FIRST_EXAMPLES_PAGE } from "./visitor.ts";

const site = siteOnMapLibreBeforeTests();

/** The first code block the page shows, and the copy button framed with it. */
function firstShownBlock(page: Page) {
  const frame = page.locator("main [data-code-frame]").filter({ visible: true }).first();
  return {
    frame,
    block: frame.locator("pre").first(),
    button: frame.getByRole("button", { name: "Copy code" }),
  };
}

describe("a code block's copy button (W66)", () => {
  it.each([
    ["an example's page", FIRST_EXAMPLES_PAGE],
    ["a doc", docRoute("getting-started")],
  ])(
    "sits at the top right of each block on %s and copies the block's code",
    async (_, route) => {
      const { page, context } = await opened(site, route, DESKTOP);
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      expect(await page.locator("main pre.astro-code:not(.folded-host pre)").count()).toBe(
        await page.locator("main [data-code-frame] > pre.astro-code").count(),
      );
      const { frame, block, button } = firstShownBlock(page);
      const [frameBox, buttonBox] = [await boxOf(frame), await boxOf(button)];
      expect(frameBox.x + frameBox.width - (buttonBox.x + buttonBox.width)).toBeLessThan(16);
      expect(buttonBox.y - frameBox.y).toBeLessThan(16);
      await button.click();
      await expect.poll(() => frame.getByRole("status").textContent()).toBe("Copied");
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        await block.textContent(),
      );
      await context.close();
    },
    30_000,
  );

  describe("on a Google host page, Google's loader folded", () => {
    const LOADER_SUMMARY = "Google's bootstrap loader, with your API key";
    const hostOf = async (copying: boolean) => {
      const visit = await visitSection(site, "simple");
      if (copying) await visit.context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await chooseVersion(visit.page, "simple", "Bundler");
      await chooseProvider(visit.page, "Google");
      const host = visit.section.locator(".folded-host").filter({ visible: true });
      await host.locator("..").getByRole("button", { name: "Copy code" }).click();
      return { ...visit, host };
    };

    it("copies the whole host file, its loader in and the fold's label out", async () => {
      const { page, context, host } = await hostOf(true);
      await expect.poll(() => host.locator("..").getByRole("status").textContent()).toBe("Copied");
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        exampleFile("simple", "vanilla.html"),
      );
      await context.close();
    }, 30_000);

    it("selects the whole host file where the clipboard is refused, the fold's label left out", async () => {
      const { page, context } = await hostOf(false);
      await expect
        .poll(() => page.evaluate(() => getSelection()?.toString() ?? ""))
        .toContain("importLibrary");
      expect(await page.evaluate(() => getSelection()?.toString())).not.toContain(LOADER_SUMMARY);
      await context.close();
    }, 30_000);
  });

  describe("a long block's fold", () => {
    it("is drawn folded before the site's script runs, so it never shows whole first", async () => {
      const { page, context } = await site.visitor({ viewport: DESKTOP });
      await page.route("**/*", (route) =>
        route.request().resourceType() === "script" ? route.abort() : route.continue(),
      );
      await page.goto(new URL(findExamplePage("markers")?.path ?? "", site.url).href);
      const block = page.locator("main [data-foldable]").filter({ visible: true }).first();
      expect(Math.round((await boxOf(block)).height)).toBe(250);
      await context.close();
    }, 30_000);

    it("frames and folds a long block written in once its version and provider are chosen, its copy taking every line (W83)", async () => {
      const visit = await visitSection(site, "markers");
      await visit.context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await chooseVersion(visit.page, "markers", "Bundler");
      await chooseProvider(visit.page, "Google");
      const frame = visit.section.locator("[data-code-frame][data-fold]").filter({ visible: true });
      const fold = frame.first().locator("[data-code-fold] button");
      expect(Math.round((await boxOf(frame.first().locator("> :first-child"))).height)).toBe(250);
      const lines = Number((await fold.textContent())?.match(/^Show all (\d+) lines$/)?.[1]);
      await fold.click();
      await frame.first().getByRole("button", { name: "Copy code" }).click();
      const copied = await visit.page.evaluate(() => navigator.clipboard.readText());
      expect(copied.trimEnd().split("\n")).toHaveLength(lines);
      await visit.context.close();
    }, 30_000);

    it("shows 15.625rem of it, then all of it and back on its button, the copy taking every line", async () => {
      const { page, context } = await opened(site, findExamplePage("markers")?.path ?? "", DESKTOP);
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const frame = page.locator("main [data-code-frame][data-fold]").filter({ visible: true });
      const block = frame.first().locator("> :first-child");
      const fold = frame.first().locator("[data-code-fold] button");
      const height = async () => Math.round((await boxOf(block)).height);
      expect(await height()).toBe(250);
      expect(await fold.getAttribute("aria-expanded")).toBe("false");
      const lines = Number((await fold.textContent())?.match(/\d+/)?.[0]);
      await fold.click();
      expect(await fold.textContent()).toBe("Show less");
      expect(await height()).toBeGreaterThan(375);
      await frame.first().getByRole("button", { name: "Copy code" }).click();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      expect(copied.trimEnd().split("\n")).toHaveLength(lines);
      await fold.click();
      expect(await height()).toBe(250);
      await context.close();
    }, 30_000);
  });
});
