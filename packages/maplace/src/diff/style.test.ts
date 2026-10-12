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
    expect(styleOf(polygon({ fill: "red" }), DEFAULT)).toEqual({ ...DEFAULT, fill: "red" });
  });

  it("falls back to the default for fields written as undefined", () => {
    expect(styleOf(polygon({ fill: undefined, stroke: "red" }), DEFAULT)).toEqual({
      ...DEFAULT,
      stroke: "red",
    });
  });

  it("drops undefined fields from the result", () => {
    expect(styleOf(polygon({ fill: undefined, stroke: "red" }), undefined)).toStrictEqual({
      stroke: "red",
    });
  });

  it("gives a polyline the default's line fields only", () => {
    const line: Location = { id: "l", type: "polyline", path, style: { strokeOpacity: 1 } };
    expect(styleOf(line, DEFAULT)).toEqual({ stroke: "blue", strokeWidth: 2, strokeOpacity: 1 });
  });

  it("gives a marker no style", () => {
    expect(styleOf({ id: "m", lat: 0, lng: 0 }, DEFAULT)).toBeUndefined();
  });

  it("is undefined when neither the location nor the default has a field", () => {
    expect(styleOf(polygon(), undefined)).toBeUndefined();
    expect(styleOf(polygon({ fill: undefined }), {})).toBeUndefined();
    expect(styleOf({ id: "l", type: "polyline", path }, { fill: "red" })).toBeUndefined();
  });
});
