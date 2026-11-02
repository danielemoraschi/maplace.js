# Styling

maplacejs comes with a few default styles. They make a map usable as soon as it is on a page, and the page can change any of them or turn them all off. What maplacejs draws carries the classes below, for the page's own styles.

## Default styles

maplacejs adds its styles to the page itself (adopted stylesheets, so no `<link>` and nothing for a content security policy to allow), and only for what the page uses:

- **The element:** `<maplace-map>` is 24rem tall, and a list beside the map goes under it on a screen narrower than 40rem.
- **The list:** its entries look like buttons, with the selected and hovered ones tinted from the text's own colour. Group headings are small and uppercase, and a heading stays in view while the entries scroll.
- **Popups:** dark text on the provider's white bubble, the content and its heading alike: on Google, inset as Google insets its start; on MapLibre, the heading on a line of its own, clear of the close button; its links in a row at the end, each 1.5rem tall.
- **The dot where distances are measured from:** 18px, blue with a white border and a soft shadow. It takes no pointer input, inside `data-maplace-unstyled` too, so a click reaches the map.
- **Clusters:** a round badge with the count, blue with white text. `--maplace-cluster-background` and `--maplace-cluster-color`, set on the map or anything above it, change its colours.
- **On a Google map:** what goes on the map (a list, a select, your own controls) sits in a panel like Google's own controls, in the map's colour scheme (light on your own map).
- **On a MapLibre map:** what goes on the map sits in a panel like MapLibre's own controls, light, as they are. `.maplace-control { color-scheme: dark }` gives a dark panel on either map. The panel is one of MapLibre's controls, so MapLibre's own rules for them reach inside it too, such as a button's hover tint ([MapLibre adapter](maplibre.md#on-map-controls)).

Every selector is wrapped in `:where()` and weighs nothing, so any rule of the page wins: `.maplace-option { padding: 0 }` is enough to change the entries' padding.

## Right to left

With `dir="rtl"` on the page or anything above the map, lists, panels, popups and the link past the map follow it, with nothing to turn on. Three things stay where they are:

- **Corners:** `top-left` is the top left in either direction, so choose the corner you want. A list's default, `top-right`, is where a right-to-left reader starts.
- **MapLibre's close button** stays at the popup's top right, as MapLibre draws it, so a popup's heading sits clear of it, a little in from the text below. Google mirrors its own.
- **Your words:** the labels are English until you set them.

Map labels in Arabic and Hebrew need no plugin on MapLibre 6.

## Cluster badges

A map with `cluster` draws each cluster as a badge with its count, `.maplace-cluster`, on Google and MapLibre alike. Two custom properties set its colours, on the map or anything above it:

```css
maplace-map {
  --maplace-cluster-background: #0b6e4f;
  --maplace-cluster-color: #fff;
}
```

For the rest of its look, style the class: its default rule weighs nothing, so yours wins.

```css
.maplace-cluster {
  min-width: 40px;
  height: 40px;
  border-radius: 20px;
  font: 700 15px/36px system-ui, sans-serif;
}
```

The badge stands with its bottom middle on the cluster's point, whatever its size. Its accessible name, "Cluster of N locations", is on the marker around it, so a badge drawn differently still reads the same.

## Turning them off

| Attribute | What |
|---|---|
| `data-maplace-unstyled` | On any element: maplacejs's default styles are off for it and everything inside it, live |

```html
<maplace-map data-maplace-unstyled api-key="YOUR_KEY" list></maplace-map>
```

Put it on `<html>` for the whole page, on `<maplace-map>` for one map, on the element a vanilla map is drawn in, or, with React, on an element around `<MaplaceMap>` and its `<LocationList>` (`<MaplaceMap>` passes no attributes to its own element). A list in a container of its own (`createGoogleMap`'s or `createMapLibreMap`'s `list: { container }`) needs the marker there, or above both. A map's popups and on-map panels are drawn inside the map, so a marker on the map or above it reaches them; one on a list placed on the map leaves the panel around that list styled.

What maplacejs's own markup needs stays: a `<maplace-location>` stays hidden (its children are popup content), `<maplace-map>` stays a block, and its map fills it. An on-map panel whose list is hidden stays hidden too.

Without the defaults, the page sizes the map (it has no height of its own) and lays out a list beside it. Popup text takes the page's colour on Google's and MapLibre's bubbles, which stay white: on a dark page, give `.maplace-popup` a dark colour.

## Classes

| Class | What it marks |
|---|---|
| `maplace-map-pane` | Inside `<maplace-map>`, the element the map is drawn in |
| `maplace-load-panel` | The [panel](element.md#load-states) with the "Load map" button, shown in the pane of a map waiting to load; `.maplace-load-panel { display: none; }` removes it |
| `maplace-map-failure` | The panel saying a map [can't be used](element.md#load-states), on a map maplacejs created; `.maplace-map-failure { display: none; }` removes it, for a page handling `:state(error)` or the `error` event itself. On your own map none shows |
| `maplace-placed-list` | The list `<maplace-map>` places beside the map or on it |
| `maplace-list-view` | The element of every list view maplacejs builds, whichever kind: the class to style a list by (a view you define with `defineListView` is your own element) |
| `maplace-list` | The block around a list's entries and its heading, area switch or search box; only on a list with one of those three |
| `maplace-list-heading` | A list's visible heading (`heading`, `list-heading`) |
| `maplace-area-switch` | The "All" and "This area" switch of a list with `scope`: two buttons, the one in use `[aria-pressed=true]` |
| `maplace-show-all` | The switch's "All" button |
| `maplace-area-only` | The switch's "This area" button |
| `maplace-empty-area` | What a list with `scope` says when no location is in the map's view (`emptyAreaLabel`); empty otherwise |
| `maplace-my-location` | The whole "My location" control: the box with its button, and the line under it that says when no position comes |
| `maplace-my-location-box` | The box around the control's button; the button is `[aria-pressed=true]` while the visitor's position is in use |
| `maplace-my-location-status` | What the control says when it gets no position (`unavailableLabel`); empty otherwise |
| `maplace-listbox` | The element holding a list's entries, without its heading, switch or search box |
| `maplace-group` | A group's heading and entries in the list |
| `maplace-search` | The search box (`search`) |
| `maplace-search-status` | What the search box says: how many locations match, or that none does; empty with no query |
| `maplace-group-heading` | A group's heading, with its count in the same text (`groupCounts`) |
| `maplace-option` | A location's entry in the list |
| `maplace-distance` | An entry's distance, after its label, in a list with `sort: "distance"`; a custom `render` shows its own instead |
| `maplace-fit-all` | The list's first entry, which clears the selection and fits all locations (`fitAll`) |
| `maplace-select` | The native select (`as: "select"`, `list="select"`) |
| `maplace-origin-dot` | The dot on the map where distances are measured from: the visitor's position after the ["My location" control](store.md#the-my-location-control), or a point the page gives to `setOrigin`; `{ display: none }` removes it |
| `maplace-popup` | A popup's content |
| `maplace-popup-heading` | A popup's heading, its location's title |
| `maplace-popup-links` | The links at the end of a popup (`openInMapsLink`, `directionsLink`); a page's `a` rule colours them, so a pale one needs `.maplace-popup-links a` for the white bubble |
| `maplace-cluster` | The badge with the count on a cluster of markers, on either provider |
| `maplace-control` | The panel around anything placed on a Google or MapLibre map: a list, a select, the "My location" control, your own controls |
| `maplace-skip-map` | The [link past the map](store.md#on-every-map), hidden until focused; `display: none` removes it |
| `maplace-google-map` | The element a Google map is drawn in, when maplacejs creates the map rather than being handed one |
| `maplace-maplibre-map` | The element a MapLibre map is drawn in, when maplacejs creates the map rather than being handed one |

A direct child of `<maplace-map>` marked `data-maplace-idle` replaces the load panel, taking the pane's place in `:state(idle)` and hidden in every other state, whatever `display` the page gives it. The default styles are adopted on the document: for a map inside a shadow root, the page hides its own child with a `:state(idle)` rule of its own.

## States

- An entry carries `data-selected` and `data-hovered` while in that state, as does a DOM marker ([icons](locations.md#icons)).
- A panel on a Google map carries `data-color-scheme`, the map's scheme: `light`, `dark` or `follow-system`.
- `<maplace-map>` shows its load state as `:state(idle)`, `:state(loading)`, `:state(ready)` and `:state(error)` ([load states](element.md#load-states)).
