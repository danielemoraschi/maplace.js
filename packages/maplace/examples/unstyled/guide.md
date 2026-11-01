# Unstyled

maplace's own styles off, and the page's CSS drawing everything: the map, the places beside it as a column of underlined names (under it on a phone), the popups in the page's type, their headings too.

- **Try it**: point at a place beside the map, and its underline turns red; pick one, and it turns bold, its popup opening on the map.
- **HTML**: `data-maplace-unstyled` on `<maplace-map>`. Inside it maplace's default styles are off: the map's height, the list's layout and looks, the popups' text colour; what maplace's markup needs stays, such as the map's pane filling the map ([Turning them off](../../../../docs/reference/styling.md#turning-them-off)).
- **Script** and **Bundler**: `data-maplace-unstyled` on the element holding both the map and its list.
- **React**: the same attribute on the element around `<MaplaceMap>` and `<LocationList>`.
- **Your CSS**: rules on the classes maplace's markup carries, `.maplace-listbox`, `.maplace-option` with `[data-hovered]` and `[data-selected]`, `.maplace-popup` and `.maplace-popup-heading` ([Classes](../../../../docs/reference/styling.md#classes)). The map needs a height of yours.
