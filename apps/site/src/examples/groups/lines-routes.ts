import type { ExampleGroup } from "../example-groups.ts";

export const linesRoutes: ExampleGroup = {
  id: "lines-routes",
  label: "Lines and routes",
  headingLead: "Lines and routes",
  intro:
    "A polyline to edit, great-circle flights, air and sea lanes by colour, and a driving route through your own stops with directions by leg.",
  summary: "An editable polyline, great circles, lanes by colour, and a driving route.",
  description:
    "Polylines, great-circle flights, trade lanes and driving routes on Google Maps or MapLibre in JavaScript, with directions by leg.",
  references: [
    { doc: "locations", heading: "## Polylines" },
    { doc: "store", heading: "## Routes" },
  ],
  sections: [
    {
      name: "polyline",
      title: "Editable polyline",
      summary: "A trail to edit, with places along it.",
    },
    {
      name: "flights",
      title: "Flights",
      summary:
        "Great circles from one city to eight, the scheduled ones dashed; slide the flight to New York along its way.",
    },
    {
      name: "trade-lanes",
      title: "Trade lanes",
      summary: "Air and sea lanes by colour; hover one, pick one for its volume.",
    },
    {
      name: "route",
      title: "Driving route",
      summary:
        "A drive through your own places, with directions by leg: Google computes it live; on MapLibre it's one stored route, as your own routing service would answer.",
    },
  ],
};
