import { createListView, createMaplace } from "maplace";
import { createGoogleAdapter } from "maplace/google";

const maplace = createMaplace({
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", group: "Centre" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", group: "North" },
    { id: "turin", lat: 45.0703, lng: 7.6869, title: "Turin", group: "North" },
  ],
});
const adapter = createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
maplace.attach(adapter, document.getElementById("menu-vanilla-map") as HTMLElement);
const menu = createListView(maplace, { as: "select", fitAllLabel: "All cities" });
adapter.mountControl(menu.element, "top-right");

const northOnly = document.getElementById("menu-vanilla-north-only") as HTMLInputElement;
northOnly.addEventListener("change", () => {
  maplace.setFilter(northOnly.checked ? ["North"] : undefined);
});
