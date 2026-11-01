import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "maplace";
import { createMapLibreMap } from "maplace/maplibre";

const box = document.getElementById("load-on-demand-maplibre-vanilla-map") as HTMLElement;
const locations: Location[] = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples" },
];

const button = document.createElement("button");
button.type = "button";
button.textContent = "Load map";
button.addEventListener("click", () => {
  // The button goes as it's pressed: focus stays here, not at the top of the page.
  box.tabIndex = -1;
  box.focus({ preventScroll: true });
  button.remove();
  createMapLibreMap(box, { locations });
});
box.append(button);
