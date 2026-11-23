import type { ExampleGroup } from "../example-groups.ts";

export const liveData: ExampleGroup = {
  id: "live-data",
  label: "Live data and loading",
  heading: "Live data and loading",
  intro:
    "Locations fetched as JSON and swapped in live, a GeoJSON file drawn as a layer, a map that loads only when the visitor presses a button, and a link that opens the map on the place picked.",
  summary: "Data swapped in live, a GeoJSON layer, a map loaded on a press, and a link to a place.",
  description:
    "Load map data from JSON or a GeoJSON file, load the map only on click, and share a link to a place, on Google Maps or MapLibre, each with its code.",
  references: [
    { doc: "element", heading: "## Properties and methods" },
    { doc: "element", heading: "## Load states" },
  ],
  sections: [
    {
      name: "live-data",
      title: "Live data from JSON",
      summary:
        "Data sets fetched as JSON and swapped in live: markers, an area, a circle, and on Google a route.",
      description:
        "Load map locations from JSON and swap data sets in live on Google Maps or MapLibre: markers, an area and a circle redrawn from each file fetched.",
    },
    {
      name: "geojson",
      title: "GeoJSON layer",
      summary:
        "A GeoJSON file as the map's layer: points as markers, a line, an area, each with a popup.",
      description:
        "Load a GeoJSON file onto Google Maps or MapLibre: its points become markers, its lines and polygons shapes, and each feature is listed with a popup.",
    },
    {
      name: "load-on-demand",
      title: "Load the map on click",
      summary:
        "A panel in the map's place: the map loads only when the visitor presses its button.",
      description:
        "Load the map only when the visitor asks: a panel stands in its place, and nothing from Google Maps or MapLibre loads until its button is pressed.",
    },
    {
      name: "link-to-place",
      title: "Shareable link to a place",
      summary:
        "A shareable link to the place picked, shown under the map, that opens the map on it.",
      description:
        "A shareable link to a place on a map: the place picked goes in the page's address, and the link opens the map on it, on Google Maps or MapLibre.",
    },
  ],
};
