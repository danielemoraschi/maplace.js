import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "@maplacejs/maplace";
import { createMapLibreMap } from "@maplacejs/maplace/maplibre";

async function fetched(url: string): Promise<Location[]> {
  return (await fetch(url)).json();
}

// The quakes, each weighing its magnitude, in the group the heatmap draws; the volcanoes, pins.
const [quakes, volcanoes] = await Promise.all([
  fetched("/examples/data/earthquakes.json"),
  fetched("/examples/data/volcanoes.json"),
]);

createMapLibreMap("#earthquakes-maplibre-vanilla-map", {
  locations: [...quakes, ...volcanoes],
  heatmap: { groups: ["Quakes"] },
  view: { kind: "center", center: { lat: 20, lng: 160 }, zoom: 2 },
  list: {
    container: "#earthquakes-maplibre-vanilla-list",
    search: true,
    searchLabel: "Find a quake or a volcano",
    groupFilter: true,
  },
});
