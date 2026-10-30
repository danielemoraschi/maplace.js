import { getEntry } from "astro:content";
import type { APIRoute } from "astro";
import { AGENT_SKILL_NAME } from "../../../../site/agent-skill-paths.ts";

export const GET: APIRoute = async () => {
  const skill = await getEntry("agentSkill", AGENT_SKILL_NAME);
  if (skill === undefined) {
    throw new Error("the agentSkill collection has no entry (content.config.ts)");
  }
  return new Response(skill.data.markdown);
};
