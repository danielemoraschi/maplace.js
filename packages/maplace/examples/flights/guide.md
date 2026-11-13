# Flights

London's flights out, each an arc from the hub to a city: a polyline of two points with a `curve`, listed beside the map, while the cities are on the map only.

- **Try it**: pick a flight in the list and the map goes to its arc, drawn heavier; click an arc on the map and the list follows. The flights west bow to the right, with a negative `curve`.
- **HTML**: a `<script type="application/json">` inside `<maplace-map>` holding the data, as a path takes more than an attribute ([Data](../../../../docs/reference/element.md#data)); `list` and `list-heading` on the map ([Map attributes](../../../../docs/reference/element.md#map-attributes)).
- **Script** and **Bundler**: `type: "polyline"`, `path` and `curve` on each flight ([Arcs](../../../../docs/reference/locations.md#arcs)), `listed: false` on each city ([Common fields](../../../../docs/reference/locations.md#every-location)), and `list: { container, heading }` ([List view options](../../../../docs/reference/store.md#list-view-options)).
- **React**: the same locations on `<MaplaceProvider>`, and `<LocationList heading="Flights from London" />` beside the `<MaplaceMap>` ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)).
