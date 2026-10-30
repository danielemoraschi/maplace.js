import type { LoaderContext } from "astro/loaders";
import { describe, expect, it, vi } from "vitest";
import { REPO_DOCS } from "./repo-docs.ts";
import {
  repoDocMarkdown,
  repoDocsLoader,
  siteMarkdownOf,
  withoutTitle,
} from "./repo-docs-loader.ts";

const doc = (id: string) => REPO_DOCS.find((each) => each.id === id) as (typeof REPO_DOCS)[number];

const settings = {
  pin: { version: "1.2.3", integrityOf: (file: string) => `sha384-of-${file}` },
  blobBase: "https://github.com/o/r/blob/abc123/",
};

vi.mock("./cdn-pin.ts", () => ({ cdnPin: async () => settings.pin }));

describe("withoutTitle", () => {
  it("drops the document's own title, which the page writes", () => {
    expect(withoutTitle("# maplace\n\nA list of locations.")).toBe("A list of locations.");
  });

  it("keeps a document without one as it is", () => {
    expect(withoutTitle("A list.\n\n# Later")).toBe("A list.\n\n# Later");
  });
});

describe("siteMarkdownOf", () => {
  const FILE = "packages/maplace/examples/custom-list/guide.md";

  it("sends a link to a repo document to its page on the site, with its anchor", () => {
    const markdown = "[views](../../../../docs/reference/element.md#list-views)";
    expect(siteMarkdownOf(markdown, FILE, settings.blobBase)).toBe("[views](/element/#list-views)");
  });

  it("sends a link to another example's guide to that example's section, on its group's page", () => {
    expect(siteMarkdownOf("[pins](../css-markers/guide.md)", FILE, settings.blobBase)).toBe(
      "[pins](/examples/styling/#css-markers)",
    );
    expect(siteMarkdownOf("[markers](../markers/guide.md)", FILE, settings.blobBase)).toBe(
      "[markers](/#markers)",
    );
  });

  it("sends a link to another repo file to GitHub at the commit built", () => {
    expect(siteMarkdownOf("[code](./vanilla.ts)", FILE, settings.blobBase)).toBe(
      `[code](${settings.blobBase}packages/maplace/examples/custom-list/vanilla.ts)`,
    );
  });

  it("drops the file's title, which the page writes", () => {
    expect(siteMarkdownOf("# Your own list\n\nA list.", FILE, settings.blobBase)).toBe("A list.");
  });
});

describe("repoDocMarkdown", () => {
  it("pins Getting started's CDN scripts and links Migrating to its page", () => {
    const markdown = repoDocMarkdown(doc("getting-started"), settings);
    expect(markdown).toContain('maplace@1.2.3/dist/maplace-element.iife.js"');
    expect(markdown).toContain('integrity="sha384-of-maplace-element.iife.js"');
    expect(markdown).toContain("](/migrating/)");
    expect(markdown).not.toMatch(/^# maplace/);
  });

  it("renders Migrating as written, its repo links to the repo", () => {
    const markdown = repoDocMarkdown(doc("migrating"), settings);
    expect(markdown).toContain("](https://github.com/o/r/blob/abc123/");
    expect(markdown).not.toMatch(/\]\((?!https:|#|\/)[^)]+\.md\)/);
  });
});

describe("repoDocMarkdown of a reference page", () => {
  it("reads its links relative to it: a doc to its page, any other file to the repo", () => {
    const markdown = repoDocMarkdown(doc("locations"), settings);
    expect(markdown).toContain("](/migrating/#location-fields)");
    expect(markdown).toContain("](https://github.com/o/r/blob/abc123/docs/rfc-1.0.md#shape)");
  });
});

describe("repoDocsLoader", () => {
  it("stores each doc by id with its Markdown as its body", async () => {
    const entries: { id: string; body: string }[] = [];
    const context = {
      store: {
        clear: () => entries.splice(0),
        set: (entry: (typeof entries)[number]) => entries.push(entry),
      },
      renderMarkdown: async (markdown: string) => ({ html: markdown }),
    };
    await repoDocsLoader().load(context as unknown as LoaderContext);
    expect(entries.map(({ id }) => id)).toEqual(REPO_DOCS.map(({ id }) => id));
    const gettingStarted = entries.find(({ id }) => id === "getting-started");
    expect(gettingStarted?.body).toContain("](/migrating/)");
  });
});
