// @vitest-environment happy-dom
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { markerDrawable, ORIGIN } from "../testing/conformance/fixtures";
import { frames } from "./frames";
import { placeMarker } from "./marker";
import type { PlacedMarker } from "./placed-location";
import type { StubMap } from "./testing/stub-libraries";
import { stubSite } from "./testing/stub-site";

const EDITABLE = markerDrawable("a", ORIGIN, { editable: true });

/** An editable marker on an open stub map, closed after the test. */
function placed(drawable = EDITABLE) {
  const opened = stubSite();
  onTestFinished(opened.close);
  const map = opened.mounted.map as unknown as StubMap;
  const { markers } = opened.mounted;
  return { placed: placeMarker(drawable, opened.site), host: opened.host, map, markers };
}

/** Google moving the marker to `lat`, `lng` in a drag. */
function dragTo({ marker }: PlacedMarker, lat: number, lng: number): void {
  marker.position = { lat, lng };
  marker.dispatchEvent(new Event("gmp-drag"));
}

/** The window losing focus with a press on the map held, as when the user switches apps. */
function blurWithPressHeld(map: StubMap): void {
  map.userInput();
  window.dispatchEvent(new Event("blur"));
}

const letGo = () => window.dispatchEvent(new Event("pointerup"));
const at = (lat: number, lng: number) => ["a", { type: "marker", lat, lng }];
const edits = (host: ReturnType<typeof placed>["host"]) => host.reportsOf("reportLocationEdit");
const changes = (host: ReturnType<typeof placed>["host"]) => host.reportsOf("reportLocationChange");

describe("a Google marker's drags", () => {
  it("reports where a drag left it, as Google gives the position after one", () => {
    const { placed: a, host } = placed();
    a.marker.position = { lat: 3, lng: 4, altitude: 0 } as google.maps.LatLngAltitudeLiteral;
    a.marker.dispatchEvent(new Event("gmp-dragend"));
    expect(changes(host)).toEqual([at(3, 4)]);
  });

  it("reports where a drag has it as it moves, then where it ended", () => {
    const { placed: a, host } = placed();
    dragTo(a, 1, 4);
    dragTo(a, 2, 4);
    a.marker.dispatchEvent(new Event("gmp-dragend"));
    expect(edits(host)).toEqual([at(1, 4), at(2, 4)]);
    expect(changes(host)).toEqual([at(2, 4)]);
  });

  it("ends a drag a window blur leaves under way where Google last placed the marker: its change once, there", () => {
    const { placed: a, host, map } = placed();
    dragTo(a, 1, 2);
    dragTo(a, 3, 4);
    blurWithPressHeld(map);
    blurWithPressHeld(map);
    expect(edits(host)).toEqual([at(1, 2), at(3, 4)]);
    expect(changes(host)).toEqual([at(3, 4)]);
  });

  it("stops Google's drag at the blur, and lets the marker be dragged again a frame after the press is let go", async () => {
    const { placed: a, map } = placed();
    dragTo(a, 1, 2);
    blurWithPressHeld(map);
    expect(a.marker.gmpDraggable).toBe(false);
    await frames(1);
    expect(a.marker.gmpDraggable).toBe(false);
    letGo();
    await frames(1);
    expect(a.marker.gmpDraggable).toBe(true);
  });

  it("leaves the marker undraggable after the release once the page turned its `editable` off", async () => {
    const { placed: a, map } = placed();
    dragTo(a, 1, 2);
    blurWithPressHeld(map);
    a.update(markerDrawable("a", { lat: 1, lng: 2 }));
    letGo();
    await frames(1);
    expect(a.marker.gmpDraggable).toBe(false);
  });

  it("reports nothing on a blur with no drag under way, or after Google ended the drag", () => {
    const { placed: a, host, map } = placed();
    blurWithPressHeld(map);
    letGo();
    dragTo(a, 1, 2);
    a.marker.dispatchEvent(new Event("gmp-dragend"));
    const before = host.reports.length;
    blurWithPressHeld(map);
    expect(host.reports.length).toBe(before);
  });

  it("takes Google's drag away from an editable marker on a blur before its first move, until let go, reporting nothing", async () => {
    const { placed: a, host, map } = placed();
    blurWithPressHeld(map);
    expect(a.marker.gmpDraggable).toBe(false);
    letGo();
    await frames(1);
    expect(a.marker.gmpDraggable).toBe(true);
    expect(host.reports).toEqual([]);
  });

  it("draws a marker back where the store has it when the page turns its `editable` off mid-drag, and reports nothing on a blur after", () => {
    const { placed: a, host, map } = placed();
    dragTo(a, 1, 2);
    a.update({ ...EDITABLE, editable: false });
    expect(a.marker.position).toEqual({ lat: 0, lng: 0 });
    const before = host.reports.length;
    blurWithPressHeld(map);
    expect(host.reports.length).toBe(before);
  });

  it("leaves a marker no drag moved where it is when the page turns its `editable` off", () => {
    const { placed: a, markers } = placed();
    const moved = vi.spyOn(markers, "moved");
    a.update({ ...EDITABLE, editable: false });
    expect(moved).not.toHaveBeenCalled();
  });

  it("reports nothing on a blur once the marker is taken off mid-drag", () => {
    const { placed: a, host, map } = placed();
    dragTo(a, 1, 2);
    a.remove();
    const before = host.reports.length;
    blurWithPressHeld(map);
    expect(host.reports.length).toBe(before);
  });

  it("reports a drag after one the page cut short from its first move, even where the cut one got to", () => {
    const { placed: a, host } = placed();
    dragTo(a, 1, 2);
    a.update({ ...EDITABLE, editable: false });
    a.update(EDITABLE);
    dragTo(a, 1, 2);
    expect(edits(host)).toEqual([at(1, 2), at(1, 2)]);
  });
});
