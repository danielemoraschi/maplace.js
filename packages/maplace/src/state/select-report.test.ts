import { describe, expect, it } from "vitest";
import { NO_CHANGE } from "./change";
import { initialSnapshot } from "./initial";
import { selectReported } from "./select-report";
import { select } from "./selection";

const AB = initialSnapshot({
  locations: [
    { id: "a", lat: 0, lng: 0 },
    { id: "b", lat: 0, lng: 0, group: "N" },
  ],
});

describe("selectReported", () => {
  it("selects a clicked location and pans to it", () => {
    expect(selectReported(AB, "b")).toEqual(select(AB, "b"));
  });

  it("deselects on a click on the map", () => {
    const selected = { ...AB, selectedId: "a" };
    expect(selectReported(selected, undefined)).toEqual(select(selected, undefined));
    expect(selectReported(AB, undefined)).toBe(NO_CHANGE);
  });

  it("changes nothing for an id the store no longer shows, where select would throw", () => {
    const filtered = { ...AB, filter: ["S"] };
    expect(selectReported(filtered, "b")).toBe(NO_CHANGE);
    expect(selectReported(AB, "gone")).toBe(NO_CHANGE);
  });
});
