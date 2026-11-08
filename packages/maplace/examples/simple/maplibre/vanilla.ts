import "maplibre-gl/dist/maplibre-gl.css";
import { createMapLibreMap } from "@maplacejs/maplace/maplibre";

createMapLibreMap("#simple-maplibre-vanilla-map", {
  locations: [{ id: "london", lat: 51.5074, lng: -0.1278, title: "London" }],
});
