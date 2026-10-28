# Brand colours

One palette across the map: the delivery areas, the cluster badge and the list, each through its own hook.

- **Try it**: point at a delivery area, and its edge turns green; pick one, here or in the list, and it fills green, its entry too. Zoom in, and the brown badges, the old town's shops and Christianshavn's, split into single shops.
- **Areas**: `style`, `hoveredStyle` and `selectedStyle` on each location, in hex, as every provider reads them (`shape-style`, `hovered-style` and `selected-style` on `<maplace-location>`, or the location's fields in a `<script type="application/json">`, as here) ([Styles](../../../../docs/reference/locations.md#styles)).
- **Cluster badge**: `--maplace-cluster-background` and `--maplace-cluster-color` on the map or any element around it ([Cluster badges](../../../../docs/reference/styling.md#cluster-badges)).
- **Pins**: the single shops keep maplace's default pin; for pins in the brand's colours, an `icon` of your own, as in [Your markers](../css-markers/guide.md).
- **List**: the page's rules on `.maplace-option[data-hovered]` and `.maplace-option[data-selected]`; maplace's own rules are in `:where()`, so any of yours wins ([Styling](../../../../docs/reference/styling.md)).
