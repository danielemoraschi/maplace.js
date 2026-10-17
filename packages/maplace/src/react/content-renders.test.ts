import { expect, it } from "vitest";
import { asksOf, rendersAnything } from "./content-renders";

it("counts null, undefined and booleans as nothing, and anything else as content", () => {
  const nothing = [null, undefined, true, false].map((node) => rendersAnything(() => node));
  const content = ["", 0, "★"].map((node) => rendersAnything(() => node));
  expect([nothing, content]).toEqual([
    [false, false, false, false],
    [true, true, true],
  ]);
});

it("counts a function that throws as rendering something", () => {
  const throwing = () => {
    throw new Error("no card");
  };
  expect(rendersAnything(throwing)).toBe(true);
});

it("asks for what is given, and nothing when neither is", () => {
  expect(asksOf({ markerIcon: () => "★" })).toEqual({ popup: false, icon: true });
  expect(asksOf({})).toBeUndefined();
});
