# The element

`<maplace-map>` is a map with an optional list, and `<maplace-location>` one location inside it. They are the whole API of a page with no build step: one script from the CDN defines both, with the Google provider, or, the MapLibre script, with MapLibre's.

<!-- example: packages/maplace/examples/quick-start/page.html -->
```html
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element.iife.js"></script>
<maplace-map api-key="YOUR_KEY" list>
  <maplace-location location-id="rome" lat="41.9028" lng="12.4964" title="Rome"></maplace-location>
  <maplace-location location-id="milan" lat="45.4642" lng="9.19" title="Milan"></maplace-location>
</maplace-map>
```

From npm, `import "maplace/element/google"` defines the same elements with the Google provider, `import "maplace/element/maplibre"` with the MapLibre provider, and `maplace/element` with none ([Setup](setup.md)). Defining them twice is harmless; a second, different copy of maplacejs on the page logs an error and leaves the first in place.

## Size

The element is 24rem tall unless the page sets its height (`maplace-map { height: 30rem }`); a page sizing it by its layout instead (`position: absolute; inset: 0`, a grid's row) sets `height: auto`. The map fills it, with its list beside it, or, on a screen narrower than 40rem, under it, at most 40% of the height, scrolling. Its own styles come with the element's script, so a page loading that script late keeps the room with `:where(maplace-map:not(:defined)) { display: block; height: 24rem; }`, which a height of the page's still overrides.

## A list before the script runs

maplace builds its list once its script has run, and a map with `hold` only on `release()`. To show the places sooner, while a slow script loads, if it fails, or while a map waits for a visitor's consent, write them into the page's HTML as a list of your own. It also puts them in front of crawlers that run no JavaScript. Hide it the moment maplace's list is there:

<!-- example: packages/maplace/src/element/testing/list-before-script.html -->
```html
<style>
  /* Holds the map's room, and the list's, until the script's own styles come. */
  :where(maplace-map:not(:defined)) {
    display: block;
    height: 24rem;
  }
  .before-script {
    margin: 0;
    overflow: auto;
  }
  maplace-map:not(:defined) > .before-script {
    height: 100%;
  }
  /* Beside a map waiting to load, where maplace's own list will go. */
  maplace-map:defined > .before-script {
    flex: 0 1 16rem;
  }
  @media (width < 40rem) {
    maplace-map:defined > .before-script {
      flex: none;
      max-height: 40%;
    }
  }
  /* Gone the moment maplace's list is there, not before. */
  maplace-map:has(.maplace-placed-list) > .before-script {
    display: none;
  }
</style>

<maplace-map list api-key="YOUR_KEY">
  <ul class="before-script">
    <li><a href="/shops/rome">Rome</a></li>
    <li><a href="/shops/milan">Milan</a></li>
  </ul>
  <maplace-location location-id="rome" lat="41.9" lng="12.5" title="Rome"></maplace-location>
  <maplace-location location-id="milan" lat="45.46" lng="9.19" title="Milan"></maplace-location>
</maplace-map>
```

- Load the script so it doesn't block parsing (`defer`, `type="module"`, or after the map), or a slow one holds the list back too.
- Picking a place still needs the script, so make the entries plain text or links to pages of their own.
- Your list and maplace's are two separate lists. Focus and scroll in yours are lost at the swap, the places are written twice, and the entries change to maplace's look unless your CSS matches it.
- This is for a list beside the map. One in a corner (`list-position`) sits on the map, where yours has no place, and with `data-maplace-unstyled` the map's layout, and so your list's place in it, is your own.
- Schema.org JSON-LD is yours to add the same way, its data matching what the page shows; maplace writes none.

## Map attributes

| Attribute | What |
|---|---|
| `list` | Present: a list of the locations (empty, or `"true"`, as Svelte 5 writes a bare `list`); `list="select"`: a native select; `list="<name>"`: a [list view of yours](#list-views). Absent: no list |
| `list-position` | `outside` (beside the map, the default; under it, within the element's height, on a screen narrower than 40rem), or a corner of the map: `top-left`, `top-right`, `bottom-left`, `bottom-right` |
| `fit-all` | Adds a first entry to the list, which clears the selection and fits all locations. Present, empty or `"true"` is on, `"false"` off, anything else misuse, as for `search`, `my-location`, `open-in-maps-link`, `directions-link`, `cluster` and `hold` |
| `fit-all-label` | The words of the list's first entry, which clears the selection and fits all locations; "All locations" when left out; does nothing without `fit-all`; a blank one is misuse |
| `list-heading` | A heading above the list, beside the map or on it; the list's accessible name |
| `group-counts` | After each group heading, how many are listed under it now, following the filter and `list-scope`: "North (3)". Present, empty or `"true"` is on, `"false"` off, anything else misuse |
| `list-scope` | `viewport`: a switch above the list, "All" or "This area", which lists only what is in the map's view and follows it, wherever the list is placed ([List view options](store.md#list-view-options)); not with `list="select"` |
| `area-only-label` | The words of the `list-scope` switch's button that lists only the map's view; default "This area" |
| `show-all-label` | The words of the `list-scope` switch's button that lists every location; default "All" |
| `empty-area-label` | What a list with `list-scope` says when no location is in the map's view; default "No locations in this area" |
| `list-sort` | `distance`: once the store has an origin, a list nearest first, each entry saying how far ([Distances](store.md#distances)) |
| `distance-unit` | What `list-sort` writes a distance in: `kilometer` (the default) or `mile` |
| `my-location` | Puts the ["My location" control](store.md#the-my-location-control) on the map: a button that asks for the visitor's position only when pressed. A value neither true nor false keeps the map from opening until it is fixed |
| `my-location-label` | The words on the "My location" button; "My location" when blank or left out; does nothing without `my-location` |
| `my-location-unavailable-label` | What the "My location" control says under its button when no position comes; "Location unavailable" when blank or left out |
| `my-location-position` | The corner of the map the "My location" control goes in; `top-left` when left out |
| `search` | Shows a search box above the list; typing narrows the list and the map once it pauses. A switch, as `fit-all` is; misuse with `list="select"` |
| `search-label` | The search box's placeholder and accessible name; "Search" when left out; does nothing without `search`; a blank one is misuse |
| `no-matches-label` | What the line under the search box says when nothing matches; default "No locations match" |
| `matches-label` | What the line under the search box says before the count of matches; default "Locations found", as "Locations found: 3" |
| `provider` | The registered provider to draw with; defaults to the only one registered, and is required when several are. A change opens the map again on it |
| `cluster` | Groups nearby markers into a cluster with a count (on Google's CDN, the cluster script; the MapLibre script clusters as it is). A switch, as `fit-all` is; can't change once the store exists; badges styled as [cluster badges](styling.md#cluster-badges) |
| `skip-map-label` | The words of the [link past the map](store.md#on-every-map), which keyboard users reach first; default "Skip the map"; can't change once the store exists; a blank one is misuse |
| `selected-label` | The word announced before a selected location's name, "Selected: Rome"; default "Selected"; can't change once the store exists; a blank one is misuse |
| `open-in-maps-link` | Adds a [link at the end of each popup](store.md#popup-options), to the location on the provider's maps site: Google Maps on Google, OpenStreetMap on MapLibre; can't change once the store exists |
| `open-in-maps-label` | The words of the link to the provider's maps site; "Open in Maps" when left out; does nothing without `open-in-maps-link`; can't change once the store exists; a blank one is misuse |
| `directions-link` | Adds a link at the end of each popup, to directions to the location: Google Maps on Google, OpenStreetMap on MapLibre; can't change once the store exists |
| `directions-label` | The words of the link to directions; "Directions" when left out; does nothing without `directions-link`; can't change once the store exists; a blank one is misuse |
| `hold` | Stays idle, with no provider request and no list built, until `release()`. A switch, as `fit-all` is, except that a value neither true nor false holds too, as well as being misuse, so a typo can't load a map before consent. Read when the map would open: writing `false` later opens nothing, `release()` does |
| `loading` | `lazy`: the map stays idle until it comes within 100px of the viewport, then loads (its list is built at once), on each connect until `release()`; read when the map would open, as `hold` is. Any other value, or none, loads at once |
| `load-label` | The words of the [load panel](#load-states)'s button; "Load map" when blank or left out; live |
| `load-from-label` | The words before the name on that panel; "Loads from" when blank or left out; live |
| `failure-label` | The words of the panel a map shows [when it can't be used](#load-states); "The map couldn't load." when blank or left out; live |
| `selected-id` | The location selected at start, like `<input value>`; later changes go through `maplace`; a [`url-state`](#url-state) address wins |
| `url-state` | Keeps the selection in the page's address, as `?location=<id>` or the parameter it names; see [URL state](#url-state) |

`list`, `list-position`, `fit-all`, `fit-all-label`, `list-heading`, `group-counts`, `list-scope`, `list-sort`, `distance-unit`, `area-only-label`, `show-all-label`, `empty-area-label`, `search`, `search-label`, `no-matches-label` and `matches-label` are live: a change builds the list again. `my-location` and the `my-location-*` attributes are read when the map opens: a later change does nothing until it opens again. The Google provider reads its own attributes, such as `api-key` and `map-id`, and the MapLibre provider `map-style` and `map-options`, when the map opens; a change of a map setting (`color-scheme`, `map-style` or `map-options`, whichever the provider) opens it again where it was: provider attributes on [Google](google.md#provider-attributes) and [MapLibre](maplibre.md#provider-attributes).

## Properties and methods

| Property | What |
|---|---|
| `locations` | The locations, as an array; once set, it wins over those written inside the element |
| `route` | The [route](store.md#routes), or `undefined` |
| `sanitize` | The store's `sanitize` option, so locations given as JSON or through `locations` can use `html`. Set it before the map opens; set later, it is misuse |
| `maplace` | The underlying [store](store.md), for anything the attributes don't cover |
| `loadState` | `error` while a misuse stands, else the store's: `idle`, `loading`, `ready` or `error` |
| `release` | `release()` starts loading at once an element held with `hold` or waiting with `loading="lazy"` |

The store is created when the element first connects (or `maplace`, `locations` or `route` is first read), from `cluster`, `sanitize`, `selected-id` and the locations, and lives as long as the element. Removed from the page, the map closes and the store goes back to `idle`, keeping its locations, selection and listeners; connected again, a new map opens. A move within one task keeps the map.

No attribute sets a centre and zoom. `selected-id` on a location with a `zoom` opens the map there, at that zoom, the location selected; for a view of your own, a script calls `map.maplace.setView({ lat: 41.9, lng: 12.5 }, 6)`, before the map opens or after ([the first view](store.md#the-first-view)). A selection made later, such as a `selected-id` location arriving afterwards, moves the map to it.

## Events

The store's [events](store.md#events), as DOM events on the element, named in lower case. They bubble, and their `detail` is the store event's payload.

| Event | Store event |
|---|---|
| `maplace-selectionchange` | `selectionChange` |
| `maplace-hoverchange` | `hoverChange` |
| `maplace-mapclick` | `mapClick` |
| `maplace-locationedit` | `locationEdit` |
| `maplace-locationchange` | `locationChange` |
| `maplace-popupopen` | `popupOpen` |
| `maplace-popupclose` | `popupClose` |
| `maplace-viewportchange` | `viewportChange` |
| `maplace-routechange` | `routeChange` |
| `maplace-error` | `error`, and the element's own [misuse](#misuse) |

## Load states

The element's `loadState` is shown as the custom state `:state(idle)` (also `loading`, `ready` and `error`), so CSS styles the map in each, such as a consent placeholder. The element never writes its own attributes or styles; its default styles, and how to turn them off, are on [Styling](styling.md). A map with `hold` asks nothing of its provider until `release()`: a consent banner calls it once the visitor agrees, and a held map builds its list on release too. A map with `loading="lazy"` stays idle until it comes near the viewport, so a map below the fold costs no map load (Google bills each) until the visitor scrolls to it; one in a hidden panel (a closed tab, `<details>`, `display: none`) loads once shown. Its list is built at once; with `hold` as well, it waits for `release()`, which loads it wherever it is.

The [Load on demand](../../packages/maplace/examples/load-on-demand/guide.md) example shows it. While it waits, with `hold` or off-screen with `loading="lazy"`, a map shows a panel in its pane: a button calling `release()` and a line naming whom it loads from. The panel asks no provider anything, and leaves as the map opens, focus passing to the pane if it held it. A placeholder a page draws with `:state(idle)` shows beside it, unless the page replaces or hides the panel, and in the `error` state the panel is hidden until the misuse is corrected.

| The map | The line |
|---|---|
| On Google | "Loads from Google" |
| On MapLibre with no `map-style` | "Loads from OpenFreeMap" |
| On MapLibre, `map-style` an `http` or `https` URL | "Loads from" and the URL's host, its port kept |
| On MapLibre with a JSON style, a relative URL or another scheme | None, only the button: there is no one host to name |
| On a provider of your own (`defineProvider`) | Its registered name |
| With `provider` naming one not registered yet | That name, then the provider's own once it registers |
| With no `provider`, and none or several registered | None, only the button |

`load-label` and `load-from-label` word it. A blank one takes the default words, unlike the other labels, where blank is misuse: an error would hide the panel, and with it the way to load the map. A direct child marked `data-maplace-idle` replaces the panel: the page's own, which stays where the page put it, shows only in `:state(idle)`, and calls `release()` itself. On a lazy map starting in view, it shows for the map's first frame, as `:state(idle)` is true then; the ready-made panel doesn't. A lazy map hidden at first (a closed tab) gets no panel, and opens as it nears the viewport. To look different, or to go, see [Styling](styling.md#classes).

A map that can't be used says so in `:state(error)`: a panel on it (`.maplace-map-failure`, an alert), worded by `failure-label`, which a page handling `:state(error)` itself hides with `.maplace-map-failure { display: none; }`. It shows on the maps maplace's adapters create, and not where the map still works (locations failing to draw), beside Google's own refused-key message, for misuse, or on a provider of your own.

## URL state

With `url-state`, the page's address says which location is selected, so a link opens on it and the back button steps through selections:

```html
<maplace-map url-state selected-id="rome">…</maplace-map>
<!-- page.html?location=milan opens on Milan -->
```

- The location the address names is selected as soon as the locations show it, over `selected-id`. A link naming a location that isn't there is ignored, never an error.
- An address naming no location gets `selected-id`'s written in, with no new history entry, when the element connects before its store is created (a script reading `maplace` first writes nothing).
- Each later selection is a new history entry, and back and forward select again; a cleared selection takes the parameter out, in place when the page took the location away (new locations, a filter), so the entry you leave doesn't name a location that's gone. Only that parameter changes: the rest of the query and the hash are kept.
- A bare `url-state` (or `"true"`) is the `location` parameter. With several maps on a page, give each its own: `url-state="office"`.
- The attribute is read when the element connects.

With React, or a store of your own, read and write the address around `select`, as the [Link to a place](../../packages/maplace/examples/link-to-place/guide.md) example does.

## Location attributes

| Attribute | What |
|---|---|
| `location-id` | The location's `id` (not `id`, which must be unique on the page) |
| `lat`, `lng` | A marker's position, or a circle's centre |
| `title` | Its `title`: the list label, the accessible name on the map and its popup's heading |
| `type` | `marker` (the default) or `circle`; a polyline or polygon needs a `path`, so it goes in the map's inline JSON ([data](#data)) |
| `group` | Its `group` |
| `tags` | Its `tags`, split on spaces, as `class` is: a tag written here can't hold a space |
| `search-text` | Its `searchText` |
| `radius` | A circle's radius, in metres |
| `icon` | A marker's image URL |
| `zoom` | The zoom selecting it shows it at |
| `listed` | `"false"` keeps it out of the list; on the map still |
| `editable` | Lets the user drag or reshape it |
| `shape-style`, `selected-style`, `hovered-style` | A shape's `style`, `selectedStyle` and `hoveredStyle`, as JSON (not `style`: that is HTML's inline CSS) |

Each attribute sets the [location field](locations.md) of the same meaning. Booleans are as HTML writes them: present, empty or `"true"` is true, `"false"` false, anything else misuse naming the attribute.

## Templates

A `<template>` child of `<maplace-location>` is the popup's content, and a `<template data-icon>` child the marker, in place of `icon` (one element, or a span around the rest), cloned for each state. Templates are the page's own markup and trusted, so they skip `sanitize`; `html` set through `locations` still needs it.

## Data

A map's locations come from the `locations` property once it is set; else from one inline `<script type="application/json">` child, or from `<maplace-location>` children. Both a script and location children is misuse. Children and the script are watched for changes. The element never fetches: to load data from a URL, fetch it and set `locations`.

<!-- example: packages/maplace/examples/polygon/page.html -->
```html
<!doctype html>
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element.iife.js"></script>
<!-- An editable area; edits are written back and announced. -->
<maplace-map id="polygon-map" api-key="YOUR_KEY">
  <script type="application/json">
    [{ "id": "park", "type": "polygon", "title": "Park", "editable": true,
       "path": [{ "lat": 41.91, "lng": 12.48 }, { "lat": 41.92, "lng": 12.49 }, { "lat": 41.90, "lng": 12.50 }] }]
  </script>
</maplace-map>
<script>
  document.getElementById('polygon-map').addEventListener('maplace-locationchange', (event) => save(event.detail.location));
</script>
```

A map waits for the document to parse its children before it opens, whether parsed or created by a script, so its first view and `selected-id` see them all.

## Providers

`defineProvider(name, factory)` registers a provider for `provider="<name>"`: the factory gets the element and returns an adapter. `maplace/element/google` registers `google`, and `maplace/element/maplibre` registers `maplibre`. With both registered (both element entries imported from npm), each map names one with `provider`, else the map is misuse naming `provider` (`several providers are registered ("google", "maplibre"): set provider`). A map naming a provider not registered yet opens once it is.

## List views

`defineListView(name, factory)` registers a list view for `list="<name>"`. The factory gets the store and a setup: `options`, the list options from the attributes (`fitAll`, `fitAllLabel`, `heading`, `groupCounts`, `scope`, `sort`, `distanceUnit`, `areaOnlyLabel`, `showAllLabel`, `emptyAreaLabel`, `search`, `searchLabel`, `noMatchesLabel`, `matchesLabel`; a switch and its label come as written, so a view of yours that shows a fit-all entry or a search box checks `fitAll` or `search`, and brings its own words when the label is missing), and `listed()`, the locations maplacejs's own lists show now, to read again on each store change; a list with `scope` narrows them to its view in "This area", so a view of yours with `scope` scopes itself. It returns a [`ListView`](store.md#list-view-options), placed by `list-position` as the built-in ones are. A name defined after the map opened builds its list then. Defining a built-in name (`select`, `true`), or one already given to another factory, throws; a `list` naming a view not defined is misuse until it is. `listed()` stays in data order: a view with `sort` sorts itself, with [`distanceTo`](store.md#distances).

A page on the CDN script, which imports nothing, calls it as `Maplace.defineListView`. [The custom-list example](../../packages/maplace/examples/custom-list/) defines one.

## Misuse

Where no caller can catch a throw, misuse sets the element's error state (`loadState` and `:state(error)`) and dispatches `maplace-error`; nothing fails silently. The error stands until the misuse is corrected: bad locations or a bad route keep the previous ones until valid ones are given, and a `selected-id` the locations don't have is selected once they do. The codes are in the [API reference](api.md#misuse-codes), the rules in [RFC §3 Errors](../rfc-1.0.md#errors).

## Vue and Svelte

Vue and Svelte use the elements as they are, with no wrapper. Import an element entry in the component, or anywhere before the app mounts. With server rendering (Nuxt, SvelteKit), render the map in the browser only, in a component that imports the entry and renders only there (Nuxt's `.client.vue`, a SvelteKit page with `ssr = false`), so the elements are defined before it mounts.

Vue is told that `maplace-` tags are custom elements, not components, in its compiler options, here those of `@vitejs/plugin-vue`:

```ts
vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("maplace-") } } })
```

```vue
<script setup lang="ts">
import "maplace/element/google";
import type { Location } from "maplace";
import type { MaplaceElementEventMap } from "maplace/element";

const locations: Location[] = [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }];
const showSelected = (event: MaplaceElementEventMap["maplace-selectionchange"]) =>
  console.log(event.detail.id);
</script>

<template>
  <maplace-map api-key="YOUR_KEY" list map-options='{"maxZoom": 12}' :locations.prop="locations"
    @maplace-selectionchange="showSelected"></maplace-map>
</template>
```

Svelte takes the tags as they are:

```svelte
<script lang="ts">
  import "maplace/element/google";
  import type { Location } from "maplace";

  const locations: Location[] = [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }];
</script>

<maplace-map api-key="YOUR_KEY" list map-options={JSON.stringify({ maxZoom: 12 })} {locations}
  onmaplace-selectionchange={(event) => console.log(event.detail.id)}></maplace-map>
```

- **Attributes** are written as in HTML; a JSON one, such as `map-options` or a location's `shape-style`, is a string, written out or made with `JSON.stringify`. A switch, such as `cluster` or `hold`, takes `false` as `"false"`, which is how both frameworks write it, and that is off (`hold` only as the map would open: `release()` opens a held map); other attributes are written or left out, never given `false`. Svelte 5 writes a bare attribute as `"true"`, which `list` takes as the built-in list. A location's `listed` and `editable` take `false` as `"false"`, their off value.
- **`locations`** is a property, as are `route` and `sanitize`: Vue sets each as one with `.prop` (`:locations.prop`), even before the element is defined. Svelte sets one as a property (`locations={…}`) once the element is defined, so the entry is imported before the component mounts.
- **Events** are listened to by their [names](#events): `@maplace-selectionchange` in Vue, `onmaplace-selectionchange` in Svelte 5 and `on:maplace-selectionchange` in Svelte 4, the event typed with its `detail`; a listener for another event, such as a page's own, types its parameter itself.
- **Popups and icons** in Vue come through `locations`, not a `<maplace-location>`'s `<template>` child: Vue renders a template's children into the element, not its content, so the child arrives empty.
- **Anything more** goes through the element itself, taken with `ref` in Vue or `bind:this` in Svelte: its [properties and methods](#properties-and-methods), such as its `maplace` store.

The types of `maplace/element` reach both frameworks' template checks (vue-tsc, svelte-check): the elements' attributes, those three properties and the events; other attributes, such as `class`, pass. A project with neither loads none of their types.
