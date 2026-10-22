/** A section of the home page: one example, its live map and its code. */
export interface ExampleSection {
  /** Its folder in `packages/maplace/examples/`. */
  readonly name: string;
  readonly title: string;
  readonly summary: string;
  /** Its list drawn its own way (as tabs), not in the site's panel beside the map. */
  readonly drawsOwnList?: true;
  /** Why it runs on Google only, said beside the MapLibre choice. */
  readonly googleOnlyBecause?: string;
}

/** The examples, in RFC §2's order (D23). */
export const EXAMPLE_SECTIONS: readonly ExampleSection[] = [
  { name: "simple", title: "Simple", summary: "One place on a map." },
  {
    name: "markers",
    title: "Markers",
    summary:
      "Image icons and popups, a list on the map, one place listed nowhere: click the map to add one.",
  },
  {
    name: "circles",
    title: "Circles",
    summary: "Areas in their own colours, with popups; resize the third and see its radius.",
  },
  {
    name: "menu",
    title: "Menu",
    summary: "A native select on the map, grouped by region, with an entry for all.",
  },
  {
    name: "custom-list",
    title: "Your own list",
    summary: "A list you build: a radio per place, and fit all, on the map.",
  },
  {
    name: "tabs",
    title: "Tabs",
    summary: "The list outside the map; a details panel follows the selection.",
    drawsOwnList: true,
  },
  {
    name: "polyline",
    title: "Polyline",
    summary: "A trail to edit, with places along it.",
  },
  {
    name: "polygon",
    title: "Polygon",
    summary: "An area to edit: drag a corner, and the edit is written back.",
  },
  {
    name: "route",
    title: "Route",
    summary: "A drive through your own places, passing through one, with directions by leg.",
    googleOnlyBecause: "MapLibre has no routing.",
  },
  {
    name: "mixed",
    title: "Mixed",
    summary:
      "Five data sets, fetched and swapped in live: markers, an area, a circle, and on Google a route.",
  },
  {
    name: "styled",
    title: "Styled",
    summary: "The provider's own look: a light or dark map, and on Google the map-type control.",
  },
  { name: "big", title: "Cluster", summary: "4,000 points, clustered." },
];
