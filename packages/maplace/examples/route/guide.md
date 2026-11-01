# Route

A drive through your own places, passing through one without stopping, with its directions leg by leg below the map. It runs on Google only, as MapLibre doesn't route.

- **Try it**: pick a place in the list, and the route stays. Read the directions below the map, each leg under a heading with its distance, and the total under them.
- **HTML**: the `route` property, `{ stops, via, travelMode }`, naming your locations by id ([Properties and methods](../../../../docs/reference/element.md#properties-and-methods)), and a `maplace-routechange` listener writing the directions from the result's legs and steps ([Events](../../../../docs/reference/element.md#events)).
- **Script** and **Bundler**: `route` in the map's options, or [`setRoute`](../../../../docs/reference/store.md#methods), and a `routeChange` listener ([Routes](../../../../docs/reference/store.md#routes)); [Routes on Google](../../../../docs/reference/google.md#routes) has its limits.
- **React**: the `route` prop and `onRouteChange` on `<MaplaceProvider>` ([`<MaplaceProvider>`](../../../../docs/reference/react.md#maplaceprovider), [Event props](../../../../docs/reference/react.md#event-props)).
