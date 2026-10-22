import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "maplace";
import { createMapLibreMap } from "maplace/maplibre";

const maplace = createMapLibreMap("#big-maplibre-vanilla-map", { cluster: true });

const response = await fetch("/points-4k.json");
const points: Location[] = await response.json();
maplace.setLocations(points);
