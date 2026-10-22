# Styling

maplacejs comes with a few default styles. They make a map usable as soon as it is on a page, and the page can change any of them or turn them all off. What maplacejs draws carries the classes below, for the page's own styles.

## Default styles

maplacejs adds its styles to the page itself (adopted stylesheets, so no `<link>` and nothing for a content security policy to allow), and only for what the page uses:

- **The element:** `<maplace-map>` is 24rem tall, and a list beside the map goes under it on a screen narrower than 40rem.
- **The list:** its entries look like buttons, with the selected and hovered ones tinted from the text's own colour. Group headings are small and uppercase, and a heading stays in view while the entries scroll.
- **Popups:** on Google's white bubble, dark text inset as Google insets its left side.
- **On a Google map:** what goes on the map (a list, a select, your own controls) sits in a panel like Google's own controls, in the map's colour scheme.
- **On a MapLibre map:** what goes on the map sits in a panel like MapLibre's own controls, light, as they are. The panel is one of MapLibre's controls, so MapLibre's own rules for them reach inside it too, such as a button's hover tint.

Every selector is wrapped in `:where()` and weighs nothing, so any rule of the page wins: `.maplace-option { padding: 0 }` is enough to change the entries' padding.

## Turning them off

| Attribute | What |
|---|---|
| `data-maplace-unstyled` | On any element: maplacejs's default styles are off for it and everything inside it, live |

```html
<maplace-map data-maplace-unstyled api-key="YOUR_KEY" list></maplace-map>
```

Put it on `<html>` for the whole page, on `<maplace-map>` for one map, on the element a vanilla map is drawn in, or, with React, on an element around `<MaplaceMap>` and its `<LocationList>` (`<MaplaceMap>` passes no attributes to its own element). A list in a container of its own (`createGoogleMap`'s `list: { container }`) needs the marker there, or above both. A map's popups and on-map panels are drawn inside the map, so a marker on the map or above it reaches them; one on a list placed on the map leaves the panel around that list styled.

What maplacejs's own markup needs stays: a `<maplace-location>` stays hidden (its children are popup content), `<maplace-map>` stays a block, and its map fills it. An on-map panel whose list is hidden stays hidden too.

Without the defaults, the page sizes the map (it has no height of its own) and lays out a list beside it. Popup text takes the page's colour on Google's bubble, which stays white: on a dark page, give `.maplace-popup` a dark colour.

## Classes

| Class | What it marks |
|---|---|
| `maplace-map-pane` | Inside `<maplace-map>`, the element the map is drawn in |
| `maplace-placed-list` | The list `<maplace-map>` places beside the map or on it |
| `maplace-list-view` | The element of every list view maplacejs builds, whichever kind: the class to style a list by (a view you define with `defineListView` is your own element) |
| `maplace-list` | With a heading, the block holding the heading and the entries |
| `maplace-list-heading` | That heading |
| `maplace-listbox` | The list of entries |
| `maplace-group` | A group of entries |
| `maplace-group-heading` | A group's heading |
| `maplace-option` | A location's entry |
| `maplace-fit-all` | The entry that fits all locations (`fitAllLabel`) |
| `maplace-select` | The native select (`as: "select"`, `list="select"`) |
| `maplace-popup` | A popup's content |
| `maplace-popup-heading` | A popup's heading, its location's title |
| `maplace-control` | The panel holding what is placed on a Google or MapLibre map |
| `maplace-google-map` | The element a Google map maplacejs creates is drawn in |
| `maplace-maplibre-map` | The element a MapLibre map maplacejs creates is drawn in |

## States

- An entry carries `data-selected` and `data-hovered` while in that state, as does a DOM marker ([icons](locations.md#icons)).
- A panel on a Google map carries `data-color-scheme`, the map's scheme: `light`, `dark` or `follow-system`.
- `<maplace-map>` shows its load state as `:state(idle)`, `:state(loading)`, `:state(ready)` and `:state(error)` ([load states](element.md#load-states)).
