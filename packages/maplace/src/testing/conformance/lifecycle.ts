import { describe, expect, it } from "vitest";
import { AWAY, adding, markerDrawable, polygonDrawable } from "./fixtures";
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
      probe.clickMap(AWAY);
      await probe.settle();
      expect(host.reports).toEqual([]);
    });

    it("reports nothing once its load is cancelled after it opened", async () => {
      const { adapter, controller, probe, host } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a")));
      // A real map may report the view it opens at any time before this.
      const reportedBefore = host.reports.length;
      controller.abort();
      probe.click("a");
      probe.pointerOver("a");
      probe.clickMap(AWAY);
      await probe.settle();
      expect(host.reports.slice(reportedBefore)).toEqual([]);
    });

    it("removes what it added on destroy, and reports nothing after", async () => {
      const mounted = await mountSubject(subject);
      const { adapter, container, pageChildren, probe, host, destroy } = mounted;
      await adapter.apply(adding(markerDrawable("a"), polygonDrawable("p")));
      const reportedBefore = host.reports.length;
      destroy();
      probe.click("a");
      probe.click("p");
      probe.clickMap(AWAY);
      await probe.settle();
      expect([...container.children]).toEqual(pageChildren);
      expect(probe.locationIds()).toEqual([]);
      expect(host.reports.slice(reportedBefore)).toEqual([]);
    });
  });
}
