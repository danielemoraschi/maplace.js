import type { LatLng, Location } from "maplace";
import { createGoogleMap } from "maplace/google";

const path: LatLng[] = [
  { lat: 44.1, lng: 9.72 },
  { lat: 44.13, lng: 9.68 },
  { lat: 44.14, lng: 9.65 },
];
const locations: Location[] = [
  // Editable: drag a point, or the middle of a segment.
  { id: "trail", type: "polyline", title: "Coast trail", editable: true, path },
  {
    id: "lighthouse",
    lat: 44.104,
    lng: 9.712,
    title: "Lighthouse",
    content: "A lighthouse on the point.",
  },
  { id: "chapel", lat: 44.128, lng: 9.685, title: "Chapel", content: "A chapel above the sea." },
  { id: "lookout", lat: 44.138, lng: 9.657, title: "Lookout", content: "The view over the bay." },
];
createGoogleMap("#polyline-vanilla-map", {
  locations,
  list: { container: "#polyline-vanilla-list" },
});
