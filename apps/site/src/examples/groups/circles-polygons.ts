import type { ExampleGroup } from "../example-groups.ts";

export const circlesPolygons: ExampleGroup = {
  id: "circles-polygons",
  label: "Circles and polygons",
  heading: "Circles and polygons",
  intro:
    "Circles and areas in your own colours, with popups: an area to edit, its edit written back to your data, and shapes and a marker in one list.",
  summary: "Circles, an editable polygon, and shapes with markers.",
  description:
    "Draw circles and polygons on Google Maps or MapLibre in your own colours, with popups; edit an area by dragging and get the new shape back in your data.",
  references: [
    { doc: "locations", heading: "## Circles" },
    { doc: "locations", heading: "## Polygons" },
    { doc: "locations", heading: "## Styles" },
  ],
  sections: [
    {
      name: "circles",
      title: "Circles",
      summary: "Circles in their own colours, with popups; resize the third and see its radius.",
      description:
        "Draw circles on Google Maps or MapLibre in their own colours, with popups, and resize one by dragging its edge to read its new radius.",
    },
    {
      name: "polygon",
      title: "Editable polygon",
      summary: "A polygon to edit: drag a corner, and the edit is written back.",
      description:
        "An editable polygon on Google Maps or MapLibre: drag a corner to reshape the area, and the new shape is written back to your data, ready to save.",
    },
    {
      name: "mixed",
      title: "Markers and shapes together",
      summary: "A marker, a circle, an area and a line on one map and in one list.",
      description:
        "Markers, circles, polygons and polylines together on one Google Maps or MapLibre map, and every one of them in one list kept in sync with it.",
    },
  ],
};
