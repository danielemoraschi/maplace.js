# Share by country

Six countries from `countries.json`, each in its own colour with its share in a badge, and the list beside the map as the legend: each country's name on its colour, a row of ten dots with its share filled in, and the share, after an "All countries" entry that shows them all again. The shares are made up, for the example.

- **HTML**: the page's script turns the file into locations with `Maplace.locationsFromGeoJSON`, keeps the six, and sets the map's `locations` property; the legend is a list view of the page's own (`Maplace.defineListView` around `Maplace.createListView` with `render`) ([List views](../../../../docs/reference/element.md#list-views)).
- **Script** and **Bundler**: [`locationsFromGeoJSON`](../../../../docs/reference/locations.md#from-geojson), each country given its `style` ([Styles](../../../../docs/reference/locations.md#styles)), each badge a marker with an `icon` and `listed: false`, so the list holds the countries alone ([Every location](../../../../docs/reference/locations.md#every-location)), and `fitAll` with `fitAllLabel` for the first entry ([List view options](../../../../docs/reference/store.md#list-view-options)).
- **React**: `markerIcon` on `<MaplaceMap>` draws the badges, and the legend's entry is `<LocationList>`'s children ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)).
- **Note**: a click on a badge selects it, so a `selectionChange` listener selects its country instead, as a click on its entry does, and the country's `selectedStyle` outline shows it; in React the selection is held in state.
