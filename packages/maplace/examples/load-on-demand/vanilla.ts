import type { Location } from "@maplacejs/maplace";
import { createGoogleMap } from "@maplacejs/maplace/google";

const box = document.getElementById("load-on-demand-vanilla-map") as HTMLElement;
const locations: Location[] = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples" },
];

const panel = document.createElement("div");
panel.className = "load-panel";
const line = document.createElement("span");
line.textContent = "Loads from Google";
const button = document.createElement("button");
button.type = "button";
button.textContent = "Load map";
button.addEventListener("click", () => {
  // The panel goes as it's pressed: focus stays here, not at the top of the page.
  box.tabIndex = -1;
  box.focus({ preventScroll: true });
  panel.remove();
  createGoogleMap(box, { locations });
});
panel.append(line, button);
box.append(panel);
