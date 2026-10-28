import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "maplace";
import { createMapLibreMap } from "maplace/maplibre";

const locations: Location[] = [
  {
    id: "rome",
    lat: 41.9028,
    lng: 12.4964,
    title: "Rome",
    content: () => popupOf("Capital of Italy."),
  },
  {
    id: "milan",
    lat: 45.4642,
    lng: 9.19,
    title: "Milan",
    content: () => popupOf("Finance and fashion."),
  },
  {
    id: "naples",
    lat: 40.8518,
    lng: 14.2681,
    title: "Naples",
    content: () => popupOf("Pizza's home town."),
  },
  {
    id: "venice",
    lat: 45.4408,
    lng: 12.3155,
    title: "Venice",
    content: () => popupOf("Built on water."),
  },
];

createMapLibreMap("#unstyled-maplibre-vanilla-map", {
  locations,
  list: { container: "#unstyled-maplibre-vanilla-list" },
});

/** A popup's content: a line about the place, under its title (the popup's heading). */
function popupOf(about: string): HTMLParagraphElement {
  const text = document.createElement("p");
  text.textContent = about;
  return text;
}
