import { afterEach, describe, expect, it } from "vitest";
import { frames } from "../google/frames";
import { sizedContainer } from "../testing/container";
import { panelControl } from "./control-panel";
import { cornerElementsIn } from "./corner-measure";
import { type CornerWatch, watchCorners } from "./corner-watch";
import { pageMapIn, removePageMaps } from "./testing/subject";

let watch: CornerWatch | undefined;

afterEach(() => {
  watch?.stop();
  removePageMaps();
  document.body.replaceChildren();
});

/**
 * A page's map, its corners, and a watch on it; `panel` adds a maplace panel bottom-left holding a
 * list taller than the map, so the room it is given sizes it.
 */
function watchedPageMap() {
  const container = sizedContainer();
  const map = pageMapIn(container);
  const corners = Object.values(cornerElementsIn(map.getContainer()) ?? {});
  const properties = () =>
    corners.flatMap((corner) =>
      Array.from(corner.style).filter((name) => name.startsWith("--maplace-")),
    );
  const panel = () => {
    const node = Object.assign(document.createElement("div"), { className: "maplace-list" });
    node.style.overflow = "auto";
    node.append(Object.assign(document.createElement("div"), { style: "height: 2000px" }));
    map.addControl(panelControl(node), "bottom-left");
  };
  watch = watchCorners(map);
  return { container, corners, properties, panel, watch };
}

describe("watchCorners", () => {
  it("writes nothing on a map with no maplace panel", async () => {
    const { container, properties, watch } = watchedPageMap();
    watch.settle();
    container.style.height = "300px";
    await frames(3);
    expect(properties()).toEqual([]);
  });

  it("stops following the map once stopped", async () => {
    const { container, properties, panel, watch } = watchedPageMap();
    panel();
    watch.settle();
    expect(properties()).not.toEqual([]);
    watch.stop();
    container.style.height = "300px";
    await frames(3);
    expect(properties()).toEqual([]);
  });

  it("lays the corners out again after a resize, then goes quiet", async () => {
    const { container, corners, panel, watch } = watchedPageMap();
    panel();
    watch.settle();
    await frames(2);
    const writes: number[] = [];
    let frame = 0;
    const observer = new MutationObserver(() => writes.push(frame));
    for (const corner of corners) observer.observe(corner, { attributeFilter: ["style"] });
    container.style.height = "300px";
    for (; frame < 6; frame += 1) await frames(1);
    observer.disconnect();
    expect(writes.length).toBeGreaterThan(0);
    expect(writes.filter((at) => at >= 3)).toEqual([]);
  });
});
