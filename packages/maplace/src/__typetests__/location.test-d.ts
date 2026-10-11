// Compile-time checks of location input: each @ts-expect-error must stay an error.
import type { Location } from "maplace";

declare function accept(location: Location): void;

accept({ id: "a", lat: 1, lng: 2 });
accept({ id: "c", type: "circle", center: { lat: 1, lng: 2 }, radius: 50 });
accept({ id: "p", type: "polygon", path: [{ lat: 0, lng: 0 }], holes: [], style: { fill: "red" } });

// @ts-expect-error every location needs an id
accept({ lat: 1, lng: 2 });
// @ts-expect-error 0.2's `lon` is gone; coordinates are lat/lng
accept({ id: "a", lat: 1, lon: 2 });
// @ts-expect-error a circle needs a radius
accept({ id: "c", type: "circle", center: { lat: 1, lng: 2 } });
// @ts-expect-error a polyline has a path, not lat/lng
accept({ id: "l", type: "polyline", lat: 1, lng: 2 });
// @ts-expect-error a polyline has no fill
accept({ id: "l", type: "polyline", path: [], style: { fill: "red" } });

// Absence is undefined, so mapping optional fields across compiles.
declare const legacyTitle: string | undefined;
accept({ id: "a", lat: 1, lng: 2, title: legacyTitle });

// Your own fields travel in `data`, typed in content functions.
declare function acceptPriced(location: Location<{ price: number }>): void;
const priced: Location<{ price: number }> = {
  id: "a",
  lat: 1,
  lng: 2,
  data: { price: 3 },
  content: (location) => document.createTextNode(`${location.data?.price.toFixed(2)}`),
};
// @ts-expect-error `data` has the declared shape
acceptPriced({ id: "b", lat: 1, lng: 2, data: { price: "3" } });
// A typed location is still a Location, so adapters and helpers need no generics.
accept(priced);
