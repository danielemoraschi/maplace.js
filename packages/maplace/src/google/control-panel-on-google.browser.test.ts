/// <reference types="google.maps" />
import { afterEach, expect, it, onTestFinished } from "vitest";
import { userEvent } from "vitest/browser";
import type { Adapter, ControlPosition } from "../adapter";
import { createListView, type ListView, type ListViewOptions } from "../list-view";
import { createMaplace } from "../maplace/create";
import { SKIP_MAP_CLASS } from "../maplace/map-aids";
import { sizedContainer } from "../testing/container";
import { panelOf } from "../testing/panel-of";
import { queried } from "../testing/queried";
import type { ColorScheme } from "./options";
import { settledOnMap } from "./testing/controls-placed";
import { darkPage } from "./testing/dark-page";
import { tabUntil } from "./testing/page-input";
import { listMountedOnGoogle } from "./testing/panels";
import { places } from "./testing/places";
import { describeWithMaps } from "./testing/with-maps";

/** Google's own control on the map, to compare a panel with (Maps JS 3.66's fullscreen button). */
function googlesOwnControl(container: HTMLElement): HTMLElement {
  const control = container.querySelector<HTMLElement>("button.gm-fullscreen-control");
  if (control === null)
    throw new Error("no Google control to compare with (the fullscreen button)");
  return control;
}

/**
 * Google's own controls on its map: its buttons, Pegman, and its logo and terms. Not its fullscreen
 * button, which Google leaves out of a page in a frame, as the test runner's is.
 */
const GOOGLES_CONTROLS =
  ".gmnoprint button, .gm-svpc, .gm-style-cc, a[href*='maps.google.com/maps']";

