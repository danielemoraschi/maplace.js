import { API_SECTIONS } from "./agent-skill-api-sections.ts";
import { AGENT_SKILL_DESCRIPTION, AGENT_SKILL_NAME } from "./agent-skill-paths.ts";
import { USING_MAPLACE_SECTIONS } from "./agent-skill-sections.ts";
import type { AgentSkillSettings } from "./agent-skill-sources.ts";

/** The whole `SKILL.md`. The description as a JSON string is a valid YAML double-quoted scalar. */
export function agentSkillMarkdown(settings: AgentSkillSettings): string {
  const frontmatter = `---\nname: ${AGENT_SKILL_NAME}\ndescription: ${JSON.stringify(AGENT_SKILL_DESCRIPTION)}\n---`;
  const sections = [...USING_MAPLACE_SECTIONS, ...API_SECTIONS].map((write) => write(settings));
  return `${[frontmatter, ...sections].join("\n\n")}\n`;
}
