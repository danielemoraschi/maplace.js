// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import type { Drawable } from "../drawable";
import type { LocationState } from "../location";
import { markerDrawable, ORIGIN } from "../testing/conformance/fixtures";
import { placeMarker } from "./marker";
import { stubSite } from "./testing/stub-site";

const shown = { state: { selected: false, hovered: false }, visible: true };

function placed(drawable: Drawable = markerDrawable("a")) {
  const { site, host, controller } = stubSite();
  return { placed: placeMarker(drawable, site), site, host, controller };
}

describe("placeMarker", () => {
  it("puts a clickable, titled marker where the location is, on the map", () => {
    const { placed: a, site } = placed(markerDrawable("a", { lat: 1, lng: 2 }, { title: "A" }));
    expect(a.marker).toMatchObject({
      position: { lat: 1, lng: 2 },
      title: "A",
      gmpClickable: true,
      map: site.mounted.map,
      hidden: false,
    });
    expect(a.marker.childNodes).toHaveLength(0);
  });

  it("titles a location without one with an empty title", () => {
    expect(placed().placed.marker.title).toBe("");
  });

  it("starts hidden when the presentation hides it, and with the icon for its state", () => {
    const { site, state } = stubSite();
    const icon = document.createElement("i");
    const renderIcon = vi.fn((_: LocationState) => icon);
    state.presented = { selectedId: "a", hoveredId: undefined, hiddenIds: new Set(["a"]) };
    const { marker } = placeMarker(markerDrawable("a", ORIGIN, { renderIcon }), site);
    expect(marker.hidden).toBe(true);
    expect(renderIcon.mock.calls).toEqual([[{ selected: true, hovered: false }]]);
    expect(marker.firstChild).toBe(icon);
  });

  it("redoes only the fields an update gives a new reference", () => {
    const renderIcon = vi.fn(() => document.createElement("i"));
    const first = markerDrawable("a", ORIGIN, { renderIcon });
    const { placed: a } = placed(first);
    a.update({ ...first, geometry: { type: "marker", lat: 3, lng: 4 }, title: "A" });
    expect(a.marker).toMatchObject({ position: { lat: 3, lng: 4 }, title: "A" });
    expect(renderIcon).toHaveBeenCalledTimes(1);
  });

  it("brings Google's default pin back when a later icon builds nothing", () => {
    const { placed: a } = placed(
      markerDrawable("a", ORIGIN, { renderIcon: () => document.createElement("i") }),
    );
    a.update(markerDrawable("a", ORIGIN, { renderIcon: () => undefined }));
    expect(a.marker.childNodes).toHaveLength(0);
  });

  it("rebuilds the icon and restacks only when the state changes", () => {
    const renderIcon = vi.fn(() => document.createElement("i"));
    const { placed: a } = placed(markerDrawable("a", ORIGIN, { renderIcon }));
    const before = a.marker.zIndex;
    a.present(shown);
    expect(renderIcon).toHaveBeenCalledTimes(1);
    a.present({ ...shown, state: { selected: true, hovered: false } });
    expect(renderIcon).toHaveBeenLastCalledWith({ selected: true, hovered: false });
    expect(a.marker.zIndex).toBeGreaterThan(before ?? 0);
  });

  it("leaves an icon that is already the marker's in place, so its CSS transitions run", () => {
    const icon = document.createElement("i");
    const { placed: a } = placed(markerDrawable("a", ORIGIN, { renderIcon: () => icon }));
    const replaced = vi.spyOn(a.marker, "replaceChildren");
    a.present({ ...shown, state: { selected: true, hovered: false } });
    expect(a.marker.firstChild).toBe(icon);
    expect(replaced).not.toHaveBeenCalled();
  });

  it("hides and shows without leaving the map, and leaves it on remove", () => {
    const { placed: a, site } = placed();
    a.present({ ...shown, visible: false });
    expect([a.marker.hidden, a.marker.map]).toEqual([true, site.mounted.map]);
    a.present(shown);
    expect(a.marker.hidden).toBe(false);
    a.remove();
    expect(a.marker.map).toBeNull();
  });

  it("leaves where it goes to the map's marker layer, on placing and when shown or selected", () => {
    const { site } = stubSite();
    const place = vi.spyOn(site.mounted.markers, "place").mockImplementation(() => {});
    const remove = vi.spyOn(site.mounted.markers, "remove").mockImplementation(() => {});
    const a = placeMarker(markerDrawable("a"), site);
    a.present({ ...shown, state: { selected: false, hovered: true } });
    a.present({ ...shown, state: { selected: true, hovered: true } });
    a.present({ ...shown, visible: false });
    a.remove();
    expect(place.mock.calls.map(([, look]) => [look.visible, look.state.selected])).toEqual([
      [true, false],
      [true, true],
      [false, false],
    ]);
    expect(remove).toHaveBeenCalledWith(a.marker);
    expect(a.marker.map).toBeNull();
  });

  it("tells the marker layer when it moves, and only then", () => {
    const drawable = markerDrawable("a");
    const { placed: a, site } = placed(drawable);
    const moved = vi.spyOn(site.mounted.markers, "moved");
    // The store keeps a geometry's reference while the location stays where it is.
    a.update({ ...drawable, title: "Rome" });
    a.update(markerDrawable("a", { lat: 1, lng: 2 }, { title: "Rome" }));
    expect(moved.mock.calls).toEqual([[a.marker]]);
  });

  it("reports a click, and the pointer onto it and off it", () => {
    const { placed: a, host } = placed();
    a.marker.dispatchEvent(new Event("gmp-click"));
    a.marker.dispatchEvent(new Event("pointerenter"));
    a.marker.dispatchEvent(new Event("pointerleave"));
    expect(host.reports.map(({ method, args }) => [method, ...args])).toEqual([
      ["reportSelectionChange", "a"],
      ["reportHoverChange", "a"],
      ["reportHoverChange", undefined],
    ]);
  });

  it("stops being hovered once hidden or removed", () => {
    const { placed: a, host } = placed();
    a.marker.dispatchEvent(new Event("pointerenter"));
    a.present({ ...shown, visible: false });
    a.present(shown);
    a.marker.dispatchEvent(new Event("pointerenter"));
    a.remove();
    expect(host.reportsOf("reportHoverChange")).toEqual([["a"], [undefined], ["a"], [undefined]]);
  });

  it("lets the user drag it only while it is editable", () => {
    const { placed: a } = placed(markerDrawable("a", ORIGIN, { editable: true }));
    expect(a.marker.gmpDraggable).toBe(true);
    a.update(markerDrawable("a"));
    expect(a.marker.gmpDraggable).toBe(false);
  });

  it("reports where a drag left it, as Google gives the position after one", () => {
    const { placed: a, host } = placed(markerDrawable("a", ORIGIN, { editable: true }));
    a.marker.position = { lat: 3, lng: 4, altitude: 0 } as google.maps.LatLngAltitudeLiteral;
    a.marker.dispatchEvent(new Event("gmp-dragend"));
    expect(host.reportsOf("reportLocationChange")).toEqual([
      ["a", { type: "marker", lat: 3, lng: 4 }],
    ]);
  });

  it("reports nothing once the load is cancelled", () => {
    const { placed: a, host, controller } = placed();
    controller.abort();
    a.marker.dispatchEvent(new Event("gmp-click"));
    a.marker.dispatchEvent(new Event("pointerenter"));
    a.marker.dispatchEvent(new Event("gmp-dragend"));
    expect(host.reports).toEqual([]);
  });
});
