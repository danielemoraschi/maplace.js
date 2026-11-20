import type { ExampleGroup } from "../example-groups.ts";

export const styling: ExampleGroup = {
  id: "styling",
  label: "Styling",
  headingLead: "Map styles and custom markers",
  intro:
    "The provider's map styles, markers of your own HTML and CSS, one brand palette for areas, cluster badges and the list, or Maplace.js's styles turned off for yours.",
  summary: "Your map's look: the provider's own styles, and Maplace.js's parts drawn your way.",
  description:
    "Your own look on Google Maps or MapLibre: map styles, custom HTML markers, brand colours, or Maplace.js's own styles turned off.",
  references: [
    { doc: "styling", heading: "## Pin colours" },
    { doc: "styling", heading: "## Classes" },
  ],
  sections: [
    {
      name: "whats-on",
      title: "Restyled venue map",
      summary:
        "A dark frame, pins coloured by category, a legend that filters them and a card of the venues, or of the one picked.",
      drawsOwnFrame: true,
    },
    {
      name: "team",
      title: "A team around the world",
      summary:
        "Faces for markers, list entries of your own with each person's local time, filtered by team.",
    },
    {
      name: "styled",
      title: "Map styles",
      summary: "The provider's own looks: a choice of styles, and on Google the map-type control.",
    },
    {
      name: "css-markers",
      title: "HTML markers with CSS states",
      summary: "Pins of your own markup, their hovered and selected looks in your CSS.",
    },
    {
      name: "brand",
      title: "Brand colours",
      summary: "One palette across the delivery areas, the cluster badges and the list.",
      drawsOwnList: true,
    },
    {
      name: "unstyled",
      title: "Default styles off",
      summary:
        "Maplace.js's styles off and nothing in their place: the map and its list as your page shows them, with no CSS but a height.",
    },
  ],
};
