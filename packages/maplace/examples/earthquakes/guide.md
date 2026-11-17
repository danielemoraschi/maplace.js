# Heatmaps

A month of earthquakes of magnitude 4.5 and up, drawn as a heatmap weighted by magnitude, with a dozen volcanoes as pins: the quakes are locations as any other, so the list's search and the checkboxes, which filter by group, narrow the heat with them.

- **Try it**: zoom in on Japan or Chile: over two zooms the heat fades into a dot per quake, sized and coloured by its magnitude, and a click on a dot selects its quake in the list. Type "Japan" in the search box: the heat shrinks to Japan's quakes, and the volcanoes leave the map. Untick Quakes: the heat goes, the volcanoes stay; the checkboxes keep what the search found (`setFilter` with the search's own `query`, [Methods](../../../../docs/reference/store.md#methods)).
- **The data**: `earthquakes.json`, a month of the USGS's earthquakes of magnitude 4.5 and up, to November 2026 (public domain), each with its magnitude as `weight`; `volcanoes.json`, a dozen well-known volcanoes.
- **HTML**: `heatmap="quakes"` on `<maplace-map>` draws the markers of the group `quakes` as heat, and `heatmap-max-zoom` sets where it gives way to the dots ([Map attributes](../../../../docs/reference/element.md#map-attributes)); a quake's `weight` is its magnitude.
- **Script** and **Bundler**: `heatmap: { groups: ["quakes"] }` in the map's options, `maxZoom` beside it ([Heatmaps](../../../../docs/reference/store.md#heatmaps)), and `weight` on each quake ([Markers](../../../../docs/reference/locations.md#markers)).
- **React**: the same `heatmap` on `<MaplaceProvider>`, beside a `<LocationList search>`; the checkboxes call `useMaplace().setFilter`, as a `filter` prop would clear the search ([`<MaplaceProvider>`](../../../../docs/reference/react.md#maplaceprovider)).
- **On both providers**: MapLibre draws the heat and the dots in its own layers, under the pins; Google, on a canvas over the map, the dots as markers. A marker in the heat has no `icon` and isn't `editable`: it is drawn as heat and a dot.
