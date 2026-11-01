# This area

The list on the map, top right, has a switch above it: every place, or only those in view as the map moves.

- **Try it**: "All", pressed at first, lists every capital. Press "This area", and the list holds those in view, listing again as you pan or zoom; choosing an entry moves the map too. Over an empty patch of sea, the list says so. "All" lists them all again.
- **HTML**: `list-scope="viewport"` on `<maplace-map>`, beside `list` and `list-position`, with `area-only-label`, `show-all-label` and `empty-area-label` for its wording ([Map attributes](../../../../docs/reference/element.md#map-attributes)).
- **Script** and **Bundler**: `list: { scope: "viewport" }` in the map's options, with `areaOnlyLabel`, `showAllLabel` and `emptyAreaLabel` ([List view options](../../../../docs/reference/store.md#list-view-options)).
- **React**: `<LocationList scope="viewport" position="top-right" />` inside the `<MaplaceMap>` ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)).
