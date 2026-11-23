/** A repo document the site renders as a page of its own. */
export interface RepoDoc {
  /** The page's path segment, and the entry's id. */
  readonly id: string;
  /** Its path in the repo. */
  readonly file: string;
  readonly title: string;
  /** The page's description, for search and sharing. */
  readonly description: string;
  /** Its name in the site's navigation. */
  readonly label: string;
  /** It has the README's pinned CDN scripts, filled in as staging fills them. */
  readonly pinsScripts?: true;
}

/**
 * The repository's page on GitHub: the manifest's `repository`, written out because the header
 * and footer render in a bundled page, where the manifest can't be read (repo-docs.test.ts
 * holds the two together).
 */
export const REPOSITORY_URL = "https://github.com/danielemoraschi/maplace.js";

export const REPO_DOCS: readonly RepoDoc[] = [
  {
    id: "getting-started",
    file: "README.md",
    title: "Embed Google Maps or MapLibre with markers on a website",
    description:
      "Put a Google Map or a MapLibre map with markers and a synced list on a website: one script tag, or npm and React.",
    label: "Getting started",
    pinsScripts: true,
  },
  {
    id: "setup",
    file: "docs/reference/setup.md",
    title: "Setup: a Google Maps key and map ID, or a MapLibre style",
    description:
      "What a map needs: on Google a key, Maps JS and, for production, a map ID; on MapLibre maplibre-gl and a style. With the element, a script of your own, or npm.",
    label: "Setup",
  },
  {
    id: "element",
    file: "docs/reference/element.md",
    title: "The element: a web component for Google Maps and MapLibre",
    description:
      "The <maplace-map> web component: Google Maps or MapLibre with markers and a synced list from HTML attributes, with its properties, events and list views.",
    label: "Element",
  },
  {
    id: "locations",
    file: "docs/reference/locations.md",
    title: "Locations: markers, circles, polylines and polygons",
    description:
      "Every location field, by type: markers, circles, polylines, polygons and multipolygons, with what each one draws and takes.",
    label: "Locations",
  },
  {
    id: "store",
    file: "docs/reference/store.md",
    title: "Headless map store and synced list view",
    description:
      "The headless map store behind every Maplace.js map: options, methods, state and events, the first view, routes, heatmaps, distances and its list view.",
    label: "Store",
  },
  {
    id: "google",
    file: "docs/reference/google.md",
    title: "Google Maps adapter: map IDs, routes and clustering",
    description:
      "Use Maplace.js with Google Maps: adapter options, your own map, loading the Maps JavaScript API, map IDs, routes, marker clustering and heatmaps.",
    label: "Google",
  },
  {
    id: "maplibre",
    file: "docs/reference/maplibre.md",
    title: "MapLibre adapter: styles, tiles and clustering",
    description:
      "The MapLibre adapter: options, your own map, styles and tiles, loading maplibre-gl, zoom, clustering, and what differs from Google.",
    label: "MapLibre",
  },
  {
    id: "react",
    file: "docs/reference/react.md",
    title: "React components for Google Maps and MapLibre",
    description:
      "React components for Google Maps and MapLibre: the provider, the map, the list, map controls, and the hook that reads the store, from @maplacejs/maplace/react.",
    label: "React",
  },
  {
    id: "styling",
    file: "docs/reference/styling.md",
    title: "Styling markers, popups and the list with CSS",
    description:
      "Style Maplace.js markers, popups, cluster badges and the location list with CSS: its default styles, turning them off, and the classes to style by.",
    label: "Styling",
  },
  {
    id: "accessibility",
    file: "docs/reference/accessibility.md",
    title: "Accessible maps: keyboard and screen reader support",
    description:
      "Keyboard and screen reader support in Maplace.js maps: what the map and its list do for each, what was tested and on what, and what wasn't yet.",
    label: "Accessibility",
  },
  {
    id: "api",
    file: "docs/reference/api.md",
    title: "Maplace.js API reference: exports, errors, capabilities",
    description:
      "Every export of every entry of the @maplacejs/maplace package, with its error codes and the capabilities of each map provider.",
    label: "API",
  },
  {
    id: "migrating",
    file: "MIGRATION.md",
    title: "Migrating from the Maplace.js 0.2 jQuery plugin",
    description:
      "Upgrade from the Maplace.js 0.2 jQuery plugin to 1.0: every 0.2 option, location field, method and callback, and what 1.0 does with each of them.",
    label: "Migrating",
  },
];

/** The repo document `id`, which must be one the site renders. */
export function repoDoc(id: string): RepoDoc {
  const doc = REPO_DOCS.find((each) => each.id === id);
  if (doc === undefined) throw new Error(`${id} isn't in REPO_DOCS`);
  return doc;
}

/** The site's page for the repo document `id`. */
export function docRoute(id: string): string {
  return `/${id}/`;
}

/** Each repo document's page on the site, by its path in the repo. */
export const DOC_ROUTES = Object.fromEntries(REPO_DOCS.map(({ file, id }) => [file, docRoute(id)]));
