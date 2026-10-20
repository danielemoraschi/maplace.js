// Compile-time checks of createGoogleMap's options: each @ts-expect-error must stay an error.

import type { Location, Maplace } from "maplace";
import {
  createGoogleAdapter,
  createGoogleMap,
  type GoogleAdapterOptions,
  type GoogleMapList,
} from "maplace/google";
import { expectTypeOf } from "vitest";

declare const pageMap: NonNullable<GoogleAdapterOptions["map"]>;
declare const side: HTMLElement;

// The data type comes from the locations given, as createMaplace's does.
const shops = createGoogleMap("#map", {
  mapId: "DEMO_MAP_ID",
  locations: [{ id: "s", lat: 1, lng: 2, data: { price: 3 } }],
});
expectTypeOf(shops).toEqualTypeOf<Maplace<{ price: number }>>();
expectTypeOf(shops.getSnapshot().locations).toEqualTypeOf<readonly Location<{ price: number }>[]>();

createGoogleMap(side, { mapId: "id", colorScheme: "dark", mapOptions: { mapTypeControl: true } });
createGoogleMap("#map", { mapId: "id", cluster: true, list: true });
createGoogleMap("#map", { mapId: "id", list: { as: "select", position: "bottom-left" } });
createGoogleMap("#map", { mapId: "id", list: { heading: "Cities", container: "#side" } });
createGoogleMap("#map", { mapId: "id", list: { container: side } });
expectTypeOf<GoogleMapList["position"]>().toEqualTypeOf<
  "top-left" | "top-right" | "bottom-left" | "bottom-right" | undefined
>();

// No map ID, no options: Google's demo map ID, and the store's defaults.
createGoogleMap("#map");
createGoogleMap("#map", { locations: [{ id: "s", lat: 1, lng: 2 }] });
createGoogleAdapter();
// @ts-expect-error a map ID is a string
createGoogleMap("#map", { mapId: 42 });
// @ts-expect-error the page's own map takes the long form: createGoogleAdapter and attach
createGoogleMap("#map", { mapId: "id", map: pageMap });
// @ts-expect-error a list's corner is one of the four
createGoogleMap("#map", { mapId: "id", list: { position: "top" } });
// @ts-expect-error list is true or the list's options
createGoogleMap("#map", { mapId: "id", list: false });
// @ts-expect-error a container is an element or a selector
createGoogleMap(42, { mapId: "id" });
