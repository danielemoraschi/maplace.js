import { describe, expect, it } from "vitest";
import {
  adding,
  circleDrawable,
  iconRecorder,
  LARGE_DIFF,
  manyMarkers,
  markerDrawable,
  ORIGIN,
  polygonDrawable,
  polylineDrawable,
  presented,
  removing,
  reshaped,
  updating,
} from "./fixtures";
import { mountSubject } from "./harness";
import type { ConformanceSubject, Supports } from "./subject";

export function drawingChecks(subject: ConformanceSubject, supports: Supports): void {
  const shapes = [polylineDrawable("l"), polygonDrawable("p")];
  if (supports.has("circle")) shapes.push(circleDrawable("c"));

  describe("drawing", () => {
    it("resolves apply once its locations are drawn", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a", { lat: 1, lng: 2 }), markerDrawable("b")));
      expect([...probe.locationIds()].sort((a, b) => a.localeCompare(b))).toEqual(["a", "b"]);
      expect(probe.location("a")?.geometry).toEqual({ type: "marker", lat: 1, lng: 2 });
    });

    it("applies removals first: an id removed and added again takes its new type", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a")));
      await adapter.apply({ added: [polygonDrawable("a")], updated: [], removed: ["a"] });
      expect(probe.location("a")?.geometry.type).toBe("polygon");
    });

    it("draws each shape where its geometry says, holes included", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(...shapes));
      for (const shape of shapes)
        expect(probe.location(shape.id)?.geometry).toEqual(shape.geometry);
    });

    it("reshapes a shape on update", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(polygonDrawable("p")));
      const triangle = [ORIGIN, { lat: 1, lng: 0 }, { lat: 0, lng: 1 }];
      await adapter.apply(
        updating(reshaped(polygonDrawable("p"), { type: "polygon", path: triangle })),
      );
      expect(probe.location("p")?.geometry).toEqual({ type: "polygon", path: triangle });
    });

    it("moves and retitles a location on update", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a")));
      await adapter.apply(updating(markerDrawable("a", { lat: 1, lng: 2 }, { title: "A" })));
      expect(probe.location("a")).toMatchObject({
        geometry: { type: "marker", lat: 1, lng: 2 },
        title: "A",
      });
    });

    it("applies diffs in the order given, without waiting for each", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await Promise.all([adapter.apply(adding(markerDrawable("a"))), adapter.apply(removing("a"))]);
      expect(probe.locationIds()).toEqual([]);
    });

    it("takes a presentation naming a location still being drawn", async () => {
      const { adapter } = await mountSubject(subject);
      const icon = iconRecorder();
      const drawing = adapter.apply(
        adding(markerDrawable("a", ORIGIN, { renderIcon: icon.renderIcon })),
      );
      adapter.present(presented({ selectedId: "a" }));
      await drawing;
      expect(icon.states.slice(-1)).toEqual([{ selected: true, hovered: false }]);
    });

    it("yields to the event loop while drawing a large diff", async () => {
      const { adapter } = await mountSubject(subject);
      let yielded = false;
      const drawing = adapter.apply(adding(...manyMarkers(LARGE_DIFF)));
      setTimeout(() => {
        yielded = true;
      }, 0);
      await drawing;
      expect(yielded).toBe(true);
    });

    it("stops a large diff on destroy: the apply still resolves, and nothing is drawn after", async () => {
      const { adapter, probe, destroy } = await mountSubject(subject);
      const drawing = adapter.apply(adding(...manyMarkers(LARGE_DIFF)));
      destroy();
      await drawing;
      expect(probe.locationIds()).toEqual([]);
    });
  });
}
