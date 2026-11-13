# Flights

London's flights out, each along its great circle, the shortest way on the earth: a polyline of two points with `geodesic: true`, listed beside the map, while the cities are on the map only.

- **Try it**: pick a flight in the list and the map goes to it, drawn heavier; click a flight on the map and the list follows. London to Tokyo crosses the Arctic, as the plane does.
- **HTML**: a `<script type="application/json">` inside `<maplace-map>` holding the data, as a path takes more than an attribute ([Data](../../../../docs/reference/element.md#data)); `list` and `list-heading` on the map ([Map attributes](../../../../docs/reference/element.md#map-attributes)).
- **Script** and **Bundler**: `type: "polyline"`, `path` and `geodesic` on each flight ([Curves and great circles](../../../../docs/reference/locations.md#curves-and-great-circles)), `listed: false` on each city ([Common fields](../../../../docs/reference/locations.md#every-location)), and `list: { container, heading }` ([List view options](../../../../docs/reference/store.md#list-view-options)).
- **React**: the same locations on `<MaplaceProvider>`, and `<LocationList heading="Flights from London" />` beside the `<MaplaceMap>` ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)).
