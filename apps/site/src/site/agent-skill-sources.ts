import { exampleFile, langOf } from "../examples/example-sources.ts";
import { docSectionOnSite, type RepoDocSettings } from "./repo-docs-loader.ts";
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
  return withAbsoluteSiteLinks(docSectionOnSite(id, heading, settings), settings.site).trim();
}

export function pageUrl(route: string, site: string): string {
  return new URL(route, site).href;
}

export function codeList(names: readonly string[]): string {
  return names.map((name) => `\`${name}\``).join(", ");
}

/** `markdown` with its rooted links absolute, on the site at `site`. */
function withAbsoluteSiteLinks(markdown: string, site: string): string {
  return markdown.replaceAll(SITE_LINK, (_, target: string) => `](${pageUrl(target, site)})`);
}
