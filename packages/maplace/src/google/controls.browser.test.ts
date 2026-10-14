/// <reference types="google.maps" />
import { afterEach, expect, it, onTestFinished } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { createListView, type ListViewOptions } from "../list-view";
import { createMaplace } from "../maplace/create";
import { unmountAll } from "../testing/conformance/harness";
import { sizedContainer } from "../testing/container";
import { optionsIn } from "../testing/lists";
import { controlsPlaced, laidOut } from "./testing/controls-placed";
import { QUIET_MS, wait } from "./testing/map-waits";
import { centerOf, fitted, onGoogle } from "./testing/store-on-google";
import { pageMapIn } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

/** Enough places that the list scrolls; all within one fit. */
const PLACES = Array.from({ length: 30 }, (_, index) => ({
  id: `p${index}`,
  lat: 40 + (index % 6),
  lng: 5 + Math.floor(index / 6) * 2,
  title: `Place ${index}`,
}));

/** The page's map with a store fitted on it, and its list view mounted in the top-left corner. */
async function listOnMap(as: ListViewOptions["as"] = "list") {
  const container = sizedContainer();
  const map = pageMapIn(container);
  const maplace = createMaplace({ locations: PLACES });
  const { adapter } = await onGoogle(maplace, { map, container });
  await fitted(maplace);
  const list = createListView(maplace, { as });
  onTestFinished(() => list.destroy());
  list.element.style.cssText = "width: 200px; max-height: 200px; overflow: auto";
  const remove = adapter.mountControl(list.element, "top-left");
  await controlsPlaced(map);
  await laidOut(list.element);
  return { map, maplace, list, remove };
}

/** Where the map is, as a user sees it: centre and zoom. */
const cameraOf = (map: google.maps.Map) => ({ center: centerOf(map), zoom: map.getZoom() });

describeWithMaps("lists on a Google map", () => {
  afterEach(unmountAll);

  it("is reached with Tab, and its keys never move or zoom the map", async () => {
    const { map, list } = await listOnMap();
    const before = cameraOf(map);
    for (let presses = 0; presses < 20 && !list.element.contains(document.activeElement); presses++)
      await userEvent.keyboard("{Tab}");
    expect(list.element.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard(
      "{ArrowDown}{ArrowDown}{End}{Home}{PageDown}+-{ArrowLeft}{ArrowRight}",
    );
    await wait(QUIET_MS);
    expect(cameraOf(map)).toEqual(before);
  });

  it("scrolls the list under the wheel, not the map's zoom, and a drag in it leaves the map", async () => {
    const { map, list } = await listOnMap();
    const before = cameraOf(map);
    const box = list.element.getBoundingClientRect();
    const inside = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
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
    await wait(QUIET_MS);
    expect(maplace.getSnapshot().selectedId).toBe("p0");
  });

  it("changes the selection from a select's keys, never the map's zoom", async () => {
    const { map, maplace, list } = await listOnMap("select");
    (list.element as HTMLSelectElement).focus();
    const zoom = map.getZoom();
    // Type-ahead changes a closed select on every platform; the arrows open it on some.
    await userEvent.keyboard("P+-");
    await expect.poll(() => maplace.getSnapshot().selectedId).toBeDefined();
    expect(map.getZoom()).toBe(zoom);
  });

  it("leaves no trace in the map once removed, and the page's own control where it was", async () => {
    const { map, list, remove } = await listOnMap();
    const pages = document.createElement("button");
    const corner = map.controls[
      google.maps.ControlPosition.TOP_LEFT
    ] as google.maps.MVCArray<HTMLElement>;
    corner.push(pages);
    await controlsPlaced(map);
    remove();
    expect(list.element.isConnected).toBe(false);
    expect(corner.getArray()).toEqual([pages]);
  });
});
