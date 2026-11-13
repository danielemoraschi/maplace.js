# Trade lanes

Sea and air lanes between ports and airports, each an arc in its mode's colour, listed under Sea and Air.

- **Try it**: hover a lane on the map and it is drawn wider; pick one, drawn wider still, on the map or in the list, for its volume in a popup. Shanghai to Los Angeles crosses the Pacific, the short way.
- **HTML**: a `<script type="application/json">` inside `<maplace-map>` holding the lanes ([Data](../../../../docs/reference/element.md#data)), and `list` and `list-heading` on the map ([Map attributes](../../../../docs/reference/element.md#map-attributes)).
- **Script** and **Bundler**: `curve` on each lane ([Arcs](../../../../docs/reference/locations.md#arcs)), its `group`, its `style`, `hoveredStyle` and `selectedStyle` ([Styles](../../../../docs/reference/locations.md#styles)), its volume as `content`, and `list: { container, heading }` ([List view options](../../../../docs/reference/store.md#list-view-options)).
- **React**: the same locations on `<MaplaceProvider>`, and `<LocationList heading="Trade lanes" />` beside the `<MaplaceMap>` ([`<LocationList>`](../../../../docs/reference/react.md#locationlist)).
