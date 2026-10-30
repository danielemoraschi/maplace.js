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
];
