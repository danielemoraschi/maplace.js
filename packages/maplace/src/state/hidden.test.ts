import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { NO_CHANGE } from "./change";
import { clearHidden } from "./hidden";
import { initialSnapshot } from "./initial";

const at = { lat: 0, lng: 0 };
const AB = initialSnapshot({
  locations: [
    { id: "a", ...at },
    { id: "b", ...at, group: "N" },
  ],
});
const only = (locations: Location[]) => ({ ...AB, locations: Object.freeze(locations) });

describe("clearHidden", () => {
  it("deselects a location that is gone", () => {
    const gone = { ...only([{ id: "a", ...at }]), selectedId: "b" };
    expect(clearHidden(gone)).toEqual({
      patch: { selectedId: undefined },
      events: [{ name: "selectionChange", payload: { id: undefined } }],
    });
  });

  it("deselects a location the filter now hides", () => {
    expect(clearHidden({ ...AB, selectedId: "a", filter: { groups: ["N"] } }).patch).toEqual({
      selectedId: undefined,
    });
  });

  it("clears the hover of a location that is gone or hidden", () => {
    expect(clearHidden({ ...AB, hoveredId: "a", filter: { groups: ["N"] } })).toEqual({
      patch: { hoveredId: undefined },
      events: [{ name: "hoverChange", payload: { id: undefined } }],
    });
  });

  it("changes nothing while the selected and hovered locations are shown", () => {
    expect(clearHidden({ ...AB, selectedId: "a", hoveredId: "b" })).toEqual(NO_CHANGE);
  });
});
