import { createListView, createMaplace, type Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";

const locations: Location[] = [
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  { id: "bologna", lat: 44.4949, lng: 11.3426, title: "Bologna" },
  { id: "florence", lat: 43.7696, lng: 11.2558, title: "Florence" },
];
const maplace = createMaplace({ locations });
const container = document.getElementById("route-vanilla-map") as HTMLElement;
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), container);
const list = document.getElementById("route-vanilla-list") as HTMLElement;
list.append(createListView(maplace).element);
maplace.setRoute({ stops: ["milan", "bologna", "florence"], travelMode: "driving" });

const distance = document.getElementById("route-vanilla-distance") as HTMLOutputElement;
maplace.on("routeChange", ({ result }) => {
  distance.textContent = result ? `${Math.round(result.distanceMeters / 1000)} km` : "";
});
