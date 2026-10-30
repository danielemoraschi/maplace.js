import { PROVIDER_LABELS, type Provider } from "../examples/example-providers.ts";
import {
  EXAMPLE_GROUPS,
  type ExampleGroup,
  type ExampleSection,
  groupPath,
  groupTitle,
} from "../examples/example-sections.ts";
import { codeTabsOf, type ExampleCode } from "../examples/example-sources.ts";
import { CHANGELOG_ENTRY } from "./changelog-loader.ts";
import { CHANGELOG_PAGE } from "./footer-pages.ts";
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
}

/** A page's Markdown, and where it is served. */
export interface MarkdownTwin {
  readonly address: string;
  readonly markdown: string;
}

/** What ties a doc's snippet to its file for `npm run check`: hidden on the page, noise as text. */
const SNIPPET_MARKER = /<!-- example: [^\n]*-->\n/g;

/** The twin of every page with Markdown behind it (`MARKDOWN_ROUTES`). */
export function markdownTwins({ docs, changelog, guides }: StoredPages): MarkdownTwin[] {
  return [
    ...EXAMPLE_GROUPS.map((group) => twin(groupPath(group), exampleGroupMarkdown(group, guides))),
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
          requiredBody(docs, doc.id, "docs").replace(SNIPPET_MARKER, ""),
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

function exampleGroupMarkdown(group: ExampleGroup, guides: readonly StoredMarkdown[]): string {
  const sections = group.sections.map((section) => sectionMarkdown(section, guides));
  return markdownPage(groupTitle(group), group.summary, sections.join("\n\n"));
}

/** A section: its summary, why it runs on Google only if it does, its guide if it has one, its code. */
function sectionMarkdown(
  { name, title, summary, googleOnlyBecause }: ExampleSection,
  guides: readonly StoredMarkdown[],
): string {
  const guide = guides.find(({ id }) => id === name) && requiredBody(guides, name, "exampleGuides");
  return [`## ${title}`, summary, googleOnlyBecause, guide, codeMarkdown(name)]
    .filter((part) => part !== undefined)
    .join("\n\n");
}

/** Every file of every version of the example `name`, on each provider it runs on. */
function codeMarkdown(name: string): string {
  return codeTabsOf(name)
    .flatMap(({ codes }) => codes)
    .map(versionMarkdown)
    .join("\n\n");
}

function versionMarkdown({ label, provider, folder, files }: ExampleCode): string {
  const fenced = files.map(
    ({ file, lang, code }) =>
      `\`packages/maplace/examples/${folder}/${file}\`\n\n\`\`\`${lang}\n${code.trimEnd()}\n\`\`\``,
  );
  return [`### ${label} on ${providerLabel(provider)}`, ...fenced].join("\n\n");
}

function providerLabel(provider: Provider): string {
  const label = PROVIDER_LABELS.find((each) => each.provider === provider)?.label;
  if (label === undefined) throw new Error(`the provider ${provider} has no label`);
  return label;
}
