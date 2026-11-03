import "maplibre-gl/dist/maplibre-gl.css";
import { createMapLibreMap } from "maplace/maplibre";

const star = document.createElement("span");
star.className = "star";
star.textContent = "★";

createMapLibreMap("#markers-maplibre-vanilla-map", {
  locations: [
    { id: "london", lat: 51.5074, lng: -0.1278, title: "London", icon: "/icons/a.svg" },
    {
      id: "edinburgh",
      lat: 55.9533,
      lng: -3.1883,
      title: "Edinburgh",
      icon: "/icons/b.svg",
      zoom: 8,
    },
    { id: "manchester", lat: 53.4808, lng: -2.2426, title: "Manchester", icon: "/icons/c.svg" },
    { id: "cardiff", lat: 51.4816, lng: -3.1791, title: "Cardiff", icon: star },
  ],
});
