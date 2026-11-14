# Live data from JSON

Data sets your page fetches and swaps in while the map stays: markers, an area, a circle, and on Google a route through some of them. The map's element never fetches anything itself.

- **Try it**: press each button above the map, Markers, More markers, Area and Circle: the map and the list take the new set, and the map fits it. On Google a fifth, Route, draws a route through its places, and leaving that set takes its route with it; MapLibre, which has no routing, has no such button. A slower answer to an earlier press is dropped.
- **HTML**: `list` on an empty `<maplace-map>`, and a script assigning the `locations` property, and on Google `route` ([Properties and methods](../../../../docs/reference/element.md#properties-and-methods)), then calling `maplace.fitAll()`.
- **Script** and **Bundler**: [`setLocations` and `fitAll`](../../../../docs/reference/store.md#methods) on the store `createGoogleMap` or `createMapLibreMap` returns, and on Google `setRoute`.
- **React**: `locations` as a prop of `<MaplaceProvider>`, and on Google `route`, from your state ([`<MaplaceProvider>`](../../../../docs/reference/react.md#maplaceprovider)), and a small component calling `fitAll` through [`useMaplace()`](../../../../docs/reference/react.md#usemaplace) when they change.
