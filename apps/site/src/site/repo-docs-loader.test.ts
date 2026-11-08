import type { LoaderContext } from "astro/loaders";
import { describe, expect, it, vi } from "vitest";
import { PACKAGE_NAME } from "../../../../scripts/release/published-package.ts";
import { REPO_DOCS } from "./repo-docs.ts";
import {
  repoDocMarkdown,
  repoDocsLoader,
  siteMarkdownOf,
  withoutReadmeOnly,
  withoutTitle,
} from "./repo-docs-loader.ts";

const doc = (id: string) => REPO_DOCS.find((each) => each.id === id) as (typeof REPO_DOCS)[number];

const settings = {
  pin: { version: "1.2.3", integrityOf: (file: string) => `sha384-of-${file}` },
  blobBase: "https://github.com/o/r/blob/abc123/",
};

vi.mock("./cdn-pin.ts", () => ({ cdnPin: async () => settings.pin }));

describe("withoutReadmeOnly", () => {
  const OPEN = "<!-- readme-only -->";
  const CLOSE = "<!-- /readme-only -->";

  it("drops the README-only block", () => {
    expect(withoutReadmeOnly(`${OPEN}\n<img src="a.svg">\n${CLOSE}\n\nThe intro.`, "R.md")).toBe(
      "The intro.",
    );
  });

  it("keeps a document without one as it is", () => {
    expect(withoutReadmeOnly("# maplace\n\nThe intro.", "R.md")).toBe("# maplace\n\nThe intro.");
  });

  it("drops every block, wherever it is", () => {
    const markdown = `${OPEN}\ntop\n${CLOSE}\n\nkept\n\n${OPEN}\n## Status\n${CLOSE}\n\n## License`;
    expect(withoutReadmeOnly(markdown, "R.md")).toBe("kept\n\n## License");
  });

  it("drops a marker however it is spaced, and leaves the word in prose alone", () => {
    expect(withoutReadmeOnly("<!--readme-only-->\nx\n<!--  /readme-only -->\n\nkept", "R.md")).toBe(
      "kept",
    );
    expect(withoutReadmeOnly("The `readme-only` marker.", "R.md")).toBe(
      "The `readme-only` marker.",
    );
  });

  it("refuses a block never closed before the next, rather than dropping what's between", () => {
    const markdown = `${OPEN}\ntop\n\nThe body.\n\n${OPEN}\nstatus\n${CLOSE}\n\n## License`;
    expect(() => withoutReadmeOnly(markdown, "R.md")).toThrow(/R\.md.*readme-only/);
  });

  it("refuses a block never closed, and a close with no opening, naming the document", () => {
    expect(() => withoutReadmeOnly(`${OPEN}\nbadges`, "R.md")).toThrow(/R\.md.*readme-only/);
    expect(() => withoutReadmeOnly(`badges\n${CLOSE}`, "R.md")).toThrow(/R\.md.*readme-only/);
  });
});

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
  it("leaves the README's top block and own section off Getting started", () => {
    const markdown = repoDocMarkdown(doc("getting-started"), settings);
    for (const repoOnly of ["<img", "shields.io", "hobby project", "Status and support"]) {
      expect(markdown).not.toContain(repoOnly);
    }
    expect(markdown).not.toContain("readme-only");
    expect(markdown.startsWith("A list of locations")).toBe(true);
  });

  it("pins Getting started's CDN scripts and links Migrating to its page", () => {
    const markdown = repoDocMarkdown(doc("getting-started"), settings);
    expect(markdown).toContain(`/${PACKAGE_NAME}@1.2.3/dist/maplace-element.iife.js"`);
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
    expect(markdown).toContain("](/element/#location-attributes)");
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
