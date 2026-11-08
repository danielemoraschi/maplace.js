import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "@maplacejs/maplace";
import { createMapLibreMap } from "@maplacejs/maplace/maplibre";

const maplace = createMapLibreMap("#big-maplibre-vanilla-map", {
  cluster: true,
});

const response = await fetch("/examples/data/points-4k.json");
const points: Location[] = await response.json();
maplace.setLocations(points);
