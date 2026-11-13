import { describe, expect, it } from "vitest";
import { type LocationContext, validateLocation } from "./location";

// A polyline's curve and geodesic: what each takes, and what neither combines with.

const at: LocationContext = { index: 0, sanitize: undefined };
const point = { lat: 0, lng: 0 };

function check(location: unknown) {
  return () => validateLocation(location, at);
}

function fails(message: string, field: string, locationId: string) {
  return expect.objectContaining({ code: "invalid-input", message, field, locationId });
}

const line = (fields: object) => ({ id: "l", type: "polyline", path: [point, point], ...fields });

describe("validateLocation: a polyline's curve", () => {
  it("accepts a curve from -1 to 1, and curve 0 on an editable line", () => {
    for (const curve of [-1, 0.3, 1]) expect(check(line({ curve }))).not.toThrow();
    expect(check(line({ curve: 0, editable: true }))).not.toThrow();
  });

  it("rejects a curve outside -1 to 1", () => {
    expect(check(line({ curve: 1.5 }))).toThrow(
      fails('location "l": curve must be a number from -1 to 1, got 1.5', "curve", "l"),
    );
  });

  it("rejects a non-zero curve on an editable polyline", () => {
    expect(check(line({ curve: 0.3, editable: true }))).toThrow(
      fails('location "l": curve cannot be set together with editable', "curve", "l"),
    );
  });

  it("rejects a curve on a polygon", () => {
    const polygon = { id: "p", type: "polygon", path: [point, point, point], curve: 0.3 };
    expect(check(polygon)).toThrow(/curve is a polyline field, not a polygon field/);
  });
});

describe("validateLocation: a polyline's geodesic", () => {
  it("accepts geodesic on a polyline, and a curve with geodesic false", () => {
    expect(check(line({ geodesic: true }))).not.toThrow();
    expect(check(line({ geodesic: false, curve: 0.3 }))).not.toThrow();
  });

  it("rejects geodesic that isn't a boolean", () => {
    expect(check(line({ geodesic: "yes" }))).toThrow(
      fails('location "l": geodesic must be a boolean, got "yes"', "geodesic", "l"),
    );
  });

  it("rejects curve with geodesic", () => {
    expect(check(line({ geodesic: true, curve: 0.3 }))).toThrow(
      fails('location "l": curve cannot be set together with geodesic', "curve", "l"),
    );
  });

  it("rejects geodesic on an editable line", () => {
    expect(check(line({ geodesic: true, editable: true }))).toThrow(
      fails('location "l": geodesic cannot be set together with editable', "geodesic", "l"),
    );
  });

  it("rejects geodesic on a polygon", () => {
    const polygon = { id: "p", type: "polygon", path: [point, point, point], geodesic: true };
    expect(check(polygon)).toThrow(/geodesic is a polyline field, not a polygon field/);
  });
});
