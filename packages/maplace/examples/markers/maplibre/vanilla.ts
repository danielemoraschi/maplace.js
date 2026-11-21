import "maplibre-gl/dist/maplibre-gl.css";
import { createMapLibreMap } from "@maplacejs/maplace/maplibre";

// The map's pin for every marker without its own icon, Lucide's map-pin: ISC License,
// © Lucide Contributors; portions © Cole Bemis (Feather, MIT); https://lucide.dev/license.
const pin = new DOMParser().parseFromString(
  '<svg xmlns="http://www.w3.org/2000/svg" class="pin" viewBox="3 1 18 22" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
  "image/svg+xml",
).documentElement;

const star = document.createElement("span");
star.className = "star";
star.textContent = "★";

createMapLibreMap("#markers-maplibre-vanilla-map", {
  markerIcon: pin,
  locations: [
    {
      id: "london",
      lat: 51.5074,
      lng: -0.1278,
      title: "London",
      icon: "/examples/data/icons/a.svg",
    },
    {
      id: "edinburgh",
      lat: 55.9533,
      lng: -3.1883,
      title: "Edinburgh",
      zoom: 8,
    },
    {
      id: "manchester",
      lat: 53.4808,
      lng: -2.2426,
      title: "Manchester",
    },
    { id: "cardiff", lat: 51.4816, lng: -3.1791, title: "Cardiff", icon: star },
  ],
});
