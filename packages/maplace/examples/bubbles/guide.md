# Bubble map

The world's largest cities as bubbles, each as big as its population, the list beside the map, which "This area" narrows to the map's view, and under the map the legend's sizes and a count of what it shows. The populations, in `cities.json`, are rounded and approximate, for the example.

- **HTML**: the page's script gives the file to the element's `maplace`, with `setLocations`, `list-scope="viewport"` puts the "All" and "This area" switch above the list ([Map attributes](../../../../docs/reference/element.md#map-attributes)), and a list view of the page's own adds each population ([List views](../../../../docs/reference/element.md#list-views)).
- **Script** and **Bundler**: each bubble is the city's `icon`, a circle sized in pixels against the largest city's population, so the legend's sizes hold at every zoom ([Icons](../../../../docs/reference/locations.md#icons)); `list: { scope: "viewport", render }` ([List view options](../../../../docs/reference/store.md#list-view-options)), and a `viewportChange` listener counts the cities in the map's bounds ([Events](../../../../docs/reference/store.md#events)).
- **React**: `markerIcon` on `<MaplaceMap>`, `<LocationList scope="viewport">`, and `onViewportChange` on `<MaplaceProvider>` into state ([Event props](../../../../docs/reference/react.md#event-props)).
- **Note**: the file lists the largest city first, and a marker added later is drawn over one before it, so the small bubbles stay on top and can be clicked.
