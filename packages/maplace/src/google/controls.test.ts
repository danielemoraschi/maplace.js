// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { ControlPosition } from "../adapter";
import { type Controls, createControls } from "./controls";
import { STUB_CONTROL_POSITIONS, type StubMap } from "./testing/stub-libraries";
import { stubMounted } from "./testing/stub-site";

/** Controls on a stub map, before it opens; `corner` lists the page nodes Google holds there. */
function controlsOnStubs() {
  const { mounted, close } = stubMounted();
  const map = mounted.map as unknown as StubMap;
  const controls = createControls();
  const corner = (position: keyof typeof STUB_CONTROL_POSITIONS) =>
    map.controls[STUB_CONTROL_POSITIONS[position]]
      ?.getArray()
      .map((held) => held.firstElementChild ?? held);
  const destroy = () => {
    close();
    controls.release();
  };
  return { map, controls, corner, open: () => controls.part.open(mounted), close, destroy };
}

const button = () => document.createElement("button");

function mount(controls: Controls, position: ControlPosition) {
  const node = button();
  return { node, remove: controls.mountControl(node, position) };
}

describe("the Google adapter's controls", () => {
  it("puts a control in its corner once the map opens, holding it in an element of its own", () => {
    const { controls, corner, open, map } = controlsOnStubs();
    const { node } = mount(controls, "bottom-right");
    expect(corner("BOTTOM_RIGHT")).toEqual([]);
    open();
    expect(corner("BOTTOM_RIGHT")).toEqual([node]);
    expect(map.controls[STUB_CONTROL_POSITIONS.BOTTOM_RIGHT]?.getArray()[0]).not.toBe(node);
  });

  it("takes a control off when removed, safely twice, and out of the page", () => {
    const { controls, corner, open } = controlsOnStubs();
    open();
    const { node, remove } = mount(controls, "top-left");
    remove();
    remove();
    expect(corner("TOP_LEFT")).toEqual([]);
    expect(node.isConnected).toBe(false);
    expect(node.parentNode).toBeNull();
  });

  it("takes every control off on destroy, and a remover after it does nothing", () => {
    const { controls, corner, open, destroy } = controlsOnStubs();
    open();
    const { remove } = mount(controls, "top-left");
    mount(controls, "top-right");
    destroy();
    expect([corner("TOP_LEFT"), corner("TOP_RIGHT")]).toEqual([[], []]);
    expect(remove).not.toThrow();
  });

  it("leaves the page's node where it is when mounted after destroy, as nothing will show it", () => {
    const { controls, open, destroy, corner } = controlsOnStubs();
    open();
    destroy();
    const node = button();
    const sidebar = document.createElement("aside");
    sidebar.append(node);
    const remove = controls.mountControl(node, "top-left");
    remove();
    expect([node.parentElement, corner("TOP_LEFT")]).toEqual([sidebar, []]);
  });

  it("leaves the page's node where it is after a destroy that came before the map opened", () => {
    const { controls } = controlsOnStubs();
    controls.release();
    const node = button();
    const sidebar = document.createElement("aside");
    sidebar.append(node);
    controls.mountControl(node, "top-left");
    expect(node.parentElement).toBe(sidebar);
  });

  it("moves a node mounted again to its new corner, where the first remover leaves it", () => {
    const { controls, corner, open } = controlsOnStubs();
    open();
    const node = button();
    const removeFirst = controls.mountControl(node, "top-left");
    controls.mountControl(node, "bottom-left");
    removeFirst();
    expect([corner("TOP_LEFT"), corner("BOTTOM_LEFT")]).toEqual([[], [node]]);
  });

  it("leaves the page's own control in the same corner through remove and destroy", () => {
    const { controls, corner, open, destroy, map } = controlsOnStubs();
    const pages = button();
    map.controls[STUB_CONTROL_POSITIONS.TOP_LEFT]?.push(pages);
    open();
    mount(controls, "top-left").remove();
    mount(controls, "top-left");
    destroy();
    expect(corner("TOP_LEFT")).toEqual([pages]);
  });

  it("takes its controls off when the map closes, as when Google refuses the key", () => {
    const { controls, corner, open, close } = controlsOnStubs();
    open();
    mount(controls, "top-left");
    close();
    mount(controls, "top-left");
    expect(corner("TOP_LEFT")).toEqual([]);
  });
});
