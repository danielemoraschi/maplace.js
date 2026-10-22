import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { DOUBLE_CLICK_WAIT_MS } from "../adapter-kit/click-gesture";
import { centreOf, tabUntil } from "../google/testing/page-input";
import { places } from "../google/testing/places";
import { createListView, type ListViewOptions } from "../list-view";
import { createMaplace } from "../maplace/create";
import { optionsIn } from "../testing/lists";
import { onPageMapLibre } from "./testing/control-site";
import { wait } from "./testing/map-settle";

afterEach(() => {
  document.body.replaceChildren();
});

/** How long the store's first fit may take to settle under a busy test run. */
const SETTLE = { timeout: 10_000 };

/** Long enough for a wheel's zoom or a drag's pan to have shown on the camera. */
const QUIET_MS = 500;

/** Where the map is, as a user sees it: centre and zoom. */
const cameraOf = (map: MapLibreMap) => ({ center: map.getCenter().toArray(), zoom: map.getZoom() });

/**
 * The page's map with a store of 30 places fitted on it and still, and its list view, small
 * enough to scroll, mounted in the top-left corner.
 */
async function listOnMap(options: ListViewOptions = {}) {
  const maplace = createMaplace({ locations: places(30) });
  const { adapter, map } = await onPageMapLibre(maplace);
  await expect.poll(() => maplace.getSnapshot().viewport?.zoom ?? 0, SETTLE).toBeGreaterThan(2);
  await expect.poll(() => map.isMoving(), SETTLE).toBe(false);
  const list = createListView(maplace, options);
  list.element.style.cssText = "width: 200px; max-height: 200px; overflow: auto";
  adapter.mountControl(list.element, "top-left");
  return { map, maplace, list };
}

/** Tabs until the focus is in `list`, past the map's own stops. */
const tabInto = (list: HTMLElement) => tabUntil(() => list.contains(document.activeElement));

describe("input in a panel on a MapLibre map", () => {
  it("is reached with Tab, and its keys never move or zoom the map", async () => {
    const { map, list } = await listOnMap();
    const before = cameraOf(map);
    await tabInto(list.element);
    await userEvent.keyboard(
      "{ArrowDown}{ArrowDown}{End}{Home}{PageDown}+-{ArrowLeft}{ArrowRight}",
    );
    await wait(QUIET_MS);
    expect(cameraOf(map)).toEqual(before);
  });

  it("scrolls the list under the wheel, not the map's zoom, and a drag in it leaves the map", async () => {
    const { map, list } = await listOnMap();
    const before = cameraOf(map);
    const inside = centreOf(list.element);
    await commands.wheelMouse(inside, 300);
    await commands.pressMouse([inside, { x: inside.x + 60, y: inside.y + 40 }]);
    await wait(QUIET_MS);
    expect(list.element.scrollTop).toBeGreaterThan(0);
    expect(cameraOf(map)).toEqual(before);
  });

  it("selects the place clicked in the list, which the map never takes as its own click", async () => {
    const { maplace, list } = await listOnMap();
    const [option] = optionsIn(list.element);
    const box = (option as HTMLElement).getBoundingClientRect();
    await commands.pressMouse([{ x: box.left + 10, y: box.top + box.height / 2 }]);
    await expect.poll(() => maplace.getSnapshot().selectedId).toBe("p0");
    await wait(DOUBLE_CLICK_WAIT_MS * 2);
    expect(maplace.getSnapshot().selectedId).toBe("p0");
  });

  it("changes the selection from a select's keys, never the map's zoom", async () => {
    const { map, maplace, list } = await listOnMap({ as: "select" });
    (list.element as HTMLSelectElement).focus();
    const zoom = map.getZoom();
    // Type-ahead changes a closed select on every platform; the arrows open it on some.
    await userEvent.keyboard("P+-");
    await expect.poll(() => maplace.getSnapshot().selectedId).toBeDefined();
    await wait(QUIET_MS);
    expect(map.getZoom()).toBe(zoom);
  });
});
