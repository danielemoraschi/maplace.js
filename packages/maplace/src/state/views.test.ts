import { describe, expect, it } from "vitest";
import type { View } from "../viewport";
import { copyView, FIT_PADDING, fitAll, fitBounds, setView } from "./views";

const box = { south: 35, west: 6, north: 47, east: 19 };

describe("fitAll", () => {
  it("fits every location with the default padding, or the one given", () => {
    expect(fitAll()).toEqual({
      patch: { view: { kind: "fit-all", padding: FIT_PADDING } },
      events: [],
    });
    expect(fitAll({ padding: 0 }).patch.view).toEqual({ kind: "fit-all", padding: 0 });
    expect(FIT_PADDING).toBe(40);
  });

  it("makes a new view on every call, so fitting again re-applies", () => {
    expect(fitAll().patch.view).not.toBe(fitAll().patch.view);
  });

  it("rejects bad options", () => {
    expect(() => fitAll({ padding: -1 })).toThrow(
      /^fitAll: options\.padding must be a number of at least 0, got -1$/,
    );
  });
});

describe("fitBounds", () => {
  it("shows a box, copied so later changes to it don't move the view", () => {
    const bounds = { ...box };
    const view = fitBounds(bounds, { padding: 10 }).patch.view;
    expect(view).toEqual({ kind: "fit-bounds", bounds: box, padding: 10 });
    expect(view?.kind === "fit-bounds" && view.bounds).not.toBe(bounds);
  });

  it("allows a box across the antimeridian, and rejects south above north", () => {
    expect(() => fitBounds({ south: 0, west: 170, north: 10, east: -170 })).not.toThrow();
    expect(() => fitBounds({ ...box, south: 50 })).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message: expect.stringMatching(/^fitBounds: bounds/),
      }),
    );
  });
});

describe("setView", () => {
  it("shows a centre at a zoom, copying the centre", () => {
    const center = { lat: 45, lng: 9 };
    const view = setView(center, 10).patch.view;
    expect(view).toEqual({ kind: "center", center, zoom: 10 });
    expect(view?.kind === "center" && view.center).not.toBe(center);
  });

  it("rejects a centre out of range and a negative zoom", () => {
    expect(() => setView({ lat: 95, lng: 0 }, 3)).toThrow(
      /^setView: center\.lat must be a number from -90 to 90, got 95$/,
    );
    expect(() => setView({ lat: 0, lng: 0 }, -1)).toThrow(
      /^setView: zoom must be a number of at least 0, got -1$/,
    );
  });
});

describe("copyView", () => {
  it("copies every kind of view, coordinates included", () => {
    const views: View[] = [
      { kind: "fit-all", padding: 0 },
      { kind: "fit-bounds", bounds: box, padding: 10 },
      { kind: "center", center: { lat: 1, lng: 2 }, zoom: 3 },
      { kind: "location", id: "a", zoom: undefined },
    ];
    for (const view of views) {
      expect(copyView(view)).toEqual(view);
      expect(copyView(view)).not.toBe(view);
    }
    const [, boxed, centred] = views.map(copyView);
    expect(boxed?.kind === "fit-bounds" && boxed.bounds).not.toBe(box);
    expect(centred?.kind === "center" && centred.center).not.toBe(
      views[2]?.kind === "center" && views[2].center,
    );
  });
});
