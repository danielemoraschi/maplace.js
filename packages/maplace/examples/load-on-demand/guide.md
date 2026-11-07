# Load on demand

The map stays idle in its place, its tiles and its provider's requests waiting, until the visitor presses a button: for a heavy map low on a page, or to ask first.

- **Try it**: press **Load map** and the map draws. Every version shows the same panel, a line naming whom the map loads from and the button: the HTML version's is the element's own, the others write their own with its look. On this site the map's script is loaded once you accept maps, so what waits for the press is the map and its tiles.
- **HTML**: `hold` on `<maplace-map>` shows the panel; its button calls `release()`, which a script of yours can call too. `load-label` and `load-from-label` set its words. For a map that waits until it scrolls into view instead, `loading="lazy"` ([Load states](../../../../docs/reference/element.md#load-states)).
- **Script** and **Bundler**: a panel of yours, a line naming whom the map loads from and a button, with `createGoogleMap` or `createMapLibreMap` in the button's click listener, so nothing is created until then ([Creating a store](../../../../docs/reference/store.md#creating-a-store)). The panel goes with the press, focus moved to the map's box first, so a keyboard reader isn't sent back to the top of the page.
- **React**: state for whether it was pressed, rendering the panel or the `<MaplaceProvider>` and `<MaplaceMap>`, the press moving the focus ([`<MaplaceMap>`](../../../../docs/reference/react.md#maplacemap)).
