import { describe, expect, it } from "vitest";
import { adding, LARGE_DIFF, manyMarkers, markerDrawable } from "./fixtures";
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

    it("stops a large diff on destroy: the apply still resolves, and nothing is drawn after", async () => {
      const { adapter, probe, destroy } = await mountSubject(subject);
      const drawing = adapter.apply(adding(...manyMarkers(LARGE_DIFF)));
      destroy();
      await drawing;
      expect(probe.locationIds()).toEqual([]);
    });

    it("places a control on the map and takes it away, safely twice and after destroy", async () => {
      const { adapter, container, destroy } = await mountSubject(subject);
      const control = document.createElement("button");
      const remove = adapter.mountControl(control, "top-left");
      expect(container.contains(control)).toBe(true);
      remove();
      remove();
      expect(container.contains(control)).toBe(false);
      const removeLater = adapter.mountControl(document.createElement("button"), "bottom-right");
      destroy();
      expect(removeLater).not.toThrow();
    });
  });
}
