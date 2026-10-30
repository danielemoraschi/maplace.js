import { LOCATION_ATTRIBUTES } from "../../../../packages/maplace/src/element/location-attributes.ts";
import { CDN_SCRIPTS } from "../../../../scripts/build/cdn-builds.ts";
import { pinnedSnippetOf, withPinnedScripts } from "../../../../scripts/build/cdn-pins.ts";
import { readRootFile } from "../../../../scripts/build/package.ts";
import {
  type AgentSkillSection,
  type AgentSkillSettings,
  codeList,
  docSection,
  exampleSnippet,
  pageUrl,
} from "./agent-skill-sources.ts";
import {
  GOOGLE_PROVIDER_ATTRIBUTES,
  MAP_ATTRIBUTES,
  MAPLIBRE_PROVIDER_ATTRIBUTES,
} from "./element-attributes.ts";
import { installOf, type ProviderInstall } from "./install-loader.ts";
import { MAP_ELEMENT_PROPERTIES, REACT_PROPS } from "./reference-names-bindings.ts";
import { docRoute, REPO_DOCS } from "./repo-docs.ts";

function intro({ site }: AgentSkillSettings): string {
  const docs = REPO_DOCS.map(
    ({ id, label, description }) => `- [${label}](${pageUrl(docRoute(id), site)}): ${description}`,
  );
  return `# Make a map with maplacejs

maplacejs turns a list of locations into a map with a synced list, on Google Maps or on MapLibre. It keeps what is selected and hovered in one store that the map, the list and your code all read.

This is a rewrite. There is no jQuery and no \`new Maplace(options).Load()\`: that is 0.2, so never write it. To move a 0.2 page, read [Migrating](${pageUrl(docRoute("migrating"), site)}).

The docs:

${docs.join("\n")}`;
}

function providerInstall({ label, npmCommand, cdnSnippet }: ProviderInstall): string {
  return `${label}:

\`\`\`sh
${npmCommand}
\`\`\`

\`\`\`html
${cdnSnippet}
\`\`\``;
}

function install({ pin }: AgentSkillSettings): string {
  const providers = installOf(pin).providers.map(providerInstall);
  return `## Install

${providers.join("\n\n")}

\`maplace@1\` follows the latest 1.x and can't carry an integrity hash: pin in production. Google's plain script has no clusterer; for \`cluster\`, this one instead:

\`\`\`html
${pinnedSnippetOf(withPinnedScripts(readRootFile("README.md"), pin), CDN_SCRIPTS.cluster)}
\`\`\``;
}

function setup(settings: AgentSkillSettings): string {
  return `## What a map needs

${docSection("setup", "## Key and Map ID", settings)}

${docSection("setup", "## Style URL", settings)}

From npm the page loads Maps JS: pass \`apiKey\` to \`createGoogleMap\`, or load Google's loader first. A map fills its container, so give the container a height; the element is 24rem tall by default.`;
}

function element({ site }: AgentSkillSettings): string {
  return `## The element

One script, no build step. In a bundled app, \`import "maplace/element/google"\` or \`"maplace/element/maplibre"\` defines the same elements instead; on MapLibre, also import \`maplibre-gl/dist/maplibre-gl.css\`.

${exampleSnippet("quick-start", "page.html")}

${exampleSnippet("quick-start/maplibre", "page.html")}

A shape's points don't fit an attribute: a polygon or polyline goes in a JSON script, or the \`locations\` property.

${exampleSnippet("polygon", "page.html")}

\`save\` is your own function: nothing defines it for you.

- \`<maplace-map>\` reads ${codeList(MAP_ATTRIBUTES)}.
- On Google it also reads ${codeList(GOOGLE_PROVIDER_ATTRIBUTES)}.
- On MapLibre it also reads ${codeList(MAPLIBRE_PROVIDER_ATTRIBUTES)}.
- \`<maplace-location>\` reads ${codeList(LOCATION_ATTRIBUTES)}.
- \`<maplace-map>\`'s properties are ${codeList(MAP_ELEMENT_PROPERTIES)}.

What each does: [the element](${pageUrl(docRoute("element"), site)}).`;
}

function ownScript(): string {
  return `## A script of your own

The CDN script also sets the page's \`Maplace\`, for a map made in your own script.

${exampleSnippet("simple", "script.html")}

The MapLibre script's \`Maplace\` has \`createMapLibreMap\`, called the same way.`;
}

function npm(): string {
  return `## npm and a bundler

Each module runs on a page that gives it what it mounts on, and on Google loads Maps JS.

${exampleSnippet("simple", "vanilla.html")}

${exampleSnippet("simple", "vanilla.ts")}

${exampleSnippet("simple/maplibre", "vanilla.html")}

${exampleSnippet("simple/maplibre", "vanilla.ts")}

\`createGoogleMap\` and \`createMapLibreMap\` are \`createMaplace(options)\` then \`attach(adapter, container)\` in one call.`;
}

function react(): string {
  return `## React

${exampleSnippet("simple", "react.tsx")}

It runs on a page like the npm one: an element with the id it renders into, a height for its \`.map\`, and, on Google, Maps JS loaded. On MapLibre it differs by \`createMapLibreAdapter\` from \`maplace/maplibre\` and by importing \`maplibre-gl/dist/maplibre-gl.css\`.

- \`MaplaceProvider\` takes ${codeList(REACT_PROPS.provider)}.
- \`MaplaceMap\` takes ${codeList(REACT_PROPS.map)}.
- \`LocationList\` takes ${codeList(REACT_PROPS.list)}.
- \`MapControl\` takes ${codeList(REACT_PROPS.control)}.

Inside the provider, \`useMaplace\` gives a component the store.`;
}

/** How to get a map on a page, in reading order. */
export const USING_MAPLACE_SECTIONS: readonly AgentSkillSection[] = [
  intro,
  install,
  setup,
  element,
  ownScript,
  npm,
  react,
];
