import { describe, expect, it } from "vitest";
import { captures, section } from "../../../../scripts/docs/markdown.ts";
import { EXAMPLE_PAGE_ENTRIES } from "../examples/example-sections.ts";
import { HOME_DESCRIPTION } from "../examples/home-page.ts";
import { AGENT_LINKS } from "./agent-links.ts";
import { PRIVACY_PAGE } from "./footer-pages.ts";
import { llmsTxt } from "./llms-txt.ts";
import { markdownAddress, markdownAddressAt } from "./markdown-routes.ts";
import { REPO_DOCS } from "./repo-docs.ts";
import { SITE_ROUTES } from "./site-routes.ts";

const SITE = new URL("https://maplacejs.com");
const TEXT = llmsTxt(SITE, AGENT_LINKS);
const OWN_LINK = AGENT_LINKS[0] as (typeof AGENT_LINKS)[number];

/** The addresses linked by the list under `## Pages`. */
const pageLinks = (text: string) =>
  captures(section(text, "## Pages", "llms.txt"), /^- \[[^\]]+\]\(([^)]+)\)/gm);

describe("llmsTxt", () => {
  it("opens with the site's name and a paragraph", () => {
    expect(TEXT.startsWith("# Maplace.js\n\n> ")).toBe(true);
  });

  it("says, in its paragraph, that the Agents section holds the skill", () => {
    const paragraph = TEXT.split("\n")[2];
    expect(paragraph).toContain("Agents");
    expect(paragraph).toContain("agent skill");
  });

  it("says how to install the skill, before the pages", () => {
    const install = "Install the agent skill with `npx skills add https://maplacejs.com`.";
    expect(TEXT).toContain(`\n\n${install}\n\n## Pages\n`);
  });

  it("says what the file holds, on the AI agents page, Agents section included", () => {
    expect(OWN_LINK.what).toContain("agent skill");
  });

  it("lists every route of the site and only those, by its Markdown where it has one", () => {
    expect(pageLinks(TEXT)).toEqual(
      SITE_ROUTES.map((route) => new URL(markdownAddressAt(route) ?? route, SITE).href),
    );
  });

  it("gives each page its description", () => {
    const setup = REPO_DOCS.find(({ id }) => id === "setup");
    expect(TEXT).toContain(`(https://maplacejs.com/setup/index.md): ${setup?.description}\n`);
    expect(TEXT).toContain(`(https://maplacejs.com/privacy/): ${PRIVACY_PAGE.description}\n`);
    expect(TEXT).toContain(`(https://maplacejs.com/index.md): ${HOME_DESCRIPTION}\n`);
  });

  it("lists every example's page by its title and description", () => {
    for (const { path, section } of EXAMPLE_PAGE_ENTRIES) {
      const address = new URL(markdownAddress(path), SITE).href;
      expect(TEXT).toContain(`\n- [${section.title}](${address}): ${section.description}\n`);
    }
  });

  it("lists the agent links under Agents, but itself", () => {
    const text = llmsTxt(SITE, [
      OWN_LINK,
      { href: "/skill.md", label: "The skill", what: "Teaches it." },
    ]);
    expect(text).toContain(
      "## Agents\n\n- [The skill](https://maplacejs.com/skill.md): Teaches it.\n",
    );
    expect(text).not.toContain(OWN_LINK.what);
  });

  it("writes no Agents heading with only itself to list", () => {
    expect(llmsTxt(SITE, [OWN_LINK])).not.toContain("## Agents");
  });
});
