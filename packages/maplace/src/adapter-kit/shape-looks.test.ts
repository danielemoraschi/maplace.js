import { describe, expect, it } from "vitest";
import type { Drawable, StyleField } from "../drawable";
import type { Geometry } from "../geometry";
import type { ShapeStyle } from "../style";
import {
  HOVERED_LOOK,
  SELECTED_LINE_LOOK,
  SELECTED_LOOK,
  sameStyles,
  styleInState,
} from "./shape-looks";

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
const BOTH = { selected: true, hovered: true };

type Shape = Pick<Drawable, "geometry" | StyleField>;

function shape(geometry: Geometry, styles: Partial<Pick<Drawable, StyleField>> = {}): Shape {
  return {
    geometry,
    style: undefined,
    selectedStyle: undefined,
    hoveredStyle: undefined,
    ...styles,
  };
}

describe("styleInState: maplace's look", () => {
  it("draws a shape at rest in its own style, the same object", () => {
    const style: ShapeStyle = { stroke: "red" };
    expect(styleInState(shape(circle, { style }), REST)).toBe(style);
    expect(styleInState(shape(circle), REST)).toBeUndefined();
  });

  it("gives a selected shape the selected look, over a hovered one's", () => {
    expect(styleInState(shape(circle), SELECTED)).toEqual(SELECTED_LOOK);
    expect(styleInState(shape(circle), HOVERED)).toEqual(HOVERED_LOOK);
    expect(styleInState(shape(circle), BOTH)).toEqual(SELECTED_LOOK);
  });

  it("keeps the fields the shape's own style sets", () => {
    const style: ShapeStyle = { stroke: "red", strokeWidth: 1 };
    expect(styleInState(shape(circle, { style }), SELECTED)).toEqual({
      ...SELECTED_LOOK,
      stroke: "red",
      strokeWidth: 1,
    });
  });

  it("gives a polyline the look's line fields only", () => {
    expect(styleInState(shape(line), SELECTED)).toEqual(SELECTED_LINE_LOOK);
  });

  it("leaves a marker's style as it is, whatever its state", () => {
    const marker: Geometry = { type: "marker", lat: 0, lng: 0 };
    expect(styleInState(shape(marker), SELECTED)).toBeUndefined();
  });
});

describe("styleInState: a shape's own state styles", () => {
  const style: ShapeStyle = { stroke: "blue", strokeWidth: 1 };
  const selectedStyle: ShapeStyle = { stroke: "red" };
  const hoveredStyle: ShapeStyle = { fill: "green" };
  const styled = shape(circle, { style, selectedStyle, hoveredStyle });

  it("lays the selected style over the style over the selected look", () => {
    expect(styleInState(styled, SELECTED)).toEqual({ ...SELECTED_LOOK, ...style, stroke: "red" });
  });

  it("draws the hovered style only while hovered: selected wins, with its own style", () => {
    expect(styleInState(styled, HOVERED)).toEqual({ ...HOVERED_LOOK, ...style, fill: "green" });
    expect(styleInState(styled, BOTH)).toEqual({ ...SELECTED_LOOK, ...style, stroke: "red" });
  });

  it("at rest, the style itself, the state styles unused", () => {
    expect(styleInState(styled, REST)).toBe(style);
  });
});

describe("sameStyles", () => {
  const style: ShapeStyle = { stroke: "blue" };

  it("is true for the same three style references", () => {
    expect(sameStyles(shape(circle, { style }), shape(line, { style }))).toBe(true);
  });

  it("is false when only the hovered style differs", () => {
    const hovered = shape(circle, { style, hoveredStyle: { fill: "red" } });
    expect(sameStyles(shape(circle, { style }), hovered)).toBe(false);
  });
});
