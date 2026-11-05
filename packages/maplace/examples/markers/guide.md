# Markers

Pins of your own: three image files, one icon drawn by the page's CSS, and one place that opens closer than the others.

- **Try it**: pick Edinburgh's pin, and the map goes to it at zoom 8, its own; the others are panned to at the map's zoom.
- **HTML**: `icon="/examples/data/icons/a.svg"` on a `<maplace-location>` for an image, a `<template data-icon>` inside it for your own markup, as Cardiff's gold star, and `zoom="8"` for its zoom ([Location attributes](../../../../docs/reference/element.md#location-attributes)).
- **Script** and **Bundler**: an `icon` on a location that is an image's URL or a node of yours ([Icons](../../../../docs/reference/locations.md#icons)), and its `zoom` ([Every location](../../../../docs/reference/locations.md#every-location)).
- **React**: `icon` for the images, and `markerIcon` on `<MaplaceMap>` for your own markup ([`<MaplaceMap>`](../../../../docs/reference/react.md#maplacemap)).
- **Their states**: for hovered and selected looks in your CSS, see [Your markers](../css-markers/guide.md).
