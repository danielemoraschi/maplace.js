import { createListView, createMaplace } from "maplace";
import { createGoogleAdapter } from "maplace/google";

const center = { lat: 41.9028, lng: 12.4964 };
const selectedStyle = { stroke: "#c2410c", fill: "#f97316" };
const maplace = createMaplace({
  locations: [
    { id: "center", type: "circle", center, radius: 5_000, title: "Within 5 km", selectedStyle },
    { id: "ring", type: "circle", center, radius: 15_000, title: "Within 15 km", selectedStyle },
  ],
});
const container = document.getElementById("circles-vanilla-map") as HTMLElement;
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), container);
const list = document.getElementById("circles-vanilla-list") as HTMLElement;
list.append(createListView(maplace).element);
