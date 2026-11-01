# Tags

A location has one `group`, its heading in the list, and as many `tags` as it needs. Tick a box and the map and the list keep the places with all the ticked tags; untick them all and every place is back. The boxes sit above the map, the list on it, top right.

- **Try it**: tick "Parking", then "Open late" too: the numbers after the headings follow what is listed.
- **HTML**: `tags="parking open-late"` on `<maplace-location>`, the tags split on spaces ([Location attributes](../../../../docs/reference/element.md#location-attributes)), `group-counts` on `<maplace-map>` for the numbers ([Map attributes](../../../../docs/reference/element.md#map-attributes)), and a script calling the element's `maplace.setFilter`.
- **Script** and **Bundler**: `tags: ["parking", "open-late"]` on a location ([Every location](../../../../docs/reference/locations.md#every-location)), `groupCounts` on the list ([List view options](../../../../docs/reference/store.md#list-view-options)), and [`setFilter({ tags })`](../../../../docs/reference/store.md#methods) with what is ticked: no tags ask for nothing, so no branch is needed for none.
- **React**: `<LocationList groupCounts />` and the `filter` prop of [`<MaplaceProvider>`](../../../../docs/reference/react.md#maplaceprovider), `filter={{ tags }}`, applied when its value changes.
- **With groups**: `setFilter({ groups: ["North"], tags: ["parking"] })` keeps what matches both; `setFilter(["North"])`, a list of groups alone, is what the [Menu](../menu/guide.md) example does.
