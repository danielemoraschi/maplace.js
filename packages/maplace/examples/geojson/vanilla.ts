import { locationsFromGeoJSON } from "@maplacejs/maplace";
import { createGoogleMap } from "@maplacejs/maplace/google";

const maplace = createGoogleMap<{ about: string }>("#geojson-vanilla-map", {
  list: { container: "#geojson-vanilla-list" },
});

// Each feature a location: a Point a marker, a LineString a line, a Polygon an area; its about
// property in the popup a click opens.
const response = await fetch("/examples/data/regents-park.json");
const features = locationsFromGeoJSON<{ about: string }>(await response.json());
maplace.setLocations(features.map((feature) => ({ ...feature, content: feature.data?.about })));
