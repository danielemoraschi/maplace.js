import { createMaplace, type Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";

/** Your own code, writing an edited location back to your server. */
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
const container = document.getElementById("polygon-vanilla-map") as HTMLElement;
maplace.attach(createGoogleAdapter({ mapId: "DEMO_MAP_ID" }), container);
maplace.on("locationChange", ({ location }) => void save(location));
