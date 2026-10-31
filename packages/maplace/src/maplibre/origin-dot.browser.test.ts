import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { ORIGIN_DOT_CLASS } from "../adapter-kit/origin-dot";
import { AWAY, adding, markerDrawable, presented } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { mountedMapLibre } from "./testing/mounted";

afterEach(unmountAll);

const AT = { lat: 0, lng: 0 };

/** A map centred on the dot, and the middle of the dot on the page. */
async function dotOnMap(drawn: Parameters<typeof adding> = []) {
  const mounted = await mountedMapLibre();
  mounted.adapter.setView({ kind: "center", center: AT, zoom: 3 });
  await mounted.adapter.apply(adding(...drawn));
  await mounted.probe.settle();
  mounted.adapter.present(presented({ origin: AT }));
  const dot = mounted.container.querySelector(`.${ORIGIN_DOT_CLASS}`) as HTMLElement;
  const { x, y, width, height } = dot.getBoundingClientRect();
  return { ...mounted, dot, middle: { x: x + width / 2, y: y + height / 2 } };
}

describe("the origin's dot on MapLibre", () => {
  it("a trusted click on the dot reaches the map as the map's click", async () => {
    const { middle, host } = await dotOnMap();
    await commands.pressMouse([middle]);
    // A map holds a click until it can't be half of a double-click.
    await expect.poll(() => host.reportsOf("reportMapClick")).toHaveLength(1);
    expect(host.reportsOf("reportSelectionChange")).toEqual([]);
  });

  it("isn't in the tab order and has no role", async () => {
    const { dot } = await dotOnMap();
    expect(dot.hasAttribute("tabindex")).toBe(false);
    expect(dot.hasAttribute("role")).toBe(false);
    expect(dot.hasAttribute("aria-label")).toBe(false);
  });

  it("the pointer over it reports no hover", async () => {
    const { middle, host, probe } = await dotOnMap();
    await commands.moveMouse(middle, 1);
    await probe.settle();
    expect(host.reportsOf("reportHoverChange")).toEqual([]);
  });

  it("a page's own click off it still selects nothing, and destroy leaves nothing", async () => {
    const { adapter, container, destroy, probe } = await dotOnMap();
    probe.clickMap(AWAY);
    await probe.settle();
    adapter.present(presented({ origin: AT }));
    destroy();
    expect(container.querySelector(`.${ORIGIN_DOT_CLASS}`)).toBeNull();
  });

  it("a DOM marker and a selected pin stack above it; a default pin in the layer shows under it", async () => {
    const icon = () => document.createElement("span");
    const { adapter, container, dot, middle, probe } = await dotOnMap([
      markerDrawable("dom", AT, { renderIcon: icon }),
      markerDrawable("pin", AT),
    ]);
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    const onTop = document.elementFromPoint(middle.x, middle.y);
    expect(onTop).toBe(canvas);
    expect(canvas.compareDocumentPosition(dot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const zOf = (element: Element) => Number(getComputedStyle(element).zIndex) || 0;
    adapter.present(presented({ origin: AT, selectedId: "dom" }));
    await probe.settle();
    const domMarker = container.querySelector(".maplibregl-marker:not(.maplace-origin-dot)");
    expect(domMarker).not.toBeNull();
    expect(zOf(domMarker as Element)).toBeGreaterThan(zOf(dot));
  });
});
