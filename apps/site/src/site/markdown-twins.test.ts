import { describe, expect, it } from "vitest";
import { fencedBlocks } from "../../../../scripts/docs/markdown.ts";
import {
  EXAMPLE_GROUPS,
  EXAMPLE_PAGE_ENTRIES,
  type ExamplePageEntry,
  examplePagesOf,
  findExamplePage,
  groupHeading,
  groupPath,
  pageHeading,
} from "../examples/example-sections.ts";
import { codeTabsOf, exampleStylesheets } from "../examples/example-sources.ts";
import { HOME_HEADING, HOME_INTRO } from "../examples/home-page.ts";
import { CHANGELOG_ENTRY } from "./changelog-loader.ts";
import { STYLESHEETS_HEADING } from "./example-markdown.ts";
import { CHANGELOG_PAGE } from "./footer-pages.ts";
import { MARKDOWN_ROUTES, markdownAddress } from "./markdown-routes.ts";
import { type MarkdownTwin, markdownTwins, type StoredPages } from "./markdown-twins.ts";
import { REPO_DOCS } from "./repo-docs.ts";

const STORED: StoredPages = {
  docs: REPO_DOCS.map(({ id }) => ({ id, body: `The body of ${id}.\n` })),
  changelog: [{ id: CHANGELOG_ENTRY, body: "## Unreleased\n" }],
  guides: [{ id: "custom-list", body: "The custom list's guide." }],
  references: EXAMPLE_GROUPS.map(({ id }) => ({ id, body: `The tables of ${id}.\n` })),
};

const TWINS = markdownTwins(STORED);

function twinAt(route: string): MarkdownTwin {
  const twin = TWINS.find(({ address }) => address === markdownAddress(route));
  if (twin === undefined) throw new Error(`no twin of ${route}`);
  return twin;
}

/** The example named `name`'s page. */
function entryOf(name: string): ExamplePageEntry {
  const entry = findExamplePage(name);
  if (entry === undefined) throw new Error(`no example ${name}`);
  return entry;
}

/** The twin of the example named `name`'s page. */
function exampleTwin(name: string): string {
  return twinAt(entryOf(name).path).markdown;
}

