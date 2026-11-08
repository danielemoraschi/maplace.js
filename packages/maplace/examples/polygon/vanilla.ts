import type { Location } from "@maplacejs/maplace";
import { createGoogleMap } from "@maplacejs/maplace/google";

/** Your own code, writing an edited location back to your server. */
declare function save(location: Location): Promise<void>;

const locations: Location[] = [
  {
    id: "park",
    type: "polygon",
    title: "Hyde Park",
    editable: true,
    path: [
      { lat: 51.512, lng: -0.175 },
      { lat: 51.513, lng: -0.16 },
      { lat: 51.503, lng: -0.155 },
    ],
  },
];
const maplace = createGoogleMap("#polygon-vanilla-map", { locations });
maplace.on("locationChange", ({ location }) => save(location));
