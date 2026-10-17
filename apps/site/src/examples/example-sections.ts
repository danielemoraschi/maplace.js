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
    summary: "Places with a list beside them, and a popup of your own markup.",
  },
  { name: "circles", title: "Circles", summary: "Areas around a point, by radius in metres." },
  {
    name: "menu",
    title: "Menu",
    summary: "A native select on the map, grouped by region, with an entry for all.",
  },
  {
    name: "tabs",
    title: "Tabs",
    summary: "The list outside the map; a details panel follows the selection.",
  },
  { name: "polyline", title: "Polyline", summary: "A path through points, from inline JSON." },
  {
    name: "polygon",
    title: "Polygon",
    summary: "An area to edit: drag a corner, and the edit is written back.",
  },
  { name: "route", title: "Route", summary: "One route through your own places, in order." },
  {
    name: "mixed",
    title: "Mixed",
    summary: "Markers and a circle, from a JSON file the page fetches.",
  },
  { name: "big", title: "Big", summary: "4,000 points from 0.2's demo, clustered." },
];
