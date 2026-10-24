// @vitest-environment happy-dom
import { describe, expect, it, onTestFinished, vi } from "vitest";
import type { Drawable } from "../drawable";
import {
  circleDrawable,
  MOVED_HOLE_CORNER,
  polygonDrawable,
  polylineDrawable,
} from "../testing/conformance/fixtures";
import { frames } from "./frames";
import { SHAPE_PLACERS } from "./shape";
import type { ShapeType } from "./shape-kinds";
import type { StubMap } from "./testing/stub-libraries";
import type { StubPolygon } from "./testing/stub-shapes";
import { stubSite } from "./testing/stub-site";

/** `drawable` placed on an open stub map, closed after the test. */
function placed(drawable: Drawable) {
  const opened = stubSite();
  onTestFinished(opened.close);
  const shape = SHAPE_PLACERS[drawable.geometry.type as ShapeType](drawable, opened.site);
  const map = opened.mounted.map as unknown as StubMap;
  return { placed: shape, stub: shape.shape as unknown as StubPolygon, host: opened.host, map };
}

/** The window losing focus with a press on the map held, as when the user switches apps. */
function blurWithPressHeld(map: StubMap): void {
  map.userInput();
  window.dispatchEvent(new Event("blur"));
}

const letGo = () => window.dispatchEvent(new Event("pointerup"));

describe("a Google shape's drags cut short, by a blur or by taking it off", () => {
  it.each([
    polygonDrawable("s", { editable: true }),
    polylineDrawable("s", { editable: true }),
    circleDrawable("s", { editable: true }),
  ])(
    "cuts short an editable $geometry.type's drag a blur leaves under way: editing off until the press is let go, then back, nothing reported",
    async (drawable) => {
      const { stub, host, map } = placed(drawable);
      blurWithPressHeld(map);
      expect(stub.get("editable")).toBe(false);
      await frames(1);
      expect(stub.get("editable")).toBe(false);
      letGo();
      await frames(1);
      expect(stub.get("editable")).toBe(true);
      expect(host.reports).toEqual([]);
    },
  );

  it("leaves a shape that isn't editable as it is on a blur", async () => {
    const { stub, map } = placed(polygonDrawable("s"));
    const setValues = vi.spyOn(stub, "setValues");
    blurWithPressHeld(map);
    letGo();
    await frames(1);
    expect(setValues).not.toHaveBeenCalled();
  });

  it("leaves a shape editable no more by the release as it is", async () => {
    const drawable = polygonDrawable("s", { editable: true });
    const { placed: s, stub, map } = placed(drawable);
    blurWithPressHeld(map);
    s.update({ ...drawable, editable: false });
    letGo();
    await frames(1);
    expect(stub.get("editable")).toBe(false);
  });

  it("cuts nothing of a shape taken off", async () => {
    const { placed: s, stub, map } = placed(polygonDrawable("s", { editable: true }));
    s.remove();
    blurWithPressHeld(map);
    expect(stub.get("editable")).toBe(true);
  });

  it("reports no edit Google fires on a shape taken off", () => {
    const { placed: s, stub, host } = placed(polygonDrawable("s", { editable: true }));
    s.remove();
    stub.getPaths().getArray()[1]?.setAt(2, MOVED_HOLE_CORNER);
    expect(host.reports).toEqual([]);
  });
});
