// Compile-time checks of the adapter contract: each @ts-expect-error must stay an error.
import type { Adapter, AdapterHost, Drawable } from "maplace";

declare const host: AdapterHost;
declare const drawable: Drawable;

host.reportLocationChange("a", { type: "marker", lat: 1, lng: 2 });
host.reportLocationEdit("a", { type: "marker", lat: 1, lng: 2 });
// @ts-expect-error an edit reports geometry, not a location
host.reportLocationEdit({ id: "a", type: "marker", lat: 1, lng: 2 });
host.reportMapClick({ lat: 1, lng: 2 });
// @ts-expect-error a click on the map is reportMapClick, with where it was
host.reportSelectionChange(undefined);
// The pointer leaving, a cleared route: each reported as undefined.
host.reportHoverChange(undefined);
host.reportRouteChange(undefined);
// @ts-expect-error a popup opens with its element, once the content is in the DOM
host.reportPopupOpen("a");
// @ts-expect-error a viewport carries its bounds
host.reportViewportChange({ center: { lat: 0, lng: 0 }, zoom: 3 });
// @ts-expect-error a reported geometry names its type
host.reportLocationChange("a", { lat: 1, lng: 2 });
// @ts-expect-error adapters report geometry, not whole locations
host.reportLocationChange({ id: "a", type: "marker", lat: 1, lng: 2 });

// @ts-expect-error adapters never see user data or callbacks
drawable.data;
// @ts-expect-error content arrives resolved, as a builder
drawable.content;

// A page's icon or content that failed builds nothing: draw the default marker, open no popup.
declare const renderIcon: NonNullable<Drawable["renderIcon"]>;
declare const renderContent: NonNullable<Drawable["renderContent"]>;
// @ts-expect-error an icon builder may return undefined
renderIcon({ selected: false, hovered: false }) satisfies Node;
// @ts-expect-error a content builder may return undefined
renderContent() satisfies Node;

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

// An adapter on a map the page made names that map's element, for `attach` to check.
adapter.pageMapElement satisfies HTMLElement | undefined;
// @ts-expect-error the store reads the page map's element, never sets it
adapter.pageMapElement = document.createElement("div");
