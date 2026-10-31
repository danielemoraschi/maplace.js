# Search

A box above the list narrows the list and the map when your typing pauses: by a place's name, its group or its `searchText`, ignoring case and accents, so "forli" finds Forlì and "harbour" finds what has it. Its status says how many are found, or that none is. The map doesn't move: choose an entry and it pans there.

- **HTML**: `search-label` on `<maplace-map>` turns the box on and names it, `no-matches-label` and `matches-label` word its status ([Map attributes](../../../../docs/reference/element.md#map-attributes)), and `search-text` on a `<maplace-location>` is what it also looks in ([Location attributes](../../../../docs/reference/element.md#location-attributes)).
- **Script** and **Bundler**: `list: { container, searchLabel: "Find a place" }` in the map's options, a [list view option](../../../../docs/reference/store.md#list-view-options), and `searchText` on a location ([Every location](../../../../docs/reference/locations.md#every-location)).
- **React**: `<LocationList searchLabel="Find a place" />` beside the `<MaplaceMap>` ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)).
- **Your own box**: the box only calls [`setFilter({ query })`](../../../../docs/reference/store.md#methods) once typing pauses, so the map doesn't redraw under each key; it replaces the whole filter: with checkboxes of your own too, spread `getSnapshot().filter` to keep the query.

The **My location** button on the map asks the browser for the visitor's position only when it is pressed, then sorts the list nearest first, each entry saying how far in a straight line, marks the place with a dot and moves the map there; pressed again, it goes back. If the visitor refuses, or the page isn't on HTTPS, it says "Location unavailable" and nothing else changes.

- **HTML**: `list-sort="distance"` and `my-location-label` on `<maplace-map>` ([Map attributes](../../../../docs/reference/element.md#map-attributes)).
- **Script** and **Bundler**: `sort: "distance"` in `list`, and `myLocation: true` in the map's options ([Distances](../../../../docs/reference/store.md#distances)).
- **React**: `<LocationList sort="distance" />`, and `<MyLocation />` inside the `<MaplaceMap>` ([`<MyLocation>`](../../../../docs/reference/react.md#mylocation)).
- **Another point**: [`setOrigin`](../../../../docs/reference/store.md#methods) takes any point, so a click measures from there: `map.on("mapClick", ({ position }) => map.setOrigin(position))`.
