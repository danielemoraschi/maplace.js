import { createListView, createMaplace } from "maplace";
import { createGoogleAdapter } from "maplace/google";

const notes: Readonly<Record<string, string>> = {
  rome: "Capital since 1871.",
  milan: "Finance and fashion.",
};
const maplace = createMaplace({
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  ],
});
const container = document.getElementById("tabs-vanilla-map") as HTMLElement;
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), container);
const list = document.getElementById("tabs-vanilla-list") as HTMLElement;
list.append(createListView(maplace).element);

const details = document.getElementById("tabs-vanilla-details") as HTMLElement;
maplace.on("selectionChange", ({ id }) => {
  details.textContent = id === undefined ? "" : (notes[id] ?? "");
});
