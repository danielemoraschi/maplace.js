# Editable polygon

A three-cornered park you can edit: each edit is written back to the store and announced, for your page to save.

- **Try it**: drag a corner, or the middle of an edge to add one; letting go calls the page's `save`, which the site shows under the map.
- **HTML**: a `<script type="application/json">` inside `<maplace-map>` holding the polygon ([Data](../../../../docs/reference/element.md#data)), and a `maplace-locationchange` listener ([Events](../../../../docs/reference/element.md#events)).
- **Script** and **Bundler**: `type: "polygon"`, `path` and `editable` on a location ([Polygons](../../../../docs/reference/locations.md#polygons)), and a `locationChange` listener ([Events](../../../../docs/reference/store.md#events)).
- **React**: the same location, with `onLocationChange` on `<MaplaceProvider>` ([Event props](../../../../docs/reference/react.md#event-props)).
