import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import type { ControlPosition } from "../adapter";
import { darkPage } from "../google/testing/dark-page";
import { places } from "../google/testing/places";
import { createListView, type ListViewOptions } from "../list-view";
import { createMaplace } from "../maplace/create";
import { panelOf } from "../testing/panel-of";
import { queried } from "../testing/queried";
import { CREDITED_OPTIONS, onMapLibre } from "./testing/control-site";

afterEach(() => {
  document.body.replaceChildren();
});

/**
 * A store on a map maplace creates, its attribution showing, with what a test mounts on it in a
 * corner, top-left unless asked: `mount` places a node there, `list` a list view.
 */
async function mapWithControls(count?: number, corner: ControlPosition = "top-left") {
  const maplace = createMaplace({ locations: places(count) });
  const { adapter, map } = await onMapLibre(maplace, CREDITED_OPTIONS);
  const mount = (node: HTMLElement) => {
    adapter.mountControl(node, corner);
    return node;
  };
  const list = (options?: ListViewOptions) => {
    const view = createListView(maplace, options);
    onTestFinished(() => view.destroy());
    return mount(view.element);
  };
  const mapBottom = () => map.getContainer().getBoundingClientRect().bottom;
  return { maplace, map, mount, list, mapBottom };
}

/** A fieldset of radios, as a page's own control (the custom-list example's). */
function radios(): HTMLElement {
  const fieldset = document.createElement("fieldset");
  fieldset.innerHTML = '<label><input type="radio" name="pick"> One</label>';
  return fieldset;
}

/** A page's own control whose suggestions hang below it, positioned out of its box. */
function withDropdown(): HTMLElement {
  const control = document.createElement("div");
  control.style.position = "relative";
  control.innerHTML =
    '<input aria-label="Search"><ul style="position: absolute; top: 100%; margin: 0; height: 60px"><li>Rome</li></ul>';
  return control;
}

describe("what goes on a MapLibre map, laid out in its panel", () => {
  it("shows the list's entries at 13px and its heading in bold, whatever the map inherits", async () => {
    const { list, map } = await mapWithControls();
    const view = list({ heading: "Choose a location:" });
    const option = queried(view, '[role="option"]');
    const heading = queried(view, ".maplace-list-heading");
    expect(getComputedStyle(map.getContainer()).fontSize).toBe("12px");
    expect(getComputedStyle(option).fontSize).toBe("13px");
    expect(Number(getComputedStyle(heading).fontWeight)).toBeGreaterThanOrEqual(600);
  });

  it("shows a select at 13px, light on a light map though the page is dark", async () => {
    darkPage();
    const { list } = await mapWithControls();
    const select = list({ as: "select" });
    const style = getComputedStyle(select);
    expect([style.fontSize, style.colorScheme]).toEqual(["13px", "light"]);
    expect(select.getBoundingClientRect().height).toBeGreaterThanOrEqual(29);
  });

  it("puts a page's own control in a panel too, its radios given room", async () => {
    const { mount } = await mapWithControls();
    const fieldset = mount(radios());
    expect(panelOf(fieldset).classList.contains("maplibregl-ctrl")).toBe(true);
    const radio = queried(fieldset, "input");
    expect(radio.getBoundingClientRect().width).toBeGreaterThanOrEqual(14);
  });

  it("keeps a long headed list within the map's height, its entries scrolling under its heading", async () => {
    const { list, mapBottom } = await mapWithControls(30);
    const view = list({ heading: "Choose a location:" });
    const panel = panelOf(view).getBoundingClientRect();
    const listbox = queried(view, '[role="listbox"]');
    expect(panel.bottom).toBeLessThanOrEqual(mapBottom() - 10);
    expect(listbox.scrollHeight).toBeGreaterThan(listbox.clientHeight);
    expect(
      queried(view, ".maplace-list-heading").getBoundingClientRect().top,
    ).toBeGreaterThanOrEqual(panel.top);
  });

  it("keeps a long list without a heading within the map's height, its entries scrolling", async () => {
    const { list, mapBottom } = await mapWithControls(30);
    const listbox = list();
    expect(panelOf(listbox).getBoundingClientRect().bottom).toBeLessThanOrEqual(mapBottom() - 10);
    expect(listbox.scrollHeight).toBeGreaterThan(listbox.clientHeight);
  });

  it("keeps a long list in the bottom-right corner within the map, above MapLibre's attribution", async () => {
    const { list, map } = await mapWithControls(30, "bottom-right");
    const view = list({ heading: "Choose a location:" });
    const attribution = queried(map.getContainer(), ".maplibregl-ctrl-attrib");
    expect(attribution.getBoundingClientRect().height).toBeGreaterThan(0);
    const top = map.getContainer().getBoundingClientRect().top;
    expect(panelOf(view).getBoundingClientRect().top).toBeGreaterThanOrEqual(top + 10);
  });

  it("lets a page's own control draw outside its panel, as a dropdown does", async () => {
    const { mount } = await mapWithControls();
    const dropdown = mount(withDropdown());
    const below = queried(dropdown, "ul").getBoundingClientRect();
    const outside = below.bottom - 5;
    expect(outside).toBeGreaterThan(panelOf(dropdown).getBoundingClientRect().bottom);
    const hit = document.elementFromPoint(below.left + 5, outside);
    expect(dropdown.contains(hit)).toBe(true);
  });

  it("hides the panel with the list", async () => {
    const { list, maplace } = await mapWithControls();
    const panel = panelOf(list());
    maplace.setLocations(places().map((place) => ({ ...place, listed: false })));
    await expect.poll(() => getComputedStyle(panel).display).toBe("none");
    maplace.setLocations(places());
    await expect.poll(() => getComputedStyle(panel).display).not.toBe("none");
  });
});
