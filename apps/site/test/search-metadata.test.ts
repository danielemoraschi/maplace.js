import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { packageManifest } from "../../../scripts/build/package.ts";
import { pngSize } from "../../../scripts/build/png-size.ts";
import { EXAMPLE_PAGE_ENTRIES } from "../src/examples/example-sections.ts";
import { PRIVACY_PAGE } from "../src/site/footer-pages.ts";
import { lastChangeOf } from "../src/site/git-dates.ts";
import { OG_IMAGE } from "../src/site/head-meta-tags.ts";
import { MARKDOWN_ROUTES, markdownAddress } from "../src/site/markdown-routes.ts";
import { strayRequests } from "../src/site/offsite-requests.ts";
import { pageSources } from "../src/site/page-sources.ts";
import { PRIVACY_CHANGED_ON } from "../src/site/privacy-changed-on.ts";
import { REPOSITORY_URL } from "../src/site/repo-docs.ts";
import { SITE_MAINTAINER } from "../src/site/site-owner.ts";
import { SITE_ROUTES } from "../src/site/site-routes.ts";
import { linkFor, linkRules } from "./header-rules.ts";
import { mapLibreSheetCopies } from "./maplibre-stylesheet-copies.ts";
import { PUBLIC_SITE, siteBuiltBeforeTests } from "./site-session.ts";

/** A node of a page's JSON-LD graph. */
type GraphNode = Record<string, unknown>;

/** What a page's head says, as served. */
interface HeadFacts {
  readonly html: string;
  readonly title: string;
  readonly description: string | null;
  readonly canonical: string | null;
  readonly metas: Readonly<Record<string, string>>;
  readonly graphs: readonly (readonly GraphNode[])[];
}

const site = siteBuiltBeforeTests();

/** What the head of each of `routes` says, one page after another. */
async function headsOf(routes: readonly string[]): Promise<ReadonlyMap<string, HeadFacts>> {
  const { page, context } = await site.visitor();
  const heads = new Map<string, HeadFacts>();
  for (const route of routes) {
    const response = await page.goto(new URL(route, site.url).href, {
      waitUntil: "domcontentloaded",
    });
    if (response === null) throw new Error(`${route} gave no response`);
    const seen = await page.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute("content"),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
      metas: [...document.head.querySelectorAll("meta[name], meta[property]")].map((meta) => [
        meta.getAttribute("name") ?? meta.getAttribute("property") ?? "",
        meta.getAttribute("content") ?? "",
      ]),
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map(
        (script) => script.textContent,
      ),
    }));
    heads.set(route, {
      html: await response.text(),
      title: seen.title,
      description: seen.description ?? null,
      canonical: seen.canonical ?? null,
      metas: Object.fromEntries(seen.metas),
      graphs: seen.jsonLd.map((text) => JSON.parse(text)["@graph"]),
    });
  }
  await context.close();
  return heads;
}

