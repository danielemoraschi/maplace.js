import {
  type AgentSkillSection,
  type AgentSkillSettings,
  codeList,
  docSection,
  exampleSnippet,
  pageUrl,
} from "./agent-skill-sources.ts";
import { LOCATION_FIELDS, SHAPE_STYLE_FIELDS, STORE_NAMES } from "./reference-names.ts";
import { GOOGLE_MAP_OPTIONS, MAPLIBRE_MAP_OPTIONS } from "./reference-names-bindings.ts";
import { docRoute } from "./repo-docs.ts";

function locations(): string {
  return `## Locations

${exampleSnippet("polygon", "vanilla.ts")}

- Every location has ${codeList(LOCATION_FIELDS.common)}.
- A marker adds ${codeList(LOCATION_FIELDS.marker)}.
- A circle adds ${codeList(LOCATION_FIELDS.circle)}.
- A polyline adds ${codeList(LOCATION_FIELDS.polyline)}.
- A polygon adds ${codeList(LOCATION_FIELDS.polygon)}.
- A shape's style has ${codeList(SHAPE_STYLE_FIELDS)}.`;
}

function options(): string {
  return `## Options

- \`createMaplace\` takes ${codeList(STORE_NAMES.options)}.
- \`popup\` takes ${codeList(STORE_NAMES.popupOptions)}.
- The store's methods are ${codeList(STORE_NAMES.methods)}.
- \`createGoogleMap\` adds ${codeList(GOOGLE_MAP_OPTIONS)}.
- \`createMapLibreMap\` adds ${codeList(MAPLIBRE_MAP_OPTIONS)}.

A location's \`html\` needs \`sanitize\`.`;
}

function capabilities(settings: AgentSkillSettings): string {
  return `## Adapters and capabilities

${docSection("api", "## Capabilities", settings)}`;
}

function eventsAndErrors({ site }: AgentSkillSettings): string {
  const link = (label: string, id: string, anchor: string) =>
    `[${label}](${pageUrl(docRoute(id), site)}#${anchor})`;
  return `## Events and errors

Events: ${link("the store's", "store", "events")}, ${link("the element's", "element", "events")}, ${link("React's props", "react", "event-props")}.

Errors: ${link("what they carry", "api", "errors")}, ${link("misuse codes", "api", "misuse-codes")}, ${link("runtime failures", "api", "runtime-failures")}.`;
}

function rules(settings: AgentSkillSettings): string {
  return `## The API's rules

${docSection("api", "## Rules", settings)}`;
}

/** The API's names and rules, in reading order. */
export const API_SECTIONS: readonly AgentSkillSection[] = [
  locations,
  options,
  capabilities,
  eventsAndErrors,
  rules,
];
