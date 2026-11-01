# Search

A box above the list narrows the list and the map when your typing pauses: by a place's name, its group or its `searchText`, ignoring case and accents. A line under the box says how many are found, or that none is. The map doesn't move: choose an entry and it pans there.

- **Try it**: type "forli" to find Forlì, or "harbour" to find the places with that word in their `searchText`.
- **HTML**: `search` on `<maplace-map>` turns the box on and `search-label` sets its placeholder, while `no-matches-label` and `matches-label` set what the line under it says when nothing matches and before the count ([Map attributes](../../../../docs/reference/element.md#map-attributes)), and `search-text` on a `<maplace-location>` is what it also looks in ([Location attributes](../../../../docs/reference/element.md#location-attributes)).
- **Script** and **Bundler**: `list: { container, search: true, searchLabel: "Find a place" }` in the map's options ([List view options](../../../../docs/reference/store.md#list-view-options)), and `searchText` on a location ([Every location](../../../../docs/reference/locations.md#every-location)).
- **React**: `<LocationList search searchLabel="Find a place" />` beside the `<MaplaceMap>` ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)).
- **Your own box**: the built-in box calls [`setFilter`](../../../../docs/reference/store.md#methods) once typing pauses, so the map doesn't redraw under each key, and keeps the rest of the filter. `setFilter` itself replaces the whole filter: a box or checkboxes of your own spread `getSnapshot().filter` to keep the query.
