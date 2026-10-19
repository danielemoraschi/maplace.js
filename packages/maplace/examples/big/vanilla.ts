import type { Location } from "maplace";
import { createGoogleMap } from "maplace/google";

const maplace = createGoogleMap("#big-vanilla-map", { mapId: "DEMO_MAP_ID", cluster: true });

const response = await fetch("/points-4k.json");
const points: Location[] = await response.json();
maplace.setLocations(points);
