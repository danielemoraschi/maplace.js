import { describe, expect, it } from "vitest";
import {
  adding,
  markerDrawable,
  presented,
  removing,
  TOWNS,
  townMarkers,
  updating,
} from "./fixtures";
import { mountSubject } from "./harness";
import type { ConformanceSubject, Supports } from "./subject";

/** Three towns a few pixels apart at zoom 3, where any clusterer groups them. */
const NEARBY = townMarkers();

/** A subject mounted to cluster, the towns drawn at zoom 3 and the map settled. */
async function clusteredSubject(subject: ConformanceSubject) {
  const mounted = await mountSubject(subject, { cluster: true });
  mounted.adapter.setView({ kind: "center", center: TOWNS.bologna, zoom: 3 });
  await mounted.adapter.apply(adding(...NEARBY));
  await mounted.probe.settle();
  return mounted;
}

export function clusterChecks(subject: ConformanceSubject, supports: Supports): void {
  describe.runIf(supports.has("cluster"))("cluster", () => {
    it("still draws every location when clustering", async () => {
      const { probe } = await clusteredSubject(subject);
      expect([...probe.locationIds()].sort((a, b) => a.localeCompare(b))).toEqual(["a", "b", "c"]);
    });

    it("shows the selected location on its own", async () => {
      const { adapter, probe } = await clusteredSubject(subject);
      adapter.present(presented({ selectedId: "b" }));
      await probe.settle();
      expect(probe.location("b")?.visible).toBe(true);
    });

    it("lets a removed location go (#54)", async () => {
      const { adapter, probe } = await clusteredSubject(subject);
      await adapter.apply(removing("b"));
      await probe.settle();
      expect([...probe.locationIds()].sort((a, b) => a.localeCompare(b))).toEqual(["a", "c"]);
    });

    it("draws a replaced location where it now is (#54)", async () => {
      const { adapter, probe } = await clusteredSubject(subject);
      const moved = { lat: 40.7, lng: -74 };
      await adapter.apply(updating(markerDrawable("b", moved)));
      await probe.settle();
      expect(probe.location("b")?.geometry).toEqual({ type: "marker", ...moved });
    });
  });
}
