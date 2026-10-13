// Compile-time checks of the Google adapter's options: each @ts-expect-error must stay an error.
import type { Adapter } from "maplace";
import { createGoogleAdapter, type GoogleAdapterOptions } from "maplace/google";

// A page's own Google map, named through the options so this file stays outside the google fence.
declare const pageMap: NonNullable<GoogleAdapterOptions["map"]>;

createGoogleAdapter({ mapId: "DEMO_MAP_ID" }) satisfies Adapter;
createGoogleAdapter({
  mapId: "DEMO_MAP_ID",
  colorScheme: "follow-system",
  map: pageMap,
  mapOptions: { disableDefaultUI: true, gestureHandling: "cooperative" },
});
createGoogleAdapter({ mapId: "id", colorScheme: undefined, map: undefined, mapOptions: undefined });

// @ts-expect-error a map ID is required: Advanced Markers need one
createGoogleAdapter({});
// @ts-expect-error maplace's colour scheme names, not Google's
createGoogleAdapter({ mapId: "id", colorScheme: "DARK" });
// @ts-expect-error the store's view sets the centre
createGoogleAdapter({ mapId: "id", mapOptions: { center: { lat: 0, lng: 0 } } });
// @ts-expect-error the store's view sets the zoom
createGoogleAdapter({ mapId: "id", mapOptions: { zoom: 3 } });
// @ts-expect-error the map ID is its own option
createGoogleAdapter({ mapId: "id", mapOptions: { mapId: "other" } });
// @ts-expect-error JSON styles are ignored on maps with a map ID
createGoogleAdapter({ mapId: "id", mapOptions: { styles: [] } });
// @ts-expect-error Google's options go in mapOptions, not a google object
createGoogleAdapter({ mapId: "id", google: {} });
