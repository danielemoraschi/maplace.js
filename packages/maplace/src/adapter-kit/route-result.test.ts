import { describe, expect, it } from "vitest";
import { withTotals } from "./route-result";

describe("withTotals", () => {
  it("totals the legs' distances and durations, keeping the path", () => {
    const legs = [
      { from: "a", to: "b", distanceMeters: 40_000, durationSeconds: 1_800.5, steps: [] },
      { from: "b", to: "c", distanceMeters: 60_000, durationSeconds: 2_700, steps: [] },
    ];
    const path = [{ lat: 1, lng: 2 }];
    expect(withTotals(legs, path)).toEqual({
      legs,
      distanceMeters: 100_000,
      durationSeconds: 4_500.5,
      path,
    });
  });
});
