// Compile-time checks of maplace/maplibre's options: each @ts-expect-error must stay an error.

import type { Location, Maplace } from "maplace";
import {
  createMapLibreAdapter,
  createMapLibreMap,
  type MapLibreAdapterOptions,
  type MapLibreMapList,
} from "maplace/maplibre";
import { expectTypeOf } from "vitest";

declare const pageMap: NonNullable<MapLibreAdapterOptions["map"]>;

// The data type comes from the locations given, as createMaplace's does.
const shops = createMapLibreMap("#map", {
  locations: [{ id: "s", lat: 1, lng: 2, data: { price: 3 } }],
});
expectTypeOf(shops).toEqualTypeOf<Maplace<{ price: number }>>();
expectTypeOf(shops.getSnapshot().locations).toEqualTypeOf<readonly Location<{ price: number }>[]>();

createMapLibreAdapter();
createMapLibreAdapter({ map: pageMap });
createMapLibreAdapter({
  mapStyle: "https://tiles.example/style.json",
  mapOptions: { maxZoom: 18 },
});
createMapLibreMap("#map", { mapStyle: { version: 8, sources: {}, layers: [] }, list: true });
// The store's style is the shapes' default style, beside the map's.
createMapLibreMap("#map", {
  mapStyle: "https://tiles.example/style.json",
  style: { stroke: "#f00" },
});
expectTypeOf<MapLibreMapList["position"]>().toEqualTypeOf<
  "top-left" | "top-right" | "bottom-left" | "bottom-right" | undefined
>();

// @ts-expect-error a style URL is mapStyle: the store's style is the shapes' default style
createMapLibreMap("#map", { style: "https://tiles.example/style.json" });
// @ts-expect-error the page's own map takes the long form: createMapLibreAdapter and attach
createMapLibreMap("#map", { map: pageMap });
// @ts-expect-error maplace sets the centre, through the store's view
createMapLibreAdapter({ mapOptions: { center: [0, 0] } });
// @ts-expect-error maplace sets the style, through mapStyle
createMapLibreAdapter({ mapOptions: { style: "https://tiles.example/style.json" } });
// @ts-expect-error a style is a URL or a style object
createMapLibreAdapter({ mapStyle: 42 });
