# Cluster

4,000 points fetched by the page: those near each other are drawn as one badge counting them, so the map stays fast and readable.

- **Try it**: zoom in on a badge, and it splits into smaller badges, then single pins.
- **HTML**: `cluster` on `<maplace-map>`, on a CDN script that bundles clustering: `maplace-element-cluster.iife.js` on Google, while MapLibre's script always does ([Map attributes](../../../../docs/reference/element.md#map-attributes)). The element never fetches: a script assigns `locations`.
- **Script** and **Bundler**: `cluster: true` in the map's options, then [`setLocations`](../../../../docs/reference/store.md#methods) with the points ([Options](../../../../docs/reference/store.md#options)). The Script version on Google is on the same cluster script; from npm, each provider loads its clustering only for a map that clusters ([on Google](../../../../docs/reference/google.md#clustering), [on MapLibre](../../../../docs/reference/maplibre.md#clustering)).
- **React**: the `cluster` prop of `<MaplaceProvider>` ([`<MaplaceProvider>`](../../../../docs/reference/react.md#maplaceprovider)).
- **Their look**: [Cluster badges](../../../../docs/reference/styling.md#cluster-badges) has the badge's colours, as [Brand colours](../brand/guide.md) uses them.
- **With a list**: a list of every point is too long to use; one that lists only what is in the map's view is in [This area](../this-area/guide.md).
