import { describe, expect, it } from "vitest";
import type { Location } from "./location";
import { locationById } from "./location-index";

describe("locationById", () => {
  it("finds a location by id, or undefined", () => {
    const b: Location = { id: "b", lat: 0, lng: 0 };
    const locations = Object.freeze([{ id: "a", lat: 0, lng: 0 }, b]);
    expect(locationById(locations, "b")).toBe(b);
    expect(locationById(locations, "c")).toBeUndefined();
  });
});
