import { describe, expect, it } from "vitest";
import { AGENTS_PAGE, PRIVACY_PAGE } from "./footer-pages.ts";
import { MARKDOWN_ROUTES, markdownAddress, markdownAddressAt } from "./markdown-routes.ts";
import { SITE_ROUTES } from "./site-routes.ts";

describe("MARKDOWN_ROUTES", () => {
  it("is every route but the privacy and AI agents pages", () => {
    expect(SITE_ROUTES.filter((route) => !MARKDOWN_ROUTES.includes(route))).toEqual([
      PRIVACY_PAGE.route,
      AGENTS_PAGE.route,
    ]);
  });

  it("holds only routes of the site", () => {
    expect(MARKDOWN_ROUTES.filter((route) => !SITE_ROUTES.includes(route))).toEqual([]);
  });
});

describe("markdownAddress", () => {
  it("is a folder page's index.md", () => {
    expect(markdownAddress("/")).toBe("/index.md");
    expect(markdownAddress("/setup/")).toBe("/setup/index.md");
    expect(markdownAddress("/examples/lists/")).toBe("/examples/lists/index.md");
  });
});

describe("markdownAddressAt", () => {
  it("gives a path with Markdown its address", () => {
    expect(markdownAddressAt("/setup/")).toBe("/setup/index.md");
  });

  it("gives a path without Markdown none", () => {
    for (const path of ["/privacy/", "/404.html", "/setup"]) {
      expect(markdownAddressAt(path), path).toBeUndefined();
    }
  });
});
