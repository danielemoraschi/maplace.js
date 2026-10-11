import { createListView, createMaplace } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { byId } from "../page";

const notes: Record<string, string> = {
  rome: "Capital since 1871.",
  milan: "Finance and fashion.",
};
const maplace = createMaplace({
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  ],
});
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), byId("map"));
byId("list").append(createListView(maplace).element);
maplace.on("select", ({ id }) => {
  byId("details").textContent = id === undefined ? "" : (notes[id] ?? "");
});
