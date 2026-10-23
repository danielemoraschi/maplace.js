// @vitest-environment happy-dom
import type { IControl } from "maplibre-gl";
import { afterEach, describe, expect, it } from "vitest";
import { frameDocument } from "../testing/iframes";
import { cssTextOf } from "../testing/selectors";
import { createControls } from "./controls";
import { openedControls } from "./testing/control-stub-map";

const button = () => document.createElement("button");

describe("the MapLibre adapter's controls", () => {
  afterEach(() => document.body.replaceChildren());

  it("places a control mounted before the map opened once it opens, and takes it off on close", () => {
    const controls = createControls();
    const node = button();
    controls.mountControl(node, "top-left");
    const { container, close } = openedControls(controls);
    expect(container.contains(node)).toBe(true);
    close();
    expect(container.contains(node)).toBe(false);
  });

  it("leaves a node mounted after destroy where it is, and keeps nothing to place", () => {
    const controls = createControls();
    controls.release();
    const node = button();
    const sidebar = document.createElement("aside");
    sidebar.append(node);
    const remove = controls.mountControl(node, "top-left");
    const { corner } = openedControls(controls);
    expect([node.parentElement, corner("top-left")]).toEqual([sidebar, []]);
    expect(remove).not.toThrow();
  });

  it("moves a node mounted again to its new corner, leaving nothing in the first", () => {
    const controls = createControls();
    const { corner } = openedControls(controls);
    const node = button();
    controls.mountControl(node, "top-left");
    controls.mountControl(node, "bottom-left");
    expect(corner("top-left")).toEqual([]);
    expect(corner("bottom-left")[0]?.firstElementChild).toBe(node);
  });

  it("leaves a node mounted again where the first remover can't reach it", () => {
    const controls = createControls();
    const { corner } = openedControls(controls);
    const node = button();
    const removeFirst = controls.mountControl(node, "top-left");
    controls.mountControl(node, "bottom-left");
    removeFirst();
    expect(corner("bottom-left")[0]?.firstElementChild).toBe(node);
  });

  it("takes a control off when removed, safely twice, and out of the page", () => {
    const controls = createControls();
    const { corner } = openedControls(controls);
    const node = button();
    const remove = controls.mountControl(node, "top-right");
    remove();
    remove();
    expect(corner("top-right")).toEqual([]);
    expect(node.parentNode).toBeNull();
  });

  it("places only the last corner of a node mounted twice before the map opens", () => {
    const controls = createControls();
    const node = button();
    controls.mountControl(node, "top-left");
    controls.mountControl(node, "bottom-right");
    const { corner } = openedControls(controls);
    expect(corner("top-left")).toEqual([]);
    expect(corner("bottom-right")[0]?.firstElementChild).toBe(node);
  });

  it("takes every control off on destroy, and a remover after it takes the node out of the page, as Google's does", () => {
    const controls = createControls();
    const { corner, destroy } = openedControls(controls);
    const node = button();
    const remove = controls.mountControl(node, "top-left");
    controls.mountControl(button(), "bottom-right");
    destroy();
    expect([corner("top-left"), corner("bottom-right")]).toEqual([[], []]);
    expect(remove).not.toThrow();
    expect(node.parentNode).toBeNull();
  });

  it("leaves the page's own control in the same corner through remove and destroy", () => {
    const controls = createControls();
    const { map, corner, destroy } = openedControls(controls);
    const own = document.createElement("div");
    const pageControl: IControl = { onAdd: () => own, onRemove: () => own.remove() };
    map.addControl(pageControl, "top-left");
    const remove = controls.mountControl(button(), "top-left");
    remove();
    controls.mountControl(button(), "top-left");
    destroy();
    expect(corner("top-left")).toEqual([own]);
  });

  it("holds each control in a panel of maplace's own that MapLibre lays out", () => {
    const controls = createControls();
    const { corner } = openedControls(controls);
    const node = button();
    controls.mountControl(node, "top-left");
    const [panel] = corner("top-left");
    expect(panel?.matches(".maplibregl-ctrl.maplace-control")).toBe(true);
    expect(panel?.firstElementChild).toBe(node);
    expect(panel?.hasAttribute("data-color-scheme")).toBe(false);
  });

  it("leaves the page's node as it was given", () => {
    const controls = createControls();
    openedControls(controls);
    const node = button();
    node.className = "pages";
    node.textContent = "Mine";
    const given = node.outerHTML;
    controls.mountControl(node, "top-left");
    expect(node.outerHTML).toBe(given);
  });

  it("gives the control's document the panel's styles once the control is on the map", () => {
    const controls = createControls();
    const page = frameDocument();
    const sheets = () => page.adoptedStyleSheets.map(cssTextOf);
    controls.mountControl(page.createElement("button"), "top-left");
    expect(sheets()).toEqual([]);
    openedControls(controls);
    expect(sheets()).toContainEqual(expect.stringContaining(".maplace-control"));
  });

  it("takes its controls off when the map closes, and places none later", () => {
    const controls = createControls();
    const { corner, close } = openedControls(controls);
    controls.mountControl(button(), "top-left");
    close();
    controls.mountControl(button(), "top-left");
    expect(corner("top-left")).toEqual([]);
  });
});
