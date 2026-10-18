import { describe, expect, it } from "vitest";
import { legStops, passesThrough, sameStops } from "./route";

describe("legStops", () => {
  it("leaves out the inner stops the route passes through", () => {
    expect(legStops({ stops: ["a", "b", "c", "d"], via: ["b"] })).toEqual(["a", "c", "d"]);
  });

  it("is every stop with no via, or an empty one", () => {
    expect(legStops({ stops: ["a", "b", "c"] })).toEqual(["a", "b", "c"]);
    expect(legStops({ stops: ["a", "b", "c"], via: [] })).toEqual(["a", "b", "c"]);
  });

  it("keeps a via id where it is the first or the last stop", () => {
    expect(legStops({ stops: ["a", "b", "a", "c"], via: ["a"] })).toEqual(["a", "b", "c"]);
  });
});

describe("passesThrough", () => {
  it("is true for an inner stop named in via", () => {
    expect(passesThrough({ stops: ["a", "b", "c"], via: ["b"] }, 1)).toBe(true);
    expect(passesThrough({ stops: ["a", "b", "c"], via: ["c"] }, 1)).toBe(false);
  });

  it("is never true for the first or the last stop", () => {
    const route = { stops: ["a", "b", "a"], via: ["a"] };
    expect(passesThrough(route, 0)).toBe(false);
    expect(passesThrough(route, 2)).toBe(false);
  });
});

describe("sameStops", () => {
  const stops = ["a", "b", "c", "d"];

  it("holds for the same stops passed through, in any order, repeated, or none named", () => {
    expect(sameStops({ stops, via: ["b", "c"] }, { stops, via: ["c", "b", "b"] })).toBe(true);
    expect(sameStops({ stops, via: [] }, { stops })).toBe(true);
  });

  it("fails for other stops, or other stops passed through", () => {
    expect(sameStops({ stops }, { stops: ["a", "c", "b", "d"] })).toBe(false);
    expect(sameStops({ stops }, { stops: ["a", "b", "c"] })).toBe(false);
    expect(sameStops({ stops, via: ["b"] }, { stops, via: ["c"] })).toBe(false);
    expect(sameStops({ stops, via: ["b"] }, { stops })).toBe(false);
  });
});
