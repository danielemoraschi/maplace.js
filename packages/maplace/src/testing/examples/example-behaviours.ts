import { expect, vi } from "vitest";
import { SELECTED_LOOK } from "../../adapter-kit/shape-looks";
import type { ResolvedView } from "../../viewport";
import type { ExampleRun } from "./example-runs";

/**
 * What an example does beyond drawing its locations, the same for its page, vanilla and React
 * versions: read on the fake map and in the version's own root, never by id. Inputs are clicked,
 * which a DOM listener and React's `onChange` both hear; React renders outside `act`, so what it
 * shows is polled.
 */
export type ExampleBehaviour = (run: ExampleRun) => Promise<void>;

export const EXAMPLE_BEHAVIOURS: Readonly<Record<string, ExampleBehaviour>> = {
  markers: async ({ adapter }) => {
    const probe = adapter.probe();
    expect(probe.location("milan")?.icon?.textContent).toBe("★");
    expect(probe.location("naples")?.icon).toBeUndefined();
    probe.click("rome");
    await probe.settle();
    await expect.poll(() => textIn(probe.shownPopup()?.element, "strong")).toBe("Rome");
    expect(probe.shownPopup()?.element.textContent).toContain("Capital of Italy.");
  },
  circles: async ({ store, adapter }) => {
    store.select("ring");
    store.select("center");
    const [ring, center] = adapter
      .callsOf("setView")
      .slice(-2)
      .map(({ view }) => view as BoundsView);
    expect([ring?.kind, center?.kind]).toEqual(["fit-bounds", "fit-bounds"]);
    expect(latitudeSpanOf(ring)).toBeGreaterThan(latitudeSpanOf(center));
    expect(adapter.probe().location("center")?.style).toEqual({
      ...SELECTED_LOOK,
      stroke: "#c2410c",
      fill: "#f97316",
    });
  },
  menu: async ({ store, adapter, root }) => {
    expect(adapter.callsOf("mountControl").map(({ position }) => position)).toEqual(["top-right"]);
    expect(root.querySelector("select")).not.toBeNull();
    root.querySelector<HTMLInputElement>("input[type=checkbox]")?.click();
    await expect.poll(() => store.getSnapshot().filter).toEqual(["North"]);
  },
  tabs: async ({ store, root }) => {
    store.select("milan");
    await expect.poll(() => textIn(root, "aside")).toBe("Finance and fashion.");
  },
  route: async ({ store, adapter, root }) => {
    // A route set by a prop arrives after the map opens: the fake reports one on a settle.
    await expect
      .poll(async () => {
        await adapter.probe().settle();
        return store.getSnapshot().routeResult?.distanceMeters;
      })
      .toBeGreaterThan(0);
    await expect.poll(() => textIn(root, "output")).toMatch(/^\d+ km$/);
  },
  polygon: async ({ store, adapter }) => {
    const saved: unknown[] = [];
    vi.stubGlobal("save", (location: unknown) => saved.push(location));
    adapter.probe().drag("park", {
      type: "polygon",
      path: [
        { lat: 41.9, lng: 12.48 },
        { lat: 41.93, lng: 12.49 },
        { lat: 41.9, lng: 12.5 },
      ],
    });
    await expect.poll(() => saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ id: "park" });
    expect(store.getSnapshot().locations[0]).toMatchObject({ id: "park" });
  },
};

type BoundsView = Extract<ResolvedView, { readonly kind: "fit-bounds" }>;

function latitudeSpanOf(view: BoundsView | undefined): number {
  return (view?.bounds.north ?? 0) - (view?.bounds.south ?? 0);
}

/** The text of the first `selector` inside `root`, if both are there. */
function textIn(root: Element | undefined, selector: string): string | null | undefined {
  return root?.querySelector(selector)?.textContent;
}
