# Your markers

Each pin is a node of yours, styled by the page's CSS: maplace marks it `data-hovered` while the reader points at it and `data-selected` once they pick it, so a rule on each attribute gives that state its look.

- **Try it**: point at a pin, and it lifts; pick one, and it turns red with a pop. Pick another, and the first goes back.
- **HTML**: a `<template data-icon>` inside each `<maplace-location>` ([Location attributes](../../../../docs/reference/element.md#location-attributes)). The template is drawn anew for each state, so the pop is a CSS animation, which starts on a new node, rather than a transition; pointing at a selected pin plays it again.
- **Script** and **Bundler**: an `icon` that is a node, the same node in every state ([Icons](../../../../docs/reference/locations.md#icons)).
- **React**: `markerIcon` on `<MaplaceMap>`, whose output sits in a node maplace keeps for each marker; that node carries the marks, so the rules read `[data-selected] > .pin` where the others read `.pin[data-selected]` ([`<MaplaceMap>`](../../../../docs/reference/react.md#maplacemap)).
- **Styling**: every class and attribute maplace's markup carries, in [Styling](../../../../docs/reference/styling.md).
