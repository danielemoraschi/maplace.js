import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { mounted } from "../testing/mounted";
import type { View } from "../viewport";

// 0.2 scenarios about what the map is asked to show (RFC Appendix A, regression-test candidates).

// The size of the big example (examples/big), the largest data set the docs use.
const BIG = 4_000;

function locationsAround(count: number, idPrefix: string): Location[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${idPrefix}${index}`,
    lat: (index % 160) - 80,
    lng: (index % 340) - 170,
  }));
}

describe("#9: swapping large location sets is one diff each, not a recursion", () => {
  it("sends each swap as one diff, however often the sets alternate", async () => {
    const first = locationsAround(BIG, "a");
    const second = locationsAround(BIG, "b");
    const { maplace, adapter } = await mounted({ locations: first });
    for (let round = 0; round < 3; round++) {
      maplace.setLocations(second);
      maplace.setLocations(first);
    }
    const applies = adapter.callsOf("apply");
    expect(applies).toHaveLength(7);
    const [last] = applies.slice(-1);
    expect(last?.diff.removed).toHaveLength(BIG);
    expect(last?.diff.added).toHaveLength(BIG);
  });
});

describe("#18, #46: an explicit view is not overridden by fit-all", () => {
  it("shows the given view, over a selection and over locations set later", async () => {
    const centre: View = { kind: "center", center: { lat: 45, lng: 9 }, zoom: 12 };
    const locations = locationsAround(3, "a");
    const { maplace, adapter } = await mounted({ locations, selectedId: "a0", view: centre });
    maplace.setLocations(locationsAround(10, "b"));
    expect(adapter.callsOf("setView").map((call) => call.view)).toEqual([centre]);
  });
});

describe("#52, #55, #65: a single location is not a blank map", () => {
  it("asks for a box around the one location", async () => {
    const { adapter } = await mounted({ locations: [{ id: "a", lat: 45, lng: 9 }] });
    expect(adapter.callsOf("setView").map((call) => call.view)).toEqual([
      { kind: "fit-bounds", bounds: { south: 45, west: 9, north: 45, east: 9 }, padding: 40 },
    ]);
  });
});

describe("#88: a route doesn't override the requested zoom", () => {
  it("leaves the view alone when a route is set", async () => {
    const { maplace, adapter } = await mounted({ locations: locationsAround(2, "a") });
    maplace.setView({ lat: 1, lng: 2 }, 15);
    const viewsBefore = adapter.callsOf("setView").length;
    maplace.setRoute({ stops: ["a0", "a1"] });
    expect(adapter.callsOf("setView")).toHaveLength(viewsBefore);
    expect(maplace.getSnapshot().view).toMatchObject({ zoom: 15 });
  });
});

describe("#186: a second map on the page renders too", () => {
  it("draws two stores independently", async () => {
    const one = await mounted({ locations: locationsAround(1, "one") });
    const two = await mounted({ locations: locationsAround(2, "two") });
    const added = (adapter: typeof one.adapter) =>
      adapter.callsOf("apply")[0]?.diff.added.map((drawable) => drawable.id);
    expect(added(one.adapter)).toEqual(["one0"]);
    expect(added(two.adapter)).toEqual(["two0", "two1"]);
  });
});
