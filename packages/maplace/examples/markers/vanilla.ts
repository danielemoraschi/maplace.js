import type { LatLng, Location } from "maplace";
import { createGoogleMap } from "maplace/google";

const star = document.createElement("span");
star.className = "star";
star.textContent = "★";

const locations: Location[] = [
  {
    id: "rome",
    lat: 41.9028,
    lng: 12.4964,
    title: "Rome",
    icon: "/icons/a.svg",
    content: () => popupOf("Capital of Italy."),
  },
  {
    id: "milan",
    lat: 45.4642,
    lng: 9.19,
    title: "Milan",
    icon: "/icons/b.svg",
    zoom: 8,
    content: () => popupOf("Finance and fashion."),
  },
  { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples", icon: "/icons/c.svg" },
  { id: "venice", lat: 45.4408, lng: 12.3155, title: "Venice", icon: star },
  { id: "florence", lat: 43.7696, lng: 11.2558, title: "Florence", listed: false },
];

const maplace = createGoogleMap("#markers-vanilla-map", {
  locations,
  list: { heading: "Choose a location:", fitAllLabel: "View all" },
});

maplace.on("mapClick", ({ position }) => dropMarkerAt(position));

let dropped = 0;
/** A click on the map drops a marker there. */
function dropMarkerAt(position: LatLng): void {
  dropped += 1;
  const marker = { id: `dropped-${dropped}`, ...position, title: `Dropped pin ${dropped}` };
  maplace.setLocations([...maplace.getSnapshot().locations, marker]);
}

/** A popup's content: a line about the place, under its title (the popup's heading). */
function popupOf(about: string): HTMLParagraphElement {
  const text = document.createElement("p");
  text.textContent = about;
  return text;
}
