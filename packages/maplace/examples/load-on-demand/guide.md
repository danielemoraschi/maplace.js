# Load on demand

The map stays idle in its place, its tiles and its provider's requests waiting, until the visitor presses a button: for a heavy map low on a page, or to ask first.

- **Try it**: press **Load map** and the map draws. The HTML version's button is the element's own, with a line naming whom the map loads from; the others make a button of their own. On this site the map's script is loaded once you accept maps, so what waits for the press is the map and its tiles.
- **HTML**: `hold` on `<maplace-map>` shows the button; it calls `release()`, which a script of yours can call too. `load-label` and `load-from-label` set its words. For a map that waits until it scrolls into view instead, `loading="lazy"` ([Load states](../../../../docs/reference/element.md#load-states)).
- **Script** and **Bundler**: a button of yours, and `createGoogleMap` or `createMapLibreMap` in its click listener, so nothing is created until then ([Creating a store](../../../../docs/reference/store.md#creating-a-store)). It moves focus to the map's box before it goes, so a keyboard reader isn't sent back to the top of the page.
- **React**: state for whether it was pressed, rendering the button or the `<MaplaceProvider>` and `<MaplaceMap>`, the press moving the focus ([`<MaplaceMap>`](../../../../docs/reference/react.md#maplacemap)).
