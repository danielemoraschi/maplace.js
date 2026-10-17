import { createMaplace, type Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { byId } from "../page";

declare function save(location: Location): Promise<void>;

const park: Location = {
  id: "park",
  type: "polygon",
  title: "Park",
  editable: true,
  path: [
    { lat: 41.91, lng: 12.48 },
    { lat: 41.92, lng: 12.49 },
    { lat: 41.9, lng: 12.5 },
  ],
};
const maplace = createMaplace({ locations: [park] });
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), byId("map"));
maplace.on("locationChange", ({ location }) => void save(location));
