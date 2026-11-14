# Map styles

The provider's own looks: on Google a light or dark map, or the visitor's system setting, with Google's map options; on MapLibre a choice of OpenFreeMap's styles, or any style's URL.

- **Try it**: choose from **Map style**: the map opens again in that look, where it was, keeping its state.
- **HTML**: on Google `color-scheme`, `map-id` and `map-options`, a change of `color-scheme` or `map-options` opening the map again ([Provider attributes](../../../../docs/reference/google.md#provider-attributes)); on MapLibre `map-style` and `map-options` ([Provider attributes](../../../../docs/reference/maplibre.md#provider-attributes)).
- **Script** and **Bundler**: `createGoogleAdapter({ mapId, colorScheme, mapOptions })` ([Map ID and styling](../../../../docs/reference/google.md#map-id-and-styling)) or `createMapLibreAdapter({ mapStyle, mapOptions })` ([Styles and tiles](../../../../docs/reference/maplibre.md#styles-and-tiles)), and `attach`; a new look is a new adapter, attached where the last one was ([Methods](../../../../docs/reference/store.md#methods)).
- **React**: the same adapters through `createAdapter`, and a `key` on `<MaplaceMap>` that changes with the look, so a new one opens ([`<MaplaceMap>`](../../../../docs/reference/react.md#maplacemap)).
