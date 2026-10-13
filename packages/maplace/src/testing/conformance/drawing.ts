import { describe, expect, it } from "vitest";
import type { Geometry } from "../../geometry";
import {
  adding,
  circleDrawable,
  iconRecorder,
  LARGE_DIFF,
  manyMarkers,
  markerDrawable,
  ORIGIN,
  presented,
  removing,
  updating,
} from "./fixtures";
import { mountSubject } from "./harness";
import type { ConformanceSubject, Supports } from "./subject";

export function drawingChecks(subject: ConformanceSubject, supports: Supports): void {
  const editable = supports.has("edit");

  describe("drawing", () => {
    it("resolves apply once its locations are drawn", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a", { lat: 1, lng: 2 }), markerDrawable("b")));
      expect([...probe.locationIds()].sort((a, b) => a.localeCompare(b))).toEqual(["a", "b"]);
      expect(probe.location("a")?.geometry).toEqual({ type: "marker", lat: 1, lng: 2 });
    });

    it.runIf(supports.has("circle"))(
      "applies removals first: an id removed and added again takes its new type",
      async () => {
        const { adapter, probe } = await mountSubject(subject);
        await adapter.apply(adding(markerDrawable("a")));
        await adapter.apply({ added: [circleDrawable("a")], updated: [], removed: ["a"] });
        expect(probe.location("a")?.geometry.type).toBe("circle");
      },
    );

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

    it.runIf(editable)(
      "doesn't move a location again when the store writes back where a drag left it",
      async () => {
        const { adapter, probe, host } = await mountSubject(subject);
        await adapter.apply(adding(markerDrawable("a", ORIGIN, { editable: true })));
        const dragged: Geometry = { type: "marker", lat: 5, lng: 5 };
        probe.drag("a", dragged);
        await adapter.apply(updating(markerDrawable("a", { lat: 5, lng: 5 }, { editable: true })));
        await probe.settle();
        expect(host.reportsOf("reportChange")).toEqual([["a", dragged]]);
        expect(probe.location("a")?.geometry).toEqual(dragged);
      },
    );

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
