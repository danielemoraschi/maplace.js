import { type AgentLink, LLMS_TXT_ROUTE, skillInstallCommand } from "./agent-links.ts";
import { listedPage } from "./listed-pages.ts";
import { markdownAddressAt } from "./markdown-routes.ts";
import { SITE_ROUTES } from "./site-routes.ts";

const SITE_IN_A_PARAGRAPH =
  "A JavaScript library that turns a list of locations into a map plus a synced list, in a few lines, on Google Maps or MapLibre. These pages hold its documentation, its changelog and its examples, each with its code; every page's link below is Markdown where the page has Markdown behind it. The Agents section links the agent skill and its index.";

/** `/llms.txt` (llmstxt.org's format): links absolute, as fetchers open what's written. */
export function llmsTxt(site: URL, agentLinks: readonly AgentLink[]): string {
  const pages = SITE_ROUTES.map((route) => pageLine(route, site));
  return [
    "# Maplace.js",
    `> ${SITE_IN_A_PARAGRAPH}`,
    `Install the agent skill with \`${skillInstallCommand(site)}\`.`,
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
