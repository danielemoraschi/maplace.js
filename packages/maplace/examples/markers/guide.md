# Custom marker icons

Pins of your own: one for every marker that has none of its own, an image file, an icon drawn by the page's CSS, and one place that opens closer than the others.

- **HTML**: a `<template data-icon>` inside `<maplace-map>` for every marker without its own, the black pin on Edinburgh and Manchester; `icon="/examples/data/icons/a.svg"` on a `<maplace-location>` for an image, as London's, a `<template data-icon>` inside it for your own markup, as Cardiff's gold star, and `zoom="8"` for its zoom ([Location attributes](../../../../docs/reference/element.md#location-attributes)).
- **Script** and **Bundler**: `markerIcon` among the map's options for every marker without its own ([Options](../../../../docs/reference/store.md#options)), an `icon` on a location that is an image's URL or a node of yours ([Icons](../../../../docs/reference/locations.md#icons)), and its `zoom` ([Every location](../../../../docs/reference/locations.md#every-location)).
- **React**: `icon` for the image, and `markerIcon` on `<MaplaceMap>` for your own markup: asked first for every marker, the star for Cardiff, the pin where a location has no `icon`, and `null` to leave London its own ([`<MaplaceMap>`](../../../../docs/reference/react.md#maplacemap)).
- **Their states**: for hovered and selected looks in your CSS, see [HTML markers with CSS states](../css-markers/guide.md).
