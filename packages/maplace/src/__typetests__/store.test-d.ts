// Compile-time checks of the store API: each @ts-expect-error must stay an error.
import type {
  Adapter,
  Location,
  Maplace,
  MaplaceEvents,
  RouteLeg,
  RouteResult,
  RouteStep,
  Snapshot,
  Viewport,
} from "maplace";
import { createMaplace } from "maplace";
import { expectTypeOf } from "vitest";

declare const maplace: Maplace;

maplace.select("a");
maplace.select("a", { zoom: 12 });
maplace.select(undefined, { pan: false });
// @ts-expect-error absence is undefined, never null
maplace.select(null);
// @ts-expect-error no boolean flag arguments; use { pan }
maplace.select("a", true);
// @ts-expect-error zoom needs panning
maplace.select("a", { pan: false, zoom: 3 });

maplace.hover("a");
maplace.hover(undefined);
// @ts-expect-error absence is undefined, never null
maplace.hover(null);
expectTypeOf<Maplace>().toHaveProperty("hover");

maplace.on("selectionChange", (event: MaplaceEvents["selectionChange"]) => event.id);
// @ts-expect-error unknown event names don't compile
maplace.on("selected", () => {});

const snapshot = maplace.getSnapshot();
// @ts-expect-error snapshots are read-only
snapshot.selectedId = "b";

declare const adapter: Adapter;
const detach: () => void = maplace.attach(adapter, document.body);
detach();
maplace.fitBounds({ south: 35, west: 6, north: 47, east: 19 }, { padding: 20 });
// @ts-expect-error setView needs a zoom with the centre
maplace.setView({ lat: 1, lng: 2 });

// A store with your own data attaches any adapter, and events carry the data type.
declare const priced: Maplace<{ price: number }>;
priced.attach(adapter, document.body);
priced.on("locationChange", ({ location }) => location.data?.price.toFixed(2));

// The data type comes from the locations given; events and the snapshot carry it.
const shop = createMaplace({ locations: [{ id: "s", lat: 1, lng: 2, data: { price: 3 } }] });
expectTypeOf(shop.getSnapshot().locations).toEqualTypeOf<readonly Location<{ price: number }>[]>();
shop.on("locationChange", ({ location, previous }) => {
  expectTypeOf(location).toEqualTypeOf<Location<{ price: number }>>();
  expectTypeOf(previous).toEqualTypeOf<Location<{ price: number }>>();
});
shop.on("viewportChange", ({ viewport }) => expectTypeOf(viewport).toEqualTypeOf<Viewport>());
shop.on("routeChange", ({ result }) =>
  expectTypeOf(result).toEqualTypeOf<RouteResult | undefined>(),
);
// Each leg has its turn-by-turn steps; a step's instruction is absent when the provider gives none.
expectTypeOf<RouteLeg["steps"]>().toEqualTypeOf<readonly RouteStep[]>();
expectTypeOf<RouteStep["instruction"]>().toEqualTypeOf<string | undefined>();
expectTypeOf<RouteStep["distanceMeters"]>().toEqualTypeOf<number>();
expectTypeOf<RouteStep["durationSeconds"]>().toEqualTypeOf<number>();
// A route passes through its `via` stops without ending a leg there.
maplace.setRoute({ stops: ["a", "b", "c"], via: ["b"] });
// @ts-expect-error via is an array of location ids
maplace.setRoute({ stops: ["a", "b", "c"], via: "b" });
// @ts-expect-error a viewport has no `center.lon`; coordinates are lat/lng
shop.on("viewportChange", ({ viewport }) => viewport.center.lon);

// The store's default styles for shapes, at rest and in each state.
createMaplace({
  style: { fill: "blue" },
  selectedStyle: { fill: "red" },
  hoveredStyle: { strokeWidth: 3 },
});

// Loading: whenReady is awaitable, attach returns detach.
expectTypeOf(shop.whenReady()).toEqualTypeOf<Promise<void>>();
expectTypeOf(shop.attach).returns.toEqualTypeOf<() => void>();
// @ts-expect-error attach needs a container for the map
shop.attach(adapter);

declare const current: Snapshot;
// @ts-expect-error the snapshot's viewport is the map's report, read-only
current.viewport = undefined;
