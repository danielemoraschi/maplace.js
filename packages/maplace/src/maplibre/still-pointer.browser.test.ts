import { type Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { presented, TOWNS } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { PIN_SIZE } from "./pin-image";
import { RENDER_WAIT, renderedIds } from "./testing/rendered";
import { clusteredTowns, ON_BOLOGNA, OVER_TOWNS } from "./testing/towns";
import { pagePointOf } from "./testing/user-drags";

afterEach(unmountAll);

/** The towns clustering, seen on Bologna close up, where pin `a` is drawn alone. */
async function pinAlone() {
  const mounted = await clusteredTowns();
  const { adapter, probe, map } = mounted;
  adapter.setView(ON_BOLOGNA);
  await vi.waitFor(async () => {
    await probe.settle();
    expect(renderedIds(map, ["maplace-pins"])).toEqual(["a"]);
  }, RENDER_WAIT);
  return mounted;
}

/** Where pin `a`'s head is drawn in Bologna, as a mouse event's place on the page. */
function bolognaPinHead(map: MapLibreMap): { clientX: number; clientY: number } {
  const { x, y } = pagePointOf(map, TOWNS.bologna);
  const head = PIN_SIZE.height - PIN_SIZE.width / 2;
  return { clientX: x, clientY: y - head };
}

/** A user's press of the mouse, or its release, on pin `a`'s head in Bologna. */
function pressOnBologna(map: MapLibreMap, type: "mousedown" | "mouseup"): void {
  const at = bolognaPinHead(map);
  map.getCanvas().dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, ...at }));
}

describe("MapLibre's hover under a pointer that hasn't moved", () => {
  it("gives the cursor back when the pin under a still pointer folds into a cluster", async () => {
    const { adapter, probe, map } = await pinAlone();
    probe.pointerOver("a");
    expect(map.getCanvas().style.cursor).toBe("pointer");
    adapter.setView(OVER_TOWNS);
    await probe.settle();
    expect(map.getCanvas().style.cursor).toBe("");
  });

  it("gives the cursor back when the pin under a still pointer is hidden", async () => {
    const { adapter, probe, map } = await pinAlone();
    probe.pointerOver("a");
    adapter.present(presented({ hiddenIds: new Set(["a"]) }));
    await vi.waitFor(() => expect(map.getCanvas().style.cursor).toBe(""), RENDER_WAIT);
  });

  it("gives the cursor back when the pin under a pointer still since a click folds into a cluster", async () => {
    const { adapter, probe, map } = await pinAlone();
    probe.pointerOver("a");
    pressOnBologna(map, "mousedown");
    pressOnBologna(map, "mouseup");
    adapter.setView(OVER_TOWNS);
    await probe.settle();
    expect(map.getCanvas().style.cursor).toBe("");
  });

  it("points nowhere again from a release fired for a press the map missed", async () => {
    const { adapter, probe, map, host } = await pinAlone();
    probe.pointerOver("a");
    pressOnBologna(map, "mousedown");
    const missed = new MouseEvent("mouseup", bolognaPinHead(map));
    map.fire(new MapMouseEvent("mouseup", map, missed));
    // The pin folds and unfolds: a release taken for a place on the map would hover it again.
    adapter.setView(OVER_TOWNS);
    await probe.settle();
    adapter.setView(ON_BOLOGNA);
    await probe.settle();
    expect(host.reportsOf("reportHoverChange")).toEqual([["a"], [undefined]]);
  });

  it("lets the pin go when the map moves on the page from under a still pointer", async () => {
    const { probe, map, container } = await pinAlone();
    probe.pointerOver("a");
    container.style.transform = "translateY(200px)";
    map.triggerRepaint();
    await vi.waitFor(() => expect(map.getCanvas().style.cursor).toBe(""), RENDER_WAIT);
  });

  it("lets the pin go when something on the map comes between it and a still pointer", async () => {
    const { probe, map, host } = await pinAlone();
    probe.pointerOver("a");
    const cover = document.createElement("div");
    cover.style.cssText = "position: absolute; inset: 0; z-index: 10";
    map.getContainer().append(cover);
    map.triggerRepaint();
    await vi.waitFor(() => expect(map.getCanvas().style.cursor).toBe(""), RENDER_WAIT);
    expect(host.reportsOf("reportHoverChange")).toEqual([["a"], [undefined]]);
  });

  it("settles a map whose container left the page under a remembered pointer", async () => {
    const { probe, map, container } = await pinAlone();
    probe.pointerOver("a");
    const place = container.parentNode;
    container.remove();
    const idle = new Promise((resolve) => map.once("idle", resolve));
    map.triggerRepaint();
    await idle;
    place?.appendChild(container);
    const back = new Promise((resolve) => map.once("idle", resolve));
    map.triggerRepaint();
    await back;
    expect(map.getCanvas().style.cursor).toBe("pointer");
  });

  it("keeps the hover of a pin pressed on while the camera moves, as a pan carries it under the pointer", async () => {
    const { adapter, probe, map, host } = await pinAlone();
    probe.pointerOver("a");
    const hovers = host.reportsOf("reportHoverChange").length;
    pressOnBologna(map, "mousedown");
    const center = { lat: TOWNS.bologna.lat, lng: TOWNS.bologna.lng + 0.01 };
    adapter.setView({ ...ON_BOLOGNA, center });
    await probe.settle();
    expect(host.reportsOf("reportHoverChange")).toHaveLength(hovers);
    expect(map.getCanvas().style.cursor).toBe("pointer");
    pressOnBologna(map, "mouseup");
  });

  it("takes a release a page's code fires on the map, with no pointer event under it", async () => {
    const { map } = await pinAlone();
    expect(() => map.fire("mouseup")).not.toThrow();
  });
});
