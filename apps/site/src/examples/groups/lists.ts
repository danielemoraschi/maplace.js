import type { ExampleGroup } from "../example-groups.ts";

export const lists: ExampleGroup = {
  id: "lists",
  label: "Lists and menus",
  heading: "Lists and menus",
  intro:
    "Your locations as a list kept in sync with the map. Any list, built-in or your own, sits beside the map or on it in a corner: here a plain list beside it, a select menu and a list of your own on it, and tabs above it with a details panel.",
  summary: "A list, a select menu, a list of your own or tabs: beside the map or on it.",
  description:
    "A list of locations kept in sync with the map: a sidebar list, a dropdown of places, your own markup or tabs with a details panel, on Google Maps or MapLibre.",
  references: [{ doc: "store", heading: "## List view options" }],
  sections: [
    {
      name: "side-list",
      title: "List beside the map",
      summary:
        "The list outside the map, where it goes by default, grouped by region, with an entry for all.",
      description:
        "A sidebar list of map locations beside Google Maps or MapLibre, grouped by region and kept in sync with the markers, with an entry that shows them all.",
    },
    {
      name: "menu",
      title: "Dropdown of places",
      summary: "A native select on the map, grouped by region, with an entry for all.",
      description:
        "A dropdown of places on a Google Maps or MapLibre map: a native select grouped by region that selects the place picked, with an entry to show them all.",
    },
    {
      name: "custom-list",
      title: "Custom list",
      summary: "A list of your own markup: here a radio per place, and one to fit all, on the map.",
      description:
        "Build a list of map locations from your own markup, here a radio button per place and one to fit them all, kept in sync with Google Maps or MapLibre.",
    },
    {
      name: "tabs",
      title: "List with a details panel",
      summary: "The list outside the map; a details panel follows the selection.",
      description:
        "A list of locations outside the map with a details panel that follows the place selected, kept in sync with the markers on Google Maps or MapLibre.",
      drawsOwnList: true,
    },
  ],
};
