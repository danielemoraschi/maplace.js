import type { Location } from "maplace";
import { createGoogleMap } from "maplace/google";

const maplace = createGoogleMap("#big-vanilla-map", {
  cluster: true,
  // On the map, top-right: a list of what is in view, with "This area only" after a move, then "Show all".
  list: { scope: "viewport" },
});

const response = await fetch("/points-4k.json");
const points: Location[] = await response.json();
maplace.setLocations(points);
