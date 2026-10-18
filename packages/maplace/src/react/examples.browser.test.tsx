import { type ComponentType, createElement, StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as Core from "../index";
import { EXAMPLE_COMPONENTS } from "../testing/examples/example-files";
import { recordErrors } from "../testing/examples/example-page";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { REACT_EXAMPLE_PROPS } from "../testing/examples/react-example-props";
import {
  attachedStore,
  recordingCreateMaplace,
  shownIds,
  sortedIds,
} from "../testing/examples/recorded-stores";
import { inAct, renderInto } from "./testing/render";

// The React examples, rendered as written in StrictMode, on the fake adapter instead of Google's.
// `maplace` is the source entry the binding imports too, so its stores are recorded.
const adapters = await vi.hoisted(async () => (await import("./testing/adapters")).fakeAdapters());
vi.mock("maplace/google", () => ({ createGoogleAdapter: adapters.createAdapter }));
vi.mock("maplace", async (importOriginal) => {
  const real = await importOriginal<typeof Core>();
  return { ...real, createMaplace: recordingCreateMaplace(real.createMaplace) };
});

const onSave = vi.fn();

/** What a page around one example sees it do, beyond drawing its locations. */
const BEHAVIOURS: Readonly<Record<string, (page: HTMLElement) => Promise<void>>> = {
  circles: async () => {
    await inAct(() => attachedStore().select("near"));
    expect(adapters.live().probe().location("near")?.style).toMatchObject({
      stroke: "#c2410c",
      fill: "#f97316",
    });
  },
  tabs: async (page) => {
    await inAct(() => attachedStore().select("milan"));
    expect(page.querySelector("aside")?.textContent).toBe("milan");
  },
  markers: async () => {
    const probe = adapters.live().probe();
    expect([probe.location("milan")?.icon?.textContent, probe.location("naples")?.icon]).toEqual([
      "★",
      undefined,
    ]);
    await inAct(() => probe.click("rome"));
    await inAct(() => probe.settle());
    expect(probe.shownPopup()?.element.textContent).toBe("RomeCapital of Italy.");
  },
  menu: async (page) => {
    expect(page.querySelector("select")).not.toBeNull();
  },
  route: async (page) => {
    await expect.poll(() => page.querySelector("p")?.textContent).toMatch(/^\d+ km$/);
  },
  polygon: async () => {
    const path = [
      { lat: 41.91, lng: 12.48 },
      { lat: 41.93, lng: 12.5 },
      { lat: 41.9, lng: 12.5 },
    ];
    await inAct(() =>
      adapters.live().host().reportLocationChange("park", { type: "polygon", path }),
    );
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: "park", path }));
  },
};

beforeEach(() => serveExampleData());
afterEach(() => vi.unstubAllGlobals());

describe.each(EXAMPLE_COMPONENTS)("the $name component", ({ name, source, load }) => {
  it("draws its locations in its map's div, with its list, and does what it says", async () => {
    const errors = recordErrors();
    const component = componentOf(await load());
    const props = { ...REACT_EXAMPLE_PROPS[name], onSave };
    const page = await renderInto(createElement(StrictMode, null, createElement(component, props)));
    expect(page.errors).toEqual([]);
    const adapter = adapters.live();
    await inAct(() => adapter.finishMount());
    await inAct(() => adapter.probe().settle());

    expect(page.container.contains(adapter.mounted?.container ?? null)).toBe(true);
    // Fetched data arrives after the first render; large diffs are drawn in chunks, a task each.
    await expect.poll(() => shownIds(attachedStore()).length).toBeGreaterThan(0);
    await expect
      .poll(() => sortedIds(adapter.probe().locationIds()))
      .toEqual(shownIds(attachedStore()));
    if (source.includes("<LocationList")) {
      expect(page.container.querySelector("[role=listbox], select")).not.toBeNull();
    }
    await BEHAVIOURS[name]?.(page.container);
    expect([...page.errors, ...errors]).toEqual([]);
  });
});

/** The one function an example module exports: its component. */
function componentOf(module: Readonly<Record<string, unknown>>): ComponentType<object> {
  const exported = Object.values(module).filter((value) => typeof value === "function");
  if (exported.length !== 1)
    throw new Error(`an example exports one component, got ${exported.length}`);
  return exported[0] as ComponentType<object>;
}
