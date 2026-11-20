import type { ExampleGroup } from "../example-groups.ts";

export const search: ExampleGroup = {
  id: "search",
  label: "Search and filters",
  headingLead: "Search and filters",
  intro:
    "The list and the map narrowed together: tag filters, nested groups with a checkbox each, a search box, the nearest places first, or only those in view.",
  summary: "Tags, nested groups, a search box, nearest first, and only what's in view.",
  description:
    "A store locator's parts on Google Maps or MapLibre: tag and group filters, a search box, the nearest places first, and only the places in view.",
  references: [{ doc: "store", heading: "## List view options" }],
  sections: [
    {
      name: "tags",
      title: "Filter by tags",
      summary: "Places with several tags: tick some to see those with all of them.",
      description:
        "Filter map markers by tags on Google Maps and MapLibre in JavaScript: tick some tags to see the places that have all of them.",
    },
    {
      name: "offices",
      title: "Filter by group",
      summary:
        "Offices by region and country, nested in the list, with a checkbox for each region and country.",
      description:
        "Filter map markers by group on Google Maps and MapLibre: offices nested by region and country, with a checkbox for each.",
    },
    {
      name: "search",
      title: "Search box",
      summary: "A box above the list that narrows the list and the map as you type.",
      description:
        "A search box that filters map markers as you type, on Google Maps and MapLibre: the list and the map narrow together.",
    },
    {
      name: "nearest",
      title: "Nearest first",
      summary: "A button on the map that sorts the list by distance from the visitor.",
      description:
        "Sort map locations by distance from the visitor on Google Maps and MapLibre: a button on the map orders the list nearest first.",
    },
    {
      name: "this-area",
      title: "This area",
      summary: "A switch above the list: every place, or only those in view as the map moves.",
      description:
        "Show only the places in view as the map moves, on Google Maps and MapLibre: a switch above the list between every place and this area.",
    },
  ],
};
