# Click to add

A click on the map adds a pin where it landed, and every pin here can be dragged to a new place.

- **Try it**: click the map for a new pin, drag it somewhere else, then click again: the one you moved stays where you put it.
- **HTML**: `editable` on a `<maplace-location>` makes it draggable ([Location attributes](../../../../docs/reference/element.md#location-attributes)). A `maplace-mapclick` listener assigns the `locations` property, the current ones and the new pin ([Events](../../../../docs/reference/element.md#events)); assigning it, rather than adding a `<maplace-location>`, keeps a dragged pin where it is, as children are read again when they change. The script sets the first view with `map.maplace.setView(center, zoom)`, as no attribute does ([Properties and methods](../../../../docs/reference/element.md#properties-and-methods)).
- **Script** and **Bundler**: `editable: true` on a location ([Every location](../../../../docs/reference/locations.md#every-location)), and a `mapClick` listener calling `setLocations` with the snapshot's locations and the new pin ([Methods](../../../../docs/reference/store.md#methods), [Events](../../../../docs/reference/store.md#events)). `view` sets the first view, a centre and zoom ([The first view](../../../../docs/reference/store.md#the-first-view)).
- **React**: `onMapClick` adds the pin to your state, and `onLocationChange` writes a dragged one back there, or the next render would put it back ([Event props](../../../../docs/reference/react.md#event-props)). `view` on `<MaplaceProvider>` sets the same first view.
