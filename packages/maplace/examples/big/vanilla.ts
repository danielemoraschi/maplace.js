import type { Location } from "maplace";
import { createGoogleMap } from "maplace/google";

const maplace = createGoogleMap("#big-vanilla-map", { cluster: true });

const response = await fetch("/points-4k.json");
const points: Location[] = await response.json();
maplace.setLocations(points);
