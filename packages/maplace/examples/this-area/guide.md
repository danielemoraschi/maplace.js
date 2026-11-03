# This area

The list on the map, top left, has a switch above it: every place, or only those in view as the map moves.

- **Try it**: "All", pressed at first, lists every capital. Press "This area", and the list holds those in view, listing again as you pan or zoom; choosing an entry moves the map too. Over an empty patch of sea, the list says so. "All" lists them all again.
- **HTML**: `list-scope="viewport"` on `<maplace-map>`, beside `list` and `list-position`, with `area-only-label`, `show-all-label` and `empty-area-label` for its wording ([Map attributes](../../../../docs/reference/element.md#map-attributes)).
- **Script** and **Bundler**: `list: { scope: "viewport", position: "top-left" }` in the map's options, with `areaOnlyLabel`, `showAllLabel` and `emptyAreaLabel` ([List view options](../../../../docs/reference/store.md#list-view-options); `position`, [on Google](../../../../docs/reference/google.md#creategooglemap), [on MapLibre](../../../../docs/reference/maplibre.md#createmaplibremap)).
- **React**: `<LocationList scope="viewport" position="top-left" />` inside the `<MaplaceMap>` ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)).
- **Its corner**: any of the four, `top-left` here. Left of the map is where a list has the most room on Google, which stacks its fullscreen button, camera control and Pegman on the right ([On-map controls](../../../../docs/reference/google.md#on-map-controls)). Without a `position`, the list goes top right.
