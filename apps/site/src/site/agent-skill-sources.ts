import { section } from "../../../../scripts/docs/markdown.ts";
import { exampleFile, langOf } from "../examples/example-sources.ts";
import { docRoute, REPO_DOCS } from "./repo-docs.ts";
import { type RepoDocSettings, repoDocMarkdown } from "./repo-docs-loader.ts";
import { SITE_LINK } from "./site-link-targets.ts";

/** What the skill is written from. */
export interface AgentSkillSettings extends RepoDocSettings {
  /** The site's address: an installed skill has no site to be relative to. */
  readonly site: string;
}

/** A part of the skill, in Markdown. */
export type AgentSkillSection = (settings: AgentSkillSettings) => string;

/** An example's file word for word, in a fence named by its extension. */
export function exampleSnippet(folder: string, file: string): string {
  return `\`\`\`${langOf(file)}\n${exampleFile(folder, file).trimEnd()}\n\`\`\``;
}

/** The text under `heading` of the doc page `id`, every link working from outside the site. */
export function docSection(id: string, heading: string, settings: AgentSkillSettings): string {
  const doc = REPO_DOCS.find((each) => each.id === id);
  if (doc === undefined) throw new Error(`${id} isn't in REPO_DOCS`);
  const text = section(repoDocMarkdown(doc, settings), heading, doc.file);
  return withAbsoluteSiteLinks(text, pageUrl(docRoute(id), settings.site)).trim();
}

export function pageUrl(route: string, site: string): string {
  return new URL(route, site).href;
}

export function codeList(names: readonly string[]): string {
  return names.map((name) => `\`${name}\``).join(", ");
}

/** `markdown` with its rooted and same-page links absolute, from `page` on the site. */
function withAbsoluteSiteLinks(markdown: string, page: string): string {
  return markdown.replaceAll(SITE_LINK, (_, target: string) => `](${new URL(target, page).href})`);
}
