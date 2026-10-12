import { describe, expect, it } from "vitest";
import { validateLocations } from "./locations";

const context = { caller: "setLocations", sanitize: undefined };

describe("validateLocations", () => {
  it("accepts an empty list and a list of valid locations", () => {
    expect(() => validateLocations([], context)).not.toThrow();
    const list = [
      { id: "a", lat: 1, lng: 2 },
      { id: "b", lat: 3, lng: 4 },
    ];
    expect(() => validateLocations(list, context)).not.toThrow();
  });

  it("rejects something that is not an array", () => {
    expect(() => validateLocations({ a: 1 }, context)).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message: "setLocations: locations must be an array, got an object",
        field: "locations",
      }),
    );
  });

  it("reports the first bad location, by its position", () => {
    const list = [
      { id: "a", lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
    ];
    expect(() => validateLocations(list, context)).toThrow(
      /locations\[1\]: id must be a non-empty string/,
    );
  });

  it("rejects a duplicate id, naming where it was first used", () => {
    const list = [
      { id: "a", lat: 1, lng: 2 },
      { id: "b", lat: 1, lng: 2 },
      { id: "a", lat: 3, lng: 4 },
    ];
    expect(() => validateLocations(list, context)).toThrow(
      expect.objectContaining({
        code: "duplicate-id",
        message: 'location "a": id is already used by locations[0]',
        field: "id",
        locationId: "a",
      }),
    );
  });

  it("passes the sanitizer on to each location", () => {
    const list = [{ id: "h", lat: 1, lng: 2, html: "<b>x</b>" }];
    expect(() => validateLocations(list, context)).toThrow(
      expect.objectContaining({ code: "missing-sanitizer" }),
    );
    const sanitize = (html: string) => html;
    expect(() => validateLocations(list, { caller: "setLocations", sanitize })).not.toThrow();
  });
});
