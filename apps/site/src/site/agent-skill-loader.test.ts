import { createHash } from "node:crypto";
import type { LoaderContext } from "astro/loaders";
import { describe, expect, it, vi } from "vitest";
import { agentSkillLoader } from "./agent-skill-loader.ts";
import { AGENT_SKILL_NAME } from "./agent-skill-paths.ts";

vi.mock("./cdn-pin.ts", () => ({
  cdnPin: async () => ({
    version: "1.2.3",
    integrityOf: (file: string) => `sha384-of-${file}`,
  }),
}));

function contextOn(site: string | undefined) {
  const entries: { id: string; data: { markdown: string; index: string } }[] = [];
  const clear = vi.fn();
  const store = { clear, set: (entry: (typeof entries)[number]) => entries.push(entry) };
  const context = { store, config: { site } } as unknown as LoaderContext;
  return { context, entries, clear };
}

describe("agentSkillLoader", () => {
  it("stores the skill and an index naming those very bytes", async () => {
    const { context, entries, clear } = contextOn("https://example.test");
    await agentSkillLoader().load(context);
    expect(clear).toHaveBeenCalledOnce();
    expect(entries.map(({ id }) => id)).toEqual([AGENT_SKILL_NAME]);
    const { markdown, index } = (entries[0] as (typeof entries)[number]).data;
    const digest = createHash("sha256").update(Buffer.from(markdown, "utf8")).digest("hex");
    expect(JSON.parse(index).skills[0].digest).toBe(`sha256:${digest}`);
  });

  it("refuses a site with no address, naming the setting", async () => {
    const { context } = contextOn(undefined);
    await expect(agentSkillLoader().load(context)).rejects.toThrow("astro.config.ts names no site");
  });
});
