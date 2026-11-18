import { describe, expect, it } from "vitest";
import { HOVERED_LINE_LOOK, SELECTED_LINE_LOOK } from "../../adapter-kit/shape-looks";
import { adding, polylineDrawable, presented, updating } from "./fixtures";
import { mountSubject } from "./harness";
import type { ConformanceSubject } from "./subject";

/**
 * How an adapter draws a line beyond its colour and width: dashed or dotted, kept through its
 * states, split at a progress, still found by a click, and active: the hovered look, the weakest
 * state. A solid line may read back with no `strokeDash`: solid is every provider's default.
 */
export function lineLookChecks(subject: ConformanceSubject): void {
  describe("line looks", () => {
    it("dashes or dots a line, and keeps it so when selected or hovered", async () => {
      const { adapter, probe } = await mountSubject(subject);
      const dashed = polylineDrawable("d", { style: { strokeDash: "dashed" } });
      const dotted = polylineDrawable("o", { style: { strokeDash: "dotted" } });
      await adapter.apply(adding(dashed, dotted));
      expect(probe.location("d")?.style).toMatchObject({ strokeDash: "dashed" });
      expect(probe.location("o")?.style).toMatchObject({ strokeDash: "dotted" });
      adapter.present(presented({ selectedId: "d", hoveredId: "o" }));
      expect(probe.location("d")?.style).toMatchObject({
        ...SELECTED_LINE_LOOK,
        strokeDash: "dashed",
      });
      expect(probe.location("o")?.style).toMatchObject({
        ...HOVERED_LINE_LOOK,
        strokeDash: "dotted",
      });
    });

    it("draws a dashed line solid while selected when its selected style says so", async () => {
      const { adapter, probe } = await mountSubject(subject);
      const selectedStyle = { strokeDash: "solid" } as const;
      const line = polylineDrawable("d", { style: { strokeDash: "dashed" }, selectedStyle });
      await adapter.apply(adding(line));
      adapter.present(presented({ selectedId: "d" }));
      expect(probe.location("d")?.style?.strokeDash ?? "solid").toBe("solid");
      expect(probe.location("d")?.style).toMatchObject(SELECTED_LINE_LOOK);
    });

    it("draws a line solid again once its style drops the dash", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(polylineDrawable("d", { style: { strokeDash: "dotted" } })));
      await adapter.apply(updating(polylineDrawable("d", { style: { strokeWidth: 2 } })));
      expect(probe.location("d")?.style).toEqual({ strokeWidth: 2 });
    });

    it("still shows a line split at its progress and takes a click on it", async () => {
      const { adapter, probe, host } = await mountSubject(subject);
      await adapter.apply(adding(polylineDrawable("l", { progress: 0.3 })));
      await probe.settle();
      expect(probe.location("l")?.visible).toBe(true);
      probe.click("l");
      await expect.poll(() => host.reportsOf("reportSelectionChange")).toEqual([["l"]]);
    });

    it("draws a line split at its progress whole again once the progress is cleared", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(polylineDrawable("l", { progress: 0.3 })));
      await adapter.apply(updating(polylineDrawable("l", { style: { strokeOpacity: 0.5 } })));
      expect(probe.location("l")?.style).toEqual({ strokeOpacity: 0.5 });
    });

    it("draws an active shape in the hovered look, its active style over it", async () => {
      const { adapter, probe } = await mountSubject(subject);
      const activeStyle = { stroke: "#ff0000" };
      await adapter.apply(adding(polylineDrawable("a", { active: true, activeStyle })));
      expect(probe.location("a")?.style).toEqual({ ...HOVERED_LINE_LOOK, ...activeStyle });
    });

    it("draws an active shape selected or hovered in that state's look, over its active one", async () => {
      const { adapter, probe } = await mountSubject(subject);
      const activeStyle = { stroke: "#ff0000" };
      await adapter.apply(adding(polylineDrawable("a", { active: true, activeStyle })));
      adapter.present(presented({ selectedId: "a" }));
      expect(probe.location("a")?.style).toEqual(SELECTED_LINE_LOOK);
      adapter.present(presented({ hoveredId: "a" }));
      expect(probe.location("a")?.style).toEqual(HOVERED_LINE_LOOK);
    });

    it("restyles a shape when only its active flag changes", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(polylineDrawable("a")));
      await adapter.apply(updating(polylineDrawable("a", { active: true })));
      expect(probe.location("a")?.style).toEqual(HOVERED_LINE_LOOK);
      await adapter.apply(updating(polylineDrawable("a", { active: false })));
      expect(probe.location("a")?.style).toEqual({});
    });
  });
}