describe("markdownTwins", () => {
  it("gives every route with Markdown a twin", () => {
    expect(TWINS.map(({ address }) => address).sort()).toEqual(
      MARKDOWN_ROUTES.map(markdownAddress).sort(),
    );
  });

  it("titles a doc's twin as its page, then its description, then its Markdown", () => {
    const setup = REPO_DOCS.find(({ id }) => id === "setup");
    expect(twinAt("/setup/").markdown).toBe(
      `# ${setup?.title}\n\n${setup?.description}\n\nThe body of setup.\n`,
    );
  });

  it("titles the changelog's twin as its page", () => {
    expect(twinAt(CHANGELOG_PAGE.route).markdown).toBe(
      `# ${CHANGELOG_PAGE.label}\n\n${CHANGELOG_PAGE.description}\n\n## Unreleased\n`,
    );
  });

  it("heads and introduces a hub's twin as its page, then lists its examples", () => {
    for (const group of EXAMPLE_GROUPS) {
      const { markdown } = twinAt(groupPath(group));
      const opening = `# ${groupHeading(group)}\n\n${group.intro}\n\n## Examples\n\n- [`;
      expect(markdown.startsWith(opening), group.id).toBe(true);
      for (const { section, path } of examplePagesOf(group))
        expect(markdown, section.name).toContain(`](${path}): `);
    }
  });

  it("ends a hub's twin with its reference tables, as its page does", () => {
    for (const group of EXAMPLE_GROUPS) {
      const { markdown } = twinAt(groupPath(group));
      expect(markdown.endsWith(`\n## Reference\n\nThe tables of ${group.id}.\n`), group.id).toBe(
        true,
      );
    }
  });

  it("writes the home page's twin as its index: each hub, then its examples", () => {
    const { markdown } = twinAt("/");
    expect(markdown.startsWith(`# ${HOME_HEADING}\n\n${HOME_INTRO}\n\n## Examples\n`)).toBe(true);
    expect(markdown).toContain("\n### [Markers and popups](/examples/markers/)\n");
    expect(markdown).toContain(
      "\n- [01 One marker](/examples/markers/simple/): One place on a map.\n",
    );
    expect(markdown).toContain("\n- [31 Default styles off](/examples/styling/unstyled/): ");
  });

  it("writes a hub's twin under two headings, its examples and its reference, as its page", () => {
    const { markdown } = twinAt("/examples/lists/");
    const headings = markdown.split("\n").filter((line) => line.startsWith("## "));
    expect(headings).toEqual(["## Examples", "## Reference"]);
  });

  it("writes an example's twin as its heading, its summary, its guide, then its code", () => {
    const { section } = entryOf("custom-list");
    expect(
      exampleTwin("custom-list").startsWith(
        `# ${pageHeading(section.title)}\n\n${section.summary}\n\nThe custom list's guide.\n\n## Code\n\n### `,
      ),
    ).toBe(true);
  });

  it("leaves the guide out of an example's twin that has none", () => {
    const { section } = entryOf("menu");
    const markdown = exampleTwin("menu");
    expect(
      markdown.startsWith(
        `# ${pageHeading(section.title)}\n\n${section.summary}\n\n## Code\n\n### `,
      ),
    ).toBe(true);
    expect(markdown).not.toContain("The custom list's guide.");
  });

  it("gives every file of every version on every provider back as written, in its fence", () => {
    for (const { path, section } of EXAMPLE_PAGE_ENTRIES) {
      const { markdown } = twinAt(path);
      for (const code of codeTabsOf(section.name).flatMap(({ codes }) => codes)) {
        for (const { file, lang, code: text } of code.files) {
          const where = `${code.folder}/${file}`;
          expect(markdown, where).toContain(`\`packages/maplace/examples/${where}\``);
          expect(fencedBlocks(markdown, lang), where).toContain(text.trimEnd());
        }
      }
    }
  });

  it("gives the stylesheet an example's versions link once, under its own heading, as written", () => {
    const markdown = exampleTwin("whats-on");
    const [stylesheet] = exampleStylesheets(codeTabsOf("whats-on").flatMap(({ codes }) => codes));
    const [, underHeading = ""] = markdown.split(`${STYLESHEETS_HEADING}\n\n`);
    expect(underHeading.startsWith("`packages/maplace/examples/styles/whats-on.css`")).toBe(true);
    expect(markdown.split("`packages/maplace/examples/styles/whats-on.css`")).toHaveLength(2);
    expect(fencedBlocks(markdown, "css")).toEqual([stylesheet?.code.trimEnd()]);
  });

  it("refuses a doc with no Markdown, naming it", () => {
    expect(() => markdownTwins({ ...STORED, docs: [] })).toThrow(
      "the docs collection has no Markdown for getting-started",
    );
  });

  it("refuses a guide stored without its Markdown", () => {
    expect(() => markdownTwins({ ...STORED, guides: [{ id: "custom-list" }] })).toThrow(
      "the exampleGuides collection has no Markdown for custom-list",
    );
  });

  it("refuses a category stored without its reference tables, naming it", () => {
    expect(() => markdownTwins({ ...STORED, references: [] })).toThrow(
      "the groupReferences collection has no Markdown for markers",
    );
  });

  it("leaves out the repo's snippet markers, which mean nothing to a reader", () => {
    const marked =
      "Before.\n\n<!-- example: packages/maplace/examples/a/page.html -->\n```html\n```\n";
    const docs = STORED.docs.map((doc) => (doc.id === "setup" ? { ...doc, body: marked } : doc));
    const { markdown } = markdownTwins({ ...STORED, docs }).find(
      ({ address }) => address === "/setup/index.md",
    ) as MarkdownTwin;
    expect(markdown).not.toContain("<!--");
    expect(markdown).toContain("Before.\n\n```html\n```\n");
  });

  it("refuses a changelog entry stored without its Markdown", () => {
    expect(() => markdownTwins({ ...STORED, changelog: [{ id: CHANGELOG_ENTRY }] })).toThrow(
      `the changelog collection has no Markdown for ${CHANGELOG_ENTRY}`,
    );
  });
});
