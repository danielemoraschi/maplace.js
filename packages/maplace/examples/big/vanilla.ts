import type { Location } from "maplace";
import { createGoogleMap } from "maplace/google";

const maplace = createGoogleMap("#big-vanilla-map", {
  cluster: true,
  // On the map, top-right: a list of what is in view, with "Search this area" after a move.
  list: { scope: "viewport" },
});

const response = await fetch("/points-4k.json");
const points: Location[] = await response.json();
maplace.setLocations(points);
