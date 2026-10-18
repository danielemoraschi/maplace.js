import { expect, vi } from "vitest";
import { SELECTED_LOOK } from "../../adapter-kit/shape-looks";
import type { FakeAdapter } from "../../testing/fake-adapter";
import type { ResolvedView } from "../../viewport";
import type { MaplaceMapElement } from "../index";

/** What an example page does beyond drawing its locations, checked on its map's fake adapter. */
export type PageBehaviour = (map: MaplaceMapElement, adapter: FakeAdapter) => Promise<void>;

export const PAGE_BEHAVIOURS: Readonly<Record<string, PageBehaviour>> = {
  circles: async (map, adapter) => {
    map.maplace.select("ring");
    map.maplace.select("center");
    const [ring, center] = adapter
      .callsOf("setView")
      .slice(-2)
      .map(({ view }) => view as BoundsView);
    expect([ring?.kind, center?.kind]).toEqual(["fit-bounds", "fit-bounds"]);
    expect(latitudeSpanOf(ring)).toBeGreaterThan(latitudeSpanOf(center));
    expect(adapter.probe().location("center")?.style).toEqual(SELECTED_LOOK);
  },
  tabs: async (map) => {
    map.maplace.select("milan");
    expect(document.getElementById("tabs-details")?.textContent).toBe("milan");
  },
  route: async (map, adapter) => {
    await adapter.probe().settle();
    await expect
      .poll(() => map.maplace.getSnapshot().routeResult?.distanceMeters)
      .toBeGreaterThan(0);
  },
  polygon: async (map, adapter) => {
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
    expect(map.maplace.getSnapshot().locations[0]).toMatchObject({ id: "park" });
  },
};

type BoundsView = Extract<ResolvedView, { readonly kind: "fit-bounds" }>;

function latitudeSpanOf(view: BoundsView | undefined): number {
  return (view?.bounds.north ?? 0) - (view?.bounds.south ?? 0);
}
