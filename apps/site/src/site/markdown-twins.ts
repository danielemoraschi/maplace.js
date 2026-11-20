import {
  EXAMPLE_GROUPS,
  EXAMPLE_PAGE_ENTRIES,
  type ExampleGroup,
  type ExamplePageEntry,
  groupHeading,
  groupPath,
  pageHeading,
} from "../examples/example-sections.ts";
import { HOME_HEADING, HOME_INTRO, HOME_ROUTE } from "../examples/home-page.ts";
import { CHANGELOG_ENTRY } from "./changelog-loader.ts";
import { exampleMarkdown } from "./example-markdown.ts";
import { CHANGELOG_PAGE } from "./footer-pages.ts";
import { exampleListMarkdown, homeIndexMarkdown } from "./home-index-markdown.ts";
import { markdownAddress } from "./markdown-routes.ts";
import { docRoute, REPO_DOCS } from "./repo-docs.ts";

/** A collection's entry as a twin reads it. */
export interface StoredMarkdown {
  readonly id: string;
  readonly body?: string;
}

/** The collections the twins are written from. */
export interface StoredPages {
  readonly docs: readonly StoredMarkdown[];
  readonly changelog: readonly StoredMarkdown[];
  readonly guides: readonly StoredMarkdown[];
  /** Each category's reference tables, by its group's id (`group-references-loader.ts`). */
  readonly references: readonly StoredMarkdown[];
}

/** A page's Markdown, and where it is served. */
export interface MarkdownTwin {
  readonly address: string;
  readonly markdown: string;
}

/** What ties a doc's snippet to its file for `npm run check`: hidden on the page, noise as text. */
const SNIPPET_MARKER = /<!-- example: [^\n]*-->\n/g;

/** The twin of every page with Markdown behind it (`MARKDOWN_ROUTES`). */
export function markdownTwins({
  docs,
  changelog,
  guides,
  references,
}: StoredPages): MarkdownTwin[] {
  return [
    twin(HOME_ROUTE, markdownPage(HOME_HEADING, HOME_INTRO, homeIndexMarkdown())),
    ...EXAMPLE_GROUPS.map((group) => twin(groupPath(group), hubMarkdown(group, references))),
    ...EXAMPLE_PAGE_ENTRIES.map((entry) => twin(entry.path, examplePageMarkdown(entry, guides))),
    twin(
      CHANGELOG_PAGE.route,
      markdownPage(
        CHANGELOG_PAGE.label,
        CHANGELOG_PAGE.description,
        requiredBody(changelog, CHANGELOG_ENTRY, "changelog"),
      ),
    ),
    ...REPO_DOCS.map((doc) =>
      twin(
        docRoute(doc.id),
        markdownPage(
          doc.title,
          doc.description,
          requiredBody(docs, doc.id, "docs").replaceAll(SNIPPET_MARKER, ""),
        ),
      ),
    ),
  ];
}

function twin(route: string, markdown: string): MarkdownTwin {
  return { address: markdownAddress(route), markdown };
}

function markdownPage(title: string, intro: string, body: string): string {
  return `# ${title}\n\n${intro}\n\n${body.trim()}\n`;
}

function requiredBody(entries: readonly StoredMarkdown[], id: string, collection: string): string {
  const body = entries.find((entry) => entry.id === id)?.body;
  if (body === undefined) throw new Error(`the ${collection} collection has no Markdown for ${id}`);
  return body;
}

/** An example's page: its heading and summary, its guide, then its code. */
function examplePageMarkdown(
  { section }: ExamplePageEntry,
  guides: readonly StoredMarkdown[],
): string {
  const body = exampleMarkdown(section.name, guideOf(guides, section.name));
  return markdownPage(pageHeading(section.title), section.summary, body);
}

/** The example `name`'s guide, if it has one; one stored without Markdown throws. */
function guideOf(guides: readonly StoredMarkdown[], name: string): string | undefined {
  return guides.some(({ id }) => id === name)
    ? requiredBody(guides, name, "exampleGuides")
    : undefined;
}

/** A category's hub: its heading and intro, its examples, then its reference tables. */
function hubMarkdown(group: ExampleGroup, references: readonly StoredMarkdown[]): string {
  const examples = `## Examples\n\n${exampleListMarkdown(group)}`;
  const reference = `## Reference\n\n${requiredBody(references, group.id, "groupReferences").trim()}`;
  return markdownPage(groupHeading(group), group.intro, `${examples}\n\n${reference}`);
}
