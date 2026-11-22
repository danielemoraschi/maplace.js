# GeoJSON layer

A GeoJSON file drawn as the map's layer: the page fetches `regents-park.json`, a FeatureCollection, and `locationsFromGeoJSON` turns each feature into a location. The park's `Polygon` becomes an area, the Broad Walk's `LineString` a line, and four `Point`s markers. Each feature's `id` is its location's, its `title` and `group` properties name it and head it in the list, and its `about` property goes in the popup a click opens.

- **HTML**: `Maplace.locationsFromGeoJSON` on the CDN script, its result, each feature's `about` copied to its `content`, set as the map's `locations` property ([Properties and methods](../../../../docs/reference/element.md#properties-and-methods)).
- **Script** and **Bundler**: [`locationsFromGeoJSON`](../../../../docs/reference/locations.md#from-geojson), from the core entry, each feature's `about` copied to its `content`, the result given to the store's `setLocations` ([Methods](../../../../docs/reference/store.md#methods)).
- **React**: the same call once the file arrives, its result kept in state and given to `<MaplaceProvider locations>` ([`<MaplaceProvider>`](../../../../docs/reference/react.md#maplaceprovider)), and `popupContent` on `<MaplaceMap>` writes each feature's `about` in its popup ([`<MaplaceMap>`](../../../../docs/reference/react.md#maplacemap)).
- **Note**: a file without ids, or with geometries the helper doesn't read (`MultiPoint`, `MultiLineString`), is mapped first; [From GeoJSON](../../../../docs/reference/locations.md#from-geojson) shows how.
