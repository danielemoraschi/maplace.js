# Markers and shapes together

A marker, a circle, a polygon and a polyline on one map and in one list: each location says what it is with its own `type`, and everything else about them works alike.

- **Try it**: pick each entry in the list and the map goes to it. Click a shape or the marker on the map and the list follows.
- **HTML**: `list` on the map, and a `<script type="application/json">` inside `<maplace-map>` holding all four, as a path takes more than an attribute ([Data](../../../../docs/reference/element.md#data)).
- **Script** and **Bundler**: `type` on each location ([Markers](../../../../docs/reference/locations.md#markers), [Circles](../../../../docs/reference/locations.md#circles), [Polylines](../../../../docs/reference/locations.md#polylines), [Polygons](../../../../docs/reference/locations.md#polygons)), and `list: { container }` ([List view options](../../../../docs/reference/store.md#list-view-options)).
- **React**: the same locations on `<MaplaceProvider>`, and `<LocationList />` beside the `<MaplaceMap>` ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)).
