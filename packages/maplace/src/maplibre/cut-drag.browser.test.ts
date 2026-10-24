import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { afterEach, describe, expect, it } from "vitest";
import type { Drawable } from "../drawable";
import type { LatLng } from "../geometry";
import {
  adding,
  markerDrawable,
  ORIGIN,
  presented,
  removing,
  updating,
} from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import type { RecordingHost } from "../testing/conformance/recording-host";
import { editingMarker, expectOneChangeEndingTheEdits } from "./testing/editable-marker";
import { type HeldDrag, holdDrag, holdPress, holdTouchDrag } from "./testing/held-drag";
import { placedMarker } from "./testing/placed-markers";

afterEach(unmountAll);

/** Where a drag is held when the page ends it, and where the user goes on moving it after. */
const DRAGGED_TO: LatLng = { lat: 1, lng: 2 };
const MOVED_ON_TO: LatLng = { lat: 2, lng: 3 };

/** An icon of the page's own, one node for every state. */
function withPageIcon(): Partial<Drawable> {
  const icon = document.createElement("span");
  icon.style.cssText = "display: block; width: 20px; height: 20px";
  return { renderIcon: () => icon };
}

/** The map's `mouseup`s heard since it was made. */
interface MapReleases {
  count(): number;
}

function mapReleasesOf(map: MapLibreMap): MapReleases {
  let heard = 0;
  map.on("mouseup", () => {
    heard += 1;
  });
  return { count: () => heard };
}

/**
 * A drag the page ended, then moved on and let go by the user: no map release fired for it before
 * the user's own, and nothing reported after the page ended it.
 */
function expectEndedQuietly(drag: HeldDrag, releases: MapReleases, host: RecordingHost) {
  const edits = host.reportsOf("reportLocationEdit").length;
  drag.moveTo(MOVED_ON_TO);
  expect(releases.count()).toBe(0);
  drag.release();
  expect(host.reportsOf("reportLocationEdit")).toHaveLength(edits);
  expect(host.reportsOf("reportLocationChange")).toEqual([]);
}

function expectAtOrigin(marker: Marker): void {
  const { lat, lng } = marker.getLngLat();
  expect(lat).toBeCloseTo(ORIGIN.lat, 6);
  expect(lng).toBeCloseTo(ORIGIN.lng, 6);
}

