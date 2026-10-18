import { createListView, createMaplace } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { byId } from "../page";

const center = { lat: 41.9028, lng: 12.4964 };
const selectedStyle = { stroke: "#c2410c", fill: "#f97316" };
const maplace = createMaplace({
  locations: [
    { id: "near", type: "circle", center, radius: 5_000, title: "Within 5 km", selectedStyle },
    { id: "far", type: "circle", center, radius: 15_000, title: "Within 15 km", selectedStyle },
  ],
});
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), byId("map"));
byId("list").append(createListView(maplace).element);
