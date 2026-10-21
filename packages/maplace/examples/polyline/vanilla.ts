import type { LatLng, Location } from "maplace";
import { createGoogleMap } from "maplace/google";

// Cinque Terre's coastal path, Riomaggiore to Monterosso, through the villages between.
const path: LatLng[] = [
  { lat: 44.0996, lng: 9.7377 },
  { lat: 44.1066, lng: 9.7285 },
  { lat: 44.1197, lng: 9.7103 },
  { lat: 44.1348, lng: 9.6847 },
  { lat: 44.1462, lng: 9.6548 },
];
const locations: Location[] = [
  // Editable: drag a point, or the middle of a segment.
  { id: "trail", type: "polyline", title: "Sentiero Azzurro", editable: true, path },
  {
    id: "manarola",
    lat: 44.1066,
    lng: 9.7285,
    title: "Manarola",
    content: "Its harbour, and the houses above it.",
  },
  {
    id: "corniglia",
    lat: 44.1197,
    lng: 9.7103,
    title: "Corniglia",
    content: "The village on the cliff top.",
  },
  {
    id: "vernazza",
    lat: 44.1348,
    lng: 9.6847,
    title: "Vernazza",
    content: "A harbour and its castle's tower.",
  },
];
createGoogleMap("#polyline-vanilla-map", {
  locations,
  list: { container: "#polyline-vanilla-list", heading: "Along the trail" },
});
