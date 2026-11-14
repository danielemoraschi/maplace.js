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
      "The maplace-map and maplace-location elements: attributes, properties, events, providers and list views.",
    label: "Element",
  },
  {
    id: "locations",
    file: "docs/reference/locations.md",
    title: "Locations: markers, circles, polylines and polygons",
    description:
      "Every location field, by type: markers, circles, polylines and polygons, with what each one draws and takes.",
    label: "Locations",
  },
  {
    id: "store",
    file: "docs/reference/store.md",
    title: "Store and list view",
    description:
      "The headless store: its options, methods, state and events, the first view of a map, and its list view.",
    label: "Store",
  },
  {
    id: "google",
    file: "docs/reference/google.md",
    title: "Google Maps adapter: map IDs, routes and clustering",
    description:
      "The Google Maps adapter: options, your own map, loading Maps JS, map IDs, routes and clustering.",
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
      "The React binding of Maplace.js: provider, map, list, map controls and the hook that reads the store.",
    label: "React",
  },
  {
    id: "styling",
    file: "docs/reference/styling.md",
    title: "Styling markers, popups and the list with CSS",
    description:
      "Maplace.js's default styles, turning them off, and the classes to style its markup by.",
    label: "Styling",
  },
  {
    id: "accessibility",
    file: "docs/reference/accessibility.md",
    title: "Accessibility",
    description:
      "What Maplace.js does for a keyboard and a screen reader, what was tested and on what, and what wasn't.",
    label: "Accessibility",
  },
  {
    id: "api",
    file: "docs/reference/api.md",
    title: "API reference",
    description:
      "Every export of every entry of the @maplacejs/maplace package, with its error codes and the capabilities of each map provider.",
    label: "API",
  },
  {
    id: "migrating",
    file: "MIGRATION.md",
    title: "Migrating from the 0.2 jQuery plugin",
    description:
      "Every 0.2 option, location field, method and callback, and what 1.0 does with it.",
    label: "Migrating",
  },
];

/** The site's page for the repo document `id`. */
export function docRoute(id: string): string {
  return `/${id}/`;
}

/** Each repo document's page on the site, by its path in the repo. */
export const DOC_ROUTES = Object.fromEntries(REPO_DOCS.map(({ file, id }) => [file, docRoute(id)]));
