# One marker

The shortest map: one place, its pin on the map, and the map centred on it.

- **HTML**: a `<maplace-location>` with `location-id`, `lat`, `lng` and `title` inside a `<maplace-map>`, which draws at a default height ([Location attributes](../../../../docs/reference/element.md#location-attributes)).
- **Script** and **Bundler**: `createGoogleMap(container, { locations })`, or `createMapLibreMap` on MapLibre; each location needs an `id` and its position ([Every location](../../../../docs/reference/locations.md#every-location)).
- **React**: a `<MaplaceMap>` inside a `<MaplaceProvider locations={…}>` ([`<MaplaceProvider>`](../../../../docs/reference/react.md#maplaceprovider)).
