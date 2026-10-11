import { createListView, createMaplace, type Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { byId } from "../page";

const locations: Location[] = [
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  { id: "bologna", lat: 44.4949, lng: 11.3426, title: "Bologna" },
  { id: "florence", lat: 43.7696, lng: 11.2558, title: "Florence" },
];
const maplace = createMaplace({ locations });
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), byId("map"));
byId("list").append(createListView(maplace).element);
maplace.setRoute({ stops: locations.map((location) => location.id), travelMode: "driving" });
maplace.on("route", ({ result }) => {
  byId("distance").textContent = result ? `${Math.round(result.distanceMeters / 1000)} km` : "";
});
