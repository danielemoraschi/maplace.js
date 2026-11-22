# Tabs

The list stays outside the map, as a list does unless it is given a corner, and becomes a row of tabs above it, with a panel under them that follows the selection.

- **HTML**: `list` and `selected-id` on `<maplace-map>` ([Map attributes](../../../../docs/reference/element.md#map-attributes)), the page's CSS drawing the list as tabs through its `role="listbox"` and `role="option"`, and a `maplace-selectionchange` listener filling the panel ([Events](../../../../docs/reference/element.md#events)).
- **Script** and **Bundler**: `selectedId` in the map's options and `list: { container }` to mount the list on a node of yours ([Options](../../../../docs/reference/store.md#options), [List view options](../../../../docs/reference/store.md#list-view-options)), and a `selectionChange` listener ([Events](../../../../docs/reference/store.md#events)).
- **React**: `defaultSelectedId` on `<MaplaceProvider>`, `<LocationList />` outside the `<MaplaceMap>`, and a component reading the selection with [`useMaplace()`](../../../../docs/reference/react.md#usemaplace).
