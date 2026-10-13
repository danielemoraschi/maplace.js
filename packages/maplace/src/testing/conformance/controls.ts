import { describe, expect, it } from "vitest";
import { mountSubject } from "./harness";
import type { ConformanceSubject } from "./subject";

export function controlChecks(subject: ConformanceSubject): void {
  describe("controls", () => {
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
