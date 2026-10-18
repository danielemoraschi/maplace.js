import { describe, expect, it } from "vitest";
import {
  adding,
  iconRecorder,
  markerDrawable,
  ORIGIN,
  polygonDrawable,
  polylineDrawable,
  presented,
  updating,
} from "./fixtures";
import { mountSubject } from "./harness";
import { shapeStateChecks } from "./shape-states";
import type { ConformanceSubject } from "./subject";

export function presentationChecks(subject: ConformanceSubject): void {
  describe("presentation", () => {
    it("hides the hidden ids, and shows them again", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a"), markerDrawable("b")));
      adapter.present(presented({ hiddenIds: new Set(["a"]) }));
      expect(probe.location("a")?.visible).toBe(false);
      expect(probe.location("b")?.visible).toBe(true);
      adapter.present(presented({}));
      expect(probe.location("a")?.visible).toBe(true);
    });

    it("hides a shape, and shows it again", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(polygonDrawable("p")));
      adapter.present(presented({ hiddenIds: new Set(["p"]) }));
      expect(probe.location("p")?.visible).toBe(false);
      adapter.present(presented({}));
      expect(probe.location("p")?.visible).toBe(true);
    });

    it("draws the icon the page built, for the state already presented", async () => {
      const { adapter, probe } = await mountSubject(subject);
      const icon = iconRecorder();
      adapter.present(presented({ selectedId: "a" }));
      await adapter.apply(adding(markerDrawable("a", ORIGIN, { renderIcon: icon.renderIcon })));
      expect(icon.states).toEqual([{ selected: true, hovered: false }]);
      expect(probe.location("a")?.icon).toBe(icon.node);
    });

    it("rebuilds an icon only for locations whose state changed", async () => {
      const { adapter } = await mountSubject(subject);
      const [a, b] = [iconRecorder(), iconRecorder()];
      await adapter.apply(
        adding(
          markerDrawable("a", ORIGIN, { renderIcon: a.renderIcon }),
          markerDrawable("b", ORIGIN, { renderIcon: b.renderIcon }),
        ),
      );
      adapter.present(presented({ hoveredId: "a" }));
      adapter.present(presented({ hoveredId: "a", hiddenIds: new Set() }));
      expect(a.states).toEqual([
        { selected: false, hovered: false },
        { selected: false, hovered: true },
      ]);
      expect(b.states).toHaveLength(1);
    });

    it("keeps the icon through an update that leaves it, and rebuilds it for a new one", async () => {
      const { adapter } = await mountSubject(subject);
      const first = iconRecorder();
      await adapter.apply(adding(markerDrawable("a", ORIGIN, { renderIcon: first.renderIcon })));
      await adapter.apply(
        updating(markerDrawable("a", ORIGIN, { renderIcon: first.renderIcon, title: "A" })),
      );
      expect(first.states).toHaveLength(1);
      const second = iconRecorder();
      await adapter.apply(updating(markerDrawable("a", ORIGIN, { renderIcon: second.renderIcon })));
      expect(second.states).toHaveLength(1);
    });

    it("draws its default marker when the page's icon built nothing", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a", ORIGIN, { renderIcon: () => undefined })));
      expect(probe.location("a")).toMatchObject({ visible: true, icon: undefined });
    });

    it("draws its default marker again when a later icon builds nothing", async () => {
      const { adapter, probe } = await mountSubject(subject);
      const icon = iconRecorder();
      await adapter.apply(adding(markerDrawable("a", ORIGIN, { renderIcon: icon.renderIcon })));
      await adapter.apply(updating(markerDrawable("a", ORIGIN, { renderIcon: () => undefined })));
      expect(probe.location("a")?.icon).toBeUndefined();
    });

    it("stacks the hovered location on top, then the selected one, the rest in the order added", async () => {
      const { adapter, probe } = await mountSubject(subject);
      await adapter.apply(adding(markerDrawable("a"), markerDrawable("b"), markerDrawable("c")));
      await adapter.apply(adding(markerDrawable("d")));
      expect(probe.stackOrder()).toEqual(["d", "c", "b", "a"]);
      adapter.present(presented({ selectedId: "a", hoveredId: "b" }));
      expect(probe.stackOrder()).toEqual(["b", "a", "d", "c"]);
      adapter.present(presented({ selectedId: "a", hiddenIds: new Set(["d"]) }));
      expect(probe.stackOrder()).toEqual(["a", "c", "b"]);
    });

    it("stacks shapes by the same rule, below every marker", async () => {
      const { adapter, probe } = await mountSubject(subject);
      const [p, q] = [polygonDrawable("p"), polygonDrawable("q")];
      await adapter.apply(adding(markerDrawable("a"), p, q, polylineDrawable("r")));
      expect(probe.stackOrder()).toEqual(["a", "r", "q", "p"]);
      adapter.present(presented({ selectedId: "p", hoveredId: "q" }));
      expect(probe.stackOrder()).toEqual(["a", "q", "p", "r"]);
    });

    shapeStateChecks(subject);
  });
}
