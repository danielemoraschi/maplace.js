// Compile-time checks of the public API: each @ts-expect-error must stay an error.
import type { Location, Maplace, MaplaceEvents } from "maplace";

declare const maplace: Maplace;
declare function accept(location: Location): void;

accept({ id: "a", lat: 1, lng: 2 });
accept({ id: "c", type: "circle", center: { lat: 1, lng: 2 }, radius: 50 });
accept({ id: "p", type: "polygon", path: [{ lat: 0, lng: 0 }], holes: [] });

// @ts-expect-error every location needs an id
accept({ lat: 1, lng: 2 });
// @ts-expect-error 0.2's `lon` is gone; coordinates are lat/lng
accept({ id: "a", lat: 1, lon: 2 });
// @ts-expect-error a circle needs a radius
accept({ id: "c", type: "circle", center: { lat: 1, lng: 2 } });
// @ts-expect-error a polyline has a path, not lat/lng
accept({ id: "l", type: "polyline", lat: 1, lng: 2 });

maplace.select("a");
maplace.select(undefined, { pan: false });
// @ts-expect-error absence is undefined, never null
maplace.select(null);
// @ts-expect-error no boolean flag arguments; use { pan }
maplace.select("a", true);

maplace.on("select", (event: MaplaceEvents["select"]) => event.id);
// @ts-expect-error unknown event names don't compile
maplace.on("selected", () => {});

const snapshot = maplace.getSnapshot();
// @ts-expect-error snapshots are read-only
snapshot.selectedId = "b";
