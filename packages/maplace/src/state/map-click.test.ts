import { describe, expect, it } from "vitest";
import { initialSnapshot } from "./initial";
import { mapClicked } from "./map-click";

const snapshot = initialSnapshot({ locations: [{ id: "a", lat: 0, lng: 0 }] });
const position = { lat: 10, lng: 20 };

describe("mapClicked", () => {
  it("fires mapClick with where, then clears the selection", () => {
    const change = mapClicked({ ...snapshot, selectedId: "a" }, position);
    expect(change.patch).toEqual({ selectedId: undefined });
    expect(change.events).toEqual([
      { name: "mapClick", payload: { position } },
      { name: "selectionChange", payload: { id: undefined } },
    ]);
  });

  it("fires mapClick alone when nothing is selected", () => {
    const change = mapClicked(snapshot, position);
    expect(change.patch).toEqual({});
    expect(change.events).toEqual([{ name: "mapClick", payload: { position } }]);
  });

  it("gives a frozen copy of the position", () => {
    const [event] = mapClicked(snapshot, position).events;
    const clicked = event?.name === "mapClick" ? event.payload.position : undefined;
    expect(clicked).not.toBe(position);
    expect(Object.isFrozen(clicked)).toBe(true);
  });

  it("throws on a position no map shows", () => {
    expect(() => mapClicked(snapshot, { lat: 200, lng: 0 })).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message: expect.stringMatching(/^reportMapClick: position\.lat/),
      }),
    );
  });
});
