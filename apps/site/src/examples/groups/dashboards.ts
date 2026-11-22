import type { ExampleGroup } from "../example-groups.ts";

export const dashboards: ExampleGroup = {
  id: "dashboards",
  label: "Data dashboards",
  headingLead: "Map dashboards and data visualization",
  intro:
    "Figures on a map: viewers by region as cards with a period switch, each country's share as a badge, cities as bubbles sized by population, and countries shaded by a value.",
  summary: "Cards with a period switch, shares by country, bubbles, and a choropleth.",
  description:
    "Map dashboards and data visualization on Google Maps or MapLibre: cards by region, shares by country, a bubble map and a choropleth.",
  references: [
    { doc: "locations", heading: "## Markers" },
    { doc: "locations", heading: "## Polylines" },
    { doc: "locations", heading: "## Multipolygons" },
    { doc: "store", heading: "## List view options" },
  ],
  sections: [
    {
      name: "audience",
      title: "Audience dashboard",
      summary: "Viewers by region as cards on the map, arcs from the studio, and a period switch.",
      description:
        "A map dashboard on Google Maps and MapLibre: viewers by region as cards, arcs from the studio, a period switch and a total.",
    },
    {
      name: "share-by-country",
      title: "Share by country",
      summary:
        "Six countries in their own colours, a badge with each one's share, the list as legend.",
      description:
        "A share-by-country map on Google Maps and MapLibre: six countries in their own colours, a badge with each share, and the list as the legend.",
    },
    {
      name: "bubbles",
      title: "Bubble map",
      summary: "Cities as bubbles sized by population, a legend, and a count of what is in view.",
      description:
        "A bubble map on Google Maps and MapLibre: the largest cities as circles sized by population, a size legend, and a count of the cities in view.",
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
