# Tags

A location has one `group`, its heading in the list, and as many `tags` as it needs. Tick a box and the map and the list keep the places with all the ticked tags; untick them all and every place is back.

- **HTML**: `tags="parking open-late"` on `<maplace-location>`, the tags split on spaces ([Location attributes](../../../../docs/reference/element.md#location-attributes)), and a script calling the element's `maplace.setFilter`.
- **Script** and **Bundler**: `tags: ["parking", "open-late"]` on a location ([Every location](../../../../docs/reference/locations.md#every-location)), and [`setFilter({ tags })`](../../../../docs/reference/store.md#methods) with what is ticked: no tags ask for nothing, so no branch is needed for none.
- **React**: the `filter` prop of [`<MaplaceProvider>`](../../../../docs/reference/react.md#maplaceprovider), `filter={{ tags }}`, applied when its value changes.
- **Counts**: `group-counts` on `<maplace-map>`, or `groupCounts` on the list, shows after each heading how many places are listed under it now ([List views](../../../../docs/reference/store.md#list-view-options)), so the numbers follow the boxes.
- **With groups**: `setFilter({ groups: ["North"], tags: ["parking"] })` keeps what matches both; `setFilter(["North"])`, a list of groups alone, is what the Menu example does.
