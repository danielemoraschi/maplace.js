import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
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
});
