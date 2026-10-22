import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "maplace";
import { createMapLibreMap } from "maplace/maplibre";

/** Your own code, writing an edited location back to your server. */
declare function save(location: Location): Promise<void>;

const locations: Location[] = [
  {
    id: "park",
    type: "polygon",
    title: "Park",
    editable: true,
    path: [
      { lat: 41.91, lng: 12.48 },
      { lat: 41.92, lng: 12.49 },
      { lat: 41.9, lng: 12.5 },
    ],
  },
];
const maplace = createMapLibreMap("#polygon-maplibre-vanilla-map", { locations });
maplace.on("locationChange", ({ location }) => save(location));
