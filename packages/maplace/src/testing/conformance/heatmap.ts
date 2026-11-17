import { describe, expect, it } from "vitest";
import { adding, presented, TOWNS, townMarkers } from "./fixtures";
import { mountSubject } from "./harness";
import type { ConformanceSubject, Supports } from "./subject";

/** The towns as heat markers, the heaviest Bologna. */
const HEATED = townMarkers().map((town, index) => ({ ...town, heatWeight: 3 - index }));

/** A subject drawing heat below zoom 9, the towns drawn at zoom 3 and the map settled. */
async function heatedSubject(subject: ConformanceSubject) {
  const mounted = await mountSubject(subject, { heatmap: { maxZoom: 9 } });
  mounted.adapter.setView({ kind: "center", center: TOWNS.bologna, zoom: 3 });
  await mounted.adapter.apply(adding(...HEATED));
  await mounted.probe.settle();
  return mounted;
}

export function heatmapChecks(subject: ConformanceSubject, supports: Supports): void {
  describe.runIf(supports.has("heatmap"))("heatmap", () => {
    it("draws every heat marker", async () => {
      const { probe } = await heatedSubject(subject);
      expect([...probe.locationIds()].sort((a, b) => a.localeCompare(b))).toEqual(["a", "b", "c"]);
      expect(probe.location("a")?.visible).toBe(true);
    });

    it("draws no hidden heat marker", async () => {
      const { adapter, probe } = await heatedSubject(subject);
      adapter.present(presented({ hiddenIds: new Set(["a"]) }));
      await probe.settle();
      expect(probe.location("a")?.visible).toBe(false);
    });

    it("reports a click on the selected heat marker, drawn over the heat", async () => {
      const { adapter, probe, host } = await heatedSubject(subject);
      adapter.present(presented({ selectedId: "b" }));
      await probe.settle();
      probe.click("b");
      await probe.settle();
      expect(host.reportsOf("reportSelectionChange")).toEqual([["b"]]);
    });
  });
}
