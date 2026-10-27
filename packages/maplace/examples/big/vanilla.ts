import type { Location } from "maplace";
import { createGoogleMap } from "maplace/google";

const maplace = createGoogleMap("#big-vanilla-map", {
  cluster: true,
  // On the map, top-right: a list switched between "All" and "This area", what is in view.
  list: { scope: "viewport" },
});

const response = await fetch("/points-4k.json");
const points: Location[] = await response.json();
maplace.setLocations(points);
