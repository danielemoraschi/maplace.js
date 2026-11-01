# Polyline

A trail you can edit, Cinque Terre's coastal path, with the villages along it as markers of their own and in the list beside the map.

- **Try it**: drag a point of the line, or the middle of a segment to add one. Pick a village for its popup. The line itself is listed too, as a location.
- **HTML**: a `<script type="application/json">` inside `<maplace-map>` holding the data, as a path takes more than an attribute ([Data](../../../../docs/reference/element.md#data)); `list` and `list-heading` on the map ([Map attributes](../../../../docs/reference/element.md#map-attributes)).
- **Script** and **Bundler**: `type: "polyline"`, `path` and `editable` on a location ([Polylines](../../../../docs/reference/locations.md#polylines)), and `list: { container, heading }` ([List view options](../../../../docs/reference/store.md#list-view-options)).
- **React**: the same locations on `<MaplaceProvider>`, and `<LocationList heading="Along the trail" />` beside the `<MaplaceMap>` ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)).
