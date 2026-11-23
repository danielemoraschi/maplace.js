import type { ExampleGroup } from "../example-groups.ts";

export const markers: ExampleGroup = {
  id: "markers",
  label: "Markers and popups",
  heading: "Custom markers and popups",
  intro:
    "Places on a map: one pin, markers with image icons or your own markup, HTML markers with hovered and selected looks in your CSS, a place card in each popup, and pins a visitor adds with a click and drags.",
  summary:
    "One pin, your own icons and HTML markers, place cards in popups, and a click to add one.",
  description:
    "Custom map markers and popups for Google Maps or MapLibre: image icons, HTML markers styled with CSS, place cards in popups, and pins added with a click.",
  references: [
    { doc: "locations", heading: "## Markers" },
    { doc: "store", heading: "## Popup options" },
  ],
  sections: [
    {
      name: "simple",
      title: "One marker",
      summary: "The smallest map there is: one location, drawn as one marker.",
      description:
        "The smallest map with a marker on Google Maps or MapLibre: one location from a script tag, a bundler or React, in a few lines of code you can copy.",
    },
    {
      name: "markers",
      title: "Custom marker icons",
      summary:
        "One pin for every marker, an image icon, an icon of your own markup, and a place with its own zoom.",
      description:
        "Custom marker icons on Google Maps or MapLibre: one pin for every marker, an image icon, an icon of your own HTML, and a place that opens at its own zoom.",
    },
    {
      name: "css-markers",
      title: "HTML markers with CSS states",
      summary: "Markers made of your own HTML, their hovered and selected looks in your CSS.",
      description:
        "Use your own HTML as map markers and style their hover and selected states in CSS, on Google Maps or MapLibre, with the stylesheet to copy.",
    },
    {
      name: "popups",
      title: "Place cards in popups",
      summary:
        "A place card in each popup: photo, rating, hours, and buttons to open it in Maps or get there.",
      description:
        "Show a place card in each map popup on Google Maps or MapLibre: photo, rating, opening hours, and buttons to open the place in Maps or get directions.",
    },
    {
      name: "click-to-add",
      title: "Click to add and drag markers",
      summary: "A click on the map adds a pin there, and every pin drags to a new place.",
      description:
        "Add a marker where the visitor clicks the map, and drag any marker to a new place, on Google Maps or MapLibre: an HTML page, a script, a bundler or React.",
    },
  ],
};
