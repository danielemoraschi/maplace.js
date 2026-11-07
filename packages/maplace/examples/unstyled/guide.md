# Default styles off

Maplace.js's own styles switched off and nothing put in their place: the map and its list exactly as your page shows them with no CSS of yours but the one rule a map can't do without, its height.

- **Try it**: the list is plain lines in the page's font, under the map; pick one and its popup opens, with nothing in the list marking it. It's the starting point for a look of your own.
- **Off with the defaults**: the map's height, the list beside it, the list's spacing, its hover and selected looks and its scrolling, and the popups' dark text and inset, and on MapLibre their heading's weight and its room beside the close button. On a dark page, give `.maplace-popup` and `.maplace-popup-heading` a dark colour: their text takes the page's on the white bubble ([Turning them off](../../../../docs/reference/styling.md#turning-them-off)).
- **HTML**: `data-maplace-unstyled` on `<maplace-map>`, and a height on its `.maplace-map-pane`: the map fills it, and the list goes under it.
- **Script** and **Bundler**: `data-maplace-unstyled` on the element holding the map and its list, and a height on the map's container.
- **React**: the same attribute on the element around `<MaplaceMap>` and `<LocationList>`, and a height on the map's class.
- **On this site**: the site's own styles stay out of anything inside `data-maplace-unstyled`, its keyboard focus ring apart, so what shows here is what your page shows: the list takes the site's font and text colour as it would take yours. To draw a look of your own, style the classes Maplace.js's markup carries ([Classes](../../../../docs/reference/styling.md#classes)).
