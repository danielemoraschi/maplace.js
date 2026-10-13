import { describe, expect, it } from "vitest";
import { adding, manyMarkers } from "./fixtures";
import { mountSubject } from "./harness";
import type { ConformanceSubject, Supports } from "./subject";

export function clusterChecks(subject: ConformanceSubject, supports: Supports): void {
  describe("cluster", () => {
    it.runIf(supports.has("cluster"))("still draws every location when clustering", async () => {
      const { adapter, probe } = await mountSubject(subject, { cluster: true });
      await adapter.apply(adding(...manyMarkers(3)));
      expect(probe.locationIds()).toHaveLength(3);
    });
  });
}
