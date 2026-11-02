import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { docRoute, REPO_DOCS } from "../src/site/repo-docs.ts";
import { opened, siteBuiltBeforeTests } from "./site-session.ts";
import { DESKTOP, PHONE } from "./visitor.ts";

const site = siteBuiltBeforeTests();

const docsNav = (page: Page) => page.getByRole("navigation", { name: "Documentation" });
const LABELS = REPO_DOCS.map(({ label }) => label);

describe("a reference page's list of the docs", () => {
  it("lists every doc in order, marking the page shown", async () => {
    const { page, context } = await opened(site, docRoute("store"), DESKTOP);
    expect(await docsNav(page).getByRole("link").allTextContents()).toEqual(LABELS);
    const marked = docsNav(page).locator('[aria-current="page"]');
    expect(await marked.allTextContents()).toEqual(["Store"]);
    expect(await marked.getAttribute("href")).toBe(docRoute("store"));
    await context.close();
  }, 30_000);

  it("shows one Documentation nav at each width", async () => {
    for (const viewport of [DESKTOP, PHONE]) {
      const { page, context } = await opened(site, docRoute("store"), viewport);
      expect(await docsNav(page).count(), `${viewport.width}`).toBe(1);
      await context.close();
    }
  }, 30_000);

  it("opens from its heading on a phone, by keyboard", async () => {
    const { page, context } = await opened(site, docRoute("store"), PHONE);
    const links = docsNav(page).getByRole("link");
    expect(await links.count()).toBe(0);
    await docsNav(page).locator("summary").focus();
    await page.keyboard.press("Enter");
    expect(await links.allTextContents()).toEqual(LABELS);
    await context.close();
  }, 30_000);

  it("isn't on a page outside the docs", async () => {
    const { page, context } = await opened(site, "/", DESKTOP);
    expect(await docsNav(page).count()).toBe(0);
    await context.close();
  }, 30_000);
});
