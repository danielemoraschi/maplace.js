import { describe, expect, it } from "vitest";
import type { Drawable } from "../../drawable";
import {
  adding,
  circleDrawable,
  markerDrawable,
  ORIGIN,
  polylineDrawable,
  presented,
  reshaped,
  updating,
} from "./fixtures";
import { mountSubject } from "./harness";
import type { ConformanceSubject } from "./subject";

/** A circle of `radius` metres at the origin, so circles of different sizes overlap. */
const circle = (id: string, radius: number): Drawable =>
  circleDrawable(id, { geometry: { type: "circle", center: ORIGIN, radius } });

/**
 * How an adapter stacks shapes: the smaller in front, so one inside another stays reachable; a
 * line before any area; among equal sizes the later added in front; whatever is hovered or
 * selected; all below every marker.
 */
export function shapeStackingChecks(subject: ConformanceSubject): void {
  describe("shapes stacked", () => {
    it("puts the smaller in front, a line before any area, below every marker", async () => {
      const { adapter, probe } = await mountSubject(subject);
      const shapes = [circle("small", 5000), circle("big", 15000), polylineDrawable("line")];
      await adapter.apply(adding(markerDrawable("a"), ...shapes));
      expect(probe.stackOrder()).toEqual(["a", "line", "small", "big"]);
    });

    it("keeps that order whatever is hovered or selected", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(circle("small", 5000), circle("big", 15000)));
      adapter.present(presented({ selectedId: "big", hoveredId: "big" }));
      expect(probe.stackOrder()).toEqual(["small", "big"]);
    });

    it("puts the later added in front among shapes of one size", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(circle("first", 5000), circle("second", 5000)));
      expect(probe.stackOrder()).toEqual(["second", "first"]);
    });

    it("restacks a shape whose size changes", async () => {
      const { adapter, probe } = await mountSubject(subject);
      const small = circle("small", 5000);
      await adapter.apply(adding(circle("big", 15000), small));
      await adapter.apply(
        updating(reshaped(small, { type: "circle", center: ORIGIN, radius: 30000 })),
      );
      expect(probe.stackOrder()).toEqual(["big", "small"]);
    });
  });
}
