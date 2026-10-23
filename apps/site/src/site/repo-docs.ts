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
    title: "Getting started",
    description:
      "Install maplacejs and put a map with a synced list on a page, with one script or a bundler.",
    label: "Getting started",
    pinsScripts: true,
  },
  {
    id: "setup",
    file: "docs/reference/setup.md",
    title: "Setup",
    description:
      "What a map needs: on Google a key, Maps JS and, for production, a map ID; on MapLibre maplibre-gl and a style, OpenFreeMap's by default, with no key. With the element, a script of your own, or npm.",
    label: "Setup",
  },
  {
    id: "element",
    file: "docs/reference/element.md",
    title: "The element",
    description:
      "The maplace-map and maplace-location elements: attributes, properties, events, providers and list views.",
    label: "Element",
  },
  {
    id: "locations",
    file: "docs/reference/locations.md",
    title: "Locations",
    description: "Every location field, by type: markers, circles, polylines and polygons.",
    label: "Locations",
  },
  {
    id: "store",
    file: "docs/reference/store.md",
    title: "Store and list view",
    description: "The headless store's options, methods, state and events, and its list view.",
    label: "Store",
  },
  {
    id: "google",
    file: "docs/reference/google.md",
    title: "Google adapter",
    description:
      "The Google Maps adapter: options, your own map, loading Maps JS, map IDs, routes and clustering.",
    label: "Google",
  },
  {
    id: "maplibre",
    file: "docs/reference/maplibre.md",
    title: "MapLibre adapter",
    description:
      "The MapLibre adapter: options, your own map, styles and tiles, loading maplibre-gl, zoom, clustering, and what differs from Google.",
    label: "MapLibre",
  },
  {
    id: "react",
    file: "docs/reference/react.md",
    title: "React",
    description: "The React binding: provider, map, list, map controls and the store hook.",
    label: "React",
  },
  {
    id: "styling",
    file: "docs/reference/styling.md",
    title: "Styling",
    description:
      "maplacejs's default styles, turning them off, and the classes to style its markup by.",
    label: "Styling",
  },
  {
    id: "api",
    file: "docs/reference/api.md",
    title: "API reference",
    description: "Every export of every entry, the error codes and the capabilities.",
    label: "API",
  },
  {
    id: "migrating",
    file: "MIGRATION.md",
    title: "Migrating from 0.2",
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
