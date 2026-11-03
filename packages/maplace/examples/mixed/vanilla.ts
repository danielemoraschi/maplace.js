import type { Location } from "maplace";
import { createGoogleMap } from "maplace/google";

const locations: Location[] = [
  { id: "tower-of-london", type: "marker", title: "Tower of London", lat: 51.5081, lng: -0.0759 },
  {
    id: "greenwich",
    type: "circle",
    title: "Greenwich",
    center: { lat: 51.4769, lng: -0.0005 },
    radius: 500,
  },
  {
    id: "hyde-park",
    type: "polygon",
    title: "Hyde Park",
    path: [
      { lat: 51.5115, lng: -0.1755 },
      { lat: 51.511, lng: -0.16 },
      { lat: 51.503, lng: -0.16 },
      { lat: 51.5035, lng: -0.1755 },
    ],
  },
  {
    id: "thames",
    type: "polyline",
    title: "Along the Thames",
    path: [
      { lat: 51.5009, lng: -0.1222 },
      { lat: 51.5085, lng: -0.1166 },
      { lat: 51.5098, lng: -0.1043 },
      { lat: 51.5085, lng: -0.0943 },
      { lat: 51.5079, lng: -0.0877 },
    ],
  },
];
createGoogleMap("#mixed-vanilla-map", {
  locations,
  list: { container: "#mixed-vanilla-list" },
});
