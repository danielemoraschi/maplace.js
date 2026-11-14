# Brand colours

One palette across the map: the delivery areas, the cluster badge and the list, each through its own hook.

- **Try it**: point at a delivery area, and its edge turns green; pick one, here or in the list, and it fills green, its entry too. Zoom in, and the brown badges, the old town's shops and Christianshavn's, split into single shops.
- **HTML**: the areas' fields in a `<script type="application/json">` inside `<maplace-map>`, as a polygon's path takes more than an attribute ([Data](../../../../docs/reference/element.md#data)); a circle written as a `<maplace-location>` takes them as `shape-style`, `hovered-style` and `selected-style`. `cluster` on the map, on `maplace-element-cluster.iife.js` on Google.
- **Script** and **Bundler**: `style`, `hoveredStyle` and `selectedStyle` on each location, in hex, as every provider reads them ([Styles](../../../../docs/reference/locations.md#styles)), with `cluster: true` in the options, on the cluster script for the Script version on Google.
- **React**: the same locations, and the `cluster` prop of [`<MaplaceProvider>`](../../../../docs/reference/react.md#maplaceprovider).
- **In every version**: the badge takes `--maplace-cluster-background` and `--maplace-cluster-color` on the map or any element around it ([Cluster badges](../../../../docs/reference/styling.md#cluster-badges)), and the list the page's rules on `.maplace-option[data-hovered]` and `.maplace-option[data-selected]`; Maplace.js's own rules are in `:where()`, so any of yours wins ([Styling](../../../../docs/reference/styling.md)). The single shops keep Maplace.js's default pin; for pins in the brand's colours, an `icon` of your own, as in [HTML markers with CSS states](../css-markers/guide.md).
