import { API_LISTS } from "../../../../packages/maplace/src/__typetests__/api-lists.ts";
import { elementEventName } from "../../../../packages/maplace/src/element/event-forwarding.ts";
import { eventPropName } from "../../../../packages/maplace/src/react/store-binding.ts";
import {
  type AgentSkillSection,
  type AgentSkillSettings,
  codeList,
  docSection,
  exampleSnippet,
} from "./agent-skill-sources.ts";
import { LOCATION_FIELDS, SHAPE_STYLE_FIELDS, STORE_NAMES } from "./reference-names.ts";
import { GOOGLE_MAP_OPTIONS, MAPLIBRE_MAP_OPTIONS } from "./reference-names-bindings.ts";

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

function events(settings: AgentSkillSettings): string {
  return `## Events

${docSection("store", "## Events", settings)}

The element dispatches them as ${codeList(API_LISTS.events.map(elementEventName))}.

In React, \`MaplaceProvider\` takes them as props: ${codeList(API_LISTS.events.map(eventPropName))}.`;
}

function errors(settings: AgentSkillSettings): string {
  return `## Errors

${docSection("api", "## Errors", settings)}

### Misuse codes

${docSection("api", "## Misuse codes", settings)}

### Runtime failures

${docSection("api", "## Runtime failures", settings)}`;
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
  events,
  errors,
  rules,
];
