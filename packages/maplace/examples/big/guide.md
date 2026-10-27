# Cluster

The list on the map lists what is in view, as a "search this area" list does. At first it lists all 4,000 points, which is what the map fits.

- **Try it**: pan or zoom. The list keeps what it listed, and a "Search this area" button shows above it; press it, and the list holds the points in view now. Choosing an entry moves the map too, which can show the button again. Search an empty patch of sea, and the list says so.
- **HTML**: `list-scope="viewport"` on `<maplace-map>`, beside `list` and `list-position` ([Map attributes](../../../../docs/reference/element.md#map-attributes)); `search-area-label` and `empty-area-label` change its wording.
- **Script** and **Bundler**: `list: { scope: "viewport" }` in the map's options, a [list view option](../../../../docs/reference/store.md#list-view-options), with `searchAreaLabel` and `emptyAreaLabel`.
- **React**: `<LocationList scope="viewport" position="top-right" />` inside the `<MaplaceMap>` ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)).
