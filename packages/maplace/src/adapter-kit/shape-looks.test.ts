import { describe, expect, it } from "vitest";
import type { Geometry } from "../geometry";
import type { ShapeStyle } from "../style";
import { HOVERED_LOOK, SELECTED_LINE_LOOK, SELECTED_LOOK, styleInState } from "./shape-looks";

const circle: Geometry = { type: "circle", center: { lat: 0, lng: 0 }, radius: 10 };
const line: Geometry = {
  type: "polyline",
  path: [
    { lat: 0, lng: 0 },
    { lat: 1, lng: 1 },
  ],
};
const REST = { selected: false, hovered: false };
const SELECTED = { selected: true, hovered: false };
const HOVERED = { selected: false, hovered: true };

describe("styleInState", () => {
  it("draws a shape at rest in its own style, the same object", () => {
    const style: ShapeStyle = { stroke: "red" };
    expect(styleInState({ geometry: circle, style }, REST)).toBe(style);
    expect(styleInState({ geometry: circle, style: undefined }, REST)).toBeUndefined();
  });

  it("gives a selected shape the selected look, over a hovered one's", () => {
    expect(styleInState({ geometry: circle, style: undefined }, SELECTED)).toEqual(SELECTED_LOOK);
    expect(styleInState({ geometry: circle, style: undefined }, HOVERED)).toEqual(HOVERED_LOOK);
    const both = { selected: true, hovered: true };
    expect(styleInState({ geometry: circle, style: undefined }, both)).toEqual(SELECTED_LOOK);
  });

  it("keeps the fields the shape's own style sets", () => {
    const style: ShapeStyle = { stroke: "red", strokeWidth: 1 };
    expect(styleInState({ geometry: circle, style }, SELECTED)).toEqual({
      ...SELECTED_LOOK,
      stroke: "red",
      strokeWidth: 1,
    });
  });

  it("gives a polyline the look's line fields only", () => {
    expect(styleInState({ geometry: line, style: undefined }, SELECTED)).toEqual(
      SELECTED_LINE_LOOK,
    );
  });

  it("leaves a marker's style as it is, whatever its state", () => {
    const marker: Geometry = { type: "marker", lat: 0, lng: 0 };
    expect(styleInState({ geometry: marker, style: undefined }, SELECTED)).toBeUndefined();
  });
});
