import type { ExampleGroup } from "../example-groups.ts";

export const lists: ExampleGroup = {
  id: "lists",
  label: "Lists and menus",
  headingLead: "Lists and menus",
  intro:
    "Your locations as a list kept in sync with the map. Any list, built-in or your own, sits beside the map or on it in a corner: here a plain list beside it, a select menu and a list of your own on it, and tabs above it with a details panel.",
  summary: "A list, a select menu, a list of your own or tabs: beside the map or on it.",
  description:
    "A list or select menu beside the map or on it, on Google Maps or MapLibre, in sync with it: grouped by region, your own markup, or tabs with details.",
  references: [{ doc: "store", heading: "## List view options" }],
  sections: [
    {
      name: "side-list",
      title: "List beside the map",
      summary:
        "The list outside the map, where it goes by default, grouped by region, with an entry for all.",
      description:
        "A list of map locations beside the map on Google Maps and MapLibre, its default place, grouped by region, with an entry to show them all.",
    },
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
