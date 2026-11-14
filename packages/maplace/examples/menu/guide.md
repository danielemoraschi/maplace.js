# Select menu

A native `<select>` on the map, top right, its places under their regions and a first entry that shows them all.

- **Try it**: choose a city and the map goes there; choose "All cities" and it fits them all again. Tick "North only": the map and the menu keep the North's.
- **HTML**: `list="select"`, `list-position`, `list-heading`, `fit-all` and `fit-all-label` on `<maplace-map>` ([Map attributes](../../../../docs/reference/element.md#map-attributes)), `group` on each `<maplace-location>` for its heading, and a script calling the element's `maplace.setFilter`.
- **Script** and **Bundler**: `list: { as: "select", heading, fitAll: true, fitAllLabel }` in the map's options ([List view options](../../../../docs/reference/store.md#list-view-options)), `group` on a location ([Every location](../../../../docs/reference/locations.md#every-location)), and [`setFilter(["North"])`](../../../../docs/reference/store.md#methods), a list of groups.
- **React**: `<LocationList as="select" heading fitAll fitAllLabel position="top-right" />` inside the `<MaplaceMap>` ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)), and the `filter` prop of `<MaplaceProvider>` ([`<MaplaceProvider>`](../../../../docs/reference/react.md#maplaceprovider)).
