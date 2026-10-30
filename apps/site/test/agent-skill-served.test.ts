import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { captures } from "../../../scripts/docs/markdown.ts";
import { AGENT_SKILL_PATH, AGENT_SKILLS_INDEX_PATH } from "../src/site/agent-skill-paths.ts";
import { SITE_ROUTES } from "../src/site/site-routes.ts";
import { siteBuiltBeforeTests } from "./site-session.ts";

const site = siteBuiltBeforeTests();

const PUBLIC_SITE = "https://maplacejs.com";
const LINK_ON_PUBLIC_SITE = /\]\(https:\/\/maplacejs\.com([^)\s]*)\)/g;

const served = (path: string) => fetch(new URL(path, site.url));

/** Each `<link>` in the `<head>` of the page at `route`, as written. */
async function headLinks(route: string): Promise<string[]> {
  const html = await (await served(route)).text();
  const head = html.slice(0, html.indexOf("</head>"));
  return head.match(/<link\b[^>]*>/g) ?? [];
}

describe("the served skill", () => {
  // Vite's preview answers an unknown path with the home page and a 200: the type tells them apart.
  it.each([
    [AGENT_SKILL_PATH, "text/markdown"],
    [AGENT_SKILLS_INDEX_PATH, "application/json"],
  ])(
    "serves %s as %s",
    async (path, contentType) => {
      const response = await served(path);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain(contentType);
    },
    30_000,
  );

  it("has an index whose digest is of the bytes served", async () => {
    const indexResponse = await served(AGENT_SKILLS_INDEX_PATH);
    const index = await indexResponse.json();
    expect(index.$schema).toBe("https://schemas.agentskills.io/discovery/0.2.0/schema.json");
    const [entry] = index.skills;
    expect(entry.type).toBe("skill-md");
    const skill = await fetch(new URL(entry.url, indexResponse.url));
    const bytes = Buffer.from(await skill.arrayBuffer());
    expect(entry.digest).toBe(`sha256:${createHash("sha256").update(bytes).digest("hex")}`);
  }, 30_000);

  it("allows any origin to read both", () => {
    const headers = readFileSync(join(site.dir, "_headers"), "utf8");
    expect(headers).toContain("/.well-known/agent-skills/*\n  Access-Control-Allow-Origin: *");
  });

  it.each([...SITE_ROUTES, "/404.html"])(
    "is linked from the head of %s",
    async (route) => {
      const links = (await headLinks(route)).filter(
        (link) => link.includes('rel="describedby"') && link.includes(AGENT_SKILLS_INDEX_PATH),
      );
      expect(links).toHaveLength(1);
    },
    30_000,
  );

  it("links only pages and headings the site has", async () => {
    const skill = await (await served(AGENT_SKILL_PATH)).text();
    const targets = new Set(captures(skill, LINK_ON_PUBLIC_SITE));
    expect(targets.size).toBeGreaterThan(0);
    for (const target of targets) {
      const { pathname, hash } = new URL(target, PUBLIC_SITE);
      expect(existsSync(join(site.dir, pathname, "index.html")), target).toBe(true);
      const page = await served(pathname);
      if (hash !== "") expect(await page.text(), target).toContain(`id="${hash.slice(1)}"`);
    }
  }, 30_000);
});
