import "maplibre-gl/dist/maplibre-gl.css";
import { createMapLibreMap } from "maplace/maplibre";

createMapLibreMap("#simple-maplibre-vanilla-map", {
  locations: [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }],
});
