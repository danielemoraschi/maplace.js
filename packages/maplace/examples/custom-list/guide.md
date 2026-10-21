# Your own list

maplacejs's lists are views of its store, and yours can be any element you build: one that calls the store's `select` and `fitAll`, and redraws when the store changes. This one is a radio per place and one to fit them all; each version below shows a way to put it on the map.

- **HTML**: define it by name with [`defineListView(name, factory)`](../../../../docs/reference/element.md#list-views) and name it in `list="checks"`. The factory gets the store and `listed()`, the locations maplacejs's own lists would show, and returns `{ element, destroy }`; `list-position` places it as it does the built-in lists.
- **Vanilla**: redraw the element from [`listedLocations(snapshot)`](../../../../docs/reference/store.md#listed-locations) whenever the store's [`subscribe`](../../../../docs/reference/store.md#methods) calls back, and put it on the map with the adapter's [`mountControl(node, position)`](../../../../docs/reference/store.md#adapters).
- **React**: a component reading the store with [`useMaplace()`](../../../../docs/reference/react.md#usemaplace) and `useSyncExternalStore`, inside a [`<MapControl>`](../../../../docs/reference/react.md#mapcontrol).
