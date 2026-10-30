import { EXAMPLE_GROUPS, groupDescription, groupPath } from "../examples/example-sections.ts";
import { type AgentLink, LLMS_TXT_ROUTE } from "./agent-links.ts";
import { FOOTER_PAGES } from "./footer-pages.ts";
import { markdownAddressAt } from "./markdown-routes.ts";
import { docRoute, REPO_DOCS } from "./repo-docs.ts";
import { SITE_ROUTES } from "./site-routes.ts";

const SITE_IN_A_PARAGRAPH =
  "A JavaScript library that turns a list of locations into a map plus a synced list, in a few lines, on Google Maps or MapLibre. These pages hold its documentation, its changelog and its examples, each with its code; every link below is Markdown where the page has Markdown behind it.";

interface ListedPage {
  readonly name: string;
  readonly description: string;
}

/** What `llms.txt` says of each page, by its route. */
const LISTED_PAGES: ReadonlyMap<string, ListedPage> = new Map([
  ...EXAMPLE_GROUPS.map(
    (group) =>
      [groupPath(group), { name: group.label, description: groupDescription(group) }] as const,
  ),
  ...FOOTER_PAGES.map(
    ({ route, label, description }) => [route, { name: label, description }] as const,
  ),
  ...REPO_DOCS.map(
    ({ id, label, description }) => [docRoute(id), { name: label, description }] as const,
  ),
]);

/** `/llms.txt` (llmstxt.org's format): links absolute, as fetchers open what's written. */
export function llmsTxt(site: URL, agentLinks: readonly AgentLink[]): string {
  const pages = SITE_ROUTES.map((route) => pageLine(route, site));
  return [
    "# maplacejs",
    `> ${SITE_IN_A_PARAGRAPH}`,
    `## Pages\n\n${pages.join("\n")}`,
    ...agentsSection(site, agentLinks),
  ]
    .join("\n\n")
    .concat("\n");
}

function pageLine(route: string, site: URL): string {
  const { name, description } = listedPage(route);
  return linkLine(name, markdownAddressAt(route) ?? route, description, site);
}

function listedPage(route: string): ListedPage {
  const page = LISTED_PAGES.get(route);
  if (page === undefined) throw new Error(`the site has no page at ${route}`);
  return page;
}

/** The `## Agents` section, every link but this file's own; none when that leaves none. */
function agentsSection(site: URL, agentLinks: readonly AgentLink[]): string[] {
  const others = agentLinks.filter(({ href }) => href !== LLMS_TXT_ROUTE);
  if (others.length === 0) return [];
  const lines = others.map(({ href, label, what }) => linkLine(label, href, what, site));
  return [`## Agents\n\n${lines.join("\n")}`];
}

function linkLine(name: string, path: string, line: string, site: URL): string {
  return `- [${name}](${new URL(path, site).href}): ${line}`;
}