describe("the site's search metadata", () => {
  let heads: ReadonlyMap<string, HeadFacts>;

  beforeAll(async () => {
    heads = await headsOf([...SITE_ROUTES, "/404.html"]);
  }, 120_000);

  const headOf = (route: string): HeadFacts => {
    const head = heads.get(route);
    if (head === undefined) throw new Error(`${route} wasn't visited`);
    return head;
  };

  const nodeOf = (route: string, type: string): GraphNode => {
    const node = headOf(route).graphs[0]?.find((candidate) => candidate["@type"] === type);
    if (node === undefined) throw new Error(`${route} has no ${type} in its JSON-LD`);
    return node;
  };

  it("holds every route's description to 80 to 160 characters", () => {
    for (const route of SITE_ROUTES) {
      const length = headOf(route).description?.length ?? 0;
      expect(length, `${route}: ${headOf(route).description}`).toBeGreaterThanOrEqual(80);
      expect(length, `${route}: ${headOf(route).description}`).toBeLessThanOrEqual(160);
    }
  });

  it("gives every route its canonical at the production address", () => {
    for (const route of SITE_ROUTES) {
      expect(headOf(route).canonical, route).toBe(`${PUBLIC_SITE}${route}`);
    }
  });

  it("gives every route its tags, absolute", () => {
    for (const route of SITE_ROUTES) {
      const { canonical, description, metas, title } = headOf(route);
      expect(metas["og:url"], route).toBe(canonical);
      expect(metas["og:title"], route).toBe(title);
      expect(metas["twitter:title"], route).toBe(title);
      expect(metas["og:description"], route).toBe(description);
      expect(metas["twitter:description"], route).toBe(description);
      expect(metas["og:image"], route).toMatch(/^https:\/\/maplacejs\.com\/.+\.(png|jpg)$/);
      expect(metas["twitter:image"], route).toBe(metas["og:image"]);
      expect(metas["twitter:image:alt"], route).toBe(metas["og:image:alt"]);
      expect(metas.author, route).toBe(SITE_MAINTAINER);
    }
  });

  it("serves the image the tags name, a 1200×630 PNG", async () => {
    const { pathname } = new URL(headOf("/").metas["og:image"] ?? "");
    const response = await fetch(new URL(pathname, site.url));
    expect(response.headers.get("content-type")).toBe("image/png");
    const png = Buffer.from(await response.arrayBuffer());
    expect(pngSize(png)).toEqual({ width: 1200, height: 630 });
  });

  it("gives each example page its own sharing image, a JPEG, and every other page the site's", async () => {
    const examplePages = new Set(EXAMPLE_PAGE_ENTRIES.map(({ path }) => path));
    for (const route of SITE_ROUTES.filter((route) => !examplePages.has(route))) {
      const { metas } = headOf(route);
      expect(metas["og:image"], route).toBe(headOf("/").metas["og:image"]);
      expect(metas["og:image:alt"], route).toBe(OG_IMAGE.alt);
    }
    // Their sizes and alts are `example-images.test.ts`'s to hold: here, that each page names its own.
    const images = EXAMPLE_PAGE_ENTRIES.map(({ path, section }) => {
      const { metas } = headOf(path);
      const { pathname } = new URL(metas["og:image"] ?? "");
      expect(pathname, path).toMatch(new RegExp(`/${section.name}\\.[\\w-]+\\.jpg$`));
      expect(metas["og:image:alt"], path).toContain(section.title);
      return pathname;
    });
    const response = await fetch(new URL(images[0] ?? "", site.url));
    expect(response.headers.get("content-type")).toBe("image/jpeg");
  });

  it("writes JSON-LD that parses and names what the page shows", () => {
    const { name, version } = packageManifest();
    for (const route of SITE_ROUTES) {
      const { canonical, description, title } = headOf(route);
      expect(nodeOf(route, "WebPage"), route).toMatchObject({
        url: canonical,
        name: title,
        description,
        dateModified: lastChangeOf(pageSources(route)),
      });
      expect(nodeOf(route, "SoftwareSourceCode"), route).toMatchObject({
        codeRepository: REPOSITORY_URL,
        version,
        sameAs: `https://www.npmjs.com/package/${name}`,
      });
      expect(nodeOf(route, "Person").name, route).toBe(SITE_MAINTAINER);
      expect(nodeOf(route, "WebSite").url, route).toBe(`${PUBLIC_SITE}/`);
    }
  });

  it("dates the privacy page as its foot does", () => {
    expect(nodeOf(PRIVACY_PAGE.route, "WebPage").dateModified).toBe(PRIVACY_CHANGED_ON);
  });

  it("asks nothing off the site for it", () => {
    for (const route of SITE_ROUTES) {
      const { html } = headOf(route);
      expect(strayRequests(html, new URL(route, site.url).href), route).toEqual([]);
    }
  });

  it("knows every page the build wrote, so none goes without its metadata", () => {
    const written = globSync("**/*.html", { cwd: site.dir }).map((file) =>
      file === "404.html" ? file : `/${file.replace(/index\.html$/, "")}`,
    );
    expect(written.sort()).toEqual([...SITE_ROUTES, "404.html"].sort());
  });

  it("writes none of it on the page not found", () => {
    const { canonical, graphs, metas } = headOf("/404.html");
    expect(canonical).toBeNull();
    expect(metas["og:title"]).toBeUndefined();
    expect(graphs).toEqual([]);
  });

  it("names the sitemap in robots.txt", () => {
    const robots = readFileSync(join(site.dir, "robots.txt"), "utf8");
    expect(robots.split("\n")).toContain(`Sitemap: ${PUBLIC_SITE}/sitemap.xml`);
  });

  it("gives each page's Markdown the page as its canonical, in a header", () => {
    const links = linkRules(readFileSync(join(site.dir, "_headers"), "utf8"));
    for (const route of MARKDOWN_ROUTES) {
      const canonical = linkFor(links, markdownAddress(route), "canonical");
      expect(canonical, route).toBe(`${PUBLIC_SITE}${route}`);
    }
  });

  it("lists exactly the site's routes, each dated as its page says", async () => {
    const xml = await (await fetch(new URL("/sitemap.xml", site.url))).text();
    const listed = [...xml.matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map(
      ([, loc = "", lastModified = ""]) => [loc, lastModified],
    );
    const expected = SITE_ROUTES.map((route) => [
      `${PUBLIC_SITE}${route}`,
      nodeOf(route, "WebPage").dateModified,
    ]);
    expect(listed).toEqual(expected);
  });
});

// Read from the same build: a test file of its own would build the site once more (W70).
describe("MapLibre's stylesheet on the built site", () => {
  it("is on every page that draws a map, once, and on no other: a page without one paints sooner", () => {
    const { mapPages, misplaced } = mapLibreSheetCopies(site.dir);
    expect(mapPages, "every example's page and the builder").toHaveLength(
      EXAMPLE_PAGE_ENTRIES.length + 1,
    );
    expect(mapPages).toContain("builder/index.html");
    expect(misplaced).toEqual([]);
  });
});
