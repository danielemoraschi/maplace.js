import { describe, expect, it } from "vitest";
import { child, root } from "./fail";
import { checkLineStyle, checkShapeStyle } from "./style";

const style = child(root('location "s"', "s"), "style");

describe("checkShapeStyle", () => {
  it("accepts a full style", () => {
    const full = { stroke: "#123", strokeOpacity: 1, strokeWidth: 0, fill: "red", fillOpacity: 0 };
    expect(() => checkShapeStyle(full, style)).not.toThrow();
  });

  it("accepts explicit undefined fields", () => {
    expect(() => checkShapeStyle({ fill: undefined }, style)).not.toThrow();
  });

  it("rejects an opacity outside 0 to 1", () => {
    expect(() => checkShapeStyle({ fillOpacity: 1.5 }, style)).toThrow(
      expect.objectContaining({
        message: 'location "s": style.fillOpacity must be a number from 0 to 1, got 1.5',
        field: "style.fillOpacity",
      }),
    );
  });

  it("rejects a negative stroke width", () => {
    expect(() => checkShapeStyle({ strokeWidth: -1 }, style)).toThrow(
      /style\.strokeWidth must be a number of at least 0, got -1/,
    );
  });

  it("rejects a colour that is not a string", () => {
    expect(() => checkShapeStyle({ stroke: 0xff0000 }, style)).toThrow(
      /style\.stroke must be a non-empty string/,
    );
  });

  it("rejects unknown style fields", () => {
    expect(() => checkShapeStyle({ strokeColor: "red" }, style)).toThrow(
      /style\.strokeColor is not a style field/,
    );
  });
});

describe("checkLineStyle", () => {
  it("rejects a fill: a line has none", () => {
    expect(() => checkLineStyle({ fill: "red" }, style)).toThrow(
      expect.objectContaining({
        message: 'location "s": style.fill is not a line style field; a line has no fill',
        field: "style.fill",
      }),
    );
  });
});
