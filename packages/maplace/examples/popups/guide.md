# Popups

Picking a place opens a popup with its title as heading and its own text below, ending in two links: one shows the place in a maps site, one gets directions there.

- **Try it**: pick Rome's pin for its popup. Its links, "Open in Maps" and "Directions", go to Google Maps on Google and to OpenStreetMap on MapLibre, in a new tab. Pick Naples: it has no content, so no popup and no links.
- **HTML**: a `<template>` inside a `<maplace-location>` holds the popup's content ([Templates](../../../../docs/reference/element.md#templates)), and `open-in-maps-link` and `directions-link` on `<maplace-map>` add the links, in default words unless `open-in-maps-label` and `directions-label` set others ([Map attributes](../../../../docs/reference/element.md#map-attributes)).
- **Script** and **Bundler**: `content` on a location, a function returning a node ([Content](../../../../docs/reference/locations.md#content)), and `popup: { openInMapsLink: true, directionsLink: true }` in the map's options ([Popup options](../../../../docs/reference/store.md#popup-options)).
- **React**: `popupContent` on `<MaplaceMap>` ([`<MaplaceMap>`](../../../../docs/reference/react.md#maplacemap)), and the same `popup` as a prop of `<MaplaceProvider>` ([`<MaplaceProvider>`](../../../../docs/reference/react.md#maplaceprovider)).
