import type { ExampleGroup } from "../example-groups.ts";

export const markers: ExampleGroup = {
  id: "markers",
  label: "Markers and popups",
  headingLead: "Custom markers and popups",
  intro:
    "Places on a map: one pin, markers with image icons or your own markup, HTML markers with hovered and selected looks in your CSS, a place card in each popup, and pins a visitor adds with a click and drags.",
  summary:
    "One pin, your own icons and HTML markers, place cards in popups, and a click to add one.",
  description:
    "Custom markers and popups on Google Maps and MapLibre in JavaScript: image icons, HTML markers styled in CSS, place cards, pins added with a click.",
  references: [
    { doc: "locations", heading: "## Markers" },
    { doc: "store", heading: "## Popup options" },
  ],
  sections: [
    {
      name: "simple",
      title: "One marker",
      summary: "One place on a map.",
      description:
        "The smallest Maplace.js map on Google Maps or MapLibre: one marker from one location, in a script, a bundler or React.",
    },
    {
      name: "markers",
      title: "Custom marker icons",
      summary:
        "One pin for every marker, an image icon, an icon of your own markup, and a place with its own zoom.",
      description:
        "Custom marker icons on Google Maps and MapLibre in JavaScript: one pin for every marker, an image icon, an icon of your own HTML, and a place with its own zoom.",
    },
    {
      name: "css-markers",
      title: "HTML markers with CSS states",
      summary: "Pins of your own markup, their hovered and selected looks in your CSS.",
      description:
        "HTML markers styled with CSS on Google Maps and MapLibre: pins of your own markup, their hover and selected looks in your stylesheet.",
    },
    {
      name: "popups",
      title: "Place cards in popups",
      summary:
        "A place card in each popup: photo, rating, hours, and buttons to open it in Maps or get there.",
      description:
        "Place cards in map popups on Google Maps and MapLibre: photo, rating, opening hours, and buttons to open the place in Maps or get there.",
    },
    {
      name: "click-to-add",
      title: "Click to add and drag markers",
      summary: "A click on the map adds a pin there, and every pin drags to a new place.",
      description:
        "Click on the map to add a marker, and drag any marker to a new place, on Google Maps or MapLibre in JavaScript.",
    },
  ],
};
