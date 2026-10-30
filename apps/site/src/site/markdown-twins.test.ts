import { describe, expect, it } from "vitest";
import { fencedBlocks } from "../../../../scripts/docs/markdown.ts";
import { EXAMPLE_GROUPS, EXAMPLE_SECTIONS, groupPath } from "../examples/example-sections.ts";
import { codeTabsOf } from "../examples/example-sources.ts";
import { CHANGELOG_ENTRY } from "./changelog-loader.ts";
import { CHANGELOG_PAGE } from "./footer-pages.ts";
import { MARKDOWN_ROUTES, markdownAddress } from "./markdown-routes.ts";
import { type MarkdownTwin, markdownTwins, type StoredPages } from "./markdown-twins.ts";
import { REPO_DOCS } from "./repo-docs.ts";

const STORED: StoredPages = {
  docs: REPO_DOCS.map(({ id }) => ({ id, body: `The body of ${id}.\n` })),
  changelog: [{ id: CHANGELOG_ENTRY, body: "## Unreleased\n" }],
  guides: [{ id: "custom-list", body: "The custom list's guide." }],
};

const TWINS = markdownTwins(STORED);

function twinAt(route: string): MarkdownTwin {
  const twin = TWINS.find(({ address }) => address === markdownAddress(route));
  if (twin === undefined) throw new Error(`no twin of ${route}`);
  return twin;
}

/** `markdown` under the heading `## title`, up to the next section's. */
function sectionOf(markdown: string, title: string): string {
  const [, after = ""] = markdown.split(`\n## ${title}\n`);
  return after.split("\n## ")[0] as string;
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

  it("writes a group's sections in order, each with its summary", () => {
    const lists = EXAMPLE_GROUPS.find(({ id }) => id === "lists");
    const { markdown } = twinAt("/examples/lists/");
    expect(markdown).toContain(`\n\n${lists?.summary}\n\n`);
    const headings = markdown.split("\n").filter((line) => line.startsWith("## "));
    expect(headings).toEqual(lists?.sections.map(({ title }) => `## ${title}`));
    for (const section of lists?.sections ?? []) {
      expect(sectionOf(markdown, section.title).trimStart().startsWith(section.summary)).toBe(true);
    }
  });

  it("puts a section's guide under it, and leaves it out for an example without one", () => {
    const { markdown } = twinAt("/examples/lists/");
    expect(sectionOf(markdown, "Your own list")).toContain("The custom list's guide.");
    expect(sectionOf(markdown, "Menu")).not.toContain("The custom list's guide.");
    expect(sectionOf(markdown, "Menu")).toContain("### ");
  });

  it("gives every file of every version on every provider back as written, in its fence", () => {
    for (const group of EXAMPLE_GROUPS) {
      const { markdown } = twinAt(groupPath(group));
      for (const { name } of group.sections) {
        for (const code of codeTabsOf(name).flatMap(({ codes }) => codes)) {
          for (const { file, lang, code: text } of code.files) {
            const where = `${code.folder}/${file}`;
            expect(markdown, where).toContain(`\`packages/maplace/examples/${where}\``);
            expect(fencedBlocks(markdown, lang), where).toContain(text.trimEnd());
          }
        }
      }
    }
  });

  it("names route on Google only", () => {
    const route = EXAMPLE_SECTIONS.find(({ name }) => name === "route");
    const group = EXAMPLE_GROUPS.find(({ sections }) => sections.includes(route as never));
    const section = sectionOf(twinAt(groupPath(group as never)).markdown, route?.title as string);
    expect(section).toContain("on Google");
    expect(section).not.toContain("on MapLibre");
    expect(section).toContain(route?.googleOnlyBecause);
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
