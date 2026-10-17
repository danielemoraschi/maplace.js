import { describe, expect, it } from "vitest";
import { adding, markerDrawable, polygonDrawable, presented } from "./fixtures";
import { mountSubject } from "./harness";
import type { ConformanceSubject } from "./subject";

export function reportChecks(subject: ConformanceSubject): void {
  describe("reports", () => {
    it("reports a click on a location, and on the map as no location", async () => {
      const { adapter, probe, host } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a")));
      probe.click("a");
      probe.clickMap();
      expect(host.reportsOf("reportSelectionChange")).toEqual([["a"], [undefined]]);
    });

    it("reports the pointer onto a location and off it", async () => {
      const { adapter, probe, host } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a")));
      probe.pointerOver("a");
      probe.pointerOut();
      expect(host.reportsOf("reportHoverChange")).toEqual([["a"], [undefined]]);
    });

    it("reports a click on a shape, and the pointer onto it and off it", async () => {
      const { adapter, probe, host } = await mountSubject(subject);
      await adapter.apply(adding(polygonDrawable("p")));
      probe.click("p");
      probe.pointerOver("p");
      probe.pointerOut();
      expect(host.reportsOf("reportSelectionChange")).toEqual([["p"]]);
      expect(host.reportsOf("reportHoverChange")).toEqual([["p"], [undefined]]);
    });

    it("can't be clicked on a hidden location", async () => {
      const { adapter, probe, host } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a"), polygonDrawable("p")));
      adapter.present(presented({ hiddenIds: new Set(["a", "p"]) }));
      probe.click("a");
      probe.click("p");
      expect(host.reportsOf("reportSelectionChange")).toEqual([]);
    });
  });
}
