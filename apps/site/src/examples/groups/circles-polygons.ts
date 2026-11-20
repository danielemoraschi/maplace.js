import type { ExampleGroup } from "../example-groups.ts";

export const circlesPolygons: ExampleGroup = {
  id: "circles-polygons",
  label: "Circles and polygons",
  headingLead: "Circles and polygons",
  intro:
    "Circles and areas in your own colours, with popups: an area to edit, its edit written back to your data, shapes and a marker in one list, and the world's countries shaded by a value.",
  summary: "Circles, an editable polygon, shapes with markers, and a choropleth.",
  description:
    "Circles, polygons and a choropleth on Google Maps or MapLibre in JavaScript: your own colours, popups, and areas edited and written back.",
  references: [
    { doc: "locations", heading: "## Circles" },
    { doc: "locations", heading: "## Polygons" },
    { doc: "locations", heading: "## Multipolygons" },
    { doc: "locations", heading: "## Styles" },
  ],
  sections: [
    {
      name: "circles",
      title: "Circles",
      summary: "Areas in their own colours, with popups; resize the third and see its radius.",
      description:
        "Circles on Google Maps and MapLibre in JavaScript: areas in their own colours, with popups, and one you resize to read its radius.",
    },
    {
      name: "polygon",
      title: "Editable polygon",
      summary: "An area to edit: drag a corner, and the edit is written back.",
      description:
        "An editable polygon on Google Maps and MapLibre in JavaScript: drag a corner to reshape the area, and the edit is written back.",
    },
    {
      name: "mixed",
      title: "Markers and shapes together",
      summary: "A marker, a circle, an area and a line on one map and in one list.",
      description:
        "Markers, circles, polygons and polylines together on one Google Maps or MapLibre map, and in one synced list.",
    },
    {
      name: "choropleth",
      title: "Choropleth of the world",
      summary:
        "Every country filled by its GDP per person, its value on hover, with a legend on the map.",
      description:
        "A choropleth map of the world on Google Maps and MapLibre: every country filled by its GDP per person, its value on hover, with a legend.",
    },
  ],
};
