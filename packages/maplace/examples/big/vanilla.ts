import type { Location } from "@maplacejs/maplace";
import { createGoogleMap } from "@maplacejs/maplace/google";

const maplace = createGoogleMap("#big-vanilla-map", {
  cluster: true,
});

const response = await fetch("/examples/data/points-4k.json");
const points: Location[] = await response.json();
maplace.setLocations(points);
