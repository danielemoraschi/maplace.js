import type { ExampleGroup } from "../example-groups.ts";

export const styling: ExampleGroup = {
  id: "styling",
  label: "Styling",
  headingLead: "Map styles and customizations",
  intro:
    "The provider's map styles, a venue map in its own colours, faces for markers, one brand palette for areas, cluster badges and the list, or Maplace.js's styles turned off for yours.",
  summary: "Your map's look: the provider's own styles, and Maplace.js's parts drawn your way.",
  description:
    "Your own look on Google Maps or MapLibre: map styles, faces as markers, brand colours, or Maplace.js's own styles turned off.",
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
      description:
        "A restyled venue map on Google Maps and MapLibre: a dark frame, pins coloured by category, a legend that filters them, and a venue card.",
      drawsOwnFrame: true,
    },
    {
      name: "team",
      title: "A team around the world",
      summary:
        "Faces for markers, list entries of your own with each person's local time, filtered by team.",
      description:
        "A team map on Google Maps and MapLibre: faces as markers, list entries with each person's local time, filtered by team.",
    },
    {
      name: "styled",
      title: "Map styles",
      summary: "The provider's own looks: a choice of styles, and on Google the map-type control.",
      description:
        "Map styles on Google Maps and MapLibre in JavaScript: a choice of the provider's own looks, and on Google the map-type control.",
    },
    {
      name: "brand",
      title: "Brand colours",
      summary: "One palette across the delivery areas, the cluster badges and the list.",
      description:
        "Brand colours on a Google Maps or MapLibre map: one palette across the delivery areas, the cluster badges and the list.",
      drawsOwnList: true,
    },
    {
      name: "unstyled",
      title: "Default styles off",
      summary:
        "Maplace.js's styles off and nothing in their place: the map and its list as your page shows them, with no CSS but a height.",
      description:
        "Maplace.js with its default styles off, on Google Maps and MapLibre: the map and its list as your page's own CSS draws them.",
    },
  ],
};
