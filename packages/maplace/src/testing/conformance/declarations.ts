import { describe, expect, it } from "vitest";
import { EVERY_CAPABILITY } from "../contract-values";
import { unmountedAdapter } from "./harness";
import type { ConformanceSubject, Supports } from "./subject";

const SMALLEST_ROUTE = 2;

/** What an adapter declares before it mounts: its capabilities and its route stop limit. */
export function declarationChecks(subject: ConformanceSubject, supports: Supports): void {
  describe("declarations", () => {
    it("names only capabilities the contract knows", () => {
      for (const capability of supports) expect(EVERY_CAPABILITY).toContain(capability);
    });

    it("limits routes to at least two stops, if at all", () => {
      const { routeStopLimit } = unmountedAdapter(subject);
      if (routeStopLimit === undefined) return;
      expect(Number.isInteger(routeStopLimit)).toBe(true);
      expect(routeStopLimit).toBeGreaterThanOrEqual(SMALLEST_ROUTE);
    });
  });
}
