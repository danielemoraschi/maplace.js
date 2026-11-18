// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import type { Drawable } from "../drawable";
import { polylineDrawable } from "../testing/conformance/fixtures";
import { SHAPE_PLACERS } from "./shape";
import type { StubMap } from "./testing/stub-libraries";
import type { StubPolyline } from "./testing/stub-shapes";
import { stubSite } from "./testing/stub-site";

/** `drawable`, a polyline, placed on a stub map, with the stub polyline it drew. */
function placed(drawable: Drawable) {
  const { site } = stubSite();
  const shape = SHAPE_PLACERS.polyline(drawable, site);
  return { placed: shape, stub: shape.shape as unknown as StubPolyline, site };
}

describe("a Google line's looks", () => {
  it("hide a dashed line's icons with its stroke while its outline is lifted, and give both back", () => {
    const style = { strokeDash: "dashed", strokeWidth: 2 } as const;
    const { placed: p, stub, site } = placed(polylineDrawable("l", { style }));
    const map = site.mounted.map as unknown as StubMap;
    const outline = () => [...map.shapes].find((shape) => shape !== stub) as StubPolyline;
    expect(stub.get("icons")).toHaveLength(1);
    p.present({ state: { selected: false, hovered: true }, visible: true });
    expect([stub.get("strokeOpacity"), stub.get("icons")]).toEqual([0, undefined]);
    expect(outline().get("icons")).toHaveLength(1);
    p.present({ state: { selected: false, hovered: false }, visible: true });
    expect([stub.get("strokeOpacity"), stub.get("icons")]).toEqual([0, expect.any(Array)]);
  });

  it("draw a line with a progress in two parts taking no input, its own stroke hidden but clickable", () => {
    const line = polylineDrawable("l", { style: { stroke: "red" }, progress: 0.5 });
    const { placed: p, stub, site } = placed(line);
    const [travelled, ahead] = partsOf(site, stub);
    expect([stub.get("strokeOpacity"), stub.get("clickable")]).toEqual([0, true]);
    expect([travelled?.get("strokeOpacity"), travelled?.get("clickable")]).toEqual([0.4, false]);
    expect([ahead?.get("strokeColor"), ahead?.get("zIndex")]).toEqual(["red", stub.get("zIndex")]);
    expect(p.seenStroke()).toBe(ahead);
  });

  it("show a line travelled to its end by its travelled part, which the stroke a user sees is", () => {
    const { placed: p, stub, site } = placed(polylineDrawable("l", { progress: 1 }));
    const [travelled] = partsOf(site, stub);
    expect(partsOf(site, stub)).toHaveLength(1);
    expect(p.seenStroke()).toBe(travelled);
  });

  it("set a part's path again only when it is another path: a hover keeps it", () => {
    const { placed: p, stub, site } = placed(polylineDrawable("l", { progress: 0.5 }));
    const [, ahead] = partsOf(site, stub);
    const setPath = vi.spyOn(ahead as StubPolyline, "setPath");
    p.present({ state: { selected: false, hovered: true }, visible: true });
    expect(setPath).not.toHaveBeenCalled();
  });

  it("lift a hovered split line's parts, its own stroke hidden through the hover and after", () => {
    const { placed: p, stub, site } = placed(polylineDrawable("l", { progress: 0.5 }));
    p.present({ state: { selected: false, hovered: true }, visible: true });
    const [travelled, ahead] = partsOf(site, stub);
    expect(partsOf(site, stub)).toHaveLength(2);
    expect(ahead?.get("zIndex")).toBeGreaterThan(stub.get("zIndex") as number);
    expect([travelled?.get("strokeWeight"), stub.get("strokeOpacity")]).toEqual([4, 0]);
    p.present({ state: { selected: false, hovered: false }, visible: true });
    expect(stub.get("strokeOpacity")).toBe(0);
    expect(ahead?.get("zIndex")).toBe(stub.get("zIndex"));
  });

  it("give a line its own stroke back once its progress is cleared, the parts off", () => {
    const style = { strokeOpacity: 0.5 };
    const { placed: p, stub, site } = placed(polylineDrawable("l", { style, progress: 0.5 }));
    p.update(polylineDrawable("l", { style }));
    expect(partsOf(site, stub)).toEqual([]);
    expect(stub.get("strokeOpacity")).toBe(0.5);
  });

  it("take a split line's parts off while it is hidden, and when it is removed", () => {
    const { placed: p, stub, site } = placed(polylineDrawable("l", { progress: 0.5 }));
    p.present({ state: { selected: false, hovered: false }, visible: false });
    expect(partsOf(site, stub)).toEqual([]);
    p.present({ state: { selected: false, hovered: false }, visible: true });
    expect(partsOf(site, stub)).toHaveLength(2);
    p.remove();
    expect([...(site.mounted.map as unknown as StubMap).shapes]).toEqual([]);
  });

  it("draw an active line in the hovered look, and as before once it isn't", () => {
    const { placed: p, stub } = placed(polylineDrawable("l"));
    p.update(polylineDrawable("l", { active: true }));
    expect(stub.get("strokeWeight")).toBe(4);
    p.update(polylineDrawable("l", { active: false }));
    expect(stub.get("strokeWeight")).toBeUndefined();
  });
});

/** The polylines on the map besides the shape: a split line's parts, travelled first. */
function partsOf(site: ReturnType<typeof placed>["site"], shape: unknown): StubPolyline[] {
  const map = site.mounted.map as unknown as StubMap;
  return [...map.shapes].filter((other) => other !== shape) as StubPolyline[];
}
