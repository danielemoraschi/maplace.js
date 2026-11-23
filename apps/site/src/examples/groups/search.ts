import type { ExampleGroup } from "../example-groups.ts";

export const search: ExampleGroup = {
  id: "search",
  label: "Search and filters",
  heading: "Search and filters",
  intro:
    "The list and the map narrowed together: tag filters, nested groups with a checkbox each, a search box, the nearest places first, or only those in view.",
  summary: "Tags, nested groups, a search box, nearest first, and only what's in view.",
  description:
    "Store locator parts for Google Maps or MapLibre: filter markers by tag or group, a search box, sort by distance, and search this area as the map moves.",
  references: [{ doc: "store", heading: "## List view options" }],
  sections: [
    {
      name: "tags",
      title: "Filter by tags",
      summary: "Places with several tags: tick some to see those with all of them.",
      description:
        "Filter map markers by tags on Google Maps or MapLibre: tick some tags, and the map and the list keep only the places that have all of them.",
    },
    {
      name: "offices",
      title: "Filter by group",
      summary:
        "Offices by region and country, nested in the list, with a checkbox for each region and country.",
      description:
        "Filter map markers by group with nested checkboxes, offices by region and country, the list and the markers narrowing together on Google Maps or MapLibre.",
    },
    {
      name: "search",
      title: "Search box",
      summary: "A box above the list that narrows the list and the map as you type.",
      description:
        "A search box that filters map markers as you type: the list and the Google Maps or MapLibre map narrow together, with the code for every version.",
    },
    {
      name: "nearest",
      title: "Sort by distance",
      summary: "A button on the map that sorts the list by distance from the visitor.",
      description:
        "Sort map locations by distance from the visitor: a button on the map orders the list nearest first, on Google Maps or MapLibre, with the code to copy.",
    },
    {
      name: "this-area",
      title: "Search this area",
      summary: "A switch above the list: every place, or only those in view as the map moves.",
      description:
        "Show only the places in view as the map moves, like a store locator's search this area, with a switch above the list, on Google Maps or MapLibre.",
    },
  ],
};
