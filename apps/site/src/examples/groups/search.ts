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
    },
    {
      name: "offices",
      title: "Filter by group",
      summary:
        "Offices by region and country, nested in the list, with a checkbox for each region and country.",
    },
    {
      name: "search",
      title: "Search box",
      summary: "A box above the list that narrows the list and the map as you type.",
    },
    {
      name: "nearest",
      title: "Nearest first",
      summary: "A button on the map that sorts the list by distance from the visitor.",
    },
    {
      name: "this-area",
      title: "This area",
      summary: "A switch above the list: every place, or only those in view as the map moves.",
    },
  ],
};
