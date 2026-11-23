import type { ExampleGroup } from "../example-groups.ts";

export const liveData: ExampleGroup = {
  id: "live-data",
  label: "Live data and loading",
  headingLead: "Live data and loading",
  intro:
    "Locations fetched as JSON and swapped in live, a GeoJSON file drawn as a layer, a map that loads only when the visitor presses a button, and a link that opens the map on the place picked.",
  summary: "Data swapped in live, a GeoJSON layer, a map loaded on a press, and a link to a place.",
  description:
    "Live JSON data, a GeoJSON layer, a map loaded on demand and a link to a place, on Google Maps or MapLibre in JavaScript, each with its code.",
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
      description:
        "Load map locations from JSON on Google Maps and MapLibre: data sets fetched and swapped in live, markers, an area and a circle.",
    },
    {
      name: "geojson",
      title: "GeoJSON layer",
      summary:
        "A GeoJSON file as the map's layer: points as markers, a line, an area, each with a popup.",
      description:
        "Load a GeoJSON file onto Google Maps or MapLibre: its points become markers, its lines and polygons shapes, each feature listed with a popup.",
    },
    {
      name: "load-on-demand",
      title: "Load the map on click",
      summary: "A panel in the map's place: nothing draws until the visitor presses its button.",
      description:
        "Load a map on demand on Google Maps and MapLibre: a panel stands in the map's place, and nothing loads until the visitor presses its button.",
    },
    {
      name: "link-to-place",
      title: "Shareable link to a place",
      summary: "A link to the place picked, shown under the map, that opens the map on it.",
      description:
        "A shareable link to a place on a map, on Google Maps and MapLibre: the place picked goes in the address, and the link opens the map on it.",
    },
  ],
};
