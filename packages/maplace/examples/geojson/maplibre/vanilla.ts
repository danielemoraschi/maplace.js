import "maplibre-gl/dist/maplibre-gl.css";
import { locationsFromGeoJSON } from "@maplacejs/maplace";
import { createMapLibreMap } from "@maplacejs/maplace/maplibre";

const maplace = createMapLibreMap<{ about: string }>("#geojson-maplibre-vanilla-map", {
  list: { container: "#geojson-maplibre-vanilla-list" },
});

// Each feature a location: a Point a marker, a LineString a line, a Polygon an area; its about
// property in the popup a click opens.
const response = await fetch("/examples/data/regents-park.json");
const features = locationsFromGeoJSON<{ about: string }>(await response.json());
maplace.setLocations(features.map((feature) => ({ ...feature, content: feature.data?.about })));
