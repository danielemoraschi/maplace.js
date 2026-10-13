import { describe, expect, it } from "vitest";
import type { Geometry } from "../../geometry";
import { adding, circleDrawable, markerDrawable, ORIGIN, presented } from "./fixtures";
import { mountSubject } from "./harness";
import type { ConformanceSubject, Supports } from "./subject";

export function reportChecks(subject: ConformanceSubject, supports: Supports): void {
  describe("reports", () => {
    it("reports a click on a location, and on the map as no location", async () => {
      const { adapter, probe, host } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a")));
      probe.click("a");
      probe.clickMap();
      expect(host.reportsOf("reportSelect")).toEqual([["a"], [undefined]]);
    });

    it("reports the pointer onto a location and off it", async () => {
      const { adapter, probe, host } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a")));
      probe.pointerOver("a");
      probe.pointerOut();
      expect(host.reportsOf("reportHover")).toEqual([["a"], [undefined]]);
    });

    it("can't be clicked on a hidden location", async () => {
      const { adapter, probe, host } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a")));
      adapter.present(presented({ hiddenIds: new Set(["a"]) }));
      probe.click("a");
      expect(host.reportsOf("reportSelect")).toEqual([]);
    });

    it.runIf(supports.has("edit"))("reports a dragged editable marker's new place", async () => {
      const { adapter, probe, host } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a", ORIGIN, { editable: true })));
      const moved: Geometry = { type: "marker", lat: 3, lng: 4 };
      probe.drag("a", moved);
      expect(host.reportsOf("reportChange")).toEqual([["a", moved]]);
    });

    it.runIf(supports.has("edit") && supports.has("circle"))(
      "reports a reshaped editable circle as a circle",
      async () => {
        const { adapter, probe, host } = await mountSubject(subject);
        await adapter.apply(adding(circleDrawable("c", { editable: true })));
        const reshaped: Geometry = { type: "circle", center: ORIGIN, radius: 2000 };
        probe.drag("c", reshaped);
        expect(host.reportsOf("reportChange")).toEqual([["c", reshaped]]);
      },
    );

    it("doesn't let a location that isn't editable be dragged", async () => {
      const { adapter, probe, host } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a")));
      probe.drag("a", { type: "marker", lat: 3, lng: 4 });
      expect(host.reportsOf("reportChange")).toEqual([]);
      expect(probe.location("a")?.geometry).toEqual({ type: "marker", ...ORIGIN });
    });
  });
}
