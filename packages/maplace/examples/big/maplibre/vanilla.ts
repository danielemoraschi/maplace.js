import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "maplace";
import { createMapLibreMap } from "maplace/maplibre";

const maplace = createMapLibreMap("#big-maplibre-vanilla-map", {
  cluster: true,
  // On the map, top-right: a list switched between "All" and "This area", what is in view.
  list: { scope: "viewport" },
});

const response = await fetch("/points-4k.json");
const points: Location[] = await response.json();
maplace.setLocations(points);
