import { describe, expect, it } from "vitest";
import {
  adding,
  markerDrawable,
  ORIGIN,
  polygonDrawable,
  presented,
  removing,
  updating,
  withContent,
} from "./fixtures";
import { type MountSettings, mountSubject } from "./harness";
import type { ConformanceSubject } from "./subject";

const withPopups = [
  withContent(markerDrawable("a"), "Alpha"),
  withContent(markerDrawable("b"), "Beta"),
];

export function popupChecks(subject: ConformanceSubject): void {
  async function mountedWithPopups(settings?: MountSettings) {
    const mounted = await mountSubject(subject, settings);
    await mounted.adapter.apply(adding(...withPopups));
    return mounted;
  }

  describe("popups", () => {
    it("opens on the selection once its content is in the DOM, closing the last one", async () => {
      const { adapter, probe, host } = await mountedWithPopups();
      adapter.present(presented({ selectedId: "a" }));
      await probe.settle();
      adapter.present(presented({ selectedId: "b" }));
      await probe.settle();
      const opened = host.reportsOf("reportPopupOpen");
      expect(opened.map(([id]) => id)).toEqual(["a", "b"]);
      expect(opened[0]?.[1].textContent).toContain("Alpha");
      expect(host.reportsOf("reportPopupClose")).toEqual([["a"]]);
      expect(probe.shownPopup()?.id).toBe("b");
    });

    it("follows the hover instead with openOn 'hover'", async () => {
      const { adapter, probe, host } = await mountedWithPopups({ openOn: "hover" });
      adapter.present(presented({ selectedId: "b", hoveredId: "a" }));
      await probe.settle();
      expect(host.reportsOf("reportPopupOpen").map(([id]) => id)).toEqual(["a"]);
    });

    it("reports a close by the user, and stays closed", async () => {
      const { adapter, probe, host } = await mountedWithPopups();
      adapter.present(presented({ selectedId: "a" }));
      await probe.settle();
      probe.closePopup();
      await probe.settle();
      expect(host.reportsOf("reportPopupClose")).toEqual([["a"]]);
      expect(probe.shownPopup()).toBeUndefined();
    });

    it("closes the popup of a removed location", async () => {
      const { adapter, probe, host } = await mountedWithPopups();
      adapter.present(presented({ selectedId: "a" }));
      await probe.settle();
      await adapter.apply(removing("a"));
      await probe.settle();
      expect(host.reportsOf("reportPopupClose")).toEqual([["a"]]);
    });

    it("refreshes an open popup whose location gets new content, reporting it open again and never closed", async () => {
      const { adapter, probe, host } = await mountedWithPopups();
      adapter.present(presented({ selectedId: "a" }));
      await probe.settle();
      await adapter.apply(updating(withContent(markerDrawable("a"), "Alpha again")));
      await probe.settle();
      const contents = host.reportsOf("reportPopupOpen").map(([, element]) => element.textContent);
      expect(contents).toEqual([
        expect.stringContaining("Alpha"),
        expect.stringContaining("again"),
      ]);
      expect(host.reportsOf("reportPopupClose")).toEqual([]);
      expect(probe.shownPopup()?.element.textContent).toContain("Alpha again");
    });

    it("closes the popup of a location hidden", async () => {
      const { adapter, probe, host } = await mountedWithPopups();
      adapter.present(presented({ selectedId: "a" }));
      await probe.settle();
      adapter.present(presented({ selectedId: "a", hiddenIds: new Set(["a"]) }));
      await probe.settle();
      expect(host.reportsOf("reportPopupClose")).toEqual([["a"]]);
      expect(probe.shownPopup()).toBeUndefined();
    });

    it("opens the popup of a location the presentation named before it was drawn", async () => {
      const { adapter, probe, host } = await mountSubject(subject);
      adapter.present(presented({ selectedId: "a" }));
      await adapter.apply(adding(...withPopups));
      await probe.settle();
      expect(host.reportsOf("reportPopupOpen").map(([id]) => id)).toEqual(["a"]);
    });

    it("opens a shape's popup", async () => {
      const { adapter, probe, host } = await mountSubject(subject);
      await adapter.apply(adding(withContent(polygonDrawable("p"), "Pi")));
      adapter.present(presented({ selectedId: "p" }));
      await probe.settle();
      expect(host.reportsOf("reportPopupOpen").map(([id]) => id)).toEqual(["p"]);
      expect(probe.shownPopup()?.element.textContent).toContain("Pi");
    });

    it("closes its popup on destroy, and reports nothing after", async () => {
      const { adapter, probe, host, destroy } = await mountedWithPopups();
      adapter.present(presented({ selectedId: "a" }));
      await probe.settle();
      destroy();
      await probe.settle();
      expect(probe.shownPopup()).toBeUndefined();
      expect(host.reportsOf("reportPopupClose")).toEqual([]);
    });

    it("opens nothing for a location without content, or whose content built nothing", async () => {
      const { adapter, probe, host } = await mountSubject(subject);
      await adapter.apply(
        adding(
          markerDrawable("a"),
          markerDrawable("b", ORIGIN, { renderContent: () => undefined }),
        ),
      );
      adapter.present(presented({ selectedId: "a" }));
      await probe.settle();
      adapter.present(presented({ selectedId: "b" }));
      await probe.settle();
      expect(host.reportsOf("reportPopupOpen")).toEqual([]);
    });
  });
}
