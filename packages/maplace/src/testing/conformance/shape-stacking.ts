import { describe, expect, it } from "vitest";
import {
  adding,
  areaDrawable,
  areaGeometry,
  markerDrawable,
  polylineDrawable,
  presented,
  reshaped,
  updating,
} from "./fixtures";
import { mountSubject } from "./harness";
import type { ConformanceSubject, Supports } from "./subject";

/**
 * How an adapter stacks shapes: the smaller in front, so one inside another stays reachable; a
 * line before any area; among equal sizes the later added in front; whatever is hovered or
 * selected; all below every marker.
 */
export function shapeStackingChecks(subject: ConformanceSubject, supports: Supports): void {
  /** An area of `radius` metres at the origin, so areas of different sizes overlap. */
  const area = (id: string, radius: number) => areaDrawable(supports, id, radius);
  describe("shapes stacked", () => {
    it("puts the smaller in front, a line before any area, below every marker", async () => {
      const { adapter, probe } = await mountSubject(subject);
      const shapes = [area("small", 5000), area("big", 15000), polylineDrawable("line")];
      await adapter.apply(adding(markerDrawable("a"), ...shapes));
      expect(probe.stackOrder()).toEqual(["a", "line", "small", "big"]);
    });

    it("keeps that order whatever is hovered or selected", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(area("small", 5000), area("big", 15000)));
      adapter.present(presented({ selectedId: "big", hoveredId: "big" }));
      expect(probe.stackOrder()).toEqual(["small", "big"]);
    });

    it("puts the later added in front among shapes of one size", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(area("first", 5000), area("second", 5000)));
      expect(probe.stackOrder()).toEqual(["second", "first"]);
    });

    it("restacks a shape whose size changes", async () => {
      const { adapter, probe } = await mountSubject(subject);
      const small = area("small", 5000);
      await adapter.apply(adding(area("big", 15000), small));
      await adapter.apply(updating(reshaped(small, areaGeometry(supports, 30000))));
      expect(probe.stackOrder()).toEqual(["big", "small"]);
    });
  });
}
