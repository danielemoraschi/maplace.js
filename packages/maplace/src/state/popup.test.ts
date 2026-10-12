import { describe, expect, it } from "vitest";
import { NO_CHANGE } from "./change";
import { initialSnapshot } from "./initial";
import { popupClosed, popupOpened } from "./popup";

const snapshot = initialSnapshot({ locations: [{ id: "a", lat: 0, lng: 0 }] });
const element = {} as HTMLElement;

describe("popupOpened", () => {
  it("fires popupOpen with the element", () => {
    expect(popupOpened(snapshot, { id: "a", element })).toEqual({
      patch: {},
      events: [{ name: "popupOpen", payload: { id: "a", element } }],
    });
  });

  it("changes nothing for a location the store no longer has or shows", () => {
    expect(popupOpened(snapshot, { id: "gone", element })).toBe(NO_CHANGE);
    expect(popupOpened({ ...snapshot, filter: ["none"] }, { id: "a", element })).toBe(NO_CHANGE);
  });
});

describe("popupClosed", () => {
  const closeOf = (id: string) => ({
    patch: {},
    events: [{ name: "popupClose", payload: { id } }],
  });

  it("fires popupClose, even for a location that is gone", () => {
    expect(popupClosed(snapshot, { id: "gone", openOn: "click" })).toEqual(closeOf("gone"));
  });

  it("deselects after closing the selected popup with openOn click, not with hover", () => {
    const selected = { ...snapshot, selectedId: "a" };
    expect(popupClosed(selected, { id: "a", openOn: "click" })).toEqual({
      patch: { selectedId: undefined },
      events: [...closeOf("a").events, { name: "select", payload: { id: undefined } }],
    });
    expect(popupClosed(selected, { id: "a", openOn: "hover" })).toEqual(closeOf("a"));
  });
});
