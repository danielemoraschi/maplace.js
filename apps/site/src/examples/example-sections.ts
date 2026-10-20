/** A section of the home page: one example, its live map and its code. */
export interface ExampleSection {
  /** Its folder in `packages/maplace/examples/`. */
  readonly name: string;
  readonly title: string;
  readonly summary: string;
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
    title: "Custom list",
    summary: "A list of your own on the map: a radio per place, and fit all.",
  },
  {
    name: "tabs",
    title: "Tabs",
    summary: "The list outside the map; a details panel follows the selection.",
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
  },
  {
    name: "mixed",
    title: "Mixed",
    summary: "Five data sets, fetched and swapped in live: markers, a route, an area, a circle.",
  },
  {
    name: "styled",
    title: "Styled",
    summary: "Google's own look: a light or dark map, and the map-type control.",
  },
  { name: "big", title: "Cluster", summary: "4,000 points, clustered." },
];
