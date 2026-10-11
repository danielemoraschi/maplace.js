import { createMaplace, type LatLng } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { byId } from "../page";

const path: LatLng[] = [
  { lat: 44.1, lng: 9.72 },
  { lat: 44.13, lng: 9.68 },
  { lat: 44.14, lng: 9.65 },
];
const maplace = createMaplace({
  locations: [{ id: "trail", type: "polyline", title: "Coast trail", path }],
});
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), byId("map"));
