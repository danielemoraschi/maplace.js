import { createGoogleMap } from "maplace/google";

const star = document.createElement("span");
star.className = "star";
star.textContent = "★";

createGoogleMap("#markers-vanilla-map", {
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", icon: "/icons/a.svg" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", icon: "/icons/b.svg", zoom: 8 },
    { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples", icon: "/icons/c.svg" },
    { id: "venice", lat: 45.4408, lng: 12.3155, title: "Venice", icon: star },
  ],
});