describe("a MapLibre marker drag the page ends", () => {
  it("cuts short the drag of a marker with a page's icon whose `editable` the page turns off: back where the store has it, reporting nothing more", async () => {
    const { map, adapter, host, marker, drawn } = await editingMarker(withPageIcon());
    const drag = holdDrag(map, marker.getElement(), DRAGGED_TO);
    const edits = host.reportsOf("reportLocationEdit").length;
    expect(edits).toBeGreaterThan(0);
    await adapter.apply(updating({ ...drawn(), editable: false }));
    expectAtOrigin(marker);
    drag.moveTo(MOVED_ON_TO);
    expect(host.reportsOf("reportLocationEdit")).toHaveLength(edits);
    expectAtOrigin(marker);
    drag.release();
    expect(host.reportsOf("reportLocationChange")).toEqual([]);
  });

  it("cuts short a touch drag of a marker with a page's icon whose `editable` the page turns off", async () => {
    const { map, adapter, host, marker, drawn } = await editingMarker(withPageIcon());
    const touch = holdTouchDrag(map, marker.getElement(), DRAGGED_TO);
    const edits = host.reportsOf("reportLocationEdit").length;
    expect(edits).toBeGreaterThan(0);
    await adapter.apply(updating({ ...drawn(), editable: false }));
    expectAtOrigin(marker);
    touch.moveTo(MOVED_ON_TO);
    touch.cancel();
    expect(host.reportsOf("reportLocationEdit")).toHaveLength(edits);
    expectAtOrigin(marker);
    expect(host.reportsOf("reportLocationChange")).toEqual([]);
  });

  it("cuts short a press not moved yet on a marker whose `editable` the page turns off: no drag follows", async () => {
    const { map, adapter, host, marker, drawn } = await editingMarker(withPageIcon());
    const press = holdPress(map, marker.getElement());
    await adapter.apply(updating({ ...drawn(), editable: false }));
    press.moveTo(MOVED_ON_TO);
    expect(host.reportsOf("reportLocationEdit")).toEqual([]);
    expectAtOrigin(marker);
    press.release();
    expect(host.reportsOf("reportLocationChange")).toEqual([]);
  });

  it("cuts a drag short to where the page moves the marker in the same update", async () => {
    const { map, adapter, host, marker, drawn } = await editingMarker(withPageIcon());
    holdDrag(map, marker.getElement(), DRAGGED_TO);
    const geometry = { type: "marker" as const, ...MOVED_ON_TO };
    await adapter.apply(updating({ ...drawn(), geometry, editable: false }));
    const { lat, lng } = marker.getLngLat();
    expect(lat).toBeCloseTo(MOVED_ON_TO.lat, 6);
    expect(lng).toBeCloseTo(MOVED_ON_TO.lng, 6);
    expect(host.reportsOf("reportLocationChange")).toEqual([]);
  });

  it("applies a hide that waited for a drag the page cut short", async () => {
    const { map, adapter, marker, drawn } = await editingMarker(withPageIcon());
    holdDrag(map, marker.getElement(), DRAGGED_TO);
    adapter.present(presented({ hiddenIds: new Set(["a"]) }));
    expect(marker.getElement().isConnected).toBe(true);
    await adapter.apply(updating({ ...drawn(), editable: false }));
    expect(marker.getElement().isConnected).toBe(false);
  });

  it("reports the next drag afresh, once, after a drag the page cut short", async () => {
    const { map, adapter, host, marker, drawn } = await editingMarker(withPageIcon());
    const cut = holdDrag(map, marker.getElement(), DRAGGED_TO);
    await adapter.apply(updating({ ...drawn(), editable: false }));
    cut.release();
    await adapter.apply(updating({ ...drawn(), editable: true }));
    holdDrag(map, marker.getElement(), MOVED_ON_TO).release();
    expectOneChangeEndingTheEdits(host);
  });

  it("fires the release of a drag it cut short once the page's whole update is drawn", async () => {
    const { map, adapter, state, marker, drawn } = await editingMarker(withPageIcon());
    await adapter.apply(adding(markerDrawable("b", ORIGIN)));
    holdDrag(map, marker.getElement(), DRAGGED_TO);
    const titlesOfBHeard: (string | undefined)[] = [];
    map.on("mouseup", () => titlesOfBHeard.push(placedMarker(state, "b").drawable().title));
    const b = placedMarker(state, "b").drawable();
    await adapter.apply(updating({ ...drawn(), editable: false }, { ...b, title: "B" }));
    expect(titlesOfBHeard).toEqual(["B"]);
  });

  it("ends the drag of a marker whose location is removed, reporting nothing", async () => {
    const { map, adapter, host, marker } = await editingMarker(withPageIcon());
    const drag = holdDrag(map, marker.getElement(), DRAGGED_TO);
    const releases = mapReleasesOf(map);
    await adapter.apply(removing("a"));
    expectEndedQuietly(drag, releases, host);
  });

  it("ends the drag of a marker drawn as a pin again, reporting nothing, its pin where the store has it", async () => {
    const { map, adapter, host, state, marker, drawn } = await editingMarker();
    const drag = holdDrag(map, marker.getElement(), DRAGGED_TO);
    const releases = mapReleasesOf(map);
    await adapter.apply(updating({ ...drawn(), editable: false }));
    expect(state.features?.pins.featureOf("a")?.geometry).toMatchObject({ coordinates: [0, 0] });
    expect(placedMarker(state, "a").domMarker()).toBeUndefined();
    expectEndedQuietly(drag, releases, host);
  });
});
