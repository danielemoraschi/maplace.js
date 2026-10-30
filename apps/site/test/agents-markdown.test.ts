import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { packageManifest, readRootFile } from "../../../scripts/build/package.ts";
import { CHANGELOG_FILE, listLines } from "../../../scripts/docs/changelog-lines.ts";
import { captures, section } from "../../../scripts/docs/markdown.ts";
import { AGENT_LINKS, LLMS_TXT_ROUTE } from "../src/site/agent-links.ts";
import { AGENTS_PAGE, PRIVACY_PAGE } from "../src/site/footer-pages.ts";
import {
  MARKDOWN_ROUTES,
  markdownAddress,
  markdownAddressAt,
} from "../src/site/markdown-routes.ts";
import { SITE_ROUTES } from "../src/site/site-routes.ts";
import { groupLink } from "./home-sections.ts";
import { opened, siteBuiltBeforeTests } from "./site-session.ts";
import { DESKTOP } from "./visitor.ts";

const NOT_FOUND_PAGE = "/404.html";

const site = siteBuiltBeforeTests();

const served = (path: string) => fetch(new URL(path, site.url));

const open = (route: string) => opened(site, route, DESKTOP);

/** The file's directives, each line a name and its value. */
function robotsDirectives(text: string): { name: string; value: string }[] {
  return text
    .split("\n")
    .filter((line) => line.trim() !== "" && !line.startsWith("#"))
    .map((line) => {
      const colon = line.indexOf(": ");
      return { name: line.slice(0, colon), value: line.slice(colon + 2) };
    });
}

interface LinkRule {
  readonly route: string;
  readonly target: string;
}

const LINK_RULE = /^(\S+)\n {2}Link: <([^>]+)>; rel="alternate"; type="text\/markdown"$/gm;

/** The `Link` rules of a `_headers` file, whatever else it holds. */
function linkRules(headers: string): LinkRule[] {
  return [...headers.matchAll(LINK_RULE)].map((rule) => ({
    route: rule[1] as string,
    target: rule[2] as string,
  }));
}

const byRoute = (a: LinkRule, b: LinkRule) => a.route.localeCompare(b.route);

describe("a page's Markdown", () => {
  it("is served for every page with Markdown", async () => {
    for (const route of MARKDOWN_ROUTES) {
      const response = await served(markdownAddress(route));
      expect(response.status, route).toBe(200);
      expect(response.headers.get("content-type"), route).toMatch(/text\/markdown/);
      expect((await response.text()).startsWith("# "), route).toBe(true);
    }
  }, 60_000);

  it("has Getting started's pinned scripts", async () => {
    const markdown = await (await served("/getting-started/index.md")).text();
    expect(markdown).toContain("# Getting started");
    expect(markdown).toContain(`maplace@${packageManifest().version}`);
  });

  it("has every line of the changelog", async () => {
    const markdown = await (await served("/changelog/index.md")).text();
    expect(markdown.match(/<time /g)).toHaveLength(listLines(readRootFile(CHANGELOG_FILE)).length);
  });

  it("has a group's guides and code", async () => {
    const markdown = await (await served("/examples/lists/index.md")).text();
    expect(markdown).toContain("## Your own list");
    expect(markdown).toContain("defineListView");
    expect(markdown).toContain("examples/custom-list/maplibre/");
  });
});

describe("llms.txt", () => {
  it("names every route and only those", async () => {
    const response = await served(LLMS_TXT_ROUTE);
    expect(response.headers.get("content-type")).toMatch(/text\/plain/);
    const text = await response.text();
    const pages = captures(section(text, "## Pages", LLMS_TXT_ROUTE), /\]\(([^)]+)\)/g);
    expect(pages.map((link) => new URL(link).pathname)).toEqual(
      SITE_ROUTES.map((route) => markdownAddressAt(route) ?? route),
    );
    for (const { href } of AGENT_LINKS.filter(({ href }) => href !== LLMS_TXT_ROUTE)) {
      expect(text, href).toContain(`${href})`);
    }
  });
});

describe("robots.txt", () => {
  it("parses and gives the content signal", async () => {
    const response = await served("/robots.txt");
    expect(response.status).toBe(200);
    const directives = robotsDirectives(await response.text());
    for (const { name, value } of directives) {
      expect(name, value).toMatch(/^[A-Za-z-]+$/);
      expect(value, name).not.toBe("");
    }
    expect(directives[0]).toEqual({ name: "User-agent", value: "*" });
    expect(directives).toContainEqual({
      name: "Content-Signal",
      value: "search=yes, ai-input=yes, ai-train=yes",
    });
    expect(directives).toContainEqual({ name: "Allow", value: "/" });
  });
});

describe("_headers", () => {
  it("has one Link rule per route with Markdown, and no other", () => {
    const rules = linkRules(readFileSync(join(site.dir, "_headers"), "utf8"));
    expect([...rules].sort(byRoute)).toEqual(
      MARKDOWN_ROUTES.map((route) => ({ route, target: markdownAddress(route) })).sort(byRoute),
    );
  });
});

describe("a page's head and its link", () => {
  it("names its twin on a page with Markdown, in its head and on the page", async () => {
    for (const route of MARKDOWN_ROUTES) {
      const { page, context } = await open(route);
      const alternate = page.locator('link[rel="alternate"][type="text/markdown"]');
      expect(await alternate.getAttribute("href"), route).toBe(markdownAddress(route));
      const shown = page.locator('main a[type="text/markdown"]:visible');
      expect(await shown.count(), route).toBe(1);
      expect(await shown.textContent(), route).toBe("Markdown");
      expect(await shown.getAttribute("href"), route).toBe(markdownAddress(route));
      await context.close();
    }
  }, 60_000);

  it("names none on a page without Markdown", async () => {
    for (const route of [PRIVACY_PAGE.route, AGENTS_PAGE.route]) {
      const { page, context } = await open(route);
      expect(await page.locator('link[type="text/markdown"]').count(), route).toBe(0);
      expect(await page.locator('main a[type="text/markdown"]').count(), route).toBe(0);
      await context.close();
    }
  });

  it("names llms.txt on every page, the not-found page too", async () => {
    for (const route of [...SITE_ROUTES, NOT_FOUND_PAGE]) {
      const html = await (await served(route)).text();
      expect(html, route).toContain(`<link rel="describedby" href="${LLMS_TXT_ROUTE}"`);
    }
  });

  it("names no Markdown on the not-found page", async () => {
    const html = await (await served(NOT_FOUND_PAGE)).text();
    expect(html).not.toContain('rel="alternate"');
  });

  it("carries the group's Markdown link on switching group in place", async () => {
    const { page, context } = await open("/");
    await groupLink(page, "Lists").click();
    await page.waitForURL(new URL("/examples/lists/", site.url).href);
    const shown = page.locator('main a[type="text/markdown"]:visible');
    await shown.first().waitFor();
    expect(await shown.count()).toBe(1);
    expect(await shown.getAttribute("href")).toBe("/examples/lists/index.md");
    await context.close();
  });
});

describe("the AI agents page", () => {
  it("links each agent link and says what is in Markdown", async () => {
    const { page, context } = await open(AGENTS_PAGE.route);
    const main = page.locator("main");
    for (const { href, what } of AGENT_LINKS) {
      expect(await main.locator(`a[href="${href}"]`).count(), href).toBe(1);
      expect(await main.textContent(), href).toContain(what);
    }
    expect(await main.locator('a[href="/setup/index.md"]').count()).toBe(1);
    await context.close();
  });
});
