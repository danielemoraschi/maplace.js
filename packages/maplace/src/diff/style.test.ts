import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import type { ShapeStyle } from "../style";
import { styleOf } from "./style";

const path = [
  { lat: 0, lng: 0 },
  { lat: 1, lng: 1 },
  { lat: 0, lng: 1 },
];
const DEFAULT = { stroke: "blue", strokeWidth: 2, fill: "white", fillOpacity: 0.5 };

function polygon(style?: ShapeStyle): Location {
  return { id: "p", type: "polygon", path, style };
}

describe("styleOf", () => {
  it("lays a shape's style over the default", () => {
    expect(styleOf(polygon({ fill: "red" }), "style", DEFAULT)).toEqual({
      ...DEFAULT,
      fill: "red",
    });
  });

  it("falls back to the default for fields written as undefined", () => {
    expect(styleOf(polygon({ fill: undefined, stroke: "red" }), "style", DEFAULT)).toEqual({
      ...DEFAULT,
      stroke: "red",
    });
  });

  it("drops undefined fields from the result", () => {
    expect(styleOf(polygon({ fill: undefined, stroke: "red" }), "style", undefined)).toStrictEqual({
      stroke: "red",
    });
  });

  it("gives a polyline the default's line fields only", () => {
    const line: Location = { id: "l", type: "polyline", path, style: { strokeOpacity: 1 } };
    expect(styleOf(line, "style", DEFAULT)).toEqual({
      stroke: "blue",
      strokeWidth: 2,
      strokeOpacity: 1,
    });
  });

  it("gives a marker no style", () => {
    const marker = { id: "m", lat: 0, lng: 0 };
    expect(styleOf(marker, "style", DEFAULT)).toBeUndefined();
    expect(styleOf(marker, "selectedStyle", DEFAULT)).toBeUndefined();
  });

  it("is undefined when neither the location nor the default has a field", () => {
    expect(styleOf(polygon(), "style", undefined)).toBeUndefined();
    expect(styleOf(polygon({ fill: undefined }), "style", {})).toBeUndefined();
    expect(styleOf({ id: "l", type: "polyline", path }, "style", { fill: "red" })).toBeUndefined();
  });
});

describe("styleOf: state styles", () => {
  it("lays a shape's selected style over the default's, without undefined fields", () => {
    const shape: Location = {
      id: "p",
      type: "polygon",
      path,
      style: { fill: "green" },
      selectedStyle: { fill: "red", stroke: undefined },
    };
    expect(styleOf(shape, "selectedStyle", DEFAULT)).toStrictEqual({ ...DEFAULT, fill: "red" });
  });

  it("gives a polyline's hovered style line fields only", () => {
    const line: Location = { id: "l", type: "polyline", path, hoveredStyle: { strokeWidth: 4 } };
    expect(styleOf(line, "hoveredStyle", DEFAULT)).toEqual({ stroke: "blue", strokeWidth: 4 });
  });
});
