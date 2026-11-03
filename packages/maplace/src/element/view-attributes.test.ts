// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { elementWith } from "./testing/dom";
import { firstViewOf } from "./view-attributes";

function refusal(attributes: Record<string, string>, field: string, problem: RegExp) {
  expect(() => firstViewOf(elementWith(attributes))).toThrow(
    expect.objectContaining({
      code: "invalid-input",
      field,
      message: expect.stringMatching(problem),
    }),
  );
}

describe("firstViewOf", () => {
  it("reads center and zoom as the store's centre view, spaces allowed", () => {
    expect(firstViewOf(elementWith({ center: " 44 , 11.5 ", zoom: "6" }))).toEqual({
      kind: "center",
      center: { lat: 44, lng: 11.5 },
      zoom: 6,
    });
  });

  it("is no view when neither is given", () => {
    expect(firstViewOf(elementWith({}))).toBeUndefined();
  });

  it("refuses center without zoom, and zoom without center, naming the missing one", () => {
    refusal({ center: "44,11" }, "zoom", /^<maplace-map>: zoom is missing: give both$/);
    refusal({ zoom: "6" }, "center", /^<maplace-map>: center is missing: give both$/);
  });

  it.each(["44", "44,11,3", "north,11", "44,", ""])(
    "refuses a center that isn't two numbers: %j",
    (center) => refusal({ center, zoom: "6" }, "center", /center must be "lat,lng", two numbers/),
  );

  it("refuses a latitude out of range in the store's words", () => {
    refusal({ center: "95,11", zoom: "6" }, "center.lat", /^<maplace-map>: center\.lat /);
  });

  it.each(["-1", "near", ""])("refuses a zoom of %j", (zoom) => {
    refusal({ center: "44,11", zoom }, "zoom", /^<maplace-map>: zoom /);
  });
});
