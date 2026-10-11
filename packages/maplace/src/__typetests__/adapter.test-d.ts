// Compile-time checks of the adapter contract: each @ts-expect-error must stay an error.
import type { Adapter, AdapterHost, Drawable } from "maplace";

declare const host: AdapterHost;
declare const drawable: Drawable;

host.reportChange("a", { type: "marker", lat: 1, lng: 2 });
// @ts-expect-error a reported geometry names its type
host.reportChange("a", { lat: 1, lng: 2 });
// @ts-expect-error adapters report geometry, not whole locations
host.reportChange({ id: "a", type: "marker", lat: 1, lng: 2 });

// @ts-expect-error adapters never see user data or callbacks
drawable.data;
// @ts-expect-error content arrives resolved, as a builder
drawable.content;

declare const adapter: Adapter;
// Drawing is awaitable, so tests and `whenReady` know when a diff is on screen.
adapter.apply({ added: [], updated: [], removed: [] }) satisfies Promise<void>;
adapter.setView({
  kind: "fit-bounds",
  bounds: { south: -20, west: 170, north: 0, east: -170 },
  padding: 40,
});
// @ts-expect-error adapters never see fit-all; the store resolves it to fit-bounds
adapter.setView({ kind: "fit-all", padding: 40 });
