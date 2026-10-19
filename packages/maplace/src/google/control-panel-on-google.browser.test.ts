/// <reference types="google.maps" />
import { afterEach, expect, it, onTestFinished } from "vitest";
import { createListView, type ListViewOptions } from "../list-view";
import { createMaplace } from "../maplace/create";
import type { ColorScheme } from "./options";
import { settledOnMap } from "./testing/controls-placed";
import { darkPage } from "./testing/dark-page";
import { panelOf, queried } from "./testing/panels";
import { places } from "./testing/places";
import { fitted, onGoogle } from "./testing/store-on-google";
import { describeWithMaps } from "./testing/with-maps";

/** Google's own control on the map, to compare a panel with (Maps JS 3.66's fullscreen button). */
function googlesOwnControl(container: HTMLElement): HTMLElement {
  const control = container.querySelector<HTMLElement>("button.gm-fullscreen-control");
  if (control === null)
    throw new Error("no Google control to compare with (the fullscreen button)");
  return control;
}

interface ListSetting extends ListViewOptions {
  readonly colorScheme?: ColorScheme | undefined;
  readonly count?: number | undefined;
}

/** A list view top-left on a map maplace creates, laid out by Google, and its panel. */
async function listOnGoogle({ colorScheme, count, ...options }: ListSetting = {}) {
  const maplace = createMaplace({ locations: places(count) });
  const { adapter, container } = await onGoogle(maplace, { colorScheme });
  await fitted(maplace);
  const list = createListView(maplace, options);
  onTestFinished(() => list.destroy());
  adapter.mountControl(list.element, "top-left");
  await settledOnMap(list.element);
  const panel = panelOf(list.element);
  return { container, view: list.element, panel };
}

describeWithMaps("controls on a Google map", () => {
  afterEach(() => document.body.replaceChildren());

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

  it("keeps a long list inside the map, its entries scrolling under its heading", async () => {
    const { container, panel, view } = await listOnGoogle({ count: 30, heading: "Places" });
    const box = panel.getBoundingClientRect();
    const listbox = queried(view, '[role="listbox"]');
    const heading = queried(view, ".maplace-list-heading");
    expect(box.bottom).toBeLessThanOrEqual(container.getBoundingClientRect().bottom);
    expect(listbox.scrollHeight).toBeGreaterThan(listbox.clientHeight);
    expect(heading.getBoundingClientRect().top).toBeGreaterThanOrEqual(box.top);
  });
});
