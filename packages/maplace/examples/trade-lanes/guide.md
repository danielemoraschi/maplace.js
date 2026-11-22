# Trade lanes

Sea and air lanes between ports and airports, each a bowed line in its mode's colour, listed under Sea and Air.

- **HTML**: a `<script type="application/json">` inside `<maplace-map>` holding the lanes ([Data](../../../../docs/reference/element.md#data)), and `list` and `list-heading` on the map ([Map attributes](../../../../docs/reference/element.md#map-attributes)).
- **Script** and **Bundler**: `curve` on each lane ([Curves and great circles](../../../../docs/reference/locations.md#curves-and-great-circles)), its `group`, its `style`, `hoveredStyle` and `selectedStyle` ([Styles](../../../../docs/reference/locations.md#styles)), its volume as `content`, and `list: { container, heading }` ([List view options](../../../../docs/reference/store.md#list-view-options)).
- **React**: the same locations on `<MaplaceProvider>`, and `<LocationList heading="Trade lanes" />` beside the `<MaplaceMap>` ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)).
