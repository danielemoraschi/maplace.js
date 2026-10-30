/** The skill's name in its frontmatter and its index, and the folder it is served from. */
export const AGENT_SKILL_NAME = "maplace";

/** Where Agent Skills Discovery looks for a site's skills. */
export const AGENT_SKILLS_INDEX_PATH = "/.well-known/agent-skills/index.json";

export const AGENT_SKILL_PATH = `/.well-known/agent-skills/${AGENT_SKILL_NAME}/SKILL.md`;

/** What tells an agent when to load the skill: its frontmatter's, and its index entry's. */
export const AGENT_SKILL_DESCRIPTION =
  "Write maplacejs 1.0 maps: a list of locations becomes a Google Maps or MapLibre map with a synced list, through the maplace-map element, a CDN script, the npm package `maplace` or its React binding. Use it when someone wants a map with markers, circles, polylines or polygons on a page, or names maplace or maplacejs. It teaches 1.0's API, not the 0.2 jQuery plugin's.";
