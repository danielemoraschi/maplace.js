import type { Location } from "@maplacejs/maplace";
import { createGoogleMap } from "@maplacejs/maplace/google";

// Each office in a region and a country: a group path, outermost first.
const offices: Location[] = await (await fetch("/examples/data/offices.json")).json();

createGoogleMap("#offices-vanilla-map", {
  locations: offices,
  list: {
    container: "#offices-vanilla-list",
    heading: "Offices",
    groupCounts: true,
    groupFilter: true,
    search: true,
    searchLabel: "Find an office",
  },
});
