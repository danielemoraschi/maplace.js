# Setup

A maplace map on Google needs Maps JS on the page and an API key; a map ID is optional. The element (its CDN script, or `maplace/element/google` from npm) adds Maps JS itself; with the adapter from npm, the page loads it.

## Key and Map ID

Two different things from Google, easy to mix up:

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

Google checks the key as the first map opens. A key it refuses (an invalid key, a referrer the key doesn't allow, the API or billing not enabled, a quota used up) is a `provider-auth-failed` error for every map on the page, and the map shows Google's message. A missing key isn't refused: Google draws the map and logs `ApiProjectMapError`, so maplace reports nothing ([when Google refuses](google.md#when-google-refuses)).

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

## With npm

```sh
npm install maplace
```

The page loads Maps JS with [Google's bootstrap loader](https://developers.google.com/maps/documentation/javascript/load-maps-js-api) (or `@googlemaps/js-api-loader`) and gives the map's container its size:

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

For the element from npm, `import "maplace/element/google"` defines it with the Google provider; it adds Maps JS itself as on the CDN, or takes the page's when the page loaded it first. With React: [React](react.md). Routes need Maps JS 3.63 or later. Every entry and what it gives: [API reference](api.md).

## Content Security Policy

The script the element adds carries the `nonce` attribute of its `<maplace-map>`, so a page with a nonce-based policy lets it load. The element never writes inline styles: its default styles are an adopted stylesheet, and a shape's styles are JSON attributes, not `style`.

## Consent

A map with `hold` asks nothing of Google, and adds no script, until `release()`. A page that needs a visitor's consent before loading Google renders its map with `hold`, styles the placeholder with `:state(idle)`, and calls `release()` once the visitor agrees ([load states](element.md#load-states)).