function overlaps(a: DOMRect, b: DOMRect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/** Which of Google's own controls `panel` covers: none, once each has its room. */
function crowded(container: HTMLElement, panel: HTMLElement): string[] {
  const panelBox = panel.getBoundingClientRect();
  const controls = [...container.querySelectorAll<HTMLElement>(GOOGLES_CONTROLS)].filter(
    (control) => !panel.contains(control),
  );
  if (controls.length === 0) throw new Error("none of Google's own controls on the map");
  return controls
    .filter((control) => overlaps(control.getBoundingClientRect(), panelBox))
    .map((control) => control.ariaLabel ?? control.className);
}

/** How far below Google's Map/Satellite toggle `panel` starts: never above it. */
function belowTheToggle(container: HTMLElement, panel: HTMLElement): number {
  const toggle = queried(container, ".gm-style-mtc").getBoundingClientRect();
  return panel.getBoundingClientRect().top - toggle.bottom;
}

/** `list` mounted top-right, once Google laid it out: its panel. */
async function mountedTopRight(adapter: Pick<Adapter, "mountControl">, list: ListView) {
  adapter.mountControl(list.element, "top-right");
  await settledOnMap(list.element);
  return panelOf(list.element);
}

interface ListSetting extends ListViewOptions {
  readonly colorScheme?: ColorScheme | undefined;
  readonly count?: number | undefined;
  readonly position?: ControlPosition | undefined;
}

/** A list view in a corner (top-left unless given) of a map maplace creates, laid out by Google. */
async function listOnGoogle({ colorScheme, count, position, ...options }: ListSetting = {}) {
  const maplace = createMaplace({ locations: places(count) });
  const list = createListView(maplace, options);
  const { adapter, container, panel } = await listMountedOnGoogle({
    maplace,
    list,
    colorScheme,
    position,
  });
  return { maplace, adapter, container, view: list.element, panel };
}

describeWithMaps("controls on a Google map", () => {
  afterEach(() => document.body.replaceChildren());

  it("reaches the link past the map first, on top of a list, and it goes to the list", async () => {
    const { container, view } = await listOnGoogle();
    const link = queried(container, `.${SKIP_MAP_CLASS}`) as HTMLAnchorElement;
    const before = document.createElement("button");
    container.before(before);
    before.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(link);
    const { left, top, width, height } = link.getBoundingClientRect();
    expect(document.elementFromPoint(left + width / 2, top + height / 2)).toBe(link);
    await userEvent.keyboard("{Enter}");
    expect(view.contains(document.activeElement)).toBe(true);
  });

  it("types in a search box without zooming the map", async () => {
    const maplace = createMaplace({ locations: places(5) });
    const list = createListView(maplace, { search: true, searchLabel: "Find" });
    await listMountedOnGoogle({ maplace, list });
    const zoom = maplace.getSnapshot().viewport?.zoom;
    const box = queried(list.element, "input") as HTMLInputElement;
    box.focus();
    await userEvent.keyboard("+-=");
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(box.value).toBe("+-=");
    expect(maplace.getSnapshot().viewport?.zoom).toBe(zoom);
  });

  it("puts a list on a light map in a panel like Google's own, at 13px, on a dark page", async () => {
    darkPage();
    const { container, panel, view } = await listOnGoogle({ heading: "Choose a location:" });
    expect(getComputedStyle(panel).backgroundColor).toBe(
      getComputedStyle(googlesOwnControl(container)).backgroundColor,
    );
    expect(getComputedStyle(panel).color).toBe("rgb(31, 31, 31)");
    const option = queried(view, '[role="option"]');
    const heading = queried(view, ".maplace-list-heading");
    expect(getComputedStyle(option).fontSize).toBe("13px");
    expect(Number(getComputedStyle(heading).fontWeight)).toBeGreaterThanOrEqual(600);
  });

  it("shows a select on a light map at 13px in the light scheme, on a dark page", async () => {
    darkPage();
    const { view } = await listOnGoogle({ as: "select" });
    expect([getComputedStyle(view).fontSize, getComputedStyle(view).colorScheme]).toEqual([
      "13px",
      "light",
    ]);
  });

  it("draws the panel dark on a dark map, as Google draws its own", async () => {
    const { container, panel } = await listOnGoogle({ colorScheme: "dark" });
    expect(getComputedStyle(panel).colorScheme).toBe("dark");
    expect(getComputedStyle(panel).backgroundColor).toBe(
      getComputedStyle(googlesOwnControl(container)).backgroundColor,
    );
  });

  it("puts a bottom-left panel in the map's corner, above Google's logo and off its terms, on a narrow map", async () => {
    // As wide as fits beside Google's right-hand column on a 350px map, which a wider one would reach.
    const legend = document.createElement("div");
    legend.style.cssText = "width: 220px; height: 64px";
    legend.textContent = "Legend";
    const { container, panel } = await listMountedOnGoogle({
      maplace: createMaplace({ locations: places(5) }),
      list: { element: legend, destroy: () => legend.remove() },
      position: "bottom-left",
      container: sizedContainer({ width: 350, height: 420 }),
    });
    expect(crowded(container, panel)).toEqual([]);
    const fromLeft = panel.getBoundingClientRect().left - container.getBoundingClientRect().left;
    expect(fromLeft).toBeLessThanOrEqual(10);
  });

  it("keeps a long bottom-left list above Google's logo and under its Map/Satellite toggle", async () => {
    const { container, panel } = await listOnGoogle({ count: 30, position: "bottom-left" });
    expect(crowded(container, panel)).toEqual([]);
    expect(belowTheToggle(container, panel)).toBeGreaterThanOrEqual(0);
  });

  it("keeps long lists inside the map and off Google's own controls, a top-left one under the Map/Satellite toggle, its heading in view as End scrolls", async () => {
    const { maplace, adapter, container, panel, view } = await listOnGoogle({
      count: 30,
      heading: "Places",
    });
    const right = createListView(maplace);
    onTestFinished(() => right.destroy());
    const rightPanel = await mountedTopRight(adapter, right);
    expect({ left: crowded(container, panel), right: crowded(container, rightPanel) }).toEqual({
      left: [],
      right: [],
    });
    expect(belowTheToggle(container, panel)).toBeGreaterThanOrEqual(0);
    const listbox = queried(view, '[role="listbox"]');
    const heading = queried(view, ".maplace-list-heading");
    const mapBox = container.getBoundingClientRect();
    expect(panel.getBoundingClientRect().bottom).toBeLessThanOrEqual(mapBox.bottom);
    expect(listbox.scrollHeight).toBeGreaterThan(listbox.clientHeight);
    await tabUntil(() => listbox.contains(document.activeElement));
    await userEvent.keyboard("{End}");
    await expect.poll(() => listbox.scrollTop).toBeGreaterThan(0);
    const panelBox = panel.getBoundingClientRect();
    expect(panelBox.top).toBeGreaterThanOrEqual(mapBox.top);
    expect(heading.getBoundingClientRect().top).toBeGreaterThanOrEqual(panelBox.top);
  });
});
