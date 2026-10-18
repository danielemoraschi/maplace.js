import { describe, expect, it } from "vitest";
import { validateLocation } from "./location";

const point = { lat: 0, lng: 0 };
const line = { id: "l", type: "polyline", path: [point, point] };
const circle = { id: "c", type: "circle", center: point, radius: 5 };

function check(location: unknown) {
  return () => validateLocation(location, { index: 0, sanitize: undefined });
}

describe("validateLocation: styles", () => {
  it("gives a polyline a line style, without fill", () => {
    expect(check({ ...line, style: { fill: "red" } })).toThrow(
      /style\.fill is not a line style field; a line has no fill/,
    );
  });

  it("accepts a shape's selected and hovered styles", () => {
    const styles = { selectedStyle: { fill: "red" }, hoveredStyle: { strokeWidth: 3 } };
    expect(check({ ...circle, ...styles })).not.toThrow();
    expect(check({ ...line, selectedStyle: { stroke: "red" } })).not.toThrow();
  });

  it("gives a polyline's selected style line fields only", () => {
    expect(check({ ...line, selectedStyle: { fill: "red" } })).toThrow(
      /selectedStyle\.fill is not a line style field; a line has no fill/,
    );
  });

  it("checks each field of a hovered style", () => {
    expect(check({ ...circle, hoveredStyle: { fillOpacity: 2 } })).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "hoveredStyle.fillOpacity" }),
    );
  });

  it("tells a marker the state styles are shape fields", () => {
    expect(check({ id: "m", lat: 1, lng: 2, selectedStyle: {} })).toThrow(
      /selectedStyle is a circle\/polyline\/polygon field, not a marker field/,
    );
  });
});
