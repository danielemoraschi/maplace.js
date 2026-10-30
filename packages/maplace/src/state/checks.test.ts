import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { child, root } from "../validate/fail";
import { checkKnownId, checkSelectable } from "./checks";

const at = { lat: 0, lng: 0 };
const a: Location = { id: "a", ...at, group: "N" };
const locations = Object.freeze([a, { id: "b", ...at, visible: false }]);
const field = child(root("caller"), "id");

describe("checkKnownId", () => {
  it("returns the location an id names", () => {
    expect(checkKnownId(locations, "a", field)).toBe(a);
  });

  it("throws unknown-id for any other id", () => {
    expect(() => checkKnownId(locations, "zz", field)).toThrow(
      expect.objectContaining({
        code: "unknown-id",
        message: 'caller: id must name a location, got "zz"',
      }),
    );
  });
});

describe("checkSelectable", () => {
  it("accepts a shown location", () => {
    expect(() =>
      checkSelectable({ locations, filter: { groups: ["N"] } }, "a", field),
    ).not.toThrow();
  });

  it("rejects a hidden one, by visible: false or by the filter", () => {
    const hidden =
      /^caller: id names a hidden location \(visible: false, or outside the filter\), got "b"$/;
    expect(() => checkSelectable({ locations, filter: undefined }, "b", field)).toThrow(hidden);
    expect(() => checkSelectable({ locations, filter: { groups: ["S"] } }, "a", field)).toThrow(
      expect.objectContaining({ code: "invalid-input" }),
    );
  });
});
