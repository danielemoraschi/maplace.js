import { describe, expect, it } from "vitest";
import {
  keepIfSame,
  sameFields,
  sameItems,
  sameJourney,
  sameOptional,
  sameValueSource,
} from "./same";

describe("sameJourney", () => {
  it("holds for the same travel mode and stops, failing for other stops passed through", () => {
    const stops = ["a", "b", "c"];
    expect(sameJourney({ stops, via: ["b"] }, { stops, via: ["b"] })).toBe(true);
    expect(sameJourney({ stops, via: ["b"] }, { stops })).toBe(false);
    expect(sameJourney({ stops }, { stops, travelMode: "walking" })).toBe(false);
  });
});

describe("sameFields", () => {
  it("compares own fields with ===", () => {
    const path = [{ lat: 1, lng: 2 }];
    expect(sameFields({ type: "polyline", path }, { type: "polyline", path })).toBe(true);
    expect(sameFields({ path }, { path: [...path] })).toBe(false);
  });

  it("treats a field written as undefined like a missing one", () => {
    expect(sameFields({ fill: undefined, stroke: "red" }, { stroke: "red" })).toBe(true);
    expect(sameFields({ stroke: "red" }, { fill: "blue", stroke: "red" })).toBe(false);
  });
});

describe("keepIfSame", () => {
  it("returns the previous object when the fields are the same", () => {
    const previous = { lat: 1, lng: 2 };
    expect(keepIfSame(previous, { lat: 1, lng: 2 })).toBe(previous);
  });

  it("returns the next object when a field differs or there is no previous one", () => {
    const next = { lat: 1, lng: 3 };
    expect(keepIfSame({ lat: 1, lng: 2 }, next)).toBe(next);
    expect(keepIfSame(undefined, next)).toBe(next);
  });

  it("keeps undefined as undefined", () => {
    expect(keepIfSame(undefined, undefined)).toBeUndefined();
    const next = { stroke: "red" };
    expect(keepIfSame(undefined, next)).toBe(next);
    expect(keepIfSame(next, undefined)).toBeUndefined();
  });
});

describe("sameValueSource", () => {
  it("holds for the same value", () => {
    expect(sameValueSource("/pin.svg", "/pin.svg")).toBe(true);
    expect(sameValueSource(undefined, undefined)).toBe(true);
  });

  it("fails for a different value, and for a function, which reads the location object", () => {
    const render = () => 1;
    expect(sameValueSource("/a.svg", "/b.svg")).toBe(false);
    expect(sameValueSource(render, render)).toBe(false);
  });
});

describe("sameItems", () => {
  it("holds for the same items in the same order", () => {
    const a = { id: "a" };
    expect(sameItems([a, "b"], [a, "b"])).toBe(true);
    expect(sameItems([], [])).toBe(true);
  });

  it("fails for another order, length or object", () => {
    expect(sameItems(["a", "b"], ["b", "a"])).toBe(false);
    expect(sameItems(["a"], ["a", "b"])).toBe(false);
    expect(sameItems([{ id: "a" }], [{ id: "a" }])).toBe(false);
  });
});

describe("sameOptional", () => {
  it("holds when both are absent, or both present and the same", () => {
    expect(sameOptional(undefined, undefined, sameItems)).toBe(true);
    expect(sameOptional(["a"], ["a"], sameItems)).toBe(true);
  });

  it("fails when only one is present, or they differ", () => {
    expect(sameOptional(["a"], undefined, sameItems)).toBe(false);
    expect(sameOptional(undefined, [], sameItems)).toBe(false);
    expect(sameOptional(["a"], ["b"], sameItems)).toBe(false);
  });
});
