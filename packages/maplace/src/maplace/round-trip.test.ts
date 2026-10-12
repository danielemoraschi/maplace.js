import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { mounted } from "../testing/mounted";

const locations: Location[] = [
  { id: "a", lat: 0, lng: 0 },
  { id: "b", lat: 1, lng: 1 },
];

describe("a report comes back to the adapter", () => {
  it("a drag reaches the adapter as an update with the written-back geometry", async () => {
    const { adapter, host } = await mounted({
      locations: [{ id: "a", lat: 0, lng: 0, editable: true }],
    });
    host.reportChange("a", { type: "marker", lat: 5, lng: 6 });
    const [update] = adapter.callsOf("apply").slice(-1);
    expect(update?.diff.updated.map((drawable) => drawable.geometry)).toEqual([
      { type: "marker", lat: 5, lng: 6 },
    ]);
  });

  it("a report during a pass waits for the next one, keeping the store's order", async () => {
    const { maplace, adapter, host } = await mounted({ locations });
    const present = adapter.present;
    adapter.present = (state) => {
      present(state);
      if (state.selectedId === "a") host.reportHover("b");
    };
    maplace.select("a");
    expect(adapter.calls.slice(-3).map((call) => call.method)).toEqual([
      "present",
      "setView",
      "present",
    ]);
  });
});
