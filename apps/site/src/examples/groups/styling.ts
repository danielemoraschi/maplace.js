import type { ExampleGroup } from "../example-groups.ts";

export const styling: ExampleGroup = {
  id: "styling",
  label: "Styling",
  heading: "Map styles and customizations",
  intro:
    "The provider's map styles, a venue map in its own colours, faces for markers, one brand palette for areas, cluster badges and the list, or Maplace.js's styles turned off for yours.",
  summary: "Your map's look: the provider's own styles, and Maplace.js's parts drawn your way.",
  description:
    "Style a Google Maps or MapLibre map your way: the provider's map styles, a restyled venue map, faces as markers, brand colours, or the default styles off.",
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
        "A restyled venue map on Google Maps or MapLibre: a dark frame, pins coloured by category, a legend that filters them, and a card for the venue picked.",
      drawsOwnFrame: true,
    },
    {
      name: "team",
      title: "A team around the world",
      summary:
        "Faces for markers, list entries of your own with each person's local time, filtered by team.",
      description:
        "A map of a team around the world on Google Maps or MapLibre: faces as markers, list entries with each person's local time, and a filter by team.",
    },
    {
      name: "styled",
      title: "Map styles",
      summary: "The provider's own map styles to choose from, and on Google the map-type control.",
      description:
        "Switch map styles on Google Maps or MapLibre: a choice of the provider's own looks, and on Google the map-type control for satellite and terrain.",
    },
    {
      name: "brand",
      title: "Brand colours",
      summary: "One palette across the delivery areas, the cluster badges and the list.",
      description:
        "Put your brand colours on a Google Maps or MapLibre map: one palette across the delivery areas, the cluster badges and the list beside the map.",
      drawsOwnList: true,
    },
    {
      name: "unstyled",
      title: "Default styles off",
      summary:
        "Maplace.js's styles off and nothing in their place: the map and its list as your page shows them, with no CSS but a height.",
      description:
        "Turn Maplace.js's default styles off and draw the list and the popups with your own CSS, on Google Maps or MapLibre, with nothing left to override.",
    },
  ],
};
