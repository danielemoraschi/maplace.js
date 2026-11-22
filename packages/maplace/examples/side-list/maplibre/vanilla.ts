import "maplibre-gl/dist/maplibre-gl.css";
import { createMapLibreMap } from "@maplacejs/maplace/maplibre";

createMapLibreMap("#side-list-maplibre-vanilla-map", {
  locations: [
    { id: "edinburgh", lat: 55.9533, lng: -3.1883, title: "Edinburgh", group: "North" },
    { id: "glasgow", lat: 55.8642, lng: -4.2518, title: "Glasgow", group: "North" },
    { id: "belfast", lat: 54.5973, lng: -5.9301, title: "Belfast", group: "North" },
    { id: "london", lat: 51.5074, lng: -0.1278, title: "London", group: "South" },
    { id: "bristol", lat: 51.4545, lng: -2.5879, title: "Bristol", group: "South" },
    { id: "cardiff", lat: 51.4816, lng: -3.1791, title: "Cardiff", group: "South" },
  ],
  list: {
    container: "#side-list-maplibre-vanilla-list",
    heading: "Cities",
    fitAll: true,
    fitAllLabel: "All cities",
  },
});
