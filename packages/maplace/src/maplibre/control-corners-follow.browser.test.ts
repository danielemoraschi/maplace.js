import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import type { ControlPosition } from "../adapter";
import { places } from "../google/testing/places";
import { createListView } from "../list-view";
import { createMaplace } from "../maplace/create";
import { cornerElementsIn } from "./corner-measure";
import { onPageMapLibre, panelOf } from "./testing/control-site";
import { mapOfWidthIn } from "./testing/map-of-width";
import { wait } from "./testing/map-settle";

afterEach(() => {
  document.body.replaceChildren();
});

/**
 * A store of `count` places on a map `width` px wide, a phone's unless asked: `list` and `button`
 * place a panel's node.
 */
async function phoneMap(count = 30, width = 375) {
  const maplace = createMaplace({ locations: places(count) });
  const site = await mapOfWidthIn(maplace, width);
  const list = (corner: ControlPosition) => {
    const view = createListView(maplace);
    onTestFinished(() => view.destroy());
    site.adapter.mountControl(view.element, corner);
    return () => panelOf(view.element).getBoundingClientRect();
  };
  const button = (corner: ControlPosition) => {
    const node = Object.assign(document.createElement("button"), { textContent: "Mine" });
    site.adapter.mountControl(node, corner);
    return () => panelOf(node).getBoundingClientRect();
  };
  const mapBox = () => site.map.getContainer().getBoundingClientRect();
  return { ...site, maplace, list, button, mapBox };
}

/** Long enough for the corners to be laid out again after a change. */
const SETTLE_MS = 200;

/** The window's error events while `act` runs and the corners settle after it. */
async function errorsDuring(act: () => Promise<void>): Promise<string[]> {
  const errors: string[] = [];
  const record = (event: ErrorEvent) => errors.push(event.message);
  window.addEventListener("error", record);
  try {
    await act();
  } finally {
    window.removeEventListener("error", record);
  }
  return errors;
}

describe("the corners of a MapLibre map following it", () => {
  it("brings the bottom-left panel back down once MapLibre folds its attribution", async () => {
    const { map, button, mapBox } = await phoneMap();
    const bottomLeft = button("bottom-left");
    expect(bottomLeft().bottom).toBeLessThan(mapBox().bottom - 30);
    map.fire("drag");
    await expect.poll(() => Math.round(bottomLeft().bottom)).toBe(Math.round(mapBox().bottom - 10));
  });

  it("lays the corners out again when the map is resized", async () => {
    const { list, button, container } = await phoneMap();
    const topLeft = list("top-left");
    const bottomLeft = button("bottom-left");
    container.style.height = "300px";
    await expect.poll(() => topLeft().bottom <= bottomLeft().top - 10 + 0.5).toBe(true);
    expect(container.getBoundingClientRect().height).toBe(300);
  });

  it("stops a top-left list above a bottom-left list that grows", async () => {
    const { maplace, list } = await phoneMap(2);
    const topLeft = list("top-left");
    const bottomLeft = list("bottom-left");
    maplace.setLocations(places(30));
    await expect.poll(() => bottomLeft().height).toBeGreaterThan(150);
    await expect.poll(() => topLeft().bottom <= bottomLeft().top - 10 + 0.5).toBe(true);
  });

  it("lays the corners out with no ResizeObserver loop error", async () => {
    const { map, list, button, container } = await phoneMap();
    list("top-left");
    button("bottom-left");
    const errors = await errorsDuring(async () => {
      container.style.height = "400px";
      await wait(SETTLE_MS);
      map.fire("drag");
      await wait(SETTLE_MS);
    });
    expect(errors).toEqual([]);
  });

  it("takes its layout off MapLibre's corners when maplace is detached from the page's map", async () => {
    const maplace = createMaplace({ locations: places(30) });
    const { adapter, map } = await onPageMapLibre(maplace);
    const view = createListView(maplace);
    onTestFinished(() => view.destroy());
    adapter.mountControl(view.element, "top-left");
    const corners = Object.values(cornerElementsIn(map.getContainer()) ?? {});
    const written = () => corners.flatMap((corner) => Array.from(corner.style));
    expect(written()).not.toEqual([]);
    maplace.destroy();
    expect(written().filter((name) => name.startsWith("--maplace-"))).toEqual([]);
  });

  it("stops watching the corners once the last panel is taken off", async () => {
    const { adapter, map } = await phoneMap();
    const remove = adapter.mountControl(document.createElement("button"), "bottom-left");
    const disconnected = vi.spyOn(ResizeObserver.prototype, "disconnect");
    onTestFinished(() => disconnected.mockRestore());
    remove();
    expect(disconnected).toHaveBeenCalled();
    const corners = Object.values(cornerElementsIn(map.getContainer()) ?? {});
    const written = corners.flatMap((corner) => Array.from(corner.style));
    expect(written.filter((name) => name.startsWith("--maplace-"))).toEqual([]);
  });

  it.each([375, 1280])(
    "gives a short list kept to its height its share once its entries grow, %i px wide",
    async (width) => {
      const { adapter, list } = await phoneMap(30, width);
      const entries = Object.assign(document.createElement("div"), {
        className: "maplace-listbox",
      });
      // As with overlay scrollbars (macOS, phones): its overflowing resizes nothing.
      entries.style.cssText = "scrollbar-width: none; width: 150px";
      const addEntries = (count: number) => {
        for (let entry = 0; entry < count; entry += 1) {
          entries.append(Object.assign(document.createElement("div"), { style: "height: 30px" }));
        }
      };
      addEntries(2);
      adapter.mountControl(entries, "top-left");
      list("bottom-left");
      await wait(SETTLE_MS);
      const shortHeight = entries.offsetHeight;
      addEntries(20);
      await expect.poll(() => entries.offsetHeight).toBeGreaterThan(shortHeight * 2);
    },
  );
});
