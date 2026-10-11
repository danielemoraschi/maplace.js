import { createListView, createMaplace } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { byId } from "../page";

const maplace = createMaplace({
  locations: [
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
    { id: "bologna", lat: 44.4949, lng: 11.3426, title: "Bologna" },
    { id: "florence", lat: 43.7696, lng: 11.2558, title: "Florence" },
  ],
});
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), byId("map"));
byId("list").append(createListView(maplace).element);
maplace.setRoute({ stops: ["milan", "bologna", "florence"], travelMode: "driving" });
maplace.on("route", ({ result }) => {
  byId("distance").textContent = result ? `${Math.round(result.distanceMeters / 1000)} km` : "";
});
