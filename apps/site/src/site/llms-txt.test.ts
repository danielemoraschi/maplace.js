import { describe, expect, it } from "vitest";
import { captures, section } from "../../../../scripts/docs/markdown.ts";
import { groupDescription, HOME_GROUP } from "../examples/example-sections.ts";
import { AGENT_LINKS } from "./agent-links.ts";
import { PRIVACY_PAGE } from "./footer-pages.ts";
import { llmsTxt } from "./llms-txt.ts";
import { markdownAddressAt } from "./markdown-routes.ts";
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
    expect(TEXT.startsWith("# maplacejs\n\n> ")).toBe(true);
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
    expect(TEXT).toContain(`(https://maplacejs.com/index.md): ${groupDescription(HOME_GROUP)}\n`);
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
