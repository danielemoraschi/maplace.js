import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { initialSnapshot } from "./initial";

const at = { lat: 0, lng: 0 };
const locations: Location[] = [
  { id: "a", ...at },
  { id: "b", ...at, visible: false },
];

describe("initialSnapshot", () => {
  it("starts empty, idle and fitting all locations", () => {
    const snapshot = initialSnapshot(undefined);
    expect(snapshot).toEqual({
      locations: [],
      selectedId: undefined,
      hoveredId: undefined,
      filter: undefined,
      view: { kind: "fit-all", padding: 40 },
      viewport: undefined,
      route: undefined,
      routeResult: undefined,
      loadState: "idle",
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.locations)).toBe(true);
  });

  it("takes a frozen copy of the locations", () => {
    const snapshot = initialSnapshot({ locations });
    expect(snapshot.locations).toEqual(locations);
    expect(snapshot.locations).not.toBe(locations);
  });

  it("brings the selected location into view", () => {
    expect(initialSnapshot({ locations, selectedId: "a" })).toMatchObject({
      selectedId: "a",
      view: { kind: "location", id: "a", zoom: undefined },
    });
  });

  it("lets an explicit view win over the selection and fitting", () => {
    const view = { kind: "center", center: { lat: 1, lng: 2 }, zoom: 5 } as const;
    expect(initialSnapshot({ locations, selectedId: "a", view })).toMatchObject({
      selectedId: "a",
      view,
    });
  });

  it("rejects a selectedId that names no location, or a hidden one", () => {
    expect(() => initialSnapshot({ locations, selectedId: "zz" })).toThrow(
      expect.objectContaining({
        code: "unknown-id",
        message: 'createMaplace: options.selectedId must name a location, got "zz"',
        field: "options.selectedId",
      }),
    );
    expect(() => initialSnapshot({ locations, selectedId: "b" })).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message: expect.stringMatching(/options\.selectedId names a hidden location/),
      }),
    );
  });

  it("rejects a location view that names no location", () => {
    expect(() =>
      initialSnapshot({ locations, view: { kind: "location", id: "zz", zoom: undefined } }),
    ).toThrow(expect.objectContaining({ code: "unknown-id", field: "options.view.id" }));
  });

  it("rejects invalid options", () => {
    expect(() => initialSnapshot({ zoom: 3 } as never)).toThrow(
      /options\.zoom is not a maplace option/,
    );
  });
});
