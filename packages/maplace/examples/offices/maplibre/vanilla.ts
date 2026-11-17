import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "@maplacejs/maplace";
import { createMapLibreMap } from "@maplacejs/maplace/maplibre";

// Each office in a region and a country: a group path, outermost first.
const offices: Location[] = await (await fetch("/examples/data/offices.json")).json();

createMapLibreMap("#offices-maplibre-vanilla-map", {
  locations: offices,
  list: {
    container: "#offices-maplibre-vanilla-list",
    heading: "Offices",
    groupCounts: true,
    groupFilter: true,
    search: true,
    searchLabel: "Find an office",
  },
});
