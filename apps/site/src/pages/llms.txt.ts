import type { APIRoute } from "astro";
import { AGENT_LINKS } from "../site/agent-links.ts";
import { llmsTxt } from "../site/llms-txt.ts";

export const GET: APIRoute = ({ site }) => {
  if (site === undefined) throw new Error("astro.config.ts names no site");
  return new Response(llmsTxt(site, AGENT_LINKS), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
