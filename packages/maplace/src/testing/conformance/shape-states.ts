import { describe, expect, it } from "vitest";
import { HOVERED_LOOK, SELECTED_LINE_LOOK, SELECTED_LOOK } from "../../adapter-kit/shape-looks";
import {
  adding,
  circleDrawable,
  polygonDrawable,
  polylineDrawable,
  presented,
  updating,
} from "./fixtures";
import { mountSubject } from "./harness";
import type { ConformanceSubject } from "./subject";

/**
 * How an adapter draws a shape in a state: maplace's look for it, the shape's style over that,
 * and its own state style over both. Colours are lowercase hex, as a provider gives them back.
 */
export function shapeStateChecks(subject: ConformanceSubject): void {
  describe("shapes in a state", () => {
    it("draws a selected or hovered shape in its look, and as before once neither", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(circleDrawable("c"), polygonDrawable("p")));
      adapter.present(presented({ selectedId: "c", hoveredId: "p" }));
      expect(probe.location("c")?.style).toEqual(SELECTED_LOOK);
      expect(probe.location("p")?.style).toEqual(HOVERED_LOOK);
      adapter.present(presented({}));
      expect(probe.location("c")?.style).toEqual({});
      expect(probe.location("p")?.style).toEqual({});
    });

    it("keeps a shape's own style through its states; a polyline gets no fill", async () => {
      const { adapter, probe } = await mountSubject(subject);
      const style = { stroke: "#ff0000", strokeWidth: 2 };
      adapter.present(presented({ selectedId: "p" }));
      await adapter.apply(adding(polygonDrawable("p", { style }), polylineDrawable("r")));
      expect(probe.location("p")?.style).toEqual({ ...SELECTED_LOOK, ...style });
      adapter.present(presented({ selectedId: "r" }));
      expect(probe.location("p")?.style).toEqual(style);
      expect(probe.location("r")?.style).toEqual(SELECTED_LINE_LOOK);
      await adapter.apply(updating(polylineDrawable("r", { style: { strokeWidth: 1 } })));
      expect(probe.location("r")?.style).toEqual({ ...SELECTED_LINE_LOOK, strokeWidth: 1 });
    });

    it("draws a selected or hovered shape in its own state style, over its style and the look", async () => {
      const { adapter, probe } = await mountSubject(subject);
      const selectedStyle = { stroke: "#ff0000", fill: "#ff0000" };
      const circle = circleDrawable("c", { style: { stroke: "#0000ff" }, selectedStyle });
      const polygon = polygonDrawable("p", { hoveredStyle: { strokeWidth: 3 } });
      await adapter.apply(adding(circle, polygon));
      adapter.present(presented({ selectedId: "c", hoveredId: "p" }));
      expect(probe.location("c")?.style).toEqual({ ...SELECTED_LOOK, ...selectedStyle });
      expect(probe.location("p")?.style).toEqual({ ...HOVERED_LOOK, strokeWidth: 3 });
      adapter.present(presented({ selectedId: "c", hoveredId: "c" }));
      expect(probe.location("c")?.style).toEqual({ ...SELECTED_LOOK, ...selectedStyle });
      adapter.present(presented({}));
      expect(probe.location("c")?.style).toEqual({ stroke: "#0000ff" });
      expect(probe.location("p")?.style).toEqual({});
    });

    it("restyles a shape in its state when only its state style changes", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(circleDrawable("c", { selectedStyle: { fill: "#ff0000" } })));
      adapter.present(presented({ selectedId: "c" }));
      await adapter.apply(updating(circleDrawable("c", { selectedStyle: { fill: "#00ff00" } })));
      expect(probe.location("c")?.style).toEqual({ ...SELECTED_LOOK, fill: "#00ff00" });
    });
  });
}
