import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "maplace";
import { createMapLibreMap } from "maplace/maplibre";

const locations: Location[] = [
  { id: "rijks", lat: 52.36, lng: 4.8852, title: "Rijksmuseum", icon: pinFor("Rijks") },
  {
    id: "anne-frank",
    lat: 52.3752,
    lng: 4.884,
    title: "Anne Frank House",
    icon: pinFor("Anne Frank"),
  },
  { id: "hermitage", lat: 52.3654, lng: 4.9025, title: "Hermitage", icon: pinFor("Hermitage") },
  { id: "nemo", lat: 52.3738, lng: 4.9123, title: "NEMO Science Museum", icon: pinFor("NEMO") },
  { id: "eye", lat: 52.3843, lng: 4.9008, title: "Eye Filmmuseum", icon: pinFor("Eye") },
];

createMapLibreMap("#css-markers-maplibre-vanilla-map", { locations });

/**
 * A pin of your own: one node for every state, which maplace marks `data-hovered` and
 * `data-selected`, so the page's CSS gives each state its look.
 */
function pinFor(label: string): HTMLElement {
  const pin = document.createElement("span");
  pin.className = "pin";
  pin.textContent = label;
  return pin;
}
