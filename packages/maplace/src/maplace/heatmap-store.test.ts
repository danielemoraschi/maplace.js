// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Drawable } from "../drawable";
import type { Location } from "../location";
import type { FakeCall } from "../testing/fake-adapter";
import { mounted } from "../testing/mounted";

const QUAKE: Location = { id: "q", lat: 0, lng: 0, group: "quakes", weight: 5 };
const LIGHT_QUAKE: Location = { id: "l", lat: 1, lng: 1, group: "quakes" };
const VOLCANO: Location = { id: "v", lat: 2, lng: 2, group: "volcanoes" };

/** The drawables the adapter was given, by id, as last added or updated. */
function drawnById(calls: readonly FakeCall[]): Map<string, Drawable> {
  const drawn = new Map<string, Drawable>();
  for (const call of calls) {
    if (call.method !== "apply") continue;
    for (const drawable of [...call.diff.added, ...call.diff.updated]) {
      drawn.set(drawable.id, drawable);
    }
  }
  return drawn;
}

describe("a store's heatmap", () => {
  it("gives the adapter its heat markers' weights, 1 when unset, and none to other groups", async () => {
    const { adapter } = await mounted({
      heatmap: { groups: ["quakes"] },
      locations: [QUAKE, LIGHT_QUAKE, VOLCANO],
    });
    const drawn = drawnById(adapter.calls);
    expect(drawn.get("q")?.heatWeight).toBe(5);
    expect(drawn.get("l")?.heatWeight).toBe(1);
    expect(drawn.get("v")?.heatWeight).toBeUndefined();
  });

  it("refuses an icon on a heat marker given to setLocations", async () => {
    const { maplace } = await mounted({ heatmap: { groups: ["quakes"] } });
    expect(() => maplace.setLocations([{ ...QUAKE, icon: "q.png" }])).toThrow(
      expect.objectContaining({ code: "invalid-input", locationId: "q", field: "icon" }),
    );
    expect(() => maplace.setLocations([{ ...VOLCANO, icon: "v.png" }])).not.toThrow();
  });
});
