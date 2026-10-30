import { createHash } from "node:crypto";
import {
  AGENT_SKILL_DESCRIPTION,
  AGENT_SKILL_NAME,
  AGENT_SKILL_PATH,
} from "./agent-skill-paths.ts";

const DISCOVERY_SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json";

/** The Agent Skills Discovery index of a site whose one skill is `skillMarkdown`. */
export function agentSkillsIndex(skillMarkdown: string): string {
  const index = {
    $schema: DISCOVERY_SCHEMA,
    skills: [
      {
        name: AGENT_SKILL_NAME,
        type: "skill-md",
        description: AGENT_SKILL_DESCRIPTION,
        url: AGENT_SKILL_PATH,
        digest: digestOf(skillMarkdown),
      },
    ],
  };
  return `${JSON.stringify(index, null, 2)}\n`;
}

/** The spec's digest of `text` as served: a string hashes as its UTF-8 bytes. */
function digestOf(text: string): string {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}
