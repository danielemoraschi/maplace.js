import type { ExampleGroup } from "../example-groups.ts";

export const liveData: ExampleGroup = {
  id: "live-data",
  label: "Live data and loading",
  headingLead: "Live data and loading",
  intro:
    "Locations fetched as JSON and swapped in live, a map that loads only when the visitor presses a button, and a link that opens the map on the place picked.",
  summary: "Data swapped in live, a map loaded on a press, and a link to a place.",
  description:
    "Live JSON data, a map loaded on demand and a link that opens it on a place, on Google Maps or MapLibre in JavaScript, each with its code.",
  references: [
    { doc: "element", heading: "## Properties and methods" },
    { doc: "element", heading: "## Load states" },
  ],
  sections: [
    {
      name: "live-data",
      title: "Live data from JSON",
      summary:
        "Data sets, fetched and swapped in live: markers, an area, a circle, and on Google a route.",
    },
    {
      name: "load-on-demand",
      title: "Load on demand",
      summary: "A panel in the map's place: nothing draws until the visitor presses its button.",
    },
    {
      name: "link-to-place",
      title: "Link to a place",
      summary: "A link to the place picked, shown under the map, that opens the map on it.",
    },
  ],
};
