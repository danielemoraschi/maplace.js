import type { ExampleGroup } from "../example-groups.ts";

export const markers: ExampleGroup = {
  id: "markers",
  label: "Markers and popups",
  headingLead: "Markers and popups",
  intro:
    "Places on a map: one pin, markers with image icons or an icon of your own markup, a place card in each popup, and pins a visitor adds with a click and drags.",
  summary: "One pin, your own icons, place cards in popups, and a click to add one.",
  description:
    "Markers and popups on Google Maps and MapLibre in JavaScript: custom icons, place cards in popups, and pins added with a click and dragged.",
  references: [
    { doc: "locations", heading: "## Markers" },
    { doc: "store", heading: "## Popup options" },
  ],
  sections: [
    { name: "simple", title: "One marker", summary: "One place on a map." },
    {
      name: "markers",
      title: "Custom marker icons",
      summary: "Image icons, an icon of your own markup, and a place with its own zoom.",
    },
    {
      name: "popups",
      title: "Place cards in popups",
      summary:
        "A place card in each popup: photo, rating, hours, and buttons to open it in Maps or get there.",
    },
    {
      name: "click-to-add",
      title: "Click to add and drag markers",
      summary: "A click on the map adds a pin there, and every pin drags to a new place.",
    },
  ],
};
