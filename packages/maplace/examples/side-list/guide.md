# List beside the map

The list where a list goes unless you give it a corner: beside the map, under it on a phone. Its places sit under their regions, after a first entry that fits them all. Choose an entry and the map goes there; choose a place on the map and its entry is selected.

- **HTML**: `list` on `<maplace-map>`, with `list-heading`, `fit-all` and `fit-all-label` ([Map attributes](../../../../docs/reference/element.md#map-attributes)), and `group` on each `<maplace-location>` for its heading. `list-position` is `outside` unless you name a corner.
- **Script** and **Bundler**: `list: { container, heading, fitAll: true, fitAllLabel }` in the map's options, the list mounted on a node of yours beside the map's ([List view options](../../../../docs/reference/store.md#list-view-options)), and `group` on a location ([Every location](../../../../docs/reference/locations.md#every-location)).
- **React**: `<LocationList heading fitAll fitAllLabel />` beside the `<MaplaceMap>`, not inside it ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)).
