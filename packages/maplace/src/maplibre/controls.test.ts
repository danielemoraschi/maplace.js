// @vitest-environment happy-dom
import type { IControl } from "maplibre-gl";
import { describe, expect, it } from "vitest";
import { createTeardowns } from "../adapter-kit/teardowns";
import { createControls } from "./controls";
import type { MountedMapLibre } from "./mounted-map";

/** A map as controls use one: the controls it holds, in its container. */
function stubMap() {
  const container = document.createElement("div");
  const held = new Set<IControl>();
  const map = {
    getContainer: () => container,
    addControl(control: IControl) {
      held.add(control);
      container.append(control.onAdd(map as never));
    },
    removeControl(control: IControl) {
      held.delete(control);
      control.onRemove(map as never);
    },
  };
  return { map, container, held };
}

/** The map opened, as the adapter's parts see it, and how to close it. */
function opened() {
  const { map, container, held } = stubMap();
  const teardowns = createTeardowns();
  const mounted = { map, onDestroy: teardowns.add } as unknown as MountedMapLibre;
  return { mounted, container, held, close: teardowns.runAll };
}

describe("the MapLibre adapter's controls", () => {
  it("places a control mounted before the map opened once it opens, and takes it off on close", () => {
    const controls = createControls();
    const node = document.createElement("button");
    controls.mountControl(node, "top-left");
    const { mounted, container, close } = opened();
    controls.part.open(mounted);
    expect(container.contains(node)).toBe(true);
    close();
    expect(container.contains(node)).toBe(false);
  });

  it("leaves a node mounted after destroy where it is, and keeps nothing to place", () => {
    const controls = createControls();
    controls.release();
    const node = document.createElement("button");
    const sidebar = document.createElement("aside");
    sidebar.append(node);
    const remove = controls.mountControl(node, "top-left");
    const { mounted, held } = opened();
    controls.part.open(mounted);
    expect([node.parentElement, held.size]).toEqual([sidebar, 0]);
    expect(remove).not.toThrow();
  });
});
