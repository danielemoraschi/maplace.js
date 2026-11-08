import "maplibre-gl/dist/maplibre-gl.css";
import { createMapLibreMap } from "@maplacejs/maplace/maplibre";

createMapLibreMap("#nearest-maplibre-vanilla-map", {
  locations: [
    { id: "london", lat: 51.5074, lng: -0.1278, title: "London" },
    { id: "bristol", lat: 51.4545, lng: -2.5879, title: "Bristol" },
    { id: "birmingham", lat: 52.4862, lng: -1.8904, title: "Birmingham" },
    { id: "manchester", lat: 53.4808, lng: -2.2426, title: "Manchester" },
    { id: "leeds", lat: 53.8008, lng: -1.5491, title: "Leeds" },
  ],
  list: { container: "#nearest-maplibre-vanilla-list", sort: "distance" },
  myLocation: true,
});
