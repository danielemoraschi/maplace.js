import { describe, expect, it } from "vitest";
import { keepIfSame, sameFields, sameValueSource } from "./same";

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
