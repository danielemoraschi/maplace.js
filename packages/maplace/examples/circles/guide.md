# Circles

Areas by radius in metres, each in its own colours, the first two with a popup, the centre selected at the start; the third resizes, its radius shown below the map as it changes.

- **Try it**: pick "Within 15 km" and it turns orange, its selected style, its popup opening. Drag the edge of "Change my size", which has neither, and the line below follows.
- **HTML**: `type="circle"`, `radius`, `shape-style`, `selected-style` and `editable` on `<maplace-location>`, a `<template>` inside each of the first two for its popup ([Location attributes](../../../../docs/reference/element.md#location-attributes)), `selected-id` on the map, and `maplace-locationedit` and `maplace-locationchange` listeners ([Events](../../../../docs/reference/element.md#events)).
- **Script** and **Bundler**: `type: "circle"`, `radius`, `style`, `selectedStyle`, `content` and `editable` on a location ([Circles](../../../../docs/reference/locations.md#circles), [Styles](../../../../docs/reference/locations.md#styles)), and `locationEdit` while dragging and `locationChange` once dropped ([Events](../../../../docs/reference/store.md#events)).
- **React**: the same circles, their text in `data` for `popupContent` on `<MaplaceMap>`, with `onLocationEdit` and `onLocationChange` on `<MaplaceProvider>` ([Event props](../../../../docs/reference/react.md#event-props)).
