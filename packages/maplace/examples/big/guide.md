# Cluster

The list on the map can be filtered to what is in view. At first it lists all 4,000 points, which is what the map fits.

- **Try it**: pan or zoom. The list keeps what it listed, and a "This area only" button shows above it; press it, and the list holds the points in view now, with "Show all" above them to list all 4,000 again. Choosing an entry moves the map too, which can show "This area only" again. Filter to an empty patch of sea, and the list says so.
- **HTML**: `list-scope="viewport"` on `<maplace-map>`, beside `list` and `list-position` ([Map attributes](../../../../docs/reference/element.md#map-attributes)); `area-only-label`, `show-all-label` and `empty-area-label` change its wording.
- **Script** and **Bundler**: `list: { scope: "viewport" }` in the map's options, a [list view option](../../../../docs/reference/store.md#list-view-options), with `areaOnlyLabel`, `showAllLabel` and `emptyAreaLabel`.
- **React**: `<LocationList scope="viewport" position="top-right" />` inside the `<MaplaceMap>` ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)).
