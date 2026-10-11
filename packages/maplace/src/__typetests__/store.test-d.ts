// Compile-time checks of the store API: each @ts-expect-error must stay an error.
import type { Adapter, Maplace, MaplaceEvents } from "maplace";

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

maplace.on("select", (event: MaplaceEvents["select"]) => event.id);
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
priced.on("change", ({ location }) => location.data?.price.toFixed(2));
