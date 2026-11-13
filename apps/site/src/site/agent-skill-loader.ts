import type { Loader } from "astro/loaders";
import { agentSkillMarkdown } from "./agent-skill.ts";
import { AGENT_SKILL_NAME } from "./agent-skill-paths.ts";
import { agentSkillsIndex } from "./agent-skills-index.ts";
import { cdnPin } from "./cdn-pin.ts";
import { configuredSite } from "./configured-site.ts";
import { siteBlobBase } from "./site-blob-base.ts";

/**
 * The content loader of the `agentSkill` collection: one entry, the skill and its index computed
 * together, so the index's digest can only name the bytes served.
 */
export function agentSkillLoader(): Loader {
  return {
    name: "agent-skill",
    async load({ store, config }) {
      const markdown = agentSkillMarkdown({
        pin: await cdnPin(),
        blobBase: siteBlobBase(),
        site: configuredSite(config.site),
      });
      store.clear();
      store.set({ id: AGENT_SKILL_NAME, data: { markdown, index: agentSkillsIndex(markdown) } });
    },
  };
}
