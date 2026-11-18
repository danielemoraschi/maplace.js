import { describe, expect, it } from "vitest";
import { validateLocation } from "./location";

// A polyline's progress and the look of the part travelled.

const point = { lat: 0, lng: 0 };
const line = (fields: object) => ({ id: "l", type: "polyline", path: [point, point], ...fields });

function check(location: unknown) {
  return () => validateLocation(location, { index: 0, sanitize: undefined });
}

describe("validateLocation: a polyline's progress", () => {
  it("accepts a progress from 0 to 1, with a line style for the part travelled", () => {
    for (const progress of [0, 0.4, 1]) expect(check(line({ progress }))).not.toThrow();
    const travelledStyle = { stroke: "#888888", strokeDash: "dotted" };
    expect(check(line({ progress: 0.5, travelledStyle }))).not.toThrow();
  });

  it("rejects a progress outside 0 to 1", () => {
    expect(check(line({ progress: -0.1 }))).toThrow(
      expect.objectContaining({
        message: 'location "l": progress must be a number from 0 to 1, got -0.1',
        field: "progress",
      }),
    );
  });

  it("gives the travelled part a line style, without fill", () => {
    expect(check(line({ travelledStyle: { fill: "red" } }))).toThrow(
      /travelledStyle\.fill is not a line style field; a line has no fill/,
    );
  });

  it("rejects a progress on an editable line, which an edit would split", () => {
    expect(check(line({ progress: 0.5, editable: true }))).toThrow(
      /location "l": progress cannot be set together with editable/,
    );
  });

  it("tells a circle the progress is a polyline field", () => {
    const circle = { id: "c", type: "circle", center: point, radius: 5, progress: 0.5 };
    expect(check(circle)).toThrow(/progress is a polyline field, not a circle field/);
  });
});
