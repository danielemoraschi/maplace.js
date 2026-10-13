import { describe, expect, it } from "vitest";
import { adding, markerDrawable } from "./fixtures";
import { mountSubject, startMount } from "./harness";
import type { ConformanceSubject } from "./subject";

export function lifecycleChecks(subject: ConformanceSubject): void {
  describe("lifecycle", () => {
    it("draws its map into the container", async () => {
      const { container } = await mountSubject(subject);
      expect(container.children.length).toBeGreaterThan(0);
    });

    it("reports nothing once its load is cancelled", async () => {
      // Not awaiting the mount: the contract doesn't say a cancelled load settles.
      const { controller, probe, host } = startMount(subject);
      controller.abort();
      probe.clickMap();
      await probe.settle();
      expect(host.reports).toEqual([]);
    });

    it("removes what it added on destroy, and reports nothing after", async () => {
      const { adapter, container, probe, host, destroy } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a")));
      destroy();
      probe.click("a");
      probe.clickMap();
      await probe.settle();
      expect(container.children.length).toBe(0);
      expect(host.reports).toEqual([]);
    });
  });
}
