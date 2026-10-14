import { describe, expect, it } from "vitest";
import { mountSubject, startMount } from "./harness";
import type { ConformanceSubject } from "./subject";

export function controlChecks(subject: ConformanceSubject): void {
  describe("controls", () => {
    it("places a control on the map and takes it away, safely twice and after destroy", async () => {
      const { adapter, container, destroy, probe } = await mountSubject(subject);
      const control = document.createElement("button");
      const remove = adapter.mountControl(control, "top-left");
      // A provider lays its controls out as it draws.
      await probe.settle();
      expect(container.contains(control)).toBe(true);
      remove();
      remove();
      expect(container.contains(control)).toBe(false);
      const removeLater = adapter.mountControl(document.createElement("button"), "bottom-right");
      destroy();
      expect(removeLater).not.toThrow();
    });

    it("places a control mounted before the map opened once it opens", async () => {
      const { adapter, container, mounting, probe } = startMount(subject);
      const control = document.createElement("button");
      adapter.mountControl(control, "top-right");
      await mounting;
      await probe.settle();
      expect(container.contains(control)).toBe(true);
    });

    it("takes its controls off the map on destroy, the page's own map included", async () => {
      const { adapter, container, destroy, probe } = await mountSubject(subject);
      const control = document.createElement("button");
      adapter.mountControl(control, "bottom-left");
      await probe.settle();
      expect(container.contains(control)).toBe(true);
      destroy();
      expect(container.contains(control)).toBe(false);
    });

    it("leaves the page's node as it was given: no style or attribute added", async () => {
      const { adapter, probe } = await mountSubject(subject);
      const control = document.createElement("button");
      control.className = "page-control";
      const asGiven = control.outerHTML;
      const remove = adapter.mountControl(control, "top-left");
      // What a provider writes on a control shows once it has drawn it.
      await probe.settle();
      const whileMounted = control.outerHTML;
      remove();
      expect([whileMounted, control.outerHTML]).toEqual([asGiven, asGiven]);
    });
  });
}
