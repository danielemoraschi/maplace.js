import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { createListView, type ListViewOptions } from "../list-view";
import { createMaplace } from "../maplace/create";
import { queried } from "../testing/queried";
import { unstyledPage } from "../testing/unstyled-page";
import type { ColorScheme } from "./options";
import { cornersLikeGoogle } from "./testing/corners-like-google";
import { darkPage } from "./testing/dark-page";
import { panelOf } from "./testing/panels";
import { places } from "./testing/places";
import { onGoogle } from "./testing/store-on-google";
import { type StubMap, stubMapsJsRecording } from "./testing/stub-libraries";

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

interface MapSetting {
  readonly colorScheme?: ColorScheme | undefined;
  readonly count?: number | undefined;
}

/**
 * A store on a Google map made of stubs, in a sized container, with what a test mounts on it laid
 * out as Google lays out its corners: `mount` places a node top-left, `list` a list view there.
 */
async function mapOnStubs({ colorScheme, count }: MapSetting = {}) {
  const { maps } = stubMapsJsRecording();
  const maplace = createMaplace({ locations: places(count) });
  const { adapter } = await onGoogle(maplace, { colorScheme });
  const map = maps[0] as StubMap;
  const mount = (node: HTMLElement) => {
    adapter.mountControl(node, "top-left");
    cornersLikeGoogle(map);
    return node;
  };
  const list = (options?: ListViewOptions) => {
    const view = createListView(maplace, options);
    onTestFinished(() => view.destroy());
    return mount(view.element);
  };
  return { maplace, map, mount, list };
}

const panelStyleOf = (node: Element) => getComputedStyle(panelOf(node));

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

describe("the panel of a control on a Google map, in the map's colour scheme", () => {
  it("puts a list on a light map in a white panel with dark text, on a dark page", async () => {
    darkPage();
    const { list } = await mapOnStubs();
    const panel = panelStyleOf(list());
    expect([panel.backgroundColor, panel.color, panel.colorScheme]).toEqual([
      "rgb(255, 255, 255)",
      "rgb(31, 31, 31)",
      "light",
    ]);
    expect(panel.boxShadow).not.toBe("none");
    expect([panel.borderRadius, panel.marginTop]).toEqual(["2px", "10px"]);
  });

  it("draws no panel inside the opt-out", async () => {
    onTestFinished(unstyledPage());
    const { list } = await mapOnStubs();
    const panel = panelStyleOf(list());
    expect([panel.boxShadow, panel.marginTop]).toEqual(["none", "0px"]);
  });

  it("still hides a panel whose list is hidden, inside the opt-out", async () => {
    onTestFinished(unstyledPage());
    const { mount } = await mapOnStubs();
    const hidden = Object.assign(document.createElement("div"), { hidden: true });
    expect(panelStyleOf(mount(hidden)).display).toBe("none");
  });

  it("draws the panel dark on a dark map, on a light page", async () => {
    const { list } = await mapOnStubs({ colorScheme: "dark" });
    const panel = panelStyleOf(list());
    expect([panel.colorScheme, panel.backgroundColor]).toEqual(["dark", "rgb(68, 68, 68)"]);
  });

  it("follows the system on a map that does", async () => {
    const { list } = await mapOnStubs({ colorScheme: "follow-system" });
    expect(panelStyleOf(list()).colorScheme).toBe("light dark");
  });

  it("makes only a map holding a control the height its panels stay within", async () => {
    const { list, map } = await mapOnStubs();
    list();
    const another = document.createElement("div");
    another.className = "maplace-google-map";
    document.body.append(another);
    expect(getComputedStyle(map.getDiv()).containerType).toBe("size");
    expect(getComputedStyle(another).containerType).toBe("normal");
  });

  it("lets the page's own rule win", async () => {
    const rule = document.createElement("style");
    rule.textContent = ".maplace-control { background: rgb(1, 2, 3) }";
    document.head.append(rule);
    onTestFinished(() => rule.remove());
    const { list } = await mapOnStubs();
    expect(panelStyleOf(list()).backgroundColor).toBe("rgb(1, 2, 3)");
  });
});

describe("what goes on a Google map, laid out in its panel", () => {
  it("shows the list's entries at 13px and its heading in bold, whatever the map inherits", async () => {
    const { list } = await mapOnStubs();
    const view = list({ heading: "Choose a location:" });
    const option = queried(view, '[role="option"]');
    const heading = queried(view, ".maplace-list-heading");
    expect(getComputedStyle(option).fontSize).toBe("13px");
    expect(Number(getComputedStyle(heading).fontWeight)).toBeGreaterThanOrEqual(600);
  });

  it("shows a select at 13px, light on a light map though the page is dark", async () => {
    darkPage();
    const { list } = await mapOnStubs();
    const select = list({ as: "select" });
    const style = getComputedStyle(select);
    expect([style.fontSize, style.colorScheme]).toEqual(["13px", "light"]);
    expect(select.getBoundingClientRect().height).toBeGreaterThanOrEqual(29);
  });

  it("puts a page's own control in a panel too, its radios given room", async () => {
    const { mount } = await mapOnStubs();
    const fieldset = mount(radios());
    expect(panelOf(fieldset).dataset.colorScheme).toBe("light");
    const radio = queried(fieldset, "input");
    expect(radio.getBoundingClientRect().width).toBeGreaterThanOrEqual(14);
  });

  it("keeps a long list within the map's height, its entries scrolling under its heading", async () => {
    const { list, map } = await mapOnStubs({ count: 30 });
    const view = list({ heading: "Choose a location:" });
    const panel = panelOf(view).getBoundingClientRect();
    const listbox = queried(view, '[role="listbox"]');
    expect(panel.bottom).toBeLessThanOrEqual(map.getDiv().getBoundingClientRect().bottom - 10);
    expect(listbox.scrollHeight).toBeGreaterThan(listbox.clientHeight);
    expect(
      queried(view, ".maplace-list-heading").getBoundingClientRect().top,
    ).toBeGreaterThanOrEqual(panel.top);
  });

  it("lets a page's own control draw outside its panel, as a dropdown does", async () => {
    const { mount } = await mapOnStubs();
    const dropdown = mount(withDropdown());
    const below = queried(dropdown, "ul").getBoundingClientRect();
    const outside = below.bottom - 5;
    expect(outside).toBeGreaterThan(panelOf(dropdown).getBoundingClientRect().bottom);
    const hit = document.elementFromPoint(below.left + 5, outside);
    expect(dropdown.contains(hit)).toBe(true);
  });

  it("keeps a long list without a heading within the map's height, its entries scrolling", async () => {
    const { list, map } = await mapOnStubs({ count: 30 });
    const listbox = list();
    expect(panelOf(listbox).getBoundingClientRect().bottom).toBeLessThanOrEqual(
      map.getDiv().getBoundingClientRect().bottom - 10,
    );
    expect(listbox.scrollHeight).toBeGreaterThan(listbox.clientHeight);
  });

  it("hides the panel with the list", async () => {
    const { list, maplace } = await mapOnStubs();
    const panel = panelOf(list());
    maplace.setLocations(places().map((place) => ({ ...place, listed: false })));
    await expect.poll(() => getComputedStyle(panel).display).toBe("none");
    maplace.setLocations(places());
    await expect.poll(() => getComputedStyle(panel).display).not.toBe("none");
  });
});
