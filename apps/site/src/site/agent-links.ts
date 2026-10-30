import { AGENT_SKILL_PATH, AGENT_SKILLS_INDEX_PATH } from "./agent-skill-paths.ts";

/** Something on the site written for an AI agent to read. */
export interface AgentLink {
  readonly href: string;
  readonly label: string;
  /** What it holds, in a line. */
  readonly what: string;
}

export const LLMS_TXT_ROUTE = "/llms.txt";

/** What an agent reads first: on the AI agents page, and but for itself in `llms.txt`. */
export const AGENT_LINKS: readonly AgentLink[] = [
  {
    href: LLMS_TXT_ROUTE,
    label: "llms.txt",
    what: "The site in a paragraph, then every page's address, in Markdown where it has it, with a line on what it holds.",
  },
  {
    href: AGENT_SKILL_PATH,
    label: "SKILL.md",
    what: "The agent skill: install, the element, locations, adapters, events, error codes and React, in one file an agent can load.",
  },
  {
    href: AGENT_SKILLS_INDEX_PATH,
    label: "Agent Skills index",
    what: "The Agent Skills Discovery index: the skill's name, its description and the sha256 of its bytes.",
  },
];
