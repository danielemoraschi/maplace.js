import { describe, expect, it } from "vitest";
import { child, root } from "./fail";
import { checkBounds, checkFitOptions, checkSelectOptions, checkView, checkZoom } from "./viewport";

function argument(call: string, name: string) {
  return child(root(call), name);
}

function fails(message: string, field: string) {
  return expect.objectContaining({ code: "invalid-input", message, field });
}

const bounds = { south: 10, west: 20, north: 40, east: 30 };

describe("checkBounds", () => {
  const field = argument("fitBounds", "bounds");

  it("accepts a box, including one across the antimeridian", () => {
    expect(() => checkBounds(bounds, field)).not.toThrow();
    expect(() => checkBounds({ ...bounds, west: 170, east: -170 }, field)).not.toThrow();
  });

  it("rejects south above north", () => {
    expect(() => checkBounds({ ...bounds, south: 50 }, field)).toThrow(
      fails("fitBounds: bounds.south (50) must not be above bounds.north (40)", "bounds.south"),
    );
  });

  it("rejects coordinates out of range and unknown keys", () => {
    expect(() => checkBounds({ ...bounds, east: 190 }, field)).toThrow(
      /bounds\.east must be a number from -180 to 180, got 190/,
    );
    expect(() => checkBounds({ ...bounds, top: 1 }, field)).toThrow(
      /bounds\.top is not a bounds field/,
    );
  });
});

describe("checkZoom", () => {
  it("accepts zero and fractional zooms, rejects negative ones", () => {
    const field = argument("setView", "zoom");
    expect(() => checkZoom(0, field)).not.toThrow();
    expect(() => checkZoom(12.5, field)).not.toThrow();
    expect(() => checkZoom(-1, field)).toThrow(
      fails("setView: zoom must be a number of at least 0, got -1", "zoom"),
    );
  });
});

describe("checkView", () => {
  const field = argument("createMaplace", "view");

  it("accepts each kind", () => {
    expect(() => checkView({ kind: "fit-all", padding: 0 }, field)).not.toThrow();
    expect(() => checkView({ kind: "fit-bounds", bounds, padding: 40 }, field)).not.toThrow();
    const center = { kind: "center", center: { lat: 1, lng: 2 }, zoom: 3 };
    expect(() => checkView(center, field)).not.toThrow();
    expect(() => checkView({ kind: "location", id: "a", zoom: undefined }, field)).not.toThrow();
  });

  it("rejects an unknown kind, listing the four", () => {
    expect(() => checkView({ kind: "fit" }, field)).toThrow(
      /view\.kind must be one of "fit-all", "fit-bounds", "center", "location", got "fit"/,
    );
  });

  it("checks the fields of its kind", () => {
    expect(() => checkView({ kind: "center", center: { lat: 1, lng: 2 } }, field)).toThrow(
      /view\.zoom must be a number of at least 0, got undefined/,
    );
    expect(() => checkView({ kind: "fit-all", padding: 0, zoom: 3 }, field)).toThrow(
      /view\.zoom is not a fit-all view field/,
    );
  });
});

describe("checkSelectOptions", () => {
  const field = argument("select", "options");

  it("accepts no options, a zoom, or no pan", () => {
    expect(() => checkSelectOptions(undefined, field)).not.toThrow();
    expect(() => checkSelectOptions({ zoom: 12 }, field)).not.toThrow();
    expect(() => checkSelectOptions({ pan: false }, field)).not.toThrow();
  });

  it("rejects a zoom without pan", () => {
    expect(() => checkSelectOptions({ pan: false, zoom: 12 }, field)).toThrow(
      fails(
        "select: options.zoom needs pan; with pan: false the map stays where it is",
        "options.zoom",
      ),
    );
  });

  it("rejects 0.2's boolean flag", () => {
    expect(() => checkSelectOptions(false, field)).toThrow(
      /select: options must be an object, got false/,
    );
  });
});

describe("checkFitOptions", () => {
  it("rejects a negative padding", () => {
    const field = argument("fitAll", "options");
    expect(() => checkFitOptions({ padding: 20 }, field)).not.toThrow();
    expect(() => checkFitOptions({ padding: -5 }, field)).toThrow(
      fails("fitAll: options.padding must be a number of at least 0, got -5", "options.padding"),
    );
  });
});
