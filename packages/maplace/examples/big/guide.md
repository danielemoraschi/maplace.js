# Cluster

The list on the map has a switch: all 4,000 points, or only those in view.

- **Try it**: above the list, a switch: "All", pressed at first, lists every point. Press "This area", and the list holds the points in view, listing again as you pan or zoom; choosing an entry moves the map too. Over an empty patch of sea, the list says so. "All" lists all 4,000 again. The switch works the same with the list beside the map, under it on a phone, or anywhere on the page.
- **HTML**: `list-scope="viewport"` on `<maplace-map>`, beside `list` and `list-position` ([Map attributes](../../../../docs/reference/element.md#map-attributes)); `area-only-label`, `show-all-label` and `empty-area-label` change its wording.
- **Script** and **Bundler**: `list: { scope: "viewport" }` in the map's options, a [list view option](../../../../docs/reference/store.md#list-view-options), with `areaOnlyLabel`, `showAllLabel` and `emptyAreaLabel`.
- **React**: `<LocationList scope="viewport" position="top-right" />` inside the `<MaplaceMap>` ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)).
