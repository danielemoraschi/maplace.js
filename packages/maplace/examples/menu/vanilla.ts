import { createListView, createMaplace } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { byId } from "../page";

const maplace = createMaplace({
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", group: "Centre" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", group: "North" },
    { id: "turin", lat: 45.0703, lng: 7.6869, title: "Turin", group: "North" },
  ],
});
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), byId("map"));
byId("menu").append(createListView(maplace, { as: "select" }).element);
byId("north-only").addEventListener("change", (event) => {
  const checked = (event.target as HTMLInputElement).checked;
  maplace.setFilter(checked ? ["North"] : undefined);
});
