import { describe, expect, it } from "vitest";
import { EXAMPLE_SECTIONS } from "../../apps/site/src/examples/example-sections.ts";
import { SHOT_PLANS } from "./plans.ts";

describe("SHOT_PLANS", () => {
  it("plans one shot for each example and none other", () => {
    const planned = SHOT_PLANS.map(({ name }) => name);
    expect([...planned].sort()).toEqual(EXAMPLE_SECTIONS.map(({ name }) => name).sort());
    expect(new Set(planned).size).toBe(planned.length);
  });
});
