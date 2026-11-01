# Nearest first

The **My location** button on the map asks the browser for the visitor's position only when it is pressed, then sorts the list nearest first, each entry saying how far in a straight line, marks the place with a dot and moves the map there.

- **Try it**: press **My location**, top left on the map, and allow it; press it again and the list goes back. If the visitor refuses, or the page isn't on HTTPS, a line under the button says "Location unavailable" and nothing else changes.
- **HTML**: `list-sort="distance"` and `my-location` on `<maplace-map>`, with `distance-unit="mile"` for miles ([Map attributes](../../../../docs/reference/element.md#map-attributes)).
- **Script** and **Bundler**: `sort: "distance"` in `list`, and `myLocation: true` in the map's options ([Distances](../../../../docs/reference/store.md#distances)).
- **React**: `<LocationList sort="distance" />`, and `<MyLocation />` inside the `<MaplaceMap>` ([`<MyLocation>`](../../../../docs/reference/react.md#mylocation)).
- **Another point**: [`setOrigin`](../../../../docs/reference/store.md#methods) takes any point, so a click measures from there: `map.on("mapClick", ({ position }) => map.setOrigin(position))`, and [a form of your own](../../../../docs/reference/locations.md#a-visitors-address) measures from a typed address.
