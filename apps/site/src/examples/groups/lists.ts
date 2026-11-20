import type { ExampleGroup } from "../example-groups.ts";

export const lists: ExampleGroup = {
  id: "lists",
  label: "Lists and menus",
  headingLead: "Lists and menus",
  intro:
    "Your locations as a list kept in sync with the map: a select menu grouped by region, a list of your own markup, or tabs with a details panel that follows the selection.",
  summary: "A select menu, a list of your own, or tabs with a details panel.",
  description:
    "A list or select menu beside the map on Google Maps or MapLibre, in sync with it: grouped by region, your own markup, or tabs with details.",
  references: [{ doc: "store", heading: "## List view options" }],
  sections: [
    {
      name: "menu",
      title: "Select menu",
      summary: "A native select on the map, grouped by region, with an entry for all.",
      description:
        "A select menu of map locations on Google Maps and MapLibre: a native select on the map, grouped by region, with an entry to show them all.",
    },
    {
      name: "custom-list",
      title: "Your own list",
      summary: "Define your own: here a radio per place, and one to fit all, on the map.",
      description:
        "Your own list of map locations on Google Maps and MapLibre in JavaScript: here a radio button per place, and one to fit them all.",
    },
    {
      name: "tabs",
      title: "Tabs",
      summary: "The list outside the map; a details panel follows the selection.",
      description:
        "Map locations as tabs outside the map on Google Maps and MapLibre, with a details panel that follows the place selected.",
      drawsOwnList: true,
    },
  ],
};
