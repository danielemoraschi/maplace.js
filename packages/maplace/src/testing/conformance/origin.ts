import { describe, expect, it, vi } from "vitest";
import { ORIGIN_DOT_CLASS } from "../../adapter-kit/origin-dot";
import type { LatLng } from "../../geometry";
import type { MapProbe } from "../map-probe";
import { AWAY, adding, markerDrawable, presented, TOWNS, townMarkers } from "./fixtures";
import { mountSubject, startMount } from "./harness";
import type { ConformanceSubject, Supports } from "./subject";

const SOMEWHERE: LatLng = { lat: 5, lng: 6 };

/** The dot's element, polled: a provider may add it to the page later. */
async function dotIn(container: HTMLElement, probe: MapProbe): Promise<HTMLElement> {
  await probe.settle();
  return vi.waitFor(() => {
    const dot = container.querySelector<HTMLElement>(`.${ORIGIN_DOT_CLASS}`);
    if (dot === null) throw new Error("no dot yet");
    return dot;
  });
}

export function originChecks(subject: ConformanceSubject, supports: Supports): void {
  describe("origin", () => {
    it("draws a dot where the origin is, and moves it", async () => {
      const { adapter, container, probe } = await mountSubject(subject);
      expect(probe.originDot()).toBeUndefined();
      adapter.present(presented({ origin: SOMEWHERE }));
      await dotIn(container, probe);
      expect(probe.originDot()).toEqual(SOMEWHERE);
      adapter.present(presented({ origin: AWAY }));
      expect(probe.originDot()).toEqual(AWAY);
      expect(container.querySelectorAll(`.${ORIGIN_DOT_CLASS}`)).toHaveLength(1);
    });

    it("takes it off when the origin clears", async () => {
      const { adapter, container, probe } = await mountSubject(subject);
      adapter.present(presented({ origin: SOMEWHERE }));
      await dotIn(container, probe);
      adapter.present(presented({}));
      expect(probe.originDot()).toBeUndefined();
      expect(container.querySelector(`.${ORIGIN_DOT_CLASS}`)).toBeNull();
    });

    it("draws an origin presented before the map opened", async () => {
      const { adapter, container, mounting, probe } = startMount(subject);
      adapter.present(presented({ origin: SOMEWHERE }));
      await mounting;
      await dotIn(container, probe);
      expect(probe.originDot()).toEqual(SOMEWHERE);
    });

    it("the dot is no location: no id, and not in the stack order", async () => {
      const { adapter, container, probe } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a")));
      adapter.present(presented({ origin: SOMEWHERE }));
      await dotIn(container, probe);
      expect(probe.locationIds()).toEqual(["a"]);
      expect(probe.stackOrder()).toEqual(["a"]);
    });

    it.runIf(supports.has("cluster"))("a cluster at that point doesn't count it", async () => {
      const { adapter, container, probe } = await mountSubject(subject, { cluster: true });
      adapter.setView({ kind: "center", center: TOWNS.bologna, zoom: 3 });
      await adapter.apply(adding(...townMarkers()));
      adapter.present(presented({ origin: TOWNS.bologna }));
      await dotIn(container, probe);
      expect([...probe.locationIds()].sort((a, b) => a.localeCompare(b))).toEqual(["a", "b", "c"]);
    });

    it("takes no pointer input: a click there on the map reports the map's click, selecting nothing", async () => {
      const { adapter, container, host, probe } = await mountSubject(subject);
      adapter.present(presented({ origin: AWAY }));
      const dot = await dotIn(container, probe);
      expect(getComputedStyle(dot).pointerEvents).toBe("none");
      probe.clickMap(AWAY);
      await probe.settle();
      expect(host.reportsOf("reportMapClick")).toEqual([[AWAY]]);
      expect(host.reportsOf("reportSelectionChange")).toEqual([]);
    });

    it("takes it off on destroy", async () => {
      const { adapter, container, destroy, probe } = await mountSubject(subject);
      adapter.present(presented({ origin: SOMEWHERE }));
      await dotIn(container, probe);
      destroy();
      expect(probe.originDot()).toBeUndefined();
      expect(container.querySelector(`.${ORIGIN_DOT_CLASS}`)).toBeNull();
    });
  });
}
