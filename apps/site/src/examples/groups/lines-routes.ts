import type { ExampleGroup } from "../example-groups.ts";

export const linesRoutes: ExampleGroup = {
  id: "lines-routes",
  label: "Lines and routes",
  heading: "Lines and routes",
  intro:
    "A polyline to edit, great-circle flights, air and sea lanes by colour, and a driving route through your own stops with directions by leg.",
  summary: "An editable polyline, great circles, lanes by colour, and a driving route.",
  description:
    "Polylines, great-circle flight paths, trade routes by colour and a driving route with directions by leg, on Google Maps or MapLibre, each with its code.",
  references: [
    { doc: "locations", heading: "## Polylines" },
    { doc: "store", heading: "## Routes" },
  ],
  sections: [
    {
      name: "polyline",
      title: "Editable polyline",
      summary: "A polyline to edit: a trail, with places along it.",
      description:
        "An editable polyline on Google Maps or MapLibre: a trail you reshape by dragging its points, with the places along it listed beside the map.",
    },
    {
      name: "flights",
      title: "Flight paths",
      summary:
        "Great circles from one city to eight, the scheduled ones dashed; slide the flight to New York along its way.",
      description:
        "Flight paths as great circles on Google Maps or MapLibre: one city to eight, scheduled flights dashed, and a slider that moves a flight along its path.",
    },
    {
      name: "trade-lanes",
      title: "Trade routes",
      summary: "Air and sea trade lanes by colour; hover one, pick one for its volume.",
      description:
        "Trade routes on a map: air and sea lanes coloured by mode, highlighted on hover, with a lane's volume when picked, on Google Maps or MapLibre.",
    },
    {
      name: "route",
      title: "Driving route",
      summary:
        "A drive through your own places, with directions by leg: Google computes it live; on MapLibre it's one stored route, as your own routing service would answer.",
      description:
        "A driving route through your own stops with directions by leg: computed live on Google Maps, and on MapLibre a stored route, as your routing would answer.",
    },
  ],
};
