/// <reference types="google.maps" />
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { createListView, type ListViewOptions } from "../list-view";
import { createMaplace } from "../maplace/create";
import { SKIP_MAP_CLASS } from "../maplace/map-aids";
import { queried } from "../testing/queried";
import type { ColorScheme } from "./options";
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

interface ListSetting extends ListViewOptions {
  readonly colorScheme?: ColorScheme | undefined;
  readonly count?: number | undefined;
}

/** A list view top-left on a map maplace creates, laid out by Google, and its panel. */
async function listOnGoogle({ colorScheme, count, ...options }: ListSetting = {}) {
  const maplace = createMaplace({ locations: places(count) });
  const list = createListView(maplace, options);
  const { container, panel } = await listMountedOnGoogle({ maplace, list, colorScheme });
  return { container, view: list.element, panel };
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
    const list = createListView(maplace, { searchLabel: "Find" });
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

  it("keeps a long list inside the map, its heading in view as End scrolls to the last entry", async () => {
    const { container, panel, view } = await listOnGoogle({ count: 30, heading: "Places" });
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
