import { describe, expect, it } from "vitest";
import { child, root } from "./fail";
import { checkLatLng, pathOf } from "./geometry";

const center = child(root('location "c"', "c"), "center");

function fails(message: string, field: string) {
  return expect.objectContaining({ code: "invalid-input", message, field });
}

describe("checkLatLng", () => {
  it("accepts coordinates in range, edges included", () => {
    expect(() => checkLatLng({ lat: -90, lng: 180 }, center)).not.toThrow();
  });

  it("rejects a latitude out of range", () => {
    expect(() => checkLatLng({ lat: 95, lng: 0 }, center)).toThrow(
      fails('location "c": center.lat must be a number from -90 to 90, got 95', "center.lat"),
    );
  });

  it("rejects a longitude out of range", () => {
    expect(() => checkLatLng({ lat: 0, lng: -181 }, center)).toThrow(
      fails('location "c": center.lng must be a number from -180 to 180, got -181', "center.lng"),
    );
  });

  it("rejects numbers given as strings, quoting them", () => {
    expect(() => checkLatLng({ lat: "45.1", lng: 0 }, center)).toThrow(
      fails('location "c": center.lat must be a number from -90 to 90, got "45.1"', "center.lat"),
    );
  });

  it("rejects NaN and infinities", () => {
    expect(() => checkLatLng({ lat: Number.NaN, lng: 0 }, center)).toThrow(/got NaN/);
    expect(() => checkLatLng({ lat: 0, lng: Number.POSITIVE_INFINITY }, center)).toThrow(
      /got Infinity/,
    );
  });

  it("points 0.2's lon at lng", () => {
    expect(() => checkLatLng({ lat: 0, lon: 0 }, center)).toThrow(
      fails('location "c": center.lon is a 0.2 field; use lng', "center.lon"),
    );
  });

  it("explains only coordinate names, not other 0.2 location fields", () => {
    expect(() => checkLatLng({ lat: 0, lng: 0, zoom: 3 }, center)).toThrow(
      fails('location "c": center.zoom is not a coordinate field', "center.zoom"),
    );
  });

  it("rejects a provider LatLng object, whose lat is a method", () => {
    const providerLatLng = Object.create({ lat: () => 1, lng: () => 2 });
    expect(() => checkLatLng(providerLatLng, center)).toThrow(/center\.lat .* got a function/);
  });

  it("rejects something that is not an object", () => {
    expect(() => checkLatLng([1, 2], center)).toThrow(
      fails('location "c": center must be an object with lat and lng, got an array', "center"),
    );
  });
});

describe("pathOf", () => {
  const path = child(root('location "l"', "l"), "path");
  const point = { lat: 0, lng: 0 };

  it("accepts enough valid points", () => {
    expect(() => pathOf(2)([point, point], path)).not.toThrow();
  });

  it("rejects too few points", () => {
    expect(() => pathOf(2)([point], path)).toThrow(
      fails('location "l": path must be an array of at least 2 points, got 1 point', "path"),
    );
  });

  it("names the bad point by index", () => {
    expect(() => pathOf(2)([point, { lat: 0, lng: 200 }], path)).toThrow(
      fails('location "l": path[1].lng must be a number from -180 to 180, got 200', "path[1].lng"),
    );
  });

  it("rejects something that is not an array", () => {
    expect(() => pathOf(2)(point, path)).toThrow(/path must be an array of at least 2 points/);
  });
});
