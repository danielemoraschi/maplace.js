import { describe, expect, it } from "vitest";
import { AWAY, adding, markerDrawable, polygonDrawable, presented } from "./fixtures";
import { mountSubject } from "./harness";
import type { ConformanceSubject } from "./subject";

export function reportChecks(subject: ConformanceSubject): void {
  describe("reports", () => {
    it("reports a click on a location", async () => {
      const { adapter, probe, host } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a")));
      probe.click("a");
      expect(host.reportsOf("reportSelectionChange")).toEqual([["a"]]);
      expect(host.reportsOf("reportMapClick")).toEqual([]);
    });

    it("reports a click on the map with where it was, as no location's", async () => {
      const { adapter, probe, host } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a")));
      probe.clickMap(AWAY);
      // A map may hold a click until it can't be half of a double-click.
      await probe.settle();
      expect(host.reportsOf("reportMapClick")).toEqual([[AWAY]]);
      expect(host.reportsOf("reportSelectionChange")).toEqual([]);
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
