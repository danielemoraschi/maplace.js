# Google adapter

`createGoogleAdapter(options)` from `maplace/google` draws a store on Google Maps; `maplace/google` is the only entry that knows `google.maps`. The element's Google provider (`maplace/element/google`, and the CDN script) makes the same adapter from the element's attributes. Provider options belong to the adapter, never to the store.

## Options

| Option | Type | What |
|---|---|---|
| `mapId` | `string` | Required: Google's advanced markers need a map ID. `DEMO_MAP_ID` works for development |
| `colorScheme` | `"light" \| "dark" \| "follow-system"` | The colour scheme of a map maplace creates |
| `map` | `google.maps.Map` | Your own map to draw on, instead of one maplace creates |
| `mapOptions` | `google.maps.MapOptions` | Extra options for a map maplace creates; not `center`, `zoom`, `mapId`, `colorScheme` or `styles` |

`center` and `zoom` are left out of `mapOptions` because only the store's `view` sets them, and JSON `styles` because Google ignores them on a map with a map ID ([map ID and styling](#map-id-and-styling)). An option the adapter doesn't know is `invalid-input`.

## Your own map

A map maplace creates is a new element filling the container (so size the container), removed on `destroy`. With `map`, maplace draws on your map and never moves it in the page or removes it; the store's `view` still sets its camera.

- `attach`'s container must be `map.getDiv()` or hold it.
- `mapOptions` and `colorScheme` are refused: set them on your map.
- Your map's own map ID applies: keep `mapId` the same. Google shows no markers on a map made without one, so that is `provider-load-failed` with `field: 'mapId'`.
- `destroy` removes only what maplace added.

`whenReady` waits for Google to initialise the map, created or yours (at most 2 s, and not while it is hidden).

## Provider attributes

The element's Google provider reads these attributes of `<maplace-map>` when the map opens.

| Attribute | What |
|---|---|
| `map-id` | Required: the map ID, as `mapId` |
| `nonce` | The nonce of the Maps JS script it adds, for a Content Security Policy |
| `color-scheme` | `light`, `dark` or `follow-system`, as `colorScheme` |
| `map-options` | A JSON object of Google's map options, as `mapOptions`, with the same exclusions |
| `api-key` | The key Maps JS loads with; needed only when the provider adds Maps JS itself |
| `version` | The Maps JS version to load |
| `language` | The language Maps JS loads with |
| `region` | The region Maps JS loads with |

A change of `color-scheme` or `map-options` opens the map again where it was, keeping the store's state, since Google sets a colour scheme only on a new map; each re-open is a new map load, which Google bills. A bad value is `invalid-input` naming the attribute (`map-options.center`).

## Loading Maps JS

Nothing reads `google` on import. The adapter calls the global `google.maps.importLibrary`, which works with [Google's bootstrap loader](https://developers.google.com/maps/documentation/javascript/load-maps-js-api) and with `@googlemaps/js-api-loader`, so maplace has no loader dependency. Without `google.maps.importLibrary` (an old or missing Maps JS) loading fails with `provider-load-failed`.

Only the element's Google provider adds Maps JS itself: one script per page however many maps, never while the element is held. The page's Maps JS tag, whoever added it, is shared: an element asking it for another `api-key`, `version`, `language` or `region` is misuse (one it leaves out takes the page's). A page that loaded Maps JS without a tag of its own (the bootstrap loader, js-api-loader) is taken as it is. [Setup](setup.md) has both routes.

## Map ID and styling

maplace draws advanced markers only (Google deprecated the legacy `Marker`), so a map ID is required; `DEMO_MAP_ID`, Google's public demo ID, works for development. A map is styled through its map ID's Cloud styling, plus `colorScheme`.

## Routes

Routes use Google's Routes library, which needs Maps JS 3.63 or later; an older one fails the route with `route-failed`. A route has 2 to 27 stops (the adapter's `routeStopLimit`), `via` stops counting too. Each leg comes with its turn-by-turn `steps`, at no extra cost, each `instruction` in the language Maps JS loaded with. Each computation is billed, so a route is computed only when it changes ([routes](store.md#routes)).

## Clustering

The `cluster` option (the element's `cluster` attribute) groups markers with `@googlemaps/markerclusterer`, drawing maplace's own cluster markers: a count, titled "Cluster of N locations". Circles, lines and polygons are never clustered, and the selected location is drawn on its own. The clusterer loads with the map, so `whenReady` waits for it; a failed load is `provider-load-failed`. On the CDN, a map with `cluster` needs `maplace-element-cluster.iife.js`, which bundles it; on the plain script it fails to load, naming the cluster script.

## When Google refuses

Google refusing the key (an invalid key, a referrer the key doesn't allow, the API or billing not enabled, a quota used up) is `provider-auth-failed` for every map on the page. Google checks the key as the first map opens, so this can come after `ready`: maplace then stops drawing and leaves the map, with Google's message on it, until `destroy`. Your own `gm_authFailure` still runs. A missing key isn't refused (Google draws the map and logs `ApiProjectMapError`), so it reports nothing.

## Clicks and edits

A click on the map is reported 250 ms after it, unless a double-click comes first, so a double-click zoom neither fires `mapClick` nor clears the selection; a location clicked within those 250 ms drops the map's click. A marker reports its drag as it moves (`locationEdit`); Google says where a shape's handle went only when it is let go, so a shape's `locationEdit` comes once, with its `locationChange`.
