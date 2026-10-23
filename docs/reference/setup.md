# Setup

A maplacejs map draws on Google Maps or on MapLibre. On Google it needs Maps JS on the page and an API key, a map ID being optional. The element (its CDN script, or `maplace/element/google` from npm) adds Maps JS itself; with the adapter from npm, the page loads it. On MapLibre it needs no key and no map ID, only a [style URL](#style-url), OpenFreeMap's by default: the MapLibre CDN script brings everything else, and from npm the page installs maplibre-gl.

## Key and Map ID

On Google, two different things, easy to mix up:

| | API key | Map ID |
|---|---|---|
| Where | the element's `api-key`, or `key` in Google's loader | the element's `map-id`, the adapter's `mapId` |
| What it does | lets your site load Maps JS, and bills your Google project | picks the map's configuration: advanced markers, Cloud styling |
| In the examples | `YOUR_KEY`, a placeholder: nothing loads until you put yours in | left out: the map uses Google's `DEMO_MAP_ID` |
| Needed | yes, always | no |
| Kept safe by | restricting it to your site's addresses: it is in your page for anyone to read | nothing: it is public |

- **The key** is your Google Maps JavaScript API key: Google's [Get an API key](https://developers.google.com/maps/documentation/javascript/get-api-key) says how to make one and restrict it to your site.
- **The map ID** defaults to `DEMO_MAP_ID`, Google's public map ID for development. A map on it warns once in the console that it isn't for production.
- **For production**, make a map ID of your own (Google's [map IDs](https://developers.google.com/maps/documentation/get-map-id)) and set it. It is also where the map's Cloud styling lives, besides a colour scheme ([map ID and styling](google.md#map-id-and-styling)).

Google checks the key as the first map opens. A key it refuses (an invalid key, a referrer the key doesn't allow, the API or billing not enabled, a quota used up) is a `provider-auth-failed` error for every map on the page, and the map shows Google's message. A missing key isn't refused: Google draws the map and logs `ApiProjectMapError`, so maplacejs reports nothing ([when Google refuses](google.md#when-google-refuses)).

## Style URL

On MapLibre a map's look and its tiles come from its style: a URL (or a JSON style object) the element's `map-style` or the adapter's `mapStyle` takes. Left out, it is OpenFreeMap's `liberty` style: free, no key, OpenStreetMap data.

Another provider's style URL works the same way, its key in the URL where it needs one, and kept safe as that provider says. A style its server refuses (HTTP 401 or 403) is `provider-auth-failed`, and one that fails to load is `provider-load-failed` ([styles and tiles](maplibre.md#styles-and-tiles)).

## With the CDN script

One script, no build step. The element adds Maps JS to the page itself, once however many maps:

<!-- example: packages/maplace/examples/quick-start/page.html -->
```html
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element.iife.js"></script>
<maplace-map api-key="YOUR_KEY" list>
  <maplace-location location-id="rome" lat="41.9028" lng="12.4964" title="Rome"></maplace-location>
  <maplace-location location-id="milan" lat="45.4642" lng="9.19" title="Milan"></maplace-location>
</maplace-map>
```

`version`, `language` and `region` choose the Maps JS it loads: [provider attributes](google.md#provider-attributes). A map with `cluster` needs the cluster script instead, and production pages pin the version with an integrity hash: [one script per page](../../README.md#one-script-per-page) and [pin it for production](../../README.md#pin-it-for-production).

On MapLibre, its own script, with no key:

<!-- example: packages/maplace/examples/quick-start/maplibre/page.html -->
```html
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element-maplibre.iife.js"></script>
<maplace-map list>
  <maplace-location location-id="rome" lat="41.9028" lng="12.4964" title="Rome"></maplace-location>
  <maplace-location location-id="milan" lat="45.4642" lng="9.19" title="Milan"></maplace-location>
</maplace-map>
```

It bundles maplibre-gl, its worker and its stylesheet, clustering included; `map-style` and `map-options` are its [provider attributes](maplibre.md#provider-attributes).

## With a script of your own

A page that makes its map in its own script, as 0.2's did, uses the same CDN script with no build step: the script also sets `Maplace`, a namespace of functions, what the npm entries export (`maplace`, the provider's and `maplace/element`), so `Maplace.createGoogleMap(...)` is what an npm page imports as `createGoogleMap`. The store it makes is the page's own, `maplace` in these docs (typed `Maplace` from npm). Given `apiKey`, maplacejs adds Maps JS to the page itself as the map mounts, as the element does from `api-key`:

<!-- example: packages/maplace/examples/simple/script.html -->
```html
<!doctype html>
<!-- A page of your own script: the CDN script, what the map mounts on, and the map made with Maplace, which adds Maps JS with your key. -->
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element.iife.js"></script>
<style>
  #simple-script-map { height: 24rem; }
</style>
<div id="simple-script-map"></div>
<script type="module">
  Maplace.createGoogleMap("#simple-script-map", {
    apiKey: "YOUR_KEY",
    locations: [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }],
  });
</script>
```

`version`, `language`, `region` and `nonce` go beside `apiKey`, as the element's attributes do, choosing the Maps JS it loads: [options](google.md#options). Google fixes them once per page, so every map on it asks for the same.

On MapLibre, the MapLibre script's `Maplace` has `createMapLibreMap` and `createMapLibreAdapter`, and, as `Maplace.maplibre`, the maplibre-gl it bundles, for a map of your own ([loading maplibre-gl](maplibre.md#loading-maplibre-gl)):

<!-- example: packages/maplace/examples/simple/maplibre/script.html -->
```html
<!doctype html>
<!-- A page of your own script: the MapLibre CDN script, which bundles maplibre-gl and its stylesheet, what the map mounts on, and the map made with Maplace. -->
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element-maplibre.iife.js"></script>
<style>
  #simple-maplibre-script-map { height: 24rem; }
</style>
<div id="simple-maplibre-script-map"></div>
<script type="module">
  Maplace.createMapLibreMap("#simple-maplibre-script-map", {
    locations: [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }],
  });
</script>
```

Every example on the site has this version, under its Script tab.

## With npm

```sh
npm install maplace
```

On Google, the page loads Maps JS with [Google's bootstrap loader](https://developers.google.com/maps/documentation/javascript/load-maps-js-api) (or `@googlemaps/js-api-loader`) and gives the map's container its size:

<!-- example: packages/maplace/examples/simple/vanilla.html -->
```html
<!doctype html>
<!-- The page vanilla.ts runs on: Maps JS from Google's bootstrap loader, what the module mounts on, the module. -->
<script>
  (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
    key: "YOUR_KEY",
    v: "weekly",
  });
</script>
<style>
  #simple-vanilla-map { height: 24rem; }
</style>
<div id="simple-vanilla-map"></div>
<script type="module" src="./vanilla.ts"></script>
```

The module makes the store on a Google map in one call ([`createGoogleMap`](google.md#creategooglemap)):

<!-- example: packages/maplace/examples/simple/vanilla.ts -->
```ts
import { createGoogleMap } from "maplace/google";

createGoogleMap("#simple-vanilla-map", {
  locations: [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }],
});
```

For the element from npm, `import "maplace/element/google"` defines it with the Google provider; it adds Maps JS itself as on the CDN, or takes the page's when the page loaded it first. With React: [React](react.md). Routes are Google's, and need Maps JS 3.63 or later. Every entry and what it gives: [API reference](api.md).

On MapLibre, the page installs maplibre-gl beside maplacejs (`npm install maplace maplibre-gl`) and imports its stylesheet, `maplibre-gl/dist/maplibre-gl.css`, in its module. It needs no loader script and no key. [`createMapLibreMap`](maplibre.md#createmaplibremap) from `maplace/maplibre` makes the store in one call, and `import "maplace/element/maplibre"` defines the element with the MapLibre provider. The simple example's MapLibre version is the whole page:

<!-- example: packages/maplace/examples/simple/maplibre/vanilla.html -->
```html
<!doctype html>
<!-- The page vanilla.ts runs on: what the module mounts on, and the module, which brings maplibre-gl and its stylesheet. -->
<style>
  #simple-maplibre-vanilla-map { height: 24rem; }
</style>
<div id="simple-maplibre-vanilla-map"></div>
<script type="module" src="./vanilla.ts"></script>
```

<!-- example: packages/maplace/examples/simple/maplibre/vanilla.ts -->
```ts
import "maplibre-gl/dist/maplibre-gl.css";
import { createMapLibreMap } from "maplace/maplibre";

createMapLibreMap("#simple-maplibre-vanilla-map", {
  locations: [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }],
});
```

## Content Security Policy

The script the element adds carries the `nonce` attribute of its `<maplace-map>`, and the one an adapter given `apiKey` adds carries its `nonce` option, so a page with a nonce-based policy lets it load. The element never writes inline styles: its default styles are an adopted stylesheet, and a shape's styles are JSON attributes, not `style`.

On MapLibre, from the CDN script or npm, a policy allows `img-src data: blob:`, as MapLibre asks: the pin maplacejs draws in front for the selected or hovered location, and on an `editable` marker, is a `data:` image. The MapLibre CDN script also starts maplibre-gl's worker from a `blob:` URL, so its pages allow `worker-src blob:`; its stylesheet is adopted, as the element's own styles are. The map fetches its style, and the tiles, fonts and icons it names, from the style's servers (OpenFreeMap's, by default), which `connect-src` allows.

## Consent

A map with `hold` asks nothing of its provider (Google, or the style's servers on MapLibre), and adds no script, until `release()`. A page that needs a visitor's consent before loading a map renders its map with `hold`, styles the placeholder with `:state(idle)`, and calls `release()` once the visitor agrees ([load states](element.md#load-states)).
