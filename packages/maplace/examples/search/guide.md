# Search

A box above the list narrows the list and the map when your typing pauses: by a place's name, its group or its `searchText`, ignoring case and accents, so "forli" finds Forlì and "harbour" finds what has it. Its status says how many are found, or that none is. The map doesn't move: choose an entry and it pans there.

- **HTML**: `search-label` on `<maplace-map>` turns the box on and names it, `no-matches-label` and `matches-label` word its status ([Map attributes](../../../../docs/reference/element.md#map-attributes)), and `search-text` on a `<maplace-location>` is what it also looks in ([Location attributes](../../../../docs/reference/element.md#location-attributes)).
- **Script** and **Bundler**: `list: { container, searchLabel: "Find a place" }` in the map's options, a [list view option](../../../../docs/reference/store.md#list-view-options), and `searchText` on a location ([Every location](../../../../docs/reference/locations.md#every-location)).
- **React**: `<LocationList searchLabel="Find a place" />` beside the `<MaplaceMap>` ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)).
- **Your own box**: the box only calls [`setFilter({ query })`](../../../../docs/reference/store.md#methods) once typing pauses, so the map doesn't redraw under each key; it replaces the whole filter: with checkboxes of your own too, spread `getSnapshot().filter` to keep the query.
